package main_test

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"net/url"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"syscall"
	"testing"
	"time"

	"github.com/kava-labs/kavachat/api/internal/handlers"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	binName = "kavachat-api"
)

type testConfig struct {
	name              string
	apiKey            string
	baseURL           string
	allowedModels     []string
	port              int
	host              string
	metricsServerPort int
	s3BucketName      string
	publicURL         string
}

var httpTestCases []*HttpTestCase

func newDefaultTestConfig() testConfig {
	return testConfig{
		name:   "openai",
		apiKey: "test-openai-api-key",
		// don't use external URL's by default
		baseURL:           "http://localhost:5556/v1/",
		allowedModels:     []string{"gpt-4o-mini"},
		port:              8080,
		host:              "127.0.0.1",
		metricsServerPort: 9090,
		// Matches localstack seed script in ./aws/bucket.sh
		s3BucketName: "test-bucket",
		publicURL:    "https://api.server.io",
	}
}

func TestMain(m *testing.M) {
	generateOpenAITestData := false
	if os.Getenv("KAVACHAT_TEST_GOLDEN") == "true" {
		generateOpenAITestData = true
	}

	build := exec.Command("go", "build", "-o", binName, ".")

	if out, err := build.CombinedOutput(); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to build %s: %s\n\n", binName, err)
		fmt.Fprintf(os.Stderr, "%s\n\n", string(out))
		os.Exit(1)
	}

	var err error
	httpTestCases, err = loadHttpTestCases(generateOpenAITestData)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load test cases: %v", err)
		os.Exit(1)
	}

	r := m.Run()

	os.Remove(binName)
	os.Exit(r)
}

func startProxyCmd(context context.Context, config testConfig, args ...string) *exec.Cmd {
	cmd := exec.CommandContext(context, fmt.Sprintf("./%s", binName), args...)

	cmd.Env = append(
		cmd.Env,
		"KAVACHAT_API_LOG_LEVEL=debug",
		"KAVACHAT_API_LOG_FORMAT=json",
		fmt.Sprintf("KAVACHAT_API_BACKEND_0_NAME=%s", config.name),
		fmt.Sprintf("KAVACHAT_API_BACKEND_0_API_KEY=%s", config.apiKey),
		fmt.Sprintf("KAVACHAT_API_BACKEND_0_BASE_URL=%s", config.baseURL),
		fmt.Sprintf("KAVACHAT_API_BACKEND_0_ALLOWED_MODELS=%s", strings.Join(config.allowedModels, ",")),
		fmt.Sprintf("KAVACHAT_API_PORT=%d", config.port),
		fmt.Sprintf("KAVACHAT_API_HOST=%s", config.host),
		fmt.Sprintf("KAVACHAT_API_METRICS_PORT=%d", config.metricsServerPort),
		fmt.Sprintf("KAVACHAT_API_S3_BUCKET=%s", config.s3BucketName),
		fmt.Sprintf("KAVACHAT_API_PUBLIC_URL=%s", config.publicURL),

		// Set AWS S3 testing env vars  for localstack - handlers use
		// LoadDefaultConfig for AWS credentials so they are read directly from env
		// instead of server config

		// Endpoint needs to be IP instead of localhost or gets host error for some reason:
		// dial tcp: lookup test-bucket.localhost: no such host
		fmt.Sprintf("AWS_ENDPOINT_URL=%s", "http://127.0.0.1:4566"),
		fmt.Sprintf("AWS_ACCESS_KEY_ID=%s", "test"),
		fmt.Sprintf("AWS_SECRET_ACCESS_KEY=%s", "test"),
		fmt.Sprintf("AWS_REGION=%s", "us-east-1"),
	)

	return cmd
}

func TestIncorrectRequiredEnvironmentVariable(t *testing.T) {
	testCases := []struct {
		name                string
		environmentVariable string
		substitutedString   string
		expectedError       string
	}{
		{
			name:                "Backend name missing",
			environmentVariable: "KAVACHAT_API_BACKEND_0_NAME",
			substitutedString:   "",
			expectedError:       "invalid backend: NAME is required for backend",
		},
		{
			name:                "API key missing",
			environmentVariable: "KAVACHAT_API_BACKEND_0_API_KEY",
			substitutedString:   "",
			expectedError:       "invalid backend: API_KEY is required for backend openai",
		},

		{
			name:                "Base url missing",
			environmentVariable: "KAVACHAT_API_BACKEND_0_BASE_URL",
			substitutedString:   "",
			expectedError:       "invalid backend: BASE_URL is required for backend openai",
		},

		{
			name:                "Allowed models missing",
			environmentVariable: "KAVACHAT_API_BACKEND_0_ALLOWED_MODELS",
			substitutedString:   "",
			expectedError:       "invalid backend: ALLOWED_MODELS needs at least one model for backend openai",
		},
		{
			name:                "Port missing, has default",
			environmentVariable: "KAVACHAT_API_PORT",
			substitutedString:   "",
			expectedError:       "",
		},
		{
			name:                "Non-integer for port",
			environmentVariable: "KAVACHAT_API_PORT",
			substitutedString:   "abc",
			expectedError:       "env: parse error on field \"ServerPort\" of type \"int\": strconv.ParseInt: parsing \"abc\"",
		},
		{
			name:                "Integer outside range for port",
			environmentVariable: "KAVACHAT_API_PORT",
			substitutedString:   "123456789000000000000000000000",
			expectedError:       "env: parse error on field \"ServerPort\" of type \"int\": strconv.ParseInt: parsing \"123456789000000000000000000000\": value out of range",
		},
		{
			name:                "Restricted port",
			environmentVariable: "KAVACHAT_API_PORT",
			substitutedString:   "80",
			expectedError:       "listen tcp 127.0.0.1:80: bind: permission denied",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			// Create new ctx each time to avoid context cancellation
			ctx, cancel := context.WithTimeout(context.Background(), time.Duration(10*time.Second))
			defer cancel()

			//	be sure we start with a fresh environment for each case
			cmd := startProxyCmd(ctx, newDefaultTestConfig())
			newEnv := []string{}

			for _, envVar := range cmd.Env {
				envVariablePattern := fmt.Sprintf("^%s=.*$", testCase.environmentVariable)

				if match, _ := regexp.MatchString(envVariablePattern, envVar); match {
					//	Some errors are triggered by inserting bad values for environment variables,
					if testCase.substitutedString != "" {
						envVar = fmt.Sprintf("%v=%s", testCase.environmentVariable, testCase.substitutedString)
					} else {
						//	While other errors are triggered by their absence
						continue
					}
				}

				newEnv = append(newEnv, envVar)
			}

			cmd.Env = newEnv

			var stdout, stderr bytes.Buffer
			cmd.Stdout = &stdout
			cmd.Stderr = &stderr

			cmdErr := cmd.Run()
			require.Error(t, cmdErr, fmt.Sprintf("expected %s to fail", cmd.String()))

			// if context.DeadlineExceeded  error
			if cmdErr != nil && errors.Is(cmdErr, context.DeadlineExceeded) {
				t.Fatalf("timeout while running cmd, likely because it did not exit with error: %v", cmdErr)
			}

			stdoutStr := stdout.String()

			t.Logf("stdout: %s", stdoutStr)

			if testCase.expectedError == "" {
				assert.NotContains(t, stdoutStr, "error", "expected no error in log output")
				return
			}

			stdoutLines := strings.Split(stdoutStr, "\n")
			lastLine := stdoutLines[len(stdoutLines)-2]

			var logJson map[string]interface{}
			err := json.Unmarshal([]byte(lastLine), &logJson)
			require.NoError(t, err, "expected log output to be json")

			assert.Contains(t, logJson, "error", "expected error field")

			gotErr, ok := logJson["error"].(string)
			require.True(t, ok, "expected error field to be a string")

			assert.Contains(t, gotErr, testCase.expectedError)

			if exitErr, ok := cmdErr.(*exec.ExitError); ok {
				assert.Equal(t, 1, exitErr.ExitCode(), "expected exit code to equal 1")
			} else {
				t.Fatalf("%v is not an exit error", cmdErr)
			}
		})
	}
}

func launchApiServer(ctx context.Context, conf testConfig) (string, func() error, error) {
	cmd := startProxyCmd(ctx, conf)

	shutdownServer := func() error {
		cmd.Process.Signal(syscall.SIGTERM)
		return cmd.Wait()
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", shutdownServer, fmt.Errorf("could not obtain stdout pipe: %w", err)
	}

	scannerStdout := bufio.NewScanner(stdout)

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return "", shutdownServer, fmt.Errorf("could not obtain stdout pipe: %w", err)
	}

	scannerStderr := bufio.NewScanner(stderr)

	go func() {
		for scannerStderr.Scan() {
			fmt.Println(scannerStderr.Text())
		}
	}()

	go func() {
		for scannerStdout.Scan() {
			fmt.Println(scannerStdout.Text())
		}
	}()

	err = cmd.Start()
	if err != nil {
		return "", shutdownServer, err
	}

	waitUntilReady := func(ctx context.Context) chan error {
		ready := make(chan error)
		requestURL := fmt.Sprintf("http://localhost:%d/v1/healthcheck", conf.port)
		go func() {
			for ctx.Err() == nil {
				resp, err := http.Get(requestURL)
				if err == nil && resp.StatusCode == 200 {
					body, err := io.ReadAll(resp.Body)
					defer resp.Body.Close()
					if err == nil {
						if string(body) == "available\n" {
							break
						}
					}
				}
			}
			ready <- ctx.Err()
		}()

		return ready
	}(ctx)

	err = <-waitUntilReady
	if err != nil {
		return "", shutdownServer, fmt.Errorf("server is not ready: %w", err)
	}

	return fmt.Sprintf("http://localhost:%d", conf.port), shutdownServer, nil
}

func TestHttpHealthCheck(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(2*time.Second))
	defer cancel()

	serverUrl, shutdown, err := launchApiServer(ctx, newDefaultTestConfig())
	require.NoError(t, err, "expected server to start without error")
	defer shutdown()

	healthcheckUrl, err := url.JoinPath(serverUrl, "/v1/healthcheck")
	require.NoError(t, err, "could not build healthcheck url")

	response, err := http.Get(healthcheckUrl)
	require.NoError(t, err, "expected server to be ready for requests")
	assert.Equal(t, http.StatusOK, response.StatusCode, "expected healthcheck to be successful")
}

func TestMetricsServer(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(2*time.Second))
	defer cancel()

	config := newDefaultTestConfig()

	_, shutdown, err := launchApiServer(ctx, config)
	require.NoError(t, err, "expected server to start without error")
	defer shutdown()

	// metrics server should have nothing on root
	metricsRootUrl := fmt.Sprintf("http://%s:%d", config.host, config.metricsServerPort)

	response, err := http.Get(metricsRootUrl)
	require.NoError(t, err, "expected metrics server to be ready for requests")
	assert.Equal(t, http.StatusNotFound, response.StatusCode, "expected metrics to be successful")

	// metrics server should be serving metrics at /metrics
	metricsUrl := fmt.Sprintf("http://%s:%d/metrics", config.host, config.metricsServerPort)

	response, err = http.Get(metricsUrl)
	require.NoError(t, err, "expected metrics server to be ready for requests")
	assert.Equal(t, http.StatusOK, response.StatusCode, "expected metrics to be successful")
}

func TestChatCompletionProxy(t *testing.T) {
	config := newDefaultTestConfig()

	authHeader := fmt.Sprintf("Bearer %s", newDefaultTestConfig().apiKey)
	mockServer := newHttpMockServer(authHeader)
	mockServer.Start()

	baseURL, err := url.JoinPath(mockServer.URL, "/v1/")
	require.NoError(t, err)
	config.baseURL = baseURL
	config.allowedModels = []string{"gpt-4o-mini", "dall-e-2"}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(20*time.Second))
	defer cancel()

	serverUrl, shutdown, err := launchApiServer(ctx, config)

	defer shutdown()
	defer mockServer.Close()

	require.NoError(t, err, "expected server to start without error")

	client := &http.Client{}
	for _, tc := range httpTestCases {
		// skip authentication and other upstream failure cases
		// for now in order to get happy path working
		if tc.WantStatusCode != 200 {
			continue
		}

		t.Run(tc.Name, func(t *testing.T) {
			// Send request to proxy server url with openai prefix, not the mock upstream
			requestUrl, err := url.JoinPath(serverUrl, "/openai/v1", tc.Path)
			require.NoError(t, err)

			var buffer io.Reader
			if tc.Body != nil {
				buffer = bytes.NewBuffer(tc.Body)
			}

			request, err := http.NewRequest(tc.Method, requestUrl, buffer)
			require.NoError(t, err)

			// no authorization header is required, we only use the content type from
			// the test case to ensure it matches the body
			requestContentType, ok := tc.Headers["Content-Type"]
			require.True(t, ok, "content type must be set")
			request.Header.Add("Content-Type", requestContentType)

			// make the request to the proxy!
			response, err := client.Do(request)
			require.NoError(t, err)
			defer response.Body.Close()

			// require that the desired status code was returned before
			// comparing the response
			require.Equal(t, tc.WantStatusCode, response.StatusCode)

			// require content matches the expected one
			responseContentType := strings.Split(response.Header.Get("Content-Type"), ";")[0]
			require.Equal(t, tc.WantContentType, responseContentType)

			// Transfer-encoding should not be set for SSE responses
			// when using http/1.1
			if responseContentType == "text/event-stream" {
				// we want to ensure we are testing http/1.1 responses
				require.Equal(t, 1, response.ProtoMajor)
				require.Equal(t, 1, response.ProtoMinor)
				require.Empty(t, response.TransferEncoding)
			}

			// assert that the response is equal to the upstream
			// expected response
			data, err := io.ReadAll(response.Body)
			require.NoError(t, err)
			assert.Equal(t, string(tc.Response.Body), string(data))
		})
	}
}

func TestFileUpload(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping test in short mode.")
	}

	// Check if localstack is running by querying /_localstack/health
	localstackHealthUrl := "http://localhost:4566/_localstack/health"
	response, err := http.Get(localstackHealthUrl)
	require.NoError(t, err, "expected localstack to be running")

	// -------------------------------------------------------------------------
	// Start API server

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(2*time.Second))
	defer cancel()

	serverConfig := newDefaultTestConfig()
	serverUrl, shutdown, err := launchApiServer(ctx, serverConfig)
	require.NoError(t, err, "expected server to start without error")
	defer shutdown()

	// Upload /v1/files
	fileContent := []byte("test image content")
	fileContentType := "image/jpeg"
	body, contentType := createMultipartBody(
		t,
		"file",
		"test.jpg",
		fileContent,
		fileContentType,
	)

	uploadUrl, err := url.JoinPath(serverUrl, "/v1/files")
	require.NoError(t, err, "could not build upload url")

	client := &http.Client{}
	response, err = client.Post(uploadUrl, contentType, body)
	require.NoError(t, err)
	defer response.Body.Close()

	if response.StatusCode == http.StatusInternalServerError {
		data, err := io.ReadAll(response.Body)
		require.NoError(t, err)
		t.Fatalf("could not upload file: %s", data)
	}

	require.Equal(t, http.StatusCreated, response.StatusCode, "expected successful file upload")

	// Read response
	var fileResponse handlers.FileUploadResponse
	err = json.NewDecoder(response.Body).Decode(&fileResponse)
	require.NoError(t, err)

	assert.NotEmpty(t, fileResponse.ID)
	expectedPath := fmt.Sprintf("/v1/files/%s", fileResponse.ID)
	expectedURL := serverConfig.publicURL + expectedPath
	assert.Equal(t, expectedURL, fileResponse.URL)

	// -------------------------------------------------------------------------
	// Download /v1/files/{id}
	downloadUrl, err := url.JoinPath(serverUrl, expectedPath)
	require.NoError(t, err, "could not build download url")

	response, err = client.Get(downloadUrl)
	require.NoError(t, err)
	defer response.Body.Close()

	require.Equalf(t, http.StatusOK, response.StatusCode, "expected successful file download %s", downloadUrl)

	// Check headers
	assert.Equal(t, "inline; filename=\"test.jpg\"", response.Header.Get("Content-Disposition"))
	assert.Equal(t, fileContentType, response.Header.Get("Content-Type"))

	data, err := io.ReadAll(response.Body)
	require.NoError(t, err)

	assert.Equal(t, fileContent, data)
}

func createMultipartBody(
	t *testing.T,
	fieldName string,
	fileName string,
	fileContent []byte,
	fileContentType string,
) (*bytes.Buffer, string) {
	t.Helper()

	var b bytes.Buffer
	writer := multipart.NewWriter(&b)

	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="%s"; filename="%s"`, fieldName, fileName))
	header.Set("Content-Type", fileContentType)

	part, err := writer.CreatePart(header)
	require.NoError(t, err)

	_, err = io.Copy(part, bytes.NewReader(fileContent))
	require.NoError(t, err)

	err = writer.Close()
	require.NoError(t, err)

	return &b, writer.FormDataContentType()
}
