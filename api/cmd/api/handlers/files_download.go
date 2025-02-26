package handlers

import (
	"context"
	"io"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/rs/zerolog"
)

type S3Downloader interface {
	GetObject(ctx context.Context, params *s3.GetObjectInput, optFns ...func(*s3.Options)) (*s3.GetObjectOutput, error)
}

type FileDownloadHandler struct {
	s3Client  S3Downloader
	bucketURI string
	logger    *zerolog.Logger
}

func NewFileDownloadHandler(bucketURI string, logger *zerolog.Logger) *FileDownloadHandler {
	return &FileDownloadHandler{
		bucketURI: bucketURI,
		logger:    logger,
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
	result, err := h.s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: &h.bucketURI,
		Key:    &fileID,
	})
	if err != nil {
		h.logger.Error().Err(err).Str("file_id", fileID).Msg("Error retrieving file from S3")
		http.Error(w, "Error retrieving file", http.StatusNotFound)
		return
	}
	defer result.Body.Close()

	// Set content type if available
	if result.ContentType != nil {
		w.Header().Set("Content-Type", *result.ContentType)
	}

	// Copy the file to the response
	if _, err := io.Copy(w, result.Body); err != nil {
		h.logger.Error().Err(err).Str("file_id", fileID).Msg("Error streaming file")
		http.Error(w, "Error streaming file", http.StatusInternalServerError)
		return
	}
}
