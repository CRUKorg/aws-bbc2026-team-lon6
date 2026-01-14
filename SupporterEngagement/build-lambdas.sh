#!/bin/bash

# Build all Lambda functions

echo "Building Lambda functions..."

# Build get-user-profile
echo "Building get-user-profile..."
cd lambda/get-user-profile
npm install
npm run build
cd ../..

# Build personalization-agent
echo "Building personalization-agent..."
cd lambda/personalization-agent
npm install
npm run build
cd ../..

# Build search
echo "Building search..."
cd lambda/search
npm install
npm run build
cd ../..

echo "All Lambda functions built successfully!"
