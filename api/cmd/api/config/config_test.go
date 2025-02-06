package config_test

import (
	"errors"
	"fmt"
	"os"
	"testing"

	"github.com/kava-labs/kavachat/api/cmd/api/config"
	"github.com/stretchr/testify/require"
)

func TestGetConfigFromEnv(t *testing.T) {
	t.Run("default values", func(t *testing.T) {
		os.Clearenv()
		cfg, err := config.NewConfigFromEnv()
		require.NoError(t, err)
		require.Equal(t, 8080, cfg.ServerPort)
		require.Equal(t, "127.0.0.1", cfg.ServerHost)
		require.Empty(t, cfg.Backends)
	})

	t.Run("custom values", func(t *testing.T) {
		os.Setenv("KAVACHAT_API_PORT", "9090")
		os.Setenv("KAVACHAT_API_HOST", "0.0.0.0")
		os.Setenv("KAVACHAT_API_BACKEND_0_NAME", "OpenAI")
		os.Setenv("KAVACHAT_API_BACKEND_0_BASE_URL", "https://api.openai.com")
		os.Setenv("KAVACHAT_API_BACKEND_0_API_KEY", "test-api-key")
		os.Setenv("KAVACHAT_API_BACKEND_0_ALLOWED_MODELS", "gpt4o-mini,gpt4o")

		os.Setenv("KAVACHAT_API_BACKEND_1_NAME", "runpod")
		os.Setenv("KAVACHAT_API_BACKEND_1_BASE_URL", "https://runpod.io/some-url")
		os.Setenv("KAVACHAT_API_BACKEND_1_API_KEY", "second-api-key")
		os.Setenv("KAVACHAT_API_BACKEND_1_ALLOWED_MODELS", "deepseek-r1")

		cfg, err := config.NewConfigFromEnv()
		require.NoError(t, err)

		require.Equal(t, 9090, cfg.ServerPort)
		require.Equal(t, "0.0.0.0", cfg.ServerHost)

		require.Len(t, cfg.Backends, 2)

		expectedBackends := config.OpenAIBackends{
			{
				Name:          "OpenAI",
				BaseURL:       "https://api.openai.com",
				APIKey:        "test-api-key",
				AllowedModels: []string{"gpt4o-mini", "gpt4o"},
			},
			{
				Name:          "runpod",
				BaseURL:       "https://runpod.io/some-url",
				APIKey:        "second-api-key",
				AllowedModels: []string{"deepseek-r1"},
			},
		}

		require.Equal(t, expectedBackends, cfg.Backends)
	})
}

// validBackend creates a valid OpenAIBackends
func validBackend() config.OpenAIBackend {
	return config.OpenAIBackend{
		Name:          "OpenAI",
		BaseURL:       "https://api.example.com/v1/",
		APIKey:        "dummy-key",
		AllowedModels: []string{"model1", "model2"},
	}
}

func TestOpenAIBackendValidate(t *testing.T) {
	tests := []struct {
		name    string
		backend config.OpenAIBackend
		wantErr error
	}{
		{
			name:    "valid backend",
			backend: validBackend(),
			wantErr: nil,
		},
		{
			name: "missing Name",
			backend: func() config.OpenAIBackend {
				b := validBackend()
				b.Name = ""
				return b
			}(),
			wantErr: errors.New("NAME is required for backend"),
		},
		{
			name: "missing BaseURL",
			backend: func() config.OpenAIBackend {
				b := validBackend()
				b.BaseURL = ""
				return b
			}(),
			wantErr: errors.New("BASE_URL is required for backend OpenAI"),
		},
		{
			name: "no trailing slash in BaseURL",
			backend: func() config.OpenAIBackend {
				b := validBackend()
				b.BaseURL = "https://api.openai.com/v1"
				return b
			}(),
			wantErr: errors.New("BASE_URL for backend OpenAI must have a trailing slash"),
		},
		{
			name: "missing ApiKey",
			backend: func() config.OpenAIBackend {
				b := validBackend()
				b.APIKey = ""
				return b
			}(),
			wantErr: errors.New("API_KEY is required for backend OpenAI"),
		},
		{
			name: "no AllowedModels",
			backend: func() config.OpenAIBackend {
				b := validBackend()
				b.AllowedModels = []string{}
				return b
			}(),
			wantErr: errors.New("ALLOWED_MODELS needs at least one model for backend OpenAI"),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.backend.Validate()

			if tc.wantErr == nil {
				require.NoError(t, err)
			} else {
				require.EqualError(t, err, tc.wantErr.Error())
			}
		})
	}
}

func TestOpenAiBackendsValidate(t *testing.T) {
	tests := []struct {
		name     string
		backends func() config.OpenAIBackends
		wantErr  error
	}{

		{
			name: "invalid backend in config",
			backends: func() config.OpenAIBackends {
				// Introduce an invalid backend (missing ApiKey)
				backend := validBackend()
				backend.APIKey = ""
				return config.OpenAIBackends{backend}
			},
			wantErr: errors.New("invalid backend: API_KEY is required for backend OpenAI"),
		},
		{
			name: "no backends",
			backends: func() config.OpenAIBackends {
				return config.OpenAIBackends{}
			},
			wantErr: errors.New("at least one backend is required"),
		},
		{
			name: "duplicate backend name",
			backends: func() config.OpenAIBackends {
				return config.OpenAIBackends{
					validBackend(),
					validBackend(),
				}
			},
			wantErr: fmt.Errorf(
				"backend name '%s' is duplicated",
				validBackend().Name,
			),
		},
		{
			name: "duplicate backend url",
			backends: func() config.OpenAIBackends {
				backend1 := validBackend()
				backend2 := validBackend()

				backend2.Name = "OpenAI2"
				backend2.AllowedModels = []string{"model3", "model4"}

				return config.OpenAIBackends{
					backend1,
					backend2,
				}
			},
			wantErr: fmt.Errorf(
				"backend base URL '%s' is duplicated for OpenAI2",
				validBackend().BaseURL,
			),
		},
		{
			name: "duplicate backend model",
			backends: func() config.OpenAIBackends {
				backend1 := validBackend()
				backend2 := validBackend()

				backend2.Name = "OpenAI2"
				backend2.BaseURL = "https://api2.example.com/v1/"

				return config.OpenAIBackends{
					backend1,
					backend2,
				}
			},
			wantErr: fmt.Errorf(
				"model 'model1' is duplicated for backend OpenAI2, allowed models must be unique across all backends",
			),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.backends().Validate()
			if tc.wantErr == nil {
				require.NoError(t, err)
			} else {
				require.EqualError(t, err, tc.wantErr.Error())
			}
		})
	}
}

func TestConfigValidate(t *testing.T) {
	validCfg := config.Config{
		ServerPort: 8080,
		ServerHost: "127.0.0.1",
		Backends:   []config.OpenAIBackend{validBackend()},
	}

	tests := []struct {
		name    string
		cfg     config.Config
		wantErr error
	}{
		{
			name:    "valid config",
			cfg:     validCfg,
			wantErr: nil,
		},
		{
			name: "invalid backend in config",
			cfg: func() config.Config {
				cfg := validCfg
				// Introduce an invalid backend (missing ApiKey)
				backend := validBackend()
				backend.APIKey = ""
				cfg.Backends = []config.OpenAIBackend{backend}
				return cfg
			}(),
			wantErr: fmt.Errorf("invalid backend: API_KEY is required for backend %s", validBackend().Name),
		},
		{
			name: "no backends",
			cfg: func() config.Config {
				cfg := validCfg
				// Clear backend
				cfg.Backends = nil
				return cfg
			}(),
			wantErr: fmt.Errorf("at least one backend is required"),
		},
		{
			name: "duplicate model in backends",
			cfg: func() config.Config {
				cfg := validCfg
				// Add a duplicate model in the backends
				backend := validBackend()
				backend.Name = "OpenAI2"
				backend.BaseURL = "https://api2.example.com/v1/"

				cfg.Backends = append(cfg.Backends, backend)

				return cfg
			}(),
			wantErr: fmt.Errorf(
				"model 'model1' is duplicated for backend OpenAI2, allowed models must be unique across all backends",
			),
		},
		{
			name: "allowed - missing ServerPort",
			cfg: func() config.Config {
				cfg := validCfg
				cfg.ServerPort = 0
				return cfg
			}(),
			wantErr: nil,
		},
		{
			name: "missing ServerHost",
			cfg: func() config.Config {
				cfg := validCfg
				cfg.ServerHost = ""
				return cfg
			}(),
			wantErr: errors.New("HOST is required"),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := tc.cfg.Validate()
			if tc.wantErr == nil {
				require.NoError(t, err)
			} else {
				require.EqualError(t, err, tc.wantErr.Error())
			}
		})
	}
}

func TestOpenAIBackendGetClient(t *testing.T) {
	t.Run("client is initialized", func(t *testing.T) {
		backend := validBackend()
		client := backend.GetClient()
		require.NotNil(t, client)

		require.Equal(t, client, backend.GetClient(), "client should be cached and return the same instance")
	})

	t.Run("client is cached", func(t *testing.T) {
		backend := validBackend()

		client1 := backend.GetClient()
		client2 := backend.GetClient()

		require.Equal(t, client1, client2, "client should be cached and return the same instance")
	})

	t.Run("client cannot be mutated", func(t *testing.T) {
		backend := validBackend()
		client1 := backend.GetClient()

		// Change backend config
		backend.BaseURL = "https://newapi.example.com"
		backend.APIKey = "new-dummy-key"
		client2 := backend.GetClient()

		require.Equal(t, client1, client2, "client does not change when backend config changes")
	})
}
