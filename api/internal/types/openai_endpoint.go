package types

// OpenAIEndpoint is the type for OpenAI API endpoints
type OpenAIEndpoint string

// String returns the string representation of the OpenAIEndpoint
func (e OpenAIEndpoint) String() string {
	return string(e)
}

const (
	// ChatCompletionEndpoint is the endpoint for chat completions
	ChatCompletionEndpoint OpenAIEndpoint = "/chat/completions"

	// ImageGenerationsEndpoint is the endpoint for image completions
	ImageGenerationsEndpoint OpenAIEndpoint = "/image/generations"
)
