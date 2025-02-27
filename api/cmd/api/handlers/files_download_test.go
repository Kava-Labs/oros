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
	"github.com/stretchr/testify/require"
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
		name                string
		method              string
		fileID              string
		s3ClientFn          func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
		expectedStatus      int
		expectedBody        string
		expectedType        string
		expectedDisposition string
	}{
		{
			name:   "successful download with content type",
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
			name:   "successful download with content disposition",
			method: http.MethodGet,
			fileID: "test-file-disposition",
			s3ClientFn: func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
				disposition := "attachment; filename=\"test.txt\""
				return &s3.GetObjectOutput{
					Body:               io.NopCloser(strings.NewReader("test content")),
					ContentDisposition: &disposition,
				}, nil
			},
			expectedStatus:      http.StatusOK,
			expectedBody:        "test content",
			expectedDisposition: "attachment; filename=\"test.txt\"",
		},
		{
			name:   "successful download with both headers",
			method: http.MethodGet,
			fileID: "test-file-both",
			s3ClientFn: func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
				contentType := "text/plain"
				disposition := "inline; filename=\"test.txt\""
				return &s3.GetObjectOutput{
					Body:               io.NopCloser(strings.NewReader("test content")),
					ContentType:        &contentType,
					ContentDisposition: &disposition,
				}, nil
			},
			expectedStatus:      http.StatusOK,
			expectedBody:        "test content",
			expectedType:        "text/plain",
			expectedDisposition: "inline; filename=\"test.txt\"",
		},
		{
			name:   "successful download with no headers",
			method: http.MethodGet,
			fileID: "test-file-no-headers",
			s3ClientFn: func(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
				return &s3.GetObjectOutput{
					Body: io.NopCloser(strings.NewReader("test content")),
				}, nil
			},
			expectedStatus: http.StatusOK,
			expectedBody:   "test content",
			expectedType:   "",
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
				bucketName: "test-bucket",
				logger:     &logger,
			}

			req := httptest.NewRequest(tt.method, "/files/"+tt.fileID, nil)
			if tt.fileID != "" {
				req.SetPathValue("file_id", tt.fileID)
			}

			w := httptest.NewRecorder()
			handler.ServeHTTP(w, req)

			require.Equal(t, tt.expectedStatus, w.Code, "status code should match expected")

			if tt.expectedBody != "" {
				require.Equal(t, tt.expectedBody, w.Body.String(), "response body should match expected")
			}

			if tt.expectedType != "" {
				require.Equal(t, tt.expectedType, w.Header().Get("Content-Type"), "Content-Type header should match expected")
			}

			if tt.expectedDisposition != "" {
				require.Equal(t, tt.expectedDisposition, w.Header().Get("Content-Disposition"), "Content-Disposition header should match expected")
			}
		})
	}
}
