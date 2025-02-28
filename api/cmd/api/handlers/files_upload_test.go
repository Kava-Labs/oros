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
	"net/textproto"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
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

func createMultipartBody(
	t *testing.T,
	fieldName string,
	fileName string,
	fileContent []byte,
	fileContentType string,
) (*bytes.Buffer, string) {
	t.Helper()

	var b bytes.Buffer
	writer := multipart.NewWriter(&b)

	header := make(textproto.MIMEHeader)
	header.Set("Content-Disposition", fmt.Sprintf(`form-data; name="%s"; filename="%s"`, fieldName, fileName))
	header.Set("Content-Type", fileContentType)

	part, err := writer.CreatePart(header)
	require.NoError(t, err)

	_, err = io.Copy(part, bytes.NewReader(fileContent))
	require.NoError(t, err)

	err = writer.Close()
	require.NoError(t, err)

	return &b, writer.FormDataContentType()
}

func createMultipartRequest(t *testing.T, fieldName string, fileName string, fileContent []byte, fileContentType string) *http.Request {
	t.Helper()

	body, contentType := createMultipartBody(t, fieldName, fileName, fileContent, fileContentType)
	req := httptest.NewRequest(http.MethodPost, "/upload", body)
	req.Header.Set("Content-Type", contentType)

	return req
}

func TestImageUploadHandler(t *testing.T) {
	logger := zerolog.New(io.Discard)

	t.Run("successful upload", func(t *testing.T) {
		var capturedInput *s3.PutObjectInput

		mock := &mockS3Client{
			putObjectFn: func(ctx context.Context, input *s3.PutObjectInput, opts ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
				capturedInput = input
				expiration := "expiry-date=\"Fri, 23 Dec 2022 00:00:00 GMT\", rule-id=\"test-rule\""
				return &s3.PutObjectOutput{
					Expiration: &expiration,
				}, nil
			},
			getObjectFn: func(ctx context.Context, input *s3.GetObjectInput, opts ...func(*s3.Options)) (*s3.GetObjectOutput, error) {
				return nil, errors.New("not implemented")
			},
		}

		handler := &FileUploadHandler{
			s3Client:   mock,
			bucketName: "test-bucket",
			publicURL:  "http://example.com",
			logger:     &logger,
		}

		fileContent := []byte("test image content")
		contentType := "image/jpeg"
		req := createMultipartRequest(t, "file", "test.jpg", fileContent, contentType)
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.Equal(t, http.StatusCreated, w.Code)

		// Verify content type was correctly passed to S3
		require.NotNil(t, capturedInput)
		require.NotNil(t, capturedInput.ContentType)
		assert.Equal(t, contentType, *capturedInput.ContentType)

		// Verify content disposition was set correctly
		require.NotNil(t, capturedInput.ContentDisposition)
		assert.Equal(t, "inline; filename=\"test.jpg\"", *capturedInput.ContentDisposition)

		var response FileUploadResponse
		err := json.NewDecoder(w.Body).Decode(&response)
		require.NoError(t, err)

		assert.NotEmpty(t, response.ID)
		assert.Equal(t, fmt.Sprintf("http://example.com/v1/files/%s", response.ID), response.URL)
		assert.Equal(t, int64(len(fileContent)), response.Bytes)
		assert.False(t, response.CreatedAt.IsZero())
		assert.False(t, response.ExpireAt.IsZero())

		// Verify the expiration date was correctly extracted
		expectedExpireAt := time.Date(2022, time.December, 23, 0, 0, 0, 0, time.UTC)
		assert.Equal(t, expectedExpireAt, response.ExpireAt)
	})

	t.Run("method not allowed", func(t *testing.T) {
		handler := &FileUploadHandler{
			logger: &logger,
		}

		req := httptest.NewRequest(http.MethodGet, "/upload", nil)
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.Equal(t, http.StatusMethodNotAllowed, w.Code)
	})

	t.Run("file too large", func(t *testing.T) {
		handler := &FileUploadHandler{
			logger: &logger,
		}

		largeContent := bytes.Repeat([]byte("a"), maxFileSize+1)
		req := createMultipartRequest(t, "file", "large.jpg", largeContent, "image/jpeg")
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Contains(t, w.Body.String(), "File too large")
	})

	t.Run("missing file", func(t *testing.T) {
		handler := &FileUploadHandler{
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

		handler := &FileUploadHandler{
			s3Client:   mock,
			bucketName: "test-bucket",
			logger:     &logger,
		}

		req := createMultipartRequest(t, "file", "test.jpg", []byte("test content"), "image/jpeg")
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)
		assert.Contains(t, w.Body.String(), "Error uploading file")
	})

	t.Run("different content types", func(t *testing.T) {
		contentTypes := []string{
			"image/png",
			"application/pdf",
			"text/plain",
			"application/octet-stream",
		}

		for _, contentType := range contentTypes {
			t.Run(contentType, func(t *testing.T) {
				var capturedInput *s3.PutObjectInput

				mock := &mockS3Client{
					putObjectFn: func(ctx context.Context, input *s3.PutObjectInput, opts ...func(*s3.Options)) (*s3.PutObjectOutput, error) {
						capturedInput = input
						return &s3.PutObjectOutput{}, nil
					},
				}

				handler := &FileUploadHandler{
					s3Client:   mock,
					bucketName: "test-bucket",
					publicURL:  "http://example.com",
					logger:     &logger,
				}

				fileContent := []byte("test content")
				req := createMultipartRequest(t, "file", "test-file", fileContent, contentType)
				w := httptest.NewRecorder()

				handler.ServeHTTP(w, req)

				assert.Equal(t, http.StatusCreated, w.Code)
				require.NotNil(t, capturedInput)
				require.NotNil(t, capturedInput.ContentType)
				assert.Equal(t, contentType, *capturedInput.ContentType)
			})
		}
	})
}

func TestExtractExpireAt(t *testing.T) {
	tests := []struct {
		name               string
		responseExpiration *string
		expectedTime       time.Time
		expectedError      error
	}{
		{
			name:               "valid expiration date, converted to UTC",
			responseExpiration: aws.String(`expiry-date="Fri, 23 Dec 2012 00:00:00 GMT", rule-id="1"`),
			expectedTime:       time.Date(2012, time.December, 23, 0, 0, 0, 0, time.UTC),
			expectedError:      nil,
		},
		{
			name:               "nil expiration date",
			responseExpiration: nil,
			expectedTime:       time.Time{},
			expectedError:      fmt.Errorf("response expiration is nil"),
		},
		{
			name:               "empty expiration date",
			responseExpiration: aws.String(""),
			expectedTime:       time.Time{},
			expectedError:      errors.New("response expiration is empty or NotImplemented"),
		},
		{
			name:               "not implemented expiration date",
			responseExpiration: aws.String("NotImplemented"),
			expectedTime:       time.Time{},
			expectedError:      errors.New("response expiration is empty or NotImplemented"),
		},
		{
			name:               "invalid expiration date format",
			responseExpiration: aws.String(`expiry-date="invalid-date", rule-id="1"`),
			expectedTime:       time.Time{},
			expectedError:      fmt.Errorf("error parsing expiry date: parsing time \"invalid-date\" as \"Mon, 02 Jan 2006 15:04:05 MST\": cannot parse \"invalid-date\" as \"Mon\""),
		},
		{
			name:               "missing expiry-date",
			responseExpiration: aws.String(`rule-id="1"`),
			expectedTime:       time.Time{},
			expectedError:      errors.New("no expiry-date found in response"),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			expireAt, err := ExtractExpireAt(tt.responseExpiration)
			if tt.expectedError != nil {
				require.Error(t, err)
				assert.Equal(t, tt.expectedError.Error(), err.Error())
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.expectedTime, expireAt)
			}
		})
	}
}
