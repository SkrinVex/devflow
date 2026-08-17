# ==========================================
# Stage 1: Build Web Frontend (React + TS + Vite)
# ==========================================
FROM node:22-alpine AS web-builder

WORKDIR /web
COPY web/package*.json ./
RUN npm install

COPY web/ ./
RUN npm run build

# ==========================================
# Stage 2: Build Go Backend (Pure Go SQLite)
# ==========================================
FROM golang:1.24-alpine AS go-builder

WORKDIR /app

# Install ca-certificates and tzdata for secure HTTPS and timezone handling
RUN apk add --no-cache ca-certificates tzdata

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Embed built frontend assets into internal/assets/dist
COPY --from=web-builder /web/dist/ ./internal/assets/dist/

# Build static binary (no CGO needed thanks to modernc.org/sqlite)
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w -extldflags '-static'" \
    -o /app/devflow \
    ./cmd/server

# ==========================================
# Stage 3: Minimal Production Runtime
# ==========================================
FROM alpine:3.21

# Install runtime security packages
RUN apk add --no-cache ca-certificates tzdata curl

# Create non-root user & data directory
RUN addgroup -S devflow && adduser -S devflow -G devflow
RUN mkdir -p /data && chown -R devflow:devflow /data

WORKDIR /app
COPY --from=go-builder /app/devflow /app/devflow

# Set permissions
RUN chown -R devflow:devflow /app

USER devflow

# Persistent volume for SQLite database and persistent JWT secret
VOLUME ["/data"]

# Expose DevFlow default port
EXPOSE 1451

ENV PORT=1451 \
    HOST=0.0.0.0 \
    DATA_DIR=/data \
    APP_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:1451/healthz || exit 1

ENTRYPOINT ["/app/devflow"]
