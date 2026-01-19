#!/bin/bash

# Build script for personalization-agent Lambda function

echo "Building personalization-agent Lambda function..."

# Clean previous build
rm -rf dist

# Install dependencies
npm install

# Compile TypeScript
npm run build

echo "Build complete!"
