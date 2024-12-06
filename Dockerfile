FROM golang:1.23-alpine AS build-env

# Set up dependencies
RUN apk add bash git make jq curl

WORKDIR /usr/src/app

# pre-copy/cache go.mod for pre-downloading dependencies and only
# redownload them in subsequent builds if they change
COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY . .
RUN go build -v -o /bin/kavachat-proxy ./...

# Create a minimal image
FROM alpine:3.21

RUN apk add bash jq curl
COPY --from=build-env /bin/kavachat-proxy /bin/kavachat-proxy

# Monitor healthcheck endpoint
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s  --start-interval=5s --retries=3 \
    CMD curl -f http://localhost:5555/v1/healthcheck || exit 1

EXPOSE 5555
CMD ["/bin/kavachat-proxy"]
