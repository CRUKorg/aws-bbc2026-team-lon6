#!/bin/bash
set -e

echo "Building search Lambda..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Compile TypeScript
npx tsc

# Copy shared modules to dist
mkdir -p dist/shared
cp ../shared/*.js dist/shared/ 2>/dev/null || true
cp ../shared/*.d.ts dist/shared/ 2>/dev/null || true

echo "Build complete!"
