package config

import (
	"errors"
	"fmt"

	"github.com/caarlos0/env/v11"
	"github.com/kava-labs/kavachat/api/cmd/api/types"
)

// Config is the configuration for the API server
type Config struct {
	LogLevel   string `env:"LOG_LEVEL" envDefault:"info"`
	ServerPort int    `env:"PORT" envDefault:"8080"`
	ServerHost string `env:"HOST" envDefault:"127.0.0.1"`

	SkipBackendValidation bool `env:"SKIP_BACKEND_VALIDATION" envDefault:"false"`

	Backends OpenAIBackends `envPrefix:"BACKEND"`
}

// Validate checks if the required fields are set
func (c Config) Validate() error {
	if err := c.Backends.Validate(); err != nil {
		return err
	}

	// Technically still works if 0 and uses a random port. But this may cause
	// more confusion than it's worth if it wasn't intentionally left out
	if c.ServerPort == 0 {
		return errors.New("PORT is required")
	}

	if c.ServerHost == "" {
		return errors.New("HOST is required")
	}

	return nil
}

// NewConfigFromEnv reads the environment variables and returns a Config struct
func NewConfigFromEnv() (Config, error) {
	var cfg Config
	err := env.ParseWithOptions(&cfg, env.Options{Prefix: "KAVACHAT_API_"})

	return cfg, err
}

// OpenAIBackend is the configuration for each OpenAI compatible backend
type OpenAIBackend struct {
	Name          string   `env:"NAME"`
	BaseURL       string   `env:"BASE_URL"`
	APIKey        string   `env:"API_KEY"`
	AllowedModels []string `env:"ALLOWED_MODELS" envSeparator:","`

	// client is the OpenAI client for this backend, initialized once after the
	// configuration is validated
	client *types.OpenAIPassthroughClient
}

// Validate checks if the required fields are set
func (b OpenAIBackend) Validate() error {
	if b.Name == "" {
		return errors.New("NAME is required for backend")
	}

	if b.BaseURL == "" {
		return fmt.Errorf("BASE_URL is required for backend %s", b.Name)
	}

	if b.APIKey == "" {
		return fmt.Errorf("API_KEY is required for backend %s", b.Name)
	}

	if len(b.AllowedModels) == 0 {
		return fmt.Errorf("ALLOWED_MODELS needs at least one model for backend %s", b.Name)
	}

	return nil
}

// String returns a string representation of the backend with the API key redacted
func (b OpenAIBackend) String() string {
	// Return with API key redacted
	return fmt.Sprintf(
		"Name: %s, BaseURL: %s, APIKey: %s, AllowedModels: %v",
		b.Name, b.BaseURL, "REDACTED", b.AllowedModels,
	)
}

// GetClient returns the OpenAI client for the backend and caches it
func (b *OpenAIBackend) GetClient() *types.OpenAIPassthroughClient {
	if b.client == nil {
		b.client = types.NewOpenAIClient(b.BaseURL, b.APIKey)

		return b.client
	}

	return b.client
}

// OpenAIBackends is a list of OpenAIBackend
type OpenAIBackends []OpenAIBackend

func (bs OpenAIBackends) Validate() error {
	if len(bs) == 0 {
		return errors.New("at least one backend is required")
	}

	names := make(map[string]struct{})
	baseUrls := make(map[string]struct{})
	models := make(map[string]struct{})

	for _, backend := range bs {
		if err := backend.Validate(); err != nil {
			return fmt.Errorf("invalid backend: %w", err)
		}

		// Check for unique names
		if _, ok := names[backend.Name]; ok {
			return fmt.Errorf("backend name '%s' is duplicated", backend.Name)
		}

		// Check for unique base URLs
		if _, ok := baseUrls[backend.BaseURL]; ok {
			return fmt.Errorf("backend base URL '%s' is duplicated for %s", backend.BaseURL, backend.Name)
		}

		names[backend.Name] = struct{}{}
		baseUrls[backend.BaseURL] = struct{}{}

		// Allowed models name must be unique across all backends, as they are
		// used for routing to the correct backend
		for _, model := range backend.AllowedModels {
			if _, ok := models[model]; ok {
				return fmt.Errorf(
					"model '%s' is duplicated for backend %s, allowed models must be unique across all backends",
					model, backend.Name,
				)
			}

			models[model] = struct{}{}
		}
	}

	return nil
}

// GetBackendFromModel returns the backend that has the given model in its
// allowlist. If no backend supports the model, it returns nil and false
func (b *OpenAIBackends) GetBackendFromModel(model string) (*OpenAIBackend, bool) {
	for _, backend := range *b {
		for _, allowedModel := range backend.AllowedModels {
			if model == allowedModel {
				return &backend, true
			}
		}
	}

	return nil, false
}
