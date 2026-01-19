# Deploy Now - Quick Start

Your AWS account is configured and ready to deploy!

## Account Configuration ✅

- **Account ID:** 226892087814
- **Region:** us-west-2
- **Stack Name:** SupporterEngagementStack-Michael

## One-Command Deployment

```bash
cd SupporterEngagement
npm run deploy:mvp
```

This automated script will:
1. ✅ Verify prerequisites (Node.js, AWS CLI, CDK, credentials)
2. 📦 Install dependencies
3. 🔨 Build TypeScript
4. 🏗️ Bootstrap CDK (if needed)
5. 🚀 Deploy the stack (~15-20 minutes)
6. 💾 Save outputs to `cdk-outputs.json`
7. 🔐 Retrieve RDS password
8. 📝 Create `.env.deployment` file
9. 🌱 Seed databases with test data
10. 🧪 Run MVP tests

## Manual Deployment (Step-by-Step)

If you prefer manual control:

### 1. Verify Prerequisites
```bash
npm run verify
```

### 2. Install & Build
```bash
npm install
npm run build
```

### 3. Bootstrap CDK (First Time Only)
```bash
cdk bootstrap
```

### 4. Deploy
```bash
cdk deploy --outputs-file cdk-outputs.json
```

### 5. Get RDS Password
```bash
aws secretsmanager list-secrets --query "SecretList[?contains(Name, 'SupporterEngagementStack')].Name" --output text

# Use the secret name from above
aws secretsmanager get-secret-value --secret-id <SECRET_NAME> --query SecretString --output text | jq -r .password
```

### 6. Create .env.deployment
Copy values from `cdk-outputs.json` and the RDS password:

```bash
cp .env.example .env.deployment
# Edit with your values
nano .env.deployment
```

### 7. Seed Databases
```bash
export $(cat .env.deployment | xargs)
npm run seed
```

### 8. Test
```bash
npm run mvp-test -- --scenario=dashboard --userId=user-001
npm run mvp-test -- --scenario=new-user --userId=user-004
npm run mvp-test -- --scenario=search --userId=user-001 --query="breast cancer"
```

## What Gets Deployed

### Infrastructure
- **VPC** with 2 AZs, public/private subnets, NAT Gateway
- **DynamoDB** (4 tables): user-profiles, context, engagement, analytics
- **RDS PostgreSQL** (t3.micro): Transaction database
- **ElastiCache Redis** (t3.micro): Context caching
- **S3** (2 buckets): Research papers, content
- **Cognito**: User authentication
- **API Gateway**: REST API endpoint
- **IAM Roles**: Lambda execution with Bedrock access

### Test Data (After Seeding)
- **user-001**: Sarah Johnson - Active donor, loved one affected by breast cancer
- **user-002**: John Smith - Super supporter with fundraising, personally affected
- **user-003**: Emma Wilson - New donor, minimal history
- **user-004**: New User - No history, for onboarding testing

## Cost Estimate

**Active Testing (all resources running):**
- RDS t3.micro: ~$15-20/month
- ElastiCache t3.micro: ~$12/month
- NAT Gateway: ~$32/month
- DynamoDB: ~$1-5/month (pay-per-request)
- S3: ~$1/month
- **Total: ~$60-70/month**

**Cost Savings:**
```bash
# Stop RDS when not testing (saves ~$15-20/month)
aws rds stop-db-instance --db-instance-identifier <instance-id>

# Start when needed
aws rds start-db-instance --db-instance-identifier <instance-id>
```

## Monitoring

### CloudWatch Logs
```bash
# API Gateway logs
aws logs tail /aws/apigateway/supporter-engagement --follow

# Lambda logs (after Lambda functions are added)
aws logs tail /aws/lambda/supporter-engagement --follow
```

### AWS Console
- **CloudFormation**: https://us-west-2.console.aws.amazon.com/cloudformation
- **DynamoDB**: https://us-west-2.console.aws.amazon.com/dynamodb
- **RDS**: https://us-west-2.console.aws.amazon.com/rds
- **S3**: https://us-west-2.console.aws.amazon.com/s3

## Troubleshooting

### Deployment Fails
```bash
# Check CDK version
cdk --version

# Clear cache and retry
rm -rf cdk.out
cdk deploy
```

### Can't Connect to RDS
- Verify security groups allow connections
- Check VPC configuration
- Ensure you're using the correct endpoint from outputs

### Seeding Fails
```bash
# Verify tables exist
aws dynamodb list-tables --region us-west-2

# Check credentials
aws sts get-caller-identity

# Verify environment variables
echo $AWS_REGION
```

### Bedrock Access Issues
```bash
# Check Bedrock models available
aws bedrock list-foundation-models --region us-east-1

# Request access if needed (AWS Console)
# https://console.aws.amazon.com/bedrock
```

## Clean Up

When you're done testing:

```bash
# Destroy the stack
cdk destroy

# Note: Some resources have RETAIN policy
# Delete manually if needed:
aws dynamodb delete-table --table-name supporter-engagement-user-profiles --region us-west-2
aws s3 rb s3://supporter-engagement-research-papers-226892087814 --force
```

## Next Steps After Deployment

1. ✅ Verify all resources in AWS Console
2. 🧪 Run all MVP test scenarios
3. 📊 Review CloudWatch metrics
4. 🔐 Test Cognito authentication
5. 🌐 Deploy frontend (React app in `cruk-clone/`)
6. 📈 Set up CloudWatch alarms
7. 🤖 Test Bedrock integration

## Support

- **Full Guide**: See `DEPLOYMENT_GUIDE.md`
- **Quick Reference**: See `QUICK_DEPLOY.md`
- **Testing**: See `TESTING_GUIDE.md`
- **Services**: See `SERVICES_SUMMARY.md`

---

**Ready?** Run: `npm run deploy:mvp`
