# ════════════════════════════════════════════════════════
# SonicVault — Docker Image (Multi-stage)
# ════════════════════════════════════════════════════════

# ── Stage 1: Dependencies ──
FROM node:20-alpine AS deps

WORKDIR /app

# Native build tools for better-sqlite3 and sharp
RUN apk add --no-cache python3 make g++ vips-dev

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && npm rebuild better-sqlite3 sharp

# ── Stage 2: Build ──
FROM node:20-alpine AS builder

WORKDIR /app

# Native build tools (needed for next build to resolve native modules)
RUN apk add --no-cache python3 make g++ vips-dev

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure renderer/public exists (needed for Next.js build)
RUN mkdir -p renderer/public

# Build Next.js standalone output
RUN cd renderer && npx next build

# ── Stage 3: Production ──
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV DATA_PATH=/data
ENV LIBRARY_PATH=/music/library
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Runtime dependencies only (no build tools)
RUN apk add --no-cache vips curl

# Copy standalone build output
COPY --from=builder /app/renderer/.next/standalone ./
COPY --from=builder /app/renderer/.next/static ./renderer/.next/static

# Copy public assets (if any exist)
COPY --from=builder /app/renderer/public ./renderer/public

# Copy migration SQL files
COPY --from=builder /app/renderer/lib/db/migrations ./migrations

# Copy entrypoint and migration runner
COPY docker/entrypoint.sh /app/entrypoint.sh
COPY docker/migrate.cjs /app/migrate.cjs
RUN chmod +x /app/entrypoint.sh

# Create data and music directories
RUN mkdir -p /data/covers /music/library

# Non-root user for security
RUN addgroup --system --gid 1001 sonicvault && \
    adduser --system --uid 1001 --ingroup sonicvault sonicvault && \
    chown -R sonicvault:sonicvault /data /music /app

USER sonicvault

# Persistent volumes
VOLUME ["/data", "/music"]

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/api/library/stats || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
