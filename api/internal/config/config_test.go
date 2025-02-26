package config_test

import (
	"errors"
	"fmt"
	"os"
	"testing"

	"github.com/kava-labs/kavachat/api/internal/config"
	"github.com/stretchr/testify/require"
)

func TestGetConfigFromEnv(t *testing.T) {
	t.Run("default values", func(t *testing.T) {
		os.Clearenv()
		cfg, err := config.NewConfigFromEnv()
		require.NoError(t, err)
		require.Equal(t, 8080, cfg.ServerPort)
		require.Equal(t, "127.0.0.1", cfg.ServerHost)
		require.Equal(t, "plain", cfg.LogFormat)
		require.Equal(t, 9090, cfg.MetricsPort)
		require.Empty(t, cfg.Backends)
		require.Empty(t, cfg.S3BucketName)
		require.Empty(t, cfg.VisionPreprocessingMap)
	})

	t.Run("custom values", func(t *testing.T) {
		os.Clearenv() // Clear any previous environment variables
		os.Setenv("KAVACHAT_API_PORT", "9090")
		os.Setenv("KAVACHAT_API_HOST", "0.0.0.0")
		os.Setenv("KAVACHAT_API_PUBLIC_URL", "https://api.example.com")
		os.Setenv("KAVACHAT_API_S3_BUCKET", "bucket-name")
		os.Setenv("KAVACHAT_API_LOG_FORMAT", "json")
		os.Setenv("KAVACHAT_API_METRICS_PORT", "8181")

		os.Setenv("KAVACHAT_API_BACKEND_0_NAME", "OpenAI")
		os.Setenv("KAVACHAT_API_BACKEND_0_BASE_URL", "https://api.openai.com")
		os.Setenv("KAVACHAT_API_BACKEND_0_API_KEY", "test-api-key")
		os.Setenv("KAVACHAT_API_BACKEND_0_ALLOWED_MODELS", "gpt4o-mini,gpt4o")

		os.Setenv("KAVACHAT_API_BACKEND_1_NAME", "runpod")
		os.Setenv("KAVACHAT_API_BACKEND_1_BASE_URL", "https://runpod.io/some-url")
		os.Setenv("KAVACHAT_API_BACKEND_1_API_KEY", "second-api-key")
		os.Setenv("KAVACHAT_API_BACKEND_1_ALLOWED_MODELS", "deepseek-r1")

		os.Setenv("KAVACHAT_API_BACKEND_2_NAME", "backend-qwen")
		os.Setenv("KAVACHAT_API_BACKEND_2_BASE_URL", "https://runpod.io/some-url-2")
		os.Setenv("KAVACHAT_API_BACKEND_2_API_KEY", "third-api-key")
		os.Setenv("KAVACHAT_API_BACKEND_2_ALLOWED_MODELS", "qwen2.5-vl")

		os.Setenv("KAVACHAT_API_VISION_PREPROCESSOR", "deepseek-r1:qwen2.5-vl")
		os.Setenv("KAVACHAT_API_VISION_SYSTEM_PROMPT", "some-prompt")

		cfg, err := config.NewConfigFromEnv()
		require.NoError(t, err)

		require.Equal(t, 9090, cfg.ServerPort)
		require.Equal(t, "0.0.0.0", cfg.ServerHost)
		require.Equal(t, "https://api.example.com", cfg.PublicURL)
		require.Equal(t, "bucket-name", cfg.S3BucketName)
		require.Equal(t, "json", cfg.LogFormat)
		require.Equal(t, 8181, cfg.MetricsPort)

		require.Len(t, cfg.Backends, 3)

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
			{
				Name:          "backend-qwen",
				BaseURL:       "https://runpod.io/some-url-2",
				APIKey:        "third-api-key",
				AllowedModels: []string{"qwen2.5-vl"},
			},
		}

		require.Equal(t, expectedBackends, cfg.Backends)

		expectedVisionPreprocessingMap := map[string]string{
			"deepseek-r1": "qwen2.5-vl",
		}

		require.Equal(t, expectedVisionPreprocessingMap, cfg.VisionPreprocessingMap)
		require.Equal(t, "some-prompt", cfg.VisionSystemPrompt)
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
			name: "no error without trailing slash in BaseURL",
			backend: func() config.OpenAIBackend {
				b := validBackend()
				b.BaseURL = "https://api.openai.com/v1"
				return b
			}(),
			wantErr: nil,
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

func TestConfigString(t *testing.T) {
	cfg := config.Config{
		LogLevel:     "debug",
		ServerPort:   8080,
		ServerHost:   "localhost",
		PublicURL:    "http://localhost:8080",
		MetricsPort:  9090,
		S3BucketName: "my-bucket",
		Backends: []config.OpenAIBackend{
			{
				Name:          "TestBackend",
				BaseURL:       "https://api.test.com",
				APIKey:        "secret-key",
				AllowedModels: []string{"model1", "model2"},
			},
		},
	}

	str := cfg.String()
	require.Contains(t, str, "LogLevel: debug")
	require.Contains(t, str, "ServerPort: 8080")
	require.Contains(t, str, "ServerHost: localhost")
	require.Contains(t, str, "PublicURL: http://localhost:8080")
	require.Contains(t, str, "MetricsPort: 9090")
	require.Contains(t, str, "S3BucketName: my-bucket")
	require.Contains(t, str, "Backends:")
	require.Contains(t, str, "TestBackend")
	require.Contains(t, str, "REDACTED")      // API key should be redacted
	require.NotContains(t, str, "secret-key") // Should not contain the actual API key
}

func TestConfigValidate(t *testing.T) {
	validCfg := config.Config{
		ServerPort:   8080,
		ServerHost:   "127.0.0.1",
		LogFormat:    "json",
		PublicURL:    "http://localhost:8080", // PublicURL is required
		S3BucketName: "test-bucket",
		Backends:     []config.OpenAIBackend{validBackend()},
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
			name: "missing ServerPort",
			cfg: func() config.Config {
				cfg := validCfg
				cfg.ServerPort = 0
				return cfg
			}(),
			wantErr: errors.New("PORT is required"),
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
		{
			name: "missing PublicURL",
			cfg: func() config.Config {
				cfg := validCfg
				cfg.PublicURL = ""
				return cfg
			}(),
			wantErr: errors.New("PUBLIC_URL is required"),
		},
		{
			name: "invalid LogFormat",
			cfg: func() config.Config {
				cfg := validCfg
				cfg.LogFormat = "invalid"
				return cfg
			}(),
			wantErr: errors.New("LOG_FORMAT must be 'plain' or 'json'"),
		},
		{
			name: "valid - vision map",
			cfg: func() config.Config {
				cfg := validCfg
				cfg.VisionPreprocessingMap = map[string]string{
					"model1": "model2",
				}

				cfg.VisionSystemPrompt = "some-prompt"

				return cfg
			}(),
			wantErr: nil,
		},
		{
			name: "invalid - vision map unknown key",
			cfg: func() config.Config {
				cfg := validCfg
				cfg.VisionPreprocessingMap = map[string]string{
					"hello": "model2",
				}
				cfg.VisionSystemPrompt = "some-prompt"

				return cfg
			}(),
			wantErr: errors.New("model 'hello' in VISION_PREPROCESSING is not supported by any backend"),
		},
		{
			name: "invalid - vision map unknown value",
			cfg: func() config.Config {
				cfg := validCfg
				cfg.VisionPreprocessingMap = map[string]string{
					"model1": "world",
				}
				cfg.VisionSystemPrompt = "some-prompt"

				return cfg
			}(),
			wantErr: errors.New("vision model 'world' in VISION_PREPROCESSING is not supported by any backend"),
		},
		{
			name: "invalid - vision prompt not set when vision map is set",
			cfg: func() config.Config {
				cfg := validCfg
				cfg.VisionPreprocessingMap = map[string]string{
					"model1": "model2",
				}
				cfg.VisionSystemPrompt = ""

				return cfg
			}(),
			wantErr: errors.New("VISION_SYSTEM_PROMPT is required when VISION_PREPROCESSOR has entries"),
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

// Test GetBackendFromModel function
func TestGetBackendFromModel(t *testing.T) {
	backends := config.OpenAIBackends{
		{
			Name:          "OpenAI",
			BaseURL:       "https://api.openai.com",
			APIKey:        "test-api-key",
			AllowedModels: []string{"gpt-4", "gpt-3.5-turbo"},
		},
		{
			Name:          "RunPod",
			BaseURL:       "https://api.runpod.io",
			APIKey:        "runpod-key",
			AllowedModels: []string{"deepseek-r1", "llama-3"},
		},
	}

	t.Run("model exists in first backend", func(t *testing.T) {
		backend, found := backends.GetBackendFromModel("gpt-4")
		require.True(t, found)
		require.NotNil(t, backend)
		require.Equal(t, "OpenAI", backend.Name)
	})

	t.Run("model exists in second backend", func(t *testing.T) {
		backend, found := backends.GetBackendFromModel("llama-3")
		require.True(t, found)
		require.NotNil(t, backend)
		require.Equal(t, "RunPod", backend.Name)
	})

	t.Run("model does not exist", func(t *testing.T) {
		backend, found := backends.GetBackendFromModel("nonexistent-model")
		require.False(t, found)
		require.Nil(t, backend)
	})

	t.Run("empty model name", func(t *testing.T) {
		backend, found := backends.GetBackendFromModel("")
		require.False(t, found)
		require.Nil(t, backend)
	})
}
