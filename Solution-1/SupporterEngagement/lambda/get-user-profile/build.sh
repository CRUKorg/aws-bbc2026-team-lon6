#!/bin/bash
set -e

# Clean and create dist directory
rm -rf dist
mkdir -p dist

# Compile TypeScript
npx tsc

echo "Build completed successfully!"
