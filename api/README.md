# Oros API

A proxy API that provides a unified interface for supporting multiple models
across different OpenAI compatible API backends.

## Supported Routes

Not all OpenAI API routes are supported. The following routes are supported:

- `POST /openai/v1/chat/completions`
- `POST /openai/v1/images/generations`

Non-OpenAI routes are also supported:

- `POST /v1/files`
- `GET /v1/files/:id`

## Configuration

API configuration is done through environment variables. The following variables
are required. You must have at least one backend configured, with a non-empty
allowed models list separated by commas.

```env
KAVACHAT_API_PORT=8080
KAVACHAT_API_HOST=127.0.0.1
KAVACHAT_API_METRICS_PORT=9090
KAVACHAT_API_PUBLIC_URL=https://public-url.com
KAVACHAT_API_S3_BUCKET=your-bucket-name

KAVACHAT_API_BACKEND_0_NAME=OpenAI
KAVACHAT_API_BACKEND_0_BASE_URL=https://openai-compatible/endpoint
KAVACHAT_API_BACKEND_0_API_KEY=your-api-key
KAVACHAT_API_BACKEND_0_ALLOWED_MODELS=Qwen2.5-14B-Instruct-1M,Deepseek-R1
```

You can add additional backends by incrementing the number in the variable name.

```env
KAVACHAT_API_BACKEND_1_NAME=runpod
KAVACHAT_API_BACKEND_1_BASE_URL=https://your-endpoint
KAVACHAT_API_BACKEND_1_API_KEY=your-api-key
KAVACHAT_API_BACKEND_1_ALLOWED_MODELS=other,models
```
