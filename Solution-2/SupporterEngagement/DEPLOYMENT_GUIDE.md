# AWS Deployment Guide - MVP Lite

This guide will help you deploy the Supporter Engagement Platform to your AWS sandbox environment for testing.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured with credentials
- Node.js 18+ and npm installed
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Quick Start

### 1. Configure AWS Credentials

```bash
# Configure AWS CLI with your sandbox credentials
aws configure

# Verify your credentials
aws sts get-caller-identity
```

### 2. Set Environment Variables

```bash
cd SupporterEngagement

# Copy the example environment file
cp .env.example .env.deployment

# Edit .env.deployment with your AWS details
# Set AWS_REGION to your preferred region (e.g., us-east-1, eu-west-2)
```

### 3. Bootstrap CDK (First Time Only)

```bash
# Bootstrap CDK in your AWS account
cdk bootstrap aws://ACCOUNT-ID/REGION

# Example:
# cdk bootstrap aws://123456789012/us-east-1
```

### 4. Deploy the Stack

```bash
# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Deploy the CDK stack
cdk deploy --require-approval never

# This will create:
# - DynamoDB tables (UserProfiles, Context, Engagement, Analytics)
# - S3 buckets (Research Papers, Content)
# - RDS PostgreSQL database
# - ElastiCache Redis cluster
# - Cognito User Pool
# - API Gateway
# - VPC and networking
```

**Note:** Deployment takes approximately 15-20 minutes due to RDS and ElastiCache provisioning.

### 5. Capture Stack Outputs

After deployment, CDK will output important values:

```
Outputs:
SupporterEngagementStack.UserPoolId = us-east-1_XXXXXXXXX
SupporterEngagementStack.UserPoolClientId = XXXXXXXXXXXXXXXXXXXXXXXXXX
SupporterEngagementStack.APIEndpoint = https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod/
SupporterEngagementStack.ResearchPapersBucketName = supporter-engagement-research-papers-123456789012
SupporterEngagementStack.ContentBucketName = supporter-engagement-content-123456789012
SupporterEngagementStack.DBEndpoint = XXXXXXXXXX.rds.amazonaws.com
SupporterEngagementStack.RedisEndpoint = XXXXXXXXXX.cache.amazonaws.com
```

**Save these values** - you'll need them for configuration.

### 6. Update Configuration

Update your `.env.deployment` file with the stack outputs:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# DynamoDB Tables
DYNAMODB_USER_PROFILES_TABLE=supporter-engagement-user-profiles
DYNAMODB_CONTEXT_TABLE=supporter-engagement-context
DYNAMODB_ENGAGEMENT_TABLE=supporter-engagement-engagement
DYNAMODB_ANALYTICS_TABLE=supporter-engagement-analytics

# S3 Buckets
S3_RESEARCH_PAPERS_BUCKET=supporter-engagement-research-papers-123456789012
S3_CONTENT_BUCKET=supporter-engagement-content-123456789012

# RDS PostgreSQL
RDS_HOST=XXXXXXXXXX.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=supporter_engagement
RDS_USERNAME=admin
# Get password from AWS Secrets Manager

# ElastiCache Redis
REDIS_HOST=XXXXXXXXXX.cache.amazonaws.com
REDIS_PORT=6379

# Cognito
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX

# API Gateway
API_ENDPOINT=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod/
```

### 7. Get RDS Password

The RDS password is stored in AWS Secrets Manager:

```bash
# Get the secret name
aws secretsmanager list-secrets --query "SecretList[?contains(Name, 'SupporterEngagementStack')].Name" --output text

# Get the password
aws secretsmanager get-secret-value --secret-id <SECRET_NAME> --query SecretString --output text | jq -r .password
```

Add this password to your `.env.deployment` file:

```bash
RDS_PASSWORD=<password-from-secrets-manager>
```

### 8. Seed the Databases

```bash
# Set environment variables from deployment config
export $(cat .env.deployment | xargs)

# Run the seeding script
npx ts-node scripts/seed-databases.ts
```

This will create 4 test users:
- **user-001** (Sarah Johnson) - Active donor with loved one affected by breast cancer
- **user-002** (John Smith) - Super supporter with active fundraising campaign
- **user-003** (Emma Wilson) - New donor with minimal engagement
- **user-004** (New User) - Brand new user with no history

### 9. Seed Research Papers (Optional)

```bash
# Upload sample research papers to S3
npx ts-node scripts/seed-research-papers.ts
```

### 10. Seed Knowledge Base (Optional)

```bash
# Upload sample articles to content bucket
npx ts-node scripts/seed-knowledge-base.ts
```

## Testing the Deployment

### Test 1: Query User Profile

```bash
# Test retrieving a user profile
npx ts-node scripts/test-deployed-stack.ts --test user-profile --userId user-001
```

### Test 2: Test Dashboard Generation

```bash
# Generate dashboard for a user
npx ts-node scripts/test-deployed-stack.ts --test dashboard --userId user-001
```

### Test 3: Test Search Functionality

```bash
# Test search
npx ts-node scripts/test-deployed-stack.ts --test search --query "breast cancer screening"
```

### Test 4: Test Personalization Agent

```bash
# Test full agent interaction
npx ts-node scripts/test-deployed-stack.ts --test agent --userId user-001 --input "Tell me about my impact"
```

## MVP Testing Scenarios

### Scenario 1: New User Onboarding

```bash
# Initialize session for new user
npx ts-node scripts/mvp-test.ts --scenario new-user --userId user-004
```

Expected: Missing data prompts, search bar, welcome message

### Scenario 2: Returning Donor Dashboard

```bash
# Load dashboard for active donor
npx ts-node scripts/mvp-test.ts --scenario dashboard --userId user-001
```

Expected: Donation summary, impact breakdown, personalized recommendations

### Scenario 3: Information Seeking

```bash
# Search for cancer information
npx ts-node scripts/mvp-test.ts --scenario search --userId user-003 --query "cancer prevention tips"
```

Expected: CRUK-verified search results, related articles

### Scenario 4: Fundraiser Progress

```bash
# Check fundraising campaign
npx ts-node scripts/mvp-test.ts --scenario fundraiser --userId user-002
```

Expected: Campaign progress, suggested next steps

## Cost Optimization for Sandbox

To minimize costs in your sandbox environment:

### 1. Use Smaller Instance Sizes

The stack already uses:
- RDS: `t3.micro` (eligible for free tier)
- ElastiCache: `cache.t3.micro`
- DynamoDB: Pay-per-request (no provisioned capacity)

### 2. Stop Resources When Not Testing

```bash
# Stop RDS instance
aws rds stop-db-instance --db-instance-identifier <instance-id>

# Start when needed
aws rds start-db-instance --db-instance-identifier <instance-id>
```

### 3. Delete Stack When Done

```bash
# Delete all resources
cdk destroy

# Note: Some resources (DynamoDB, S3) have RETAIN policy
# Delete them manually if needed:
aws dynamodb delete-table --table-name supporter-engagement-user-profiles
aws s3 rb s3://supporter-engagement-research-papers-ACCOUNT-ID --force
```

## Troubleshooting

### Issue: CDK Deploy Fails

```bash
# Check CDK version
cdk --version

# Update CDK
npm install -g aws-cdk@latest

# Clear CDK cache
rm -rf cdk.out
```

### Issue: Database Connection Fails

```bash
# Check security groups allow connections
# Verify VPC configuration
# Ensure Lambda functions are in correct subnets
```

### Issue: Seeding Script Fails

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check table names match
aws dynamodb list-tables

# Verify permissions
aws iam get-user
```

### Issue: No Data Returned

```bash
# Verify data was seeded
aws dynamodb scan --table-name supporter-engagement-user-profiles --limit 5

# Check CloudWatch logs
aws logs tail /aws/lambda/supporter-engagement --follow
```

## Monitoring

### CloudWatch Dashboards

```bash
# View API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=SupporterEngagementAPI \
  --start-time 2025-01-14T00:00:00Z \
  --end-time 2025-01-14T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### View Logs

```bash
# API Gateway logs
aws logs tail /aws/apigateway/supporter-engagement --follow

# Lambda logs (when created)
aws logs tail /aws/lambda/supporter-engagement-api --follow
```

## Next Steps

After successful deployment and testing:

1. **Add Lambda Functions** - Create Lambda handlers for API endpoints
2. **Configure Bedrock** - Set up Amazon Bedrock access for AI features
3. **Add Frontend** - Deploy React frontend to S3/CloudFront
4. **Set up CI/CD** - Automate deployments with GitHub Actions
5. **Add Monitoring** - Set up CloudWatch alarms and dashboards
6. **Security Hardening** - Review IAM policies, enable encryption

## Support

For issues or questions:
- Check CloudWatch Logs for error details
- Review CDK documentation: https://docs.aws.amazon.com/cdk/
- Check AWS service limits in your account
