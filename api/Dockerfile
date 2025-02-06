FROM golang:1.23-bookworm AS build-env

# Set up dependencies
RUN apt-get update \
    && apt-get install -y git make gcc jq curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# pre-copy/cache go.mod for pre-downloading dependencies and only
# redownload them in subsequent builds if they change
COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN go build -v -o /bin/kavachat-api ./cmd/api/

# Create a minimal image
FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build-env /bin/kavachat-api /bin/kavachat-api

# Monitor healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s  --start-interval=5s --retries=3 \
    CMD curl -f http://localhost:5555/v1/healthcheck || exit 1

EXPOSE 5555

CMD ["/bin/kavachat-api"]
