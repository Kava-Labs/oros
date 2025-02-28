#!/usr/bin/env bash

BUCKET_NAME="test-bucket"

# Create bucket for file upload tests
echo "Creating bucket: $BUCKET_NAME"
awslocal s3api create-bucket --bucket $BUCKET_NAME

# Set lifecycle policy for test bucket, expire 1 day after creation
echo "Setting lifecycle policy for $BUCKET_NAME"
awslocal s3api put-bucket-lifecycle-configuration \
    --bucket $BUCKET_NAME \
    --lifecycle-configuration file:///etc/localstack/init/ready.d/lifecycle.json
