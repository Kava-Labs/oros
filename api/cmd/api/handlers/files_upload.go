package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"path"
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

type ImageUploadHandler struct {
	s3Client  S3Uploader
	bucketURI string
	publicURL string
	logger    *zerolog.Logger
}

func NewImageUploadHandler(bucketName, publicURL string, logger *zerolog.Logger) *ImageUploadHandler {
	// Load AWS config from environment
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("unable to load AWS SDK config: %v", err))
	}

	client := s3.NewFromConfig(cfg)

	return &ImageUploadHandler{
		s3Client:  client,
		bucketURI: bucketName,
		publicURL: publicURL,
		logger:    logger,
	}
}

func (h *ImageUploadHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	// Limit request size
	r.Body = http.MaxBytesReader(w, r.Body, maxFileSize)

	// Parse multipart form
	if err := r.ParseMultipartForm(maxFileSize); err != nil {
		http.Error(w, "File too large", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Error retrieving file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Generate unique filename using ULID
	id := ulid.Make()
	filename := id.String() + path.Ext(header.Filename)

	// Upload to S3
	ctx := r.Context()
	_, err = h.s3Client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(h.bucketURI),
		Key:    aws.String(filename),
		Body:   file,
	})
	if err != nil {
		h.logger.Error().Err(err).Msg("Failed to upload file to S3")
		http.Error(w, "Error uploading file", http.StatusInternalServerError)
		return
	}

	// Calculate file size from header
	size := header.Size

	now := time.Now()
	response := FileResponse{
		ID:        id.String(),
		URL:       fmt.Sprintf("%s/v1/files/%s", h.publicURL, id.String()),
		Bytes:     size,
		CreatedAt: now,
		ExpireAt:  now.Add(24 * time.Hour * 7), // 7 days expiration
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}
