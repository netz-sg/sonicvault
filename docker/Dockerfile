# ════════════════════════════════════════════════════════
# SonicVault — Docker Image (Multi-stage)
# ════════════════════════════════════════════════════════

# ── Stage 1: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Native deps for better-sqlite3 and sharp
RUN apk add --no-cache python3 make g++ vips-dev

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy full source
COPY . .

# Build Next.js standalone
RUN cd renderer && npx next build

# ── Stage 2: Production ──
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV DATA_PATH=/data
ENV LIBRARY_PATH=/music/library

# Runtime deps for better-sqlite3 and sharp
RUN apk add --no-cache vips curl

# Copy standalone build output
COPY --from=builder /app/renderer/.next/standalone ./
COPY --from=builder /app/renderer/.next/static ./renderer/.next/static
COPY --from=builder /app/renderer/public ./renderer/public

# Create data and music directories
RUN mkdir -p /data /music/library

# Data volume (SQLite DB, covers cache)
# Music volume (library output + source mounts)
VOLUME ["/data", "/music"]

EXPOSE 3000

# Health check — verify the web server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/library/stats || exit 1

CMD ["node", "renderer/server.js"]
