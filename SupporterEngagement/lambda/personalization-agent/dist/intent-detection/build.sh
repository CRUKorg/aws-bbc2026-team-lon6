#!/bin/bash

# Build script for intent-detection Lambda function

echo "Building intent-detection Lambda..."

# Install dependencies
npm install

# Compile TypeScript
npm run build

echo "Build complete!"
