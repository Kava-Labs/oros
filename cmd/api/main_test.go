package main_test

import (
	"bufio"
	"bytes"
	"context"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
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

	default_OPEN_API_KEY      = "test-openai-api-key"
	default_KAVACHAT_API_PORT = 0
)

func TestMain(m *testing.M) {
	build := exec.Command("go", "build", "-o", binName, ".")

	if out, err := build.CombinedOutput(); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to build %s: %s\n\n", binName, err)
		fmt.Fprintf(os.Stderr, "%s\n\n", string(out))
		os.Exit(1)
	}

	r := m.Run()

	os.Remove(binName)
	os.Exit(r)
}

func startProxyCmd(t *testing.T, context context.Context, args ...string) *exec.Cmd {
	cmd := exec.CommandContext(context, fmt.Sprintf("./%s", binName), args...)

	cmd.Env = append(cmd.Env,
		fmt.Sprintf("OPENAI_API_KEY=%s", default_OPEN_API_KEY),
		fmt.Sprintf("KAVACHAT_API_PORT=%d", default_KAVACHAT_API_PORT),
	)

	return cmd
}

func TestNoKeyForOpenAI(t *testing.T) {
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))
	cmd := startProxyCmd(t, ctx)

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

func TestHttpHealthCheck(t *testing.T) {
	ctx, _ := context.WithTimeout(context.Background(), time.Duration(1*time.Second))
	cmd := startProxyCmd(t, ctx)
	stdout, err := cmd.StdoutPipe()
	require.NoError(t, err, "could not obtain stdout pipe for server")

	scanner := bufio.NewScanner(stdout)
	err = cmd.Start()
	shutdownServer := func() {
		cmd.Process.Signal(syscall.SIGTERM)
	}
	defer func() {
		// TODO: graceful shutdown and err check
		// When exit status is non-zero, we have an ungraceful shutdown
		// We should assert the process catches sigterm and shutdown during the
		// test without error
		// this should catch interrupt but not kill from deadline timeout
		_ = cmd.Wait()
	}()
	require.NoError(t, err, "expected no error when starting server")

	getPort, readerErr := func() (chan int, chan error) {
		port := make(chan int)
		readErr := make(chan error)

		portMatcher, err := regexp.Compile("msg=listening port=([0-9]*)")
		require.NoError(t, err, "invalid port regex")

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
	case <-time.After(1 * time.Second):
		err = errors.New("server did not start within timeout")
	}
	if err != nil {
		shutdownServer()
		require.NoError(t, err, "error when reading port")
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
	require.NoError(t, err, "server did not pass healthcheck")

	shutdownServer()
}
