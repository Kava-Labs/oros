package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
	"github.com/rs/zerolog"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type mockS3Client struct {
	putObjectFn func(context.Context, *s3.PutObjectInput, ...func(*s3.Options)) (*s3.PutObjectOutput, error)
	getObjectFn func(context.Context, *s3.GetObjectInput, ...func(*s3.Options)) (*s3.GetObjectOutput, error)
}

func (m *mockS3Client) PutObject(ctx context.Context, input *s3.PutObjectInput, opts ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
	return m.putObjectFn(ctx, input, opts...)
}

func (m *mockS3Client) GetObject(ctx context.Context, input *s3.GetObjectInput, opts ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
	return m.getObjectFn(ctx, input, opts...)
}

func createMultipartRequest(t *testing.T, fieldName, fileName string, fileContent []byte) *http.Request {
	var b bytes.Buffer
	writer := multipart.NewWriter(&b)

	part, err := writer.CreateFormFile(fieldName, fileName)
	require.NoError(t, err)

	_, err = io.Copy(part, bytes.NewReader(fileContent))
	require.NoError(t, err)

	err = writer.Close()
	require.NoError(t, err)

	req := httptest.NewRequest(http.MethodPost, "/upload", &b)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req
}

func TestImageUploadHandler(t *testing.T) {
	logger := zerolog.New(io.Discard)

	t.Run("successful upload", func(t *testing.T) {
		mock := &mockS3Client{
			putObjectFn: func(ctx context.Context, input *s3.PutObjectInput, opts ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
				return &s3.PutObjectOutput{}, nil
			},
			getObjectFn: func(ctx context.Context, input *s3.GetObjectInput, opts ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
				return nil, errors.New("not implemented")
			},
		}

		handler := &ImageUploadHandler{
			s3Client:   mock,
			bucketName: "test-bucket",
			publicURL:  "http://example.com",
			logger:     &logger,
		}

		fileContent := []byte("test image content")
		req := createMultipartRequest(t, "file", "test.jpg", fileContent)
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		var response FileResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.NotEmpty(t, response.ID)
		assert.Equal(t, fmt.Sprintf("http://example.com/v1/files/%s", response.ID), response.URL)
		assert.Equal(t, int64(len(fileContent)), response.Bytes)
		assert.False(t, response.CreatedAt.IsZero())
		assert.False(t, response.ExpireAt.IsZero())
	})

	t.Run("method not allowed", func(t *testing.T) {
		handler := &ImageUploadHandler{
			logger: &logger,
		}

		req := httptest.NewRequest(http.MethodGet, "/upload", nil)
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.Equal(t, http.StatusMethodNotAllowed, w.Code)
	})

	t.Run("file too large", func(t *testing.T) {
		handler := &ImageUploadHandler{
			logger: &logger,
		}

		largeContent := bytes.Repeat([]byte("a"), maxFileSize+1)
		req := createMultipartRequest(t, "file", "large.jpg", largeContent)
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "File too large")
	})

	t.Run("missing file", func(t *testing.T) {
		handler := &ImageUploadHandler{
			logger: &logger,
		}

		var b bytes.Buffer
		writer := multipart.NewWriter(&b)
		writer.Close()

		req := httptest.NewRequest(http.MethodPost, "/upload", &b)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "Error retrieving file")
	})

	t.Run("s3 upload failure", func(t *testing.T) {
		mock := &mockS3Client{
			putObjectFn: func(ctx context.Context, input *s3.PutObjectInput, opts ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
				return nil, &smithy.OperationError{
					ServiceID:     "S3",
					OperationName: "PutObject",
					Err:           errors.New("upload failed"),
				}
			},
			getObjectFn: func(ctx context.Context, input *s3.GetObjectInput, opts ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
				return nil, errors.New("not implemented")
			},
		}

		handler := &ImageUploadHandler{
			s3Client:   mock,
			bucketName: "test-bucket",
			logger:     &logger,
		}

		req := createMultipartRequest(t, "file", "test.jpg", []byte("test content"))
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "Error uploading file")
	})
}
