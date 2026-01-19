#!/bin/bash

# Account Setup Script
# Configures AWS account parameters for deployment

set -e

echo "🔧 AWS Account Configuration Setup"
echo "===================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Get current AWS configuration
echo "📋 Checking current AWS configuration..."
echo ""

# Try to get account ID
CURRENT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "")
CURRENT_REGION=$(aws configure get region 2>/dev/null || echo "")
CURRENT_USER=$(aws sts get-caller-identity --query Arn --output text 2>/dev/null || echo "")

if [ -z "$CURRENT_ACCOUNT" ]; then
    echo "❌ No AWS credentials configured."
    echo ""
    echo "Please configure AWS CLI first:"
    echo "  aws configure"
    echo ""
    echo "You'll need:"
    echo "  - AWS Access Key ID"
    echo "  - AWS Secret Access Key"
    echo "  - Default region (e.g., us-east-1, eu-west-2)"
    echo ""
    exit 1
fi

echo "✓ Current AWS Configuration:"
echo "  Account ID: $CURRENT_ACCOUNT"
echo "  Region: ${CURRENT_REGION:-not set}"
echo "  User/Role: $CURRENT_USER"
echo ""

# Confirm this is the correct account
read -p "⚠️  Is this your SANDBOX/TEST account? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo ""
    echo "❌ Deployment cancelled."
    echo ""
    echo "To switch AWS accounts:"
    echo "  1. Configure different credentials: aws configure"
    echo "  2. Or use AWS profiles: aws configure --profile sandbox"
    echo "  3. Then set: export AWS_PROFILE=sandbox"
    echo ""
    exit 1
fi

# Set region if not configured
if [ -z "$CURRENT_REGION" ]; then
    echo ""
    echo "📍 No default region set."
    echo ""
    echo "Common regions:"
    echo "  1. us-east-1 (US East - N. Virginia)"
    echo "  2. us-west-2 (US West - Oregon)"
    echo "  3. eu-west-1 (Europe - Ireland)"
    echo "  4. eu-west-2 (Europe - London)"
    echo "  5. ap-southeast-1 (Asia Pacific - Singapore)"
    echo ""
    read -p "Enter region (or press Enter for us-east-1): " REGION_INPUT
    CURRENT_REGION=${REGION_INPUT:-us-east-1}
    
    aws configure set region $CURRENT_REGION
    echo "✓ Region set to: $CURRENT_REGION"
fi

echo ""
echo "📝 Updating configuration files..."

# Update cdk.context.json
cat > cdk.context.json << EOF
{
  "deployment": {
    "account": "$CURRENT_ACCOUNT",
    "region": "$CURRENT_REGION",
    "stackName": "SupporterEngagementStack",
    "environment": "sandbox"
  },
  "resourceNames": {
    "userProfilesTable": "supporter-engagement-user-profiles",
    "contextTable": "supporter-engagement-context",
    "engagementTable": "supporter-engagement-engagement",
    "analyticsTable": "supporter-engagement-analytics",
    "researchPapersBucket": "supporter-engagement-research-papers-$CURRENT_ACCOUNT",
    "contentBucket": "supporter-engagement-content-$CURRENT_ACCOUNT"
  }
}
EOF

echo "✓ Updated cdk.context.json"

# Create .env.deployment file
cat > .env.deployment << EOF
# AWS Configuration
AWS_REGION=$CURRENT_REGION
AWS_ACCOUNT_ID=$CURRENT_ACCOUNT

# DynamoDB Tables (will be created by CDK)
DYNAMODB_USER_PROFILES_TABLE=supporter-engagement-user-profiles
DYNAMODB_CONTEXT_TABLE=supporter-engagement-context
DYNAMODB_ENGAGEMENT_TABLE=supporter-engagement-engagement
DYNAMODB_ANALYTICS_TABLE=supporter-engagement-analytics

# S3 Buckets (will be created by CDK)
S3_RESEARCH_PAPERS_BUCKET=supporter-engagement-research-papers-$CURRENT_ACCOUNT
S3_CONTENT_BUCKET=supporter-engagement-content-$CURRENT_ACCOUNT

# RDS PostgreSQL (will be created by CDK - update after deployment)
RDS_HOST=pending-deployment
RDS_PORT=5432
RDS_DATABASE=supporter_engagement
RDS_USERNAME=admin
RDS_PASSWORD=pending-deployment

# ElastiCache Redis (will be created by CDK - update after deployment)
REDIS_HOST=pending-deployment
REDIS_PORT=6379

# Cognito (will be created by CDK - update after deployment)
COGNITO_USER_POOL_ID=pending-deployment
COGNITO_CLIENT_ID=pending-deployment

# Amazon Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=$CURRENT_REGION

# API Gateway (will be created by CDK - update after deployment)
API_GATEWAY_URL=pending-deployment

# Cache TTL (in seconds)
CACHE_TTL_USER_PROFILE=300
CACHE_TTL_RESEARCH_PAPERS=3600
CACHE_TTL_KNOWLEDGE_ARTICLES=3600

# Logging
LOG_LEVEL=info
EOF

echo "✓ Created .env.deployment"

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📋 Summary:"
echo "  Account: $CURRENT_ACCOUNT"
echo "  Region: $CURRENT_REGION"
echo "  Stack: SupporterEngagementStack"
echo ""
echo "🚀 Next steps:"
echo "  1. Review cdk.context.json"
echo "  2. Run: npm install"
echo "  3. Run: npm run build"
echo "  4. Run: cdk bootstrap (first time only)"
echo "  5. Run: cdk deploy"
echo ""
echo "💡 Quick deploy:"
echo "  npm install && npm run build && cdk deploy"
echo ""
