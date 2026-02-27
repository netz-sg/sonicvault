#!/bin/sh
set -e

echo "=== SonicVault v1.0.0 ==="
echo "Data:  ${DATA_PATH:-/data}"
echo "Music: ${LIBRARY_PATH:-/music}"

# Run idempotent database migration
node /app/migrate.cjs

# Start Next.js standalone server
exec node /app/renderer/server.js
