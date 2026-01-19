# Quick Deployment Guide

Your account parameters are configured. Follow these steps to deploy:

## Pre-Deployment Checklist

✅ Account parameters updated in `cdk.context.json`
✅ CDK app configured in `bin/supporter_engagement.ts`

## Deployment Steps

### 1. Install Dependencies

```bash
cd SupporterEngagement
npm install
```

### 2. Build TypeScript

```bash
npm run build
```

### 3. Bootstrap CDK (First Time Only)

```bash
# Check your account/region from cdk.context.json
cdk bootstrap

# This creates the CDK toolkit stack in your account
```

### 4. Preview Changes (Optional)

```bash
# See what will be deployed
cdk synth

# Or see the diff
cdk diff
```

### 5. Deploy Stack

```bash
cdk deploy

# Or skip approval prompts
cdk deploy --require-approval never
```

**⏱️ Deployment Time:** 15-20 minutes (RDS and ElastiCache take the longest)

### 6. Save Stack Outputs

After deployment, CDK will output important values. **Save these!**

```
Outputs:
SupporterEngagementStack.UserPoolId = us-east-1_XXXXXXXXX
SupporterEngagementStack.UserPoolClientId = XXXXXXXXXXXXXXXXXXXXXXXXXX
SupporterEngagementStack.APIEndpoint = https://XXXXXXXXXX.execute-api.REGION.amazonaws.com/prod/
SupporterEngagementStack.ResearchPapersBucketName = supporter-engagement-research-papers-ACCOUNT
SupporterEngagementStack.ContentBucketName = supporter-engagement-content-ACCOUNT
SupporterEngagementStack.DBEndpoint = XXXXXXXXXX.REGION.rds.amazonaws.com
SupporterEngagementStack.RedisEndpoint = XXXXXXXXXX.cache.amazonaws.com
```

### 7. Get RDS Password

```bash
# List secrets
aws secretsmanager list-secrets --query "SecretList[?contains(Name, 'SupporterEngagementStack')].Name" --output text

# Get password
aws secretsmanager get-secret-value --secret-id <SECRET_NAME> --query SecretString --output text | jq -r .password
```

### 8. Update Environment File

Create `.env.deployment` with the stack outputs:

```bash
# Copy from example
cp .env.example .env.deployment

# Edit with your values
nano .env.deployment
```

Update these fields:
- `RDS_HOST` - from DBEndpoint output
- `RDS_PASSWORD` - from Secrets Manager
- `REDIS_HOST` - from RedisEndpoint output
- `COGNITO_USER_POOL_ID` - from UserPoolId output
- `COGNITO_CLIENT_ID` - from UserPoolClientId output
- `S3_RESEARCH_PAPERS_BUCKET` - from ResearchPapersBucketName output
- `S3_CONTENT_BUCKET` - from ContentBucketName output

### 9. Seed Databases

```bash
# Load environment variables
export $(cat .env.deployment | xargs)

# Seed DynamoDB tables with test users
npx ts-node scripts/seed-databases.ts
```

This creates 4 test users:
- **user-001** - Sarah Johnson (active donor, loved one affected)
- **user-002** - John Smith (super supporter with fundraising)
- **user-003** - Emma Wilson (new donor)
- **user-004** - New User (no history)

### 10. Test the Deployment

```bash
# Test dashboard for user-001
npx ts-node scripts/mvp-test.ts --scenario=dashboard --userId=user-001

# Test search
npx ts-node scripts/mvp-test.ts --scenario=search --userId=user-001 --query="breast cancer screening"

# Test new user onboarding
npx ts-node scripts/mvp-test.ts --scenario=new-user --userId=user-004

# Test fundraiser progress
npx ts-node scripts/mvp-test.ts --scenario=fundraiser --userId=user-002
```

## What Gets Deployed

### DynamoDB Tables
- `supporter-engagement-user-profiles` - User profile data
- `supporter-engagement-context` - User context and history
- `supporter-engagement-engagement` - Engagement records
- `supporter-engagement-analytics` - Analytics data

### RDS PostgreSQL
- Instance: `t3.micro` (free tier eligible)
- Database: `supporter_engagement`
- Tables: Transactions, donations

### ElastiCache Redis
- Instance: `cache.t3.micro`
- Used for: Context caching

### S3 Buckets
- Research papers bucket
- Content/knowledge base bucket

### Cognito
- User pool for authentication
- Web client for frontend

### VPC & Networking
- VPC with 2 AZs
- Public and private subnets
- NAT Gateway
- Security groups

### IAM Roles
- Lambda execution role
- Permissions for DynamoDB, S3, RDS, Bedrock

## Cost Estimate

**Monthly costs for sandbox (active testing):**
- RDS t3.micro: ~$15-20 (free tier eligible)
- ElastiCache t3.micro: ~$12
- DynamoDB: ~$1-5 (pay-per-request)
- S3: ~$1
- NAT Gateway: ~$32
- **Total: ~$60-70/month**

**To reduce costs:**
- Stop RDS when not testing: `aws rds stop-db-instance --db-instance-identifier <id>`
- Use smaller instances
- Delete stack when done: `cdk destroy`

## Troubleshooting

### Deployment Fails

```bash
# Check CDK version
cdk --version

# Clear cache
rm -rf cdk.out

# Try again
cdk deploy
```

### Can't Connect to RDS

- Check security groups allow connections
- Verify you're using the correct endpoint
- Ensure password is correct

### Seeding Fails

```bash
# Verify tables exist
aws dynamodb list-tables

# Check credentials
aws sts get-caller-identity

# Verify region matches
echo $AWS_REGION
```

## Clean Up

When you're done testing:

```bash
# Destroy the stack
cdk destroy

# Note: Some resources have RETAIN policy
# Delete manually if needed:
aws dynamodb delete-table --table-name supporter-engagement-user-profiles
aws s3 rb s3://supporter-engagement-research-papers-ACCOUNT --force
```

## Next Steps

After successful deployment:

1. ✅ Test all MVP scenarios
2. 📊 Review CloudWatch logs
3. 🔐 Test Cognito authentication
4. 🤖 Enable Bedrock access (if not already)
5. 🌐 Deploy frontend (React app)
6. 📈 Set up monitoring and alarms

## Support

- **CloudWatch Logs:** Check for errors
- **CDK Docs:** https://docs.aws.amazon.com/cdk/
- **AWS Console:** Review deployed resources

---

**Ready to deploy?** Run: `npm install && npm run build && cdk deploy`
