package main_test

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"os/exec"
	"regexp"
	"strconv"
	"strings"
	"sync"
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
	host    string
}

type ProxyServer struct {
	Url      string
	Shutdown func() error

	logMu sync.Mutex
	Logs  []string
}

var httpTestCases []*HttpTestCase

func newDefaultTestConfig() config {
	return config{
		apiKey: "test-openai-api-key",
		// don't use external URL's by default
		baseURL: "http://localhost:5556/v1",
		port:    0,
		host:    "127.0.0.1",
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
		fmt.Sprintf("KAVACHAT_API_HOST=%s", config.host),
	)

	return cmd
}

func TestIncorrectRequiredEnvironmentVariable(t *testing.T) {
	testCases := []struct {
		name                string
		environmentVariable string
		susbstitutedValue   string
		expectedError       string
	}{
		{
			name:                "API key missing",
			environmentVariable: "OPENAI_API_KEY",
			expectedError:       "OPENAI_API_KEY is required",
		},
		{
			name:                "Base url missing",
			environmentVariable: "OPENAI_BASE_URL",
			expectedError:       "OPENAI_BASE_URL is required",
		},
		{
			name:                "Non-integer for port",
			environmentVariable: "KAVACHAT_API_PORT",
			susbstitutedValue:   "abc",
			expectedError:       "error setting KAVACHAT_API_PORT to abc",
		},
		{
			name:                "Integer outside range for port",
			environmentVariable: "KAVACHAT_API_PORT",
			susbstitutedValue:   "123456789000000000000000000000",
			expectedError:       "error setting KAVACHAT_API_PORT to 123456789000000000000000000000",
		},
	}
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			//	be sure we start with a fresh environment for each case
			cmd := startProxyCmd(ctx, newDefaultTestConfig())
			newEnv := []string{}

			for _, envVar := range cmd.Env {
				envVariablePattern := fmt.Sprintf("^%s=.*$", testCase.environmentVariable)

				if match, _ := regexp.MatchString(envVariablePattern, envVar); match {
					//	Some errors are triggered by inserting bad values for environment variables,
					if testCase.susbstitutedValue != "" {
						envVar = fmt.Sprintf("%v=%s", testCase.environmentVariable, testCase.susbstitutedValue)
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

			err := cmd.Run()
			require.Error(t, err, fmt.Sprintf("expected %s to fail", cmd.String()))

			assert.Contains(t, stderr.String(), fmt.Sprintf("fatal: %s", testCase.expectedError))
			assert.Contains(t, stdout.String(), fmt.Sprintf("level=ERROR msg=\"%s", testCase.expectedError))

			if exitErr, ok := err.(*exec.ExitError); ok {
				assert.Equal(t, 1, exitErr.ExitCode(), "expected exit code to equal 1")
			} else {
				t.Fatalf("%v is not an exit error", err)
			}
		})
	}
}

func launchApiServer(ctx context.Context, conf config) (*ProxyServer, error) {
	cmd := startProxyCmd(ctx, conf)

	shutdownServer := func() error {
		cmd.Process.Signal(syscall.SIGTERM)
		return cmd.Wait()
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("could not obtain stdout pipe: %w", err)
	}

	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("could not obtain stderr pipe: %w", err)
	}

	scanner := bufio.NewScanner(stdout)
	err = cmd.Start()
	if err != nil {
		return nil, err
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
		return nil, err
	}

	waitUntilReady := func(ctx context.Context) chan error {
		ready := make(chan error)
		requestURL := fmt.Sprintf("http://localhost:%d/v1/healthcheck", port)
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
		return nil, fmt.Errorf("server is not ready: %w", err)
	}

	server := &ProxyServer{
		Url:      fmt.Sprintf("http://localhost:%d", port),
		Shutdown: shutdownServer,
		logMu:    sync.Mutex{},
		Logs:     []string{},
	}

	recordServerLogs := func(src io.ReadCloser) {
		scanner := bufio.NewScanner(src)
		for scanner.Scan() {
			line := scanner.Text()
			server.logMu.Lock()
			server.Logs = append(server.Logs, line)
			server.logMu.Unlock()
		}
	}

	go recordServerLogs(stdout)
	go recordServerLogs(stderr)

	return server, nil
}

func TestHttpHealthCheck(t *testing.T) {
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))

	srv, err := launchApiServer(ctx, newDefaultTestConfig())
	require.NoError(t, err, "expected server to start without error")
	defer func() {
		if srv != nil {
			srv.Shutdown()
		}
	}()

	healthcheckUrl, err := url.JoinPath(srv.Url, "/v1/healthcheck")
	require.NoError(t, err, "could not build healthcheck url")

	response, err := http.Get(healthcheckUrl)
	require.NoError(t, err, "expected server to be ready for requests")
	assert.Equal(t, http.StatusOK, response.StatusCode, "expected healthcheck to be successful")
}

func TestProxy(t *testing.T) {
	config := newDefaultTestConfig()

	authHeader := fmt.Sprintf("Bearer %s", newDefaultTestConfig().apiKey)
	mockServer := newHttpMockServer(authHeader)
	mockServer.Start()

	baseURL, err := url.JoinPath(mockServer.URL, "/v1")
	require.NoError(t, err)
	config.baseURL = baseURL
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(60*time.Second))
	srv, err := launchApiServer(ctx, config)
	require.NoError(t, err, "expected server to start without error")

	defer func() {
		if srv != nil {
			srv.Shutdown()
		}
	}()

	defer mockServer.Close()

	require.NoError(t, err, "expected server to start without error")

	client := &http.Client{}
	for tcIdx, tc := range httpTestCases {
		// skip authentication and other upstream failure cases
		// for now in order to get happy path working
		if tc.WantStatusCode != 200 {
			continue
		}

		t.Run(tc.Name, func(t *testing.T) {
			// Send request to proxy server url with openai prefix, not the mock upstream
			requestUrl, err := url.JoinPath(srv.Url, "/openai/v1", tc.Path)
			require.NoError(t, err)

			var buffer io.Reader
			if tc.Body != nil {
				buffer = bytes.NewBuffer(tc.Body)
			}

			request, err := http.NewRequest(tc.Method, requestUrl, buffer)
			require.NoError(t, err)

			requestContentType, ok := tc.Headers["Content-Type"]
			if tc.Method != http.MethodOptions {
				require.True(t, ok, "content type must be set")
				request.Header.Add("Content-Type", requestContentType)
			}

			request.Header.Add("x-testcase-index", strconv.Itoa(tcIdx))

			if _, ok := tc.Headers["Authorization"]; ok {
				request.Header.Add("AUthorization", tc.Headers["Authorization"])
			}

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

			for name, value := range tc.WantResponseHeaders {
				require.Equal(t, value, response.Header.Get(name))
			}

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

			// assert server logs match expected logs
			if len(tc.ExpectLogs) != 0 {
				matchedLogs := 0
				for _, expectedLog := range tc.ExpectLogs {
					srv.logMu.Lock()
					for _, log := range srv.Logs {
						if strings.Contains(log, expectedLog) {
							matchedLogs++
							break
						}
					}
					srv.logMu.Unlock()
				}

				assert.Equal(t, len(tc.ExpectLogs), matchedLogs, "failed to match logs %s", tc.ExpectLogs)
			}
		})
	}
}
