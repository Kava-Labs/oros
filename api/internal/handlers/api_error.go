package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/kava-labs/kavachat/api/internal/types"
	openai "github.com/sashabaranov/go-openai"
)

// RespondAPIError writes an API error to the response writer
func RespondAPIError(
	w http.ResponseWriter,
	statusCode int,
	message string,
) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	err := openai.APIError{
		Message: message,
		Type:    types.OpenAIErrorTypeFromStatusCode(statusCode).String(),
		// More undocumented fields, leave nil for now
		Param: nil,
		Code:  nil,
	}
	json.NewEncoder(w).Encode(err)
}
