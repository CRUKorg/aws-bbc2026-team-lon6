#!/bin/bash

# Script to cleanup leftover resources from failed deployment

REGION="us-west-2"
PREFIX="michael-supporter-engagement"

echo "🧹 Checking for leftover resources from failed deployment"
echo "=========================================================="
echo ""

echo "📊 DynamoDB Tables:"
aws dynamodb list-tables --region $REGION --query "TableNames[?starts_with(@, '${PREFIX}')]" --output table

echo ""
echo "🪣 S3 Buckets:"
aws s3 ls | grep "${PREFIX}"

echo ""
echo "=========================================================="
echo ""
echo "⚠️  IMPORTANT: These resources have RETAIN policies to protect data."
echo ""
echo "Options:"
echo ""
echo "1. DELETE ALL (Fresh Start - DESTRUCTIVE):"
echo "   This will permanently delete all tables and buckets."
echo "   Run: bash scripts/delete-all-resources.sh"
echo ""
echo "2. IMPORT INTO STACK (Preserve Data):"
echo "   This will import existing resources into the new stack."
echo "   This is more complex and requires manual CloudFormation import."
echo ""
echo "3. RENAME RESOURCES (Avoid Conflict):"
echo "   Change resource names in the CDK stack to avoid conflicts."
echo "   This creates new resources alongside the old ones."
echo ""
echo "For a hackathon/demo with dummy data, Option 1 (DELETE ALL) is recommended."
echo ""
