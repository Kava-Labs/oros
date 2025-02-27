package handlers

import (
	"context"
	"fmt"
	"io"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/rs/zerolog"
)

type S3Downloader interface {
	GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
}

type FileDownloadHandler struct {
	s3Client   S3Downloader
	bucketName string
	logger     *zerolog.Logger
}

func NewFileDownloadHandler(bucketName string, baseLogger *zerolog.Logger) *FileDownloadHandler {
	logger := baseLogger.With().
		Str("handler", "FileDownloadHandler").
		Logger()

	// Load AWS config from environment
	cfg, err := config.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("unable to load AWS SDK config: %v", err))
	}

	client := s3.NewFromConfig(cfg)

	return &FileDownloadHandler{
		s3Client:   client,
		bucketName: bucketName,
		logger:     &logger,
	}
}

func (h *FileDownloadHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fileID := r.PathValue("file_id")
	if fileID == "" {
		http.Error(w, "Missing file ID", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	objectResult, err := h.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(h.bucketName),
		Key:    aws.String(fileID),
	})
	if err != nil {
		h.logger.Error().Err(err).Str("file_id", fileID).Msg("Error retrieving file from S3")

		http.Error(w, "Error retrieving file", http.StatusNotFound)
		return
	}
	defer objectResult.Body.Close()

	// Set content type if available
	if objectResult.ContentType != nil {
		w.Header().Set("Content-Type", *objectResult.ContentType)
	}

	// Set ContentDisposition if available
	if objectResult.ContentDisposition != nil {
		w.Header().Set("Content-Disposition", *objectResult.ContentDisposition)
	}

	h.logger.Debug().
		Str("bucket_name", h.bucketName).
		Str("key", fileID).
		Str("content_type", *objectResult.ContentType).
		Str("content_disposition", *objectResult.ContentDisposition).
		Msg("Downloading file")

	// Copy the file to the response
	if _, err := io.Copy(w, objectResult.Body); err != nil {
		h.logger.Error().Err(err).Str("file_id", fileID).Msg("Error streaming file")
		http.Error(w, "Error streaming file", http.StatusInternalServerError)
		return
	}
}
