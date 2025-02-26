package handlers_test

import (
	"testing"

	"github.com/kava-labs/kavachat/api/internal/handlers"
	openai "github.com/sashabaranov/go-openai"
	"github.com/stretchr/testify/assert"
)

func TestLatestUserContentHasImage(t *testing.T) {
	tests := []struct {
		name     string
		request  openai.ChatCompletionRequest
		expected []openai.ChatMessagePart
	}{
		{
			"Empty Messages",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{},
			},
			nil,
		},
		{
			"No User Message Content",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleSystem,
						Content: "System message",
					},
				},
			},
			nil,
		},
		{
			"Text User Message Content",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: "hello there",
					},
				},
			},
			nil,
		},
		{
			"Valid Image URL in User Message Content",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role: openai.ChatMessageRoleUser,
						MultiContent: []openai.ChatMessagePart{
							{
								Type: "image_url",
								ImageURL: &openai.ChatMessageImageURL{
									URL: "http://example.com/image.jpg",
								},
							},
						},
					},
				},
			},
			[]openai.ChatMessagePart{
				{
					Type: "image_url",
					ImageURL: &openai.ChatMessageImageURL{
						URL: "http://example.com/image.jpg",
					},
				},
			},
		},
		{
			"With previous user messages",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: "Some text content",
					},
					{
						Role:    openai.ChatMessageRoleAssistant,
						Content: "response",
					},
					{
						Role: openai.ChatMessageRoleUser,
						MultiContent: []openai.ChatMessagePart{
							{
								Type: "image_url",
								ImageURL: &openai.ChatMessageImageURL{
									URL: "http://example.com/image",
								},
							},
						},
					},
				},
			},
			[]openai.ChatMessagePart{
				{
					Type: "image_url",
					ImageURL: &openai.ChatMessageImageURL{
						URL: "http://example.com/image",
					},
				},
			},
		},
		{
			"Followup after image",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role: openai.ChatMessageRoleUser,
						MultiContent: []openai.ChatMessagePart{
							{
								Type: "image_url",
								ImageURL: &openai.ChatMessageImageURL{
									URL: "http://example.com/image",
								},
							},
						},
					},
					{
						Role:    openai.ChatMessageRoleAssistant,
						Content: "response",
					},
					{
						Role:    openai.ChatMessageRoleUser,
						Content: "Some text content",
					},
				},
			},
			nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := handlers.GetLatestUserContentImages(tt.request)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestUpdateLatestUserMessage(t *testing.T) {
	tests := []struct {
		name               string
		giveRequest        openai.ChatCompletionRequest
		giveImgDescription string
		wantRequest        openai.ChatCompletionRequest
	}{
		{
			"Empty Messages",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{},
			},
			"Image description",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{},
			},
		},
		{
			"No User Message",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleSystem,
						Content: "System message",
					},
				},
			},
			"Image description",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleSystem,
						Content: "System message",
					},
				},
			},
		},
		{
			"unmodified - String content",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: "Old content",
					},
				},
			},
			"image description",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: "Old content",
					},
				},
			},
		},
		{
			"unmodified - Slice content with no images",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role: openai.ChatMessageRoleUser,
						MultiContent: []openai.ChatMessagePart{
							{
								Type: "text",
								Text: "User text prompt",
							},
						},
					},
				},
			},
			"image description",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: "Old content",
					},
				},
			},
		},
		{
			"updated - single image",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role: openai.ChatMessageRoleUser,
						MultiContent: []openai.ChatMessagePart{
							{
								Type: "image_url",
								ImageURL: &openai.ChatMessageImageURL{
									URL: "http://example.com/image.jpg",
								},
							},
						},
					},
				},
			},
			"image description",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: "image description\n",
					},
				},
			},
		},
		{
			"unmodified - text in multicontent",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role: openai.ChatMessageRoleUser,
						MultiContent: []openai.ChatMessagePart{
							{
								Type: "text",
								Text: "User text prompt",
							},
						},
					},
				},
			},
			"New image description",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: "New image description\nUser text prompt",
					},
				},
			},
		},
		{
			"Update User Message with Multiple Text Parts",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role: openai.ChatMessageRoleUser,
						MultiContent: []openai.ChatMessagePart{
							{
								Type: "text",
								Text: "First text part",
							},
							{
								Type: "image_url",
								ImageURL: &openai.ChatMessageImageURL{
									URL: "http://example.com/image.jpg",
								},
							},
							{
								Type: "text",
								Text: "Second text part",
							},
						},
					},
				},
			},
			"New image description",
			openai.ChatCompletionRequest{
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleUser,
						Content: "New image description\nFirst text part\nSecond text part",
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := handlers.UpdateLatestUserMessage(tt.giveRequest, tt.giveImgDescription)
			assert.Equal(t, tt.wantRequest, result)
		})
	}
}
