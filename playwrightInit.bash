#!/bin/bash

# Check if API is running, otherwise exit.
#curl --fail http://localhost:5555/v1/healthcheck
#status=$?
#if [ $status -ne 0 ]; then
#  echo "API server is not running. Please run the API server first."
#  exit 1
#fi

echo "Proxy server is ready."

# Start the webapp dev server
bash ./e2e/pre-e2e.bash && npm run dev
