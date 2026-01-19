#!/bin/bash

# Script to extract logical resource IDs from CDK synth
# This helps if the logical IDs change when CDK code is modified

STACK_NAME="MichaelSupporterEngagement"

echo "🔍 Extracting Logical Resource IDs from CDK template"
echo "=========================================================="
echo ""

# Synthesize and save to file
cd "$(dirname "$0")/.." && npx cdk synth $STACK_NAME > /tmp/cdk-synth-output.yaml 2>&1

echo "📊 DynamoDB Tables:"
echo ""
grep -A 5 "Type: AWS::DynamoDB::Table" /tmp/cdk-synth-output.yaml | grep -B 5 "TableName:" | grep -E "^  [A-Z]|TableName:" | sed 's/^  //' | awk '/^[A-Z]/ {id=$1} /TableName:/ {print "  Logical ID: " id "\n  Table Name: " $2 "\n"}'

echo ""
echo "🪣 S3 Buckets:"
echo ""
grep -A 5 "Type: AWS::S3::Bucket" /tmp/cdk-synth-output.yaml | grep -B 5 "BucketName:" | grep -E "^  [A-Z]|BucketName:" | sed 's/^  //' | awk '/^[A-Z]/ {id=$1} /BucketName:/ {print "  Logical ID: " id "\n  Bucket Name: " $2 "\n"}'

echo ""
echo "=========================================================="
echo ""
echo "💡 Use these Logical IDs in the import configuration"
echo ""
