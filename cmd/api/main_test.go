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
	if os.Getenv("OPENAI_API_KEY") == "" {
		fmt.Fprintf(os.Stderr, "OPENAI_API_KEY is required")
		os.Exit(1)
	}

	if os.Getenv("OPENAI_BASE_URL") == "" {
		fmt.Fprintf(os.Stderr, "OPENAI_BASE_URL is required")
		os.Exit(1)
	}

	build := exec.Command("go", "build", "-o", binName, ".")

	if out, err := build.CombinedOutput(); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to build %s: %s\n\n", binName, err)
		fmt.Fprintf(os.Stderr, "%s\n\n", string(out))
		os.Exit(1)
	}

	var err error
	httpTestCases, err = loadHttpTestCases(false)
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

func TestNoKeyForOpenAI(t *testing.T) {
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))
	cmd := startProxyCmd(ctx, newDefaultTestConfig())

	newEnv := []string{}
	for _, envVar := range cmd.Env {
		if match, _ := regexp.MatchString("^OPENAI_API_KEY=.*$", envVar); match {
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

	assert.Contains(t, stdout.String(), "level=ERROR msg=\"OPENAI_API_KEY is required\"")
	assert.Contains(t, stderr.String(), "fatal: OPENAI_API_KEY is required")

	if exitErr, ok := err.(*exec.ExitError); ok {
		assert.Equal(t, 1, exitErr.ExitCode(), "expected exit code to equal 1")
	} else {
		t.Fatalf("%v is not an exit error", err)
	}
}

func TestNoBaseURLForOpenAI(t *testing.T) {
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))
	cmd := startProxyCmd(ctx, newDefaultTestConfig())

	newEnv := []string{}
	for _, envVar := range cmd.Env {
		if match, _ := regexp.MatchString("^OPENAI_BASE_URL=.*$", envVar); match {
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

	assert.Contains(t, stdout.String(), "level=ERROR msg=\"OPENAI_BASE_URL is required\"")
	assert.Contains(t, stderr.String(), "fatal: OPENAI_BASE_URL is required")

	if exitErr, ok := err.(*exec.ExitError); ok {
		assert.Equal(t, 1, exitErr.ExitCode(), "expected exit code to equal 1")
	} else {
		t.Fatalf("%v is not an exit error", err)
	}
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
			assert.Equal(t, tc.WantStatusCode, response.StatusCode)

			// assert that the response is equal to the upstream
			// expected response
			data, err := io.ReadAll(response.Body)
			require.NoError(t, err)
			assert.Equal(t, string(tc.Response.Body), string(data))
		})
	}

}
