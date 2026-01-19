# 🚀 Supporter Engagement Platform - Deployment Ready

## ✅ Status: Ready to Deploy

Your AWS infrastructure is configured and ready for deployment to your sandbox environment.

## Quick Start

```bash
cd SupporterEngagement

# Option 1: Automated deployment (recommended)
npm run deploy:mvp

# Option 2: Manual step-by-step
npm install
npm run build
cdk bootstrap  # First time only
cdk deploy
```

## Configuration

- **AWS Account**: 226892087814
- **Region**: us-west-2
- **Stack Name**: SupporterEngagementStack-Michael
- **Environment**: Sandbox

## Prerequisites

Before deploying, you need:

1. **AWS CLI** - Install from https://aws.amazon.com/cli/
   ```bash
   # macOS
   brew install awscli
   
   # Or download installer
   curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
   sudo installer -pkg AWSCLIV2.pkg -target /
   ```

2. **AWS Credentials** - Configure your credentials
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Default region: us-west-2
   # Default output format: json
   ```

3. **Verify Setup**
   ```bash
   aws sts get-caller-identity
   # Should show Account: 226892087814
   ```

## What Gets Deployed

### Infrastructure (~20 minutes)
- **VPC** with 2 AZs, NAT Gateway, public/private subnets
- **DynamoDB** (4 tables): user-profiles, context, engagement, analytics
- **RDS PostgreSQL** (t3.micro): Transaction database
- **ElastiCache Redis** (t3.micro): Context caching
- **S3** (2 buckets): Research papers, content
- **Cognito**: User authentication pool
- **API Gateway**: REST API endpoint
- **IAM Roles**: Lambda execution with Bedrock permissions

### Application Code
- **5 MCP Servers**: User Profile, Transaction, Research Papers, Knowledge Base, Analytics
- **3 AI Services**: Context Management, Intent Recognition, Content Personalization
- **Agent Components**: Personalization Agent, Dashboard Generator, Search Handler, Missing Data Handler
- **Flow State Machine**: Information Seeking Flow

## Deployment Steps

### 1. Install AWS CLI (if needed)

```bash
# Check if installed
aws --version

# If not installed (macOS)
brew install awscli

# Verify
aws --version
```

### 2. Configure AWS Credentials

```bash
aws configure
```

Enter your credentials:
- AWS Access Key ID: [Your access key]
- AWS Secret Access Key: [Your secret key]
- Default region name: us-west-2
- Default output format: json

### 3. Verify Configuration

```bash
aws sts get-caller-identity
```

Should output:
```json
{
    "UserId": "...",
    "Account": "226892087814",
    "Arn": "..."
}
```

### 4. Deploy

```bash
cd SupporterEngagement

# Automated deployment
npm run deploy:mvp
```

This will:
1. ✅ Verify prerequisites
2. 📦 Install dependencies
3. 🔨 Build TypeScript
4. 🏗️ Bootstrap CDK (if needed)
5. 🚀 Deploy stack (~20 minutes)
6. 💾 Save outputs
7. 🔐 Get RDS password
8. 📝 Create .env.deployment
9. 🌱 Seed databases
10. 🧪 Run MVP tests

### 5. Post-Deployment

After deployment completes, you'll have:

- `cdk-outputs.json` - Stack outputs (endpoints, IDs, etc.)
- `.env.deployment` - Environment variables for testing
- 4 test users seeded in DynamoDB
- All infrastructure running in AWS

## Test the Deployment

```bash
# Test dashboard
npm run mvp-test -- --scenario=dashboard --userId=user-001

# Test search
npm run mvp-test -- --scenario=search --userId=user-001 --query="breast cancer"

# Test new user onboarding
npm run mvp-test -- --scenario=new-user --userId=user-004

# Test fundraiser
npm run mvp-test -- --scenario=fundraiser --userId=user-002
```

## Cost Estimate

**Monthly costs (all resources running):**
- RDS t3.micro: ~$15-20
- ElastiCache t3.micro: ~$12
- NAT Gateway: ~$32
- DynamoDB: ~$1-5 (pay-per-request)
- S3: ~$1
- **Total: ~$60-70/month**

**Save money:**
```bash
# Stop RDS when not testing
aws rds stop-db-instance --db-instance-identifier <instance-id>

# Destroy stack when done
cdk destroy
```

## Troubleshooting

### AWS CLI Not Found
```bash
# Install AWS CLI
brew install awscli

# Or download from AWS
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

### No AWS Credentials
```bash
# Configure credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-west-2
```

### CDK Bootstrap Fails
```bash
# Ensure credentials are correct
aws sts get-caller-identity

# Bootstrap manually
cdk bootstrap aws://226892087814/us-west-2
```

### Deployment Fails
```bash
# Clear CDK cache
rm -rf cdk.out

# Try again
cdk deploy
```

## Monitoring

### CloudWatch Logs
```bash
# API Gateway logs
aws logs tail /aws/apigateway/supporter-engagement --follow --region us-west-2
```

### AWS Console
- CloudFormation: https://us-west-2.console.aws.amazon.com/cloudformation
- DynamoDB: https://us-west-2.console.aws.amazon.com/dynamodb
- RDS: https://us-west-2.console.aws.amazon.com/rds
- S3: https://us-west-2.console.aws.amazon.com/s3

## Clean Up

When you're done:

```bash
# Destroy the stack
cdk destroy

# Manually delete retained resources if needed
aws dynamodb delete-table --table-name supporter-engagement-user-profiles --region us-west-2
aws s3 rb s3://supporter-engagement-research-papers-226892087814 --force
```

## Documentation

- **DEPLOY_NOW.md** - Quick start guide
- **DEPLOYMENT_GUIDE.md** - Full deployment guide
- **DEPLOYMENT_STATUS.md** - Current status and checklist
- **QUICK_DEPLOY.md** - Quick reference
- **TESTING_GUIDE.md** - Testing instructions
- **SERVICES_SUMMARY.md** - Services overview

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review CloudWatch logs
3. Check AWS Console for resource status
4. Verify IAM permissions
5. Ensure Bedrock access is enabled (for AI features)

## Next Steps

After successful deployment:

1. ✅ Verify all resources in AWS Console
2. 🧪 Run all MVP test scenarios
3. 📊 Review CloudWatch metrics
4. 🔐 Test Cognito authentication
5. 🌐 Deploy frontend (React app in `cruk-clone/`)
6. 📈 Set up CloudWatch alarms
7. 🤖 Test Bedrock integration

---

**Ready to deploy?** Run: `npm run deploy:mvp`

**Need help?** See `DEPLOYMENT_GUIDE.md` for detailed instructions.
