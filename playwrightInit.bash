#!/bin/bash

set -e

# Start the proxy server in the background
OPENAI_BASE_URL=${OPENAI_BASE_URL} OPENAI_API_KEY=${OPENAI_API_KEY} go run ./cmd/api/main.go &
PROXY_SERVER_PID=$! # Store the process ID of the Proxy server

echo "Started Proxy server PID: ${PROXY_SERVER_PID}"

# Ping the health check endpoint until it succeeds
echo "Waiting for the Proxy server to become ready..."
curl --retry 12 \
     --retry-delay 5 \
     --retry-all-errors \
     --silent \
     --fail \
     --output /dev/null \
     http://localhost:5555/v1/healthcheck

echo "Proxy server is ready."

# Start the webapp dev server
npm run dev
