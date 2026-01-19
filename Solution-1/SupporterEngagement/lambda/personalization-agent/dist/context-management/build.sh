#!/bin/bash
set -e

echo "Building context-management Lambda..."

# Clean previous build
rm -rf dist

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build TypeScript
echo "Compiling TypeScript..."
npm run build

echo "Build complete!"
