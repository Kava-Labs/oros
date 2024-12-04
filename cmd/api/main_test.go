package main_test

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	binName = "kavachat-api"
)

type config struct {
	apiKey  string
	baseURL string
	port    int
}

var httpTestCases []*HttpTestCase

func newDefaultTestConfig() config {
	return config{
		apiKey: "test-openai-api-key",
		// don't use external URL's by default
		baseURL: "http://localhost:5556/v1",
		port:    0,
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

func startProxyCmd(context context.Context, config config, args ...string) *exec.Cmd {
	cmd := exec.CommandContext(context, fmt.Sprintf("./%s", binName), args...)

	cmd.Env = append(cmd.Env,
		fmt.Sprintf("OPENAI_API_KEY=%s", config.apiKey),
		fmt.Sprintf("OPENAI_BASE_URL=%s", config.baseURL),
		fmt.Sprintf("KAVACHAT_API_PORT=%d", config.port),
	)

	return cmd
}

func TestMissingRequiredEnvironmentVariable(t *testing.T) {
	testCases := []struct {
		name                string
		environmentVariable string
	}{
		{
			name:                "API key missing",
			environmentVariable: "OPENAI_API_KEY",
		},
		{
			name:                "Base url missing",
			environmentVariable: "OPENAI_BASE_URL",
		},
	}
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			//	be sure we start with a fresh environment for each case
			cmd := startProxyCmd(ctx, newDefaultTestConfig())
			newEnv := []string{}

			for _, envVar := range cmd.Env {
				//	skip the targeted environment variable when building the new env
				envVariablePattern := fmt.Sprintf("^%s=.*$", testCase.environmentVariable)
				if match, _ := regexp.MatchString(envVariablePattern, envVar); match {
					continue
				}
				newEnv = append(newEnv, envVar)
			}

			cmd.Env = newEnv

			var stdout, stderr bytes.Buffer
			cmd.Stdout = &stdout
			cmd.Stderr = &stderr

			err := cmd.Run()
			require.Error(t, err, fmt.Sprintf("expected %s to fail", cmd.String()))

			assert.Contains(t, stderr.String(), fmt.Sprintf("fatal: %s is required", testCase.environmentVariable))
			assert.Contains(t, stdout.String(), fmt.Sprintf("level=ERROR msg=\"%s is required\"", testCase.environmentVariable))

			if exitErr, ok := err.(*exec.ExitError); ok {
				assert.Equal(t, 1, exitErr.ExitCode(), "expected exit code to equal 1")
			} else {
				t.Fatalf("%v is not an exit error", err)
			}
		})
	}
}

func TestStringPortValue(t *testing.T) {
	unavailablePort := "abc"
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))
	cmd := startProxyCmd(ctx, newDefaultTestConfig())

	newEnv := []string{}
	for _, envVar := range cmd.Env {
		if match, _ := regexp.MatchString("^KAVACHAT_API_PORT=.*$", envVar); match {
			envVar = fmt.Sprintf("KAVACHAT_API_PORT=%s", unavailablePort)
		}
		newEnv = append(newEnv, envVar)
	}
	cmd.Env = newEnv

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	require.Error(t, err, fmt.Sprintf("expected %s to fail", cmd.String()))

	assert.Contains(t, stdout.String(), fmt.Sprintf("level=ERROR msg=\"error setting KAVACHAT_API_PORT to %s", unavailablePort))
	assert.Contains(t, stderr.String(), fmt.Sprintf("fatal: error setting KAVACHAT_API_PORT to %s", unavailablePort))
}

func TestOutOfRangePortValue(t *testing.T) {
	unavailablePort := 1234567890000000000
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))
	cmd := startProxyCmd(ctx, newDefaultTestConfig())

	newEnv := []string{}
	for _, envVar := range cmd.Env {
		if match, _ := regexp.MatchString("^KAVACHAT_API_PORT=.*$", envVar); match {
			envVar = fmt.Sprintf("KAVACHAT_API_PORT=%d", unavailablePort)
		}
		newEnv = append(newEnv, envVar)
	}
	cmd.Env = newEnv

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	err := cmd.Run()
	require.Error(t, err, fmt.Sprintf("expected %s to fail", cmd.String()))

	assert.Contains(t, stdout.String(), fmt.Sprintf("level=ERROR msg=\"listen tcp: address %d: invalid port\"", unavailablePort))
	assert.Contains(t, stderr.String(), fmt.Sprintf("fatal: listen tcp: address %d: invalid port", unavailablePort))
}

func launchApiServer(ctx context.Context, conf config) (string, func() error, error) {
	cmd := startProxyCmd(ctx, conf)

	shutdownServer := func() error {
		cmd.Process.Signal(syscall.SIGTERM)
		return cmd.Wait()
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return "", shutdownServer, fmt.Errorf("could not obtain stdout pipe: %w", err)
	}

	scanner := bufio.NewScanner(stdout)
	err = cmd.Start()
	if err != nil {
		return "", shutdownServer, err
	}

	getPort, readerErr := func() (chan int, chan error) {
		port := make(chan int)
		readErr := make(chan error)

		portMatcher, err := regexp.Compile("msg=listening port=([0-9]*)")
		if err != nil {
			panic(err)
		}

		go func() {
			for scanner.Scan() {
				line := scanner.Text()

				matches := portMatcher.FindStringSubmatch(line)
				if len(matches) > 1 {
					parsedPort, err := strconv.Atoi(matches[1])
					if err == nil {
						port <- parsedPort
					} else {
						readErr <- err
					}

					break
				}
			}
			close(port)
		}()

		return port, readErr
	}()

	port := 0
	err = nil
	select {
	case port = <-getPort:
	case err = <-readerErr:
	case <-ctx.Done():
		err = ctx.Err()
	}
	if err != nil {
		return "", shutdownServer, err
	}

	waitUntilReady := func(ctx context.Context) chan error {
		ready := make(chan error)
		requestURL := fmt.Sprintf("http://localhost:%d/v1/healthcheck", port)
		go func() {
			for ctx.Err() == nil {
				resp, err := http.Get(requestURL)
				if err == nil && resp.StatusCode == 200 {
					body, err := ioutil.ReadAll(resp.Body)
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

	return fmt.Sprintf("http://localhost:%d", port), shutdownServer, nil
}

func TestHttpHealthCheck(t *testing.T) {
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))

	serverUrl, shutdown, err := launchApiServer(ctx, newDefaultTestConfig())
	require.NoError(t, err, "expected server to start without error")
	defer shutdown()

	healthcheckUrl, err := url.JoinPath(serverUrl, "/v1/healthcheck")
	require.NoError(t, err, "could not build healthcheck url")

	response, err := http.Get(healthcheckUrl)
	require.NoError(t, err, "expected server to be ready for requests")
	assert.Equal(t, http.StatusOK, response.StatusCode, "expected healthcheck to be successful")
}

func TestChatCompletionProxy(t *testing.T) {
	config := newDefaultTestConfig()

	authHeader := fmt.Sprintf("Bearer %s", newDefaultTestConfig().apiKey)
	mockServer := newHttpMockServer(authHeader)
	mockServer.Start()

	baseURL, err := url.JoinPath(mockServer.URL, "/v1")
	require.NoError(t, err)
	config.baseURL = baseURL
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(60*time.Second))
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
