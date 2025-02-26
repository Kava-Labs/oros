package handlers

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/rs/zerolog"
)

type mockS3Downloader struct {
	getObjectFn func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
}

func (m *mockS3Downloader) GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
	return m.getObjectFn(ctx, params, optFns...)
}

func TestFileDownloadHandler_ServeHTTP(t *testing.T) {
	logger := zerolog.New(io.Discard)

	tests := []struct {
		name           string
		method         string
		fileID         string
		s3ClientFn     func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
		expectedStatus int
		expectedBody   string
		expectedType   string
	}{
		{
			name:   "successful download",
			method: http.MethodGet,
			fileID: "test-file",
			s3ClientFn: func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
				contentType := "text/plain"
				return &s3.GetObjectOutput{
					Body:        io.NopCloser(strings.NewReader("test content")),
					ContentType: &contentType,
				}, nil
			},
			expectedStatus: http.StatusOK,
			expectedBody:   "test content",
			expectedType:   "text/plain",
		},
		{
			name:           "invalid method",
			method:         http.MethodPost,
			fileID:         "test-file",
			expectedStatus: http.StatusMethodNotAllowed,
		},
		{
			name:           "missing file id",
			method:         http.MethodGet,
			fileID:         "",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:   "s3 error",
			method: http.MethodGet,
			fileID: "test-file",
			s3ClientFn: func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
				return nil, errors.New("s3 error")
			},
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			handler := &FileDownloadHandler{
				s3Client: &mockS3Downloader{
					getObjectFn: tt.s3ClientFn,
				},
				bucketURI: "test-bucket",
				logger:    &logger,
			}

			req := httptest.NewRequest(tt.method, "/files/"+tt.fileID, nil)
			if tt.fileID != "" {
				req.SetPathValue("file_id", tt.fileID)
			}

			w := httptest.NewRecorder()
			handler.ServeHTTP(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if tt.expectedBody != "" && w.Body.String() != tt.expectedBody {
				t.Errorf("expected body %q, got %q", tt.expectedBody, w.Body.String())
			}

			if tt.expectedType != "" && w.Header().Get("Content-Type") != tt.expectedType {
				t.Errorf("expected content-type %q, got %q", tt.expectedType, w.Header().Get("Content-Type"))
			}
		})
	}
}
