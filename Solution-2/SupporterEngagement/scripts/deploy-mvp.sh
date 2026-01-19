#!/bin/bash

# MVP Deployment Script
# Automates the deployment process for the Supporter Engagement Platform

set -e  # Exit on error

echo "🚀 Supporter Engagement Platform - MVP Deployment"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verify prerequisites
echo -e "${BLUE}Step 1: Verifying prerequisites...${NC}"
npm run verify
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prerequisites check failed. Please fix the issues above.${NC}"
    exit 1
fi
echo ""

# Step 2: Install dependencies
echo -e "${BLUE}Step 2: Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✓ Dependencies already installed"
fi
echo ""

# Step 3: Build TypeScript
echo -e "${BLUE}Step 3: Building TypeScript...${NC}"
npm run build
echo ""

# Step 4: Check if CDK is bootstrapped
echo -e "${BLUE}Step 4: Checking CDK bootstrap...${NC}"
ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-west-2")

echo "Account: $ACCOUNT"
echo "Region: $REGION"

# Check if bootstrap stack exists
BOOTSTRAP_STACK=$(aws cloudformation describe-stacks --stack-name CDKToolkit --region $REGION 2>/dev/null || echo "")

if [ -z "$BOOTSTRAP_STACK" ]; then
    echo -e "${YELLOW}⚠️  CDK not bootstrapped in this account/region${NC}"
    echo -e "${YELLOW}Running: cdk bootstrap${NC}"
    cdk bootstrap
else
    echo "✓ CDK already bootstrapped"
fi
echo ""

# Step 5: Preview deployment
echo -e "${BLUE}Step 5: Previewing deployment...${NC}"
echo "This will show you what resources will be created."
echo ""
read -p "Do you want to see the deployment preview? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cdk diff
    echo ""
fi

# Step 6: Deploy
echo -e "${BLUE}Step 6: Deploying stack...${NC}"
echo -e "${YELLOW}⏱️  This will take 15-20 minutes (RDS and ElastiCache are slow)${NC}"
echo ""
read -p "Ready to deploy? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "Deploying..."
cdk deploy --require-approval never --outputs-file cdk-outputs.json

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""

# Step 7: Display outputs
echo -e "${BLUE}Step 7: Stack outputs saved to cdk-outputs.json${NC}"
echo ""
echo "📋 Important outputs:"
cat cdk-outputs.json | jq -r '.["SupporterEngagementStack-Michael"] | to_entries[] | "  \(.key): \(.value)"'
echo ""

# Step 8: Get RDS password
echo -e "${BLUE}Step 8: Retrieving RDS password...${NC}"
SECRET_ARN=$(aws secretsmanager list-secrets --query "SecretList[?contains(Name, 'SupporterEngagementStack')].ARN" --output text)

if [ -n "$SECRET_ARN" ]; then
    RDS_PASSWORD=$(aws secretsmanager get-secret-value --secret-id $SECRET_ARN --query SecretString --output text | jq -r .password)
    echo "✓ RDS Password retrieved"
    echo ""
else
    echo -e "${YELLOW}⚠️  Could not find RDS secret${NC}"
    RDS_PASSWORD="<retrieve manually>"
fi

# Step 9: Create .env.deployment file
echo -e "${BLUE}Step 9: Creating .env.deployment file...${NC}"

# Extract values from outputs
USER_POOL_ID=$(cat cdk-outputs.json | jq -r '.["SupporterEngagementStack-Michael"].UserPoolId')
CLIENT_ID=$(cat cdk-outputs.json | jq -r '.["SupporterEngagementStack-Michael"].UserPoolClientId')
DB_ENDPOINT=$(cat cdk-outputs.json | jq -r '.["SupporterEngagementStack-Michael"].DBEndpoint')
REDIS_ENDPOINT=$(cat cdk-outputs.json | jq -r '.["SupporterEngagementStack-Michael"].RedisEndpoint')
RESEARCH_BUCKET=$(cat cdk-outputs.json | jq -r '.["SupporterEngagementStack-Michael"].ResearchPapersBucketName')
CONTENT_BUCKET=$(cat cdk-outputs.json | jq -r '.["SupporterEngagementStack-Michael"].ContentBucketName')

cat > .env.deployment << EOF
# AWS Configuration
AWS_REGION=$REGION
AWS_ACCOUNT_ID=$ACCOUNT

# DynamoDB Tables
DYNAMODB_USER_PROFILES_TABLE=supporter-engagement-user-profiles
DYNAMODB_CONTEXT_TABLE=supporter-engagement-context
DYNAMODB_ENGAGEMENT_TABLE=supporter-engagement-engagement
DYNAMODB_ANALYTICS_TABLE=supporter-engagement-analytics

# RDS PostgreSQL
RDS_HOST=$DB_ENDPOINT
RDS_PORT=5432
RDS_DATABASE=supporter_engagement
RDS_USERNAME=admin
RDS_PASSWORD=$RDS_PASSWORD

# ElastiCache Redis
REDIS_HOST=$REDIS_ENDPOINT
REDIS_PORT=6379

# Cognito
COGNITO_USER_POOL_ID=$USER_POOL_ID
COGNITO_CLIENT_ID=$CLIENT_ID

# S3 Buckets
S3_RESEARCH_PAPERS_BUCKET=$RESEARCH_BUCKET
S3_CONTENT_BUCKET=$CONTENT_BUCKET

# Bedrock
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
BEDROCK_REGION=us-east-1

# Application
LOG_LEVEL=info
NODE_ENV=production
EOF

echo "✓ Created .env.deployment"
echo ""

# Step 10: Seed databases
echo -e "${BLUE}Step 10: Seeding databases...${NC}"
echo ""
read -p "Do you want to seed the databases with test data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    export $(cat .env.deployment | xargs)
    npm run seed
    echo ""
fi

# Step 11: Run MVP tests
echo -e "${BLUE}Step 11: Testing deployment...${NC}"
echo ""
read -p "Do you want to run MVP tests? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    export $(cat .env.deployment | xargs)
    
    echo ""
    echo "Testing dashboard for user-001..."
    npm run mvp-test -- --scenario=dashboard --userId=user-001
    
    echo ""
    echo "Testing new user onboarding for user-004..."
    npm run mvp-test -- --scenario=new-user --userId=user-004
    
    echo ""
fi

# Summary
echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "=================================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Review the outputs in cdk-outputs.json"
echo "2. Check .env.deployment for all configuration"
echo "3. Run additional tests:"
echo "   npm run mvp-test -- --scenario=search --userId=user-001 --query=\"breast cancer\""
echo "   npm run mvp-test -- --scenario=fundraiser --userId=user-002"
echo ""
echo "4. Monitor CloudWatch logs:"
echo "   aws logs tail /aws/apigateway/supporter-engagement --follow"
echo ""
echo "5. View resources in AWS Console:"
echo "   https://console.aws.amazon.com/cloudformation"
echo ""
echo "💰 Cost Management:"
echo "   - Stop RDS when not testing: aws rds stop-db-instance --db-instance-identifier <id>"
echo "   - Estimated cost: ~\$60-70/month for active testing"
echo "   - Destroy stack when done: cdk destroy"
echo ""
echo "📖 Documentation:"
echo "   - DEPLOYMENT_GUIDE.md - Full deployment guide"
echo "   - QUICK_DEPLOY.md - Quick reference"
echo "   - TESTING_GUIDE.md - Testing instructions"
echo ""
