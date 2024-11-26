package main

import (
	"fmt"
	"os"
	"os/exec"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	binName = "kavachat-api"
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
	return exec.Command(fmt.Sprintf("./%s", binName), args...)
}

func TestNoArgs(t *testing.T) {
	cmd := startProxy()
	out, err := cmd.CombinedOutput()

	require.NoError(t, err, fmt.Sprintf("expected %s to not fail", cmd.String()))
	assert.Contains(t, string(out), "Welcome to the Kavachat API!")
}
