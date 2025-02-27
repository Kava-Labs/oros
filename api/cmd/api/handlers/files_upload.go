package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/oklog/ulid/v2"
	"github.com/rs/zerolog"
)

const (
	maxFileSize = 10 * 1024 * 1024 // 10MB
)

type FileResponse struct {
	ID        string    `json:"id"`
	URL       string    `json:"url"`
	Bytes     int64     `json:"bytes"`
	CreatedAt time.Time `json:"created_at"`
	ExpireAt  time.Time `json:"expire_at"`
}

type S3Uploader interface {
	PutObject(context.Context, *s3.PutObjectInput, ...func(*s3.Options)) (*s3.PutObjectOutput, error)
}

type FileUploadHandler struct {
	s3Client   S3Uploader
	bucketName string
	publicURL  string
	logger     *zerolog.Logger
}

var expireDateRegex = regexp.MustCompile(`expiry-date="([^"]+)"`)

func NewFileUploadHandler(bucketName, publicURL string, baseLogger *zerolog.Logger) *FileUploadHandler {
	logger := baseLogger.With().
		Str("handler", "FileUploadHandler").
		Logger()

	// Load AWS config from environment
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("unable to load AWS SDK config: %v", err))
	}

	client := s3.NewFromConfig(cfg)

	return &FileUploadHandler{
		s3Client:   client,
		bucketName: bucketName,
		publicURL:  publicURL,
		logger:     &logger,
	}
}

func (h *FileUploadHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Limit request size
	r.Body = http.MaxBytesReader(w, r.Body, maxFileSize)

	// Parse multipart form
	if err := r.ParseMultipartForm(maxFileSize); err != nil {
		h.logger.Debug().Err(err).Msg("Error parsing multipart form")

		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	file, fileHeader, err := r.FormFile("file")
	if err != nil {
		h.logger.Debug().Err(err).Msg("Error retrieving file from form")

		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Generate unique filename using ULID, shorter than UUID
	fileKey := ulid.Make().String()
	fileContentType := fileHeader.Header.Get("Content-Type")
	fileContentDisposition := fmt.Sprintf("inline; filename=\"%s\"", fileHeader.Filename)

	h.logger.Debug().
		Str("key", fileKey).
		Str("content_type", fileContentType).
		Str("content_disposition", fileContentDisposition).
		Msg("File uploaded successfully")

	// Upload to S3
	ctx := r.Context()
	putResponse, err := h.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(h.bucketName),
		Key:         aws.String(fileKey),
		Body:        file,
		ContentType: aws.String(fileContentType),
		// Inline for client side display
		ContentDisposition: aws.String(fileContentDisposition),
	})
	if err != nil {
		h.logger.Error().Err(err).Msg("Failed to upload file to S3")
		http.Error(w, "Error uploading file", http.StatusInternalServerError)
		return
	}

	expireAt, err := ExtractExpireAt(putResponse.Expiration)
	if err != nil {
		h.logger.
			Warn().
			Err(err).
			Str("key", fileKey).
			Str("x-amz-expiration", *putResponse.Expiration).
			Msg("Failed to extract expiration date from S3 response")

		// TODO: Actually delete instead of just setting expiration response
		expireAt = time.Now().Add(24 * time.Hour)
	}

	// Calculate file size from header
	size := fileHeader.Size

	now := time.Now()
	response := FileResponse{
		ID:        fileKey,
		URL:       fmt.Sprintf("%s/v1/files/%s", h.publicURL, fileKey),
		Bytes:     size,
		CreatedAt: now,
		// TODO: Configurable expiration & actually delete them in process
		ExpireAt: expireAt,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// ExtractExpireAt extracts the expiration date from the x-amz-expiration
// response header from S3 PutObject API response.
func ExtractExpireAt(responseExpiration *string) (time.Time, error) {
	if responseExpiration == nil {
		return time.Time{}, fmt.Errorf("response expiration is nil")
	}

	// expiry-date="Fri, 23 Dec 2012 00:00:00 GMT", rule-id="1"
	if *responseExpiration == "" || strings.Contains(*responseExpiration, "NotImplemented") {
		return time.Time{}, errors.New("response expiration is empty or NotImplemented")
	}

	matches := expireDateRegex.FindStringSubmatch(*responseExpiration)
	if len(matches) < 2 {
		return time.Time{}, errors.New("no expiry-date found in response")
	}

	expiryDate := matches[1]
	expireAt, err := time.Parse(time.RFC1123, expiryDate)
	if err != nil {
		return time.Time{}, fmt.Errorf("error parsing expiry date: %w", err)
	}

	// Convert to UTC
	return expireAt.UTC(), nil
}
