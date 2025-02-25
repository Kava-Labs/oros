package types

type OpenAIErrorType string

// These are some possible values in the error.type field, which are not
// exhaustive as the values are not documented.
const (
	OpenaiAPIErrorTypeInvalidRequest OpenAIErrorType = "invalid_request_error"
	OpenaiAPIErrorTypeRateLimit      OpenAIErrorType = "rate_limit_error"
	OpenaiAPIErrorTypeTokensLimit    OpenAIErrorType = "tokens_exceeded_error"
	OpenaiAPIErrorTypeAuth           OpenAIErrorType = "authentication_error"
	OpenaiAPIErrorTypeNotFound       OpenAIErrorType = "not_found_error"
	OpenaiAPIErrorTypeServer         OpenAIErrorType = "server_error"
	OpenaiAPIErrorTypePermission     OpenAIErrorType = "permission_error"
)

// OpenAIErrorTypeFromStatusCode returns the OpenAIErrorType for a given HTTP
// status code. This is a best-effort mapping and may not be exhaustive or
// match the actual error type returned by OpenAI's API.
func OpenAIErrorTypeFromStatusCode(statusCode int) OpenAIErrorType {
	switch statusCode {
	case 400:
		return OpenaiAPIErrorTypeInvalidRequest
	case 401:
		return OpenaiAPIErrorTypeAuth
	case 403:
		return OpenaiAPIErrorTypePermission
	case 404:
		return OpenaiAPIErrorTypeNotFound
	case 429:
		return OpenaiAPIErrorTypeRateLimit
	case 500:
		return OpenaiAPIErrorTypeServer
	default:
		return OpenaiAPIErrorTypeInvalidRequest
	}
}

func (t OpenAIErrorType) String() string {
	return string(t)
}
