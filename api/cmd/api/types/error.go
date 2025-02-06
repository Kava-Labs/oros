package types

import (
	"github.com/openai/openai-go"
)

// ErrorResponse is the response body for an error
type ErrorResponse struct {
	ErrorBody *openai.Error `json:"error"`
}
