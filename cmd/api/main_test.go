package main_test

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	binName = "kavachat-api"

	default_OPEN_API_KEY = "test-openai-api-key"
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

func startProxy(args ...string) *exec.Cmd {
	cmd := exec.Command(fmt.Sprintf("./%s", binName), args...)

	cmd.Env = append(cmd.Env, fmt.Sprintf("OPENAI_API_KEY=%s", default_OPEN_API_KEY))

	return cmd
}

func TestNoArgs(t *testing.T) {
	cmd := startProxy()
	out, err := cmd.CombinedOutput()

	require.NoError(t, err, fmt.Sprintf("expected %s to not fail", cmd.String()))
	assert.Contains(t, string(out), "Welcome to the Kavachat API!")
}

func TestNoKeyForOpenAI(t *testing.T) {
	cmd := startProxy()

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
