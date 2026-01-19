# Import Existing Resources Guide

## Problem
The previous CDK deployment failed and rolled back, but left behind resources with RETAIN policies:
- 4 DynamoDB tables
- 2 S3 buckets

These resources are blocking the new deployment because CloudFormation sees them as already existing.

## Solution: Import Resources into New Stack

This approach preserves all existing data and brings the resources under CDK management.

### Step 1: Verify Resources Exist

```bash
cd SupporterEngagement
bash scripts/cleanup-resources.sh
```

This will show you all the existing resources.

### Step 2: Run the Import Script

```bash
bash scripts/import-existing-resources.sh
```

This script will:
1. ✅ Verify all 6 resources exist
2. 📄 Generate the CloudFormation template from your CDK code
3. 📦 Create a resource import configuration
4. 🚀 Create the stack and import the resources
5. ⏳ Wait for the import to complete

### Step 3: Deploy Remaining Resources

Once the import is complete, deploy the rest of the stack:

```bash
npx cdk deploy MichaelSupporterEngagement --require-approval never --outputs-file cdk-outputs.json
```

This will add:
- VPC and networking
- RDS PostgreSQL database
- ElastiCache Redis cluster
- Cognito User Pool
- API Gateway
- IAM roles and policies

## How Resource Import Works

CloudFormation's resource import feature allows you to:
1. Take existing AWS resources
2. Bring them under CloudFormation/CDK management
3. Preserve all data and configurations

The process:
1. Creates a new stack in "IMPORT" mode
2. Maps existing resources to logical IDs in the template
3. Validates that resources match the template definitions
4. Completes the stack creation with imported resources

## Logical Resource IDs

The script uses these mappings (extracted from CDK synth):

| Resource Type | Logical ID | Physical Name |
|--------------|------------|---------------|
| DynamoDB Table | UserProfilesTableF49D814C | michael-supporter-engagement-user-profiles |
| DynamoDB Table | ContextTableE95A339A | michael-supporter-engagement-context |
| DynamoDB Table | EngagementTableA44AD095 | michael-supporter-engagement-engagement |
| DynamoDB Table | AnalyticsTable3F84C304 | michael-supporter-engagement-analytics |
| S3 Bucket | ResearchPapersBucketB4EFD1DD | michael-supporter-engagement-research-papers-226892087814 |
| S3 Bucket | ContentBucket52D4B12C | michael-supporter-engagement-content-226892087814 |

## Troubleshooting

### Import Fails with "Resource doesn't exist"
- Run `bash scripts/cleanup-resources.sh` to verify resources
- Check that resource names match exactly
- Verify you're in the correct region (us-west-2)

### Import Fails with "Resource configuration doesn't match"
- The existing resource configuration must match the CDK template
- Check DynamoDB table schemas (partition key, sort key)
- Check S3 bucket settings (encryption, versioning)

### Stack Already Exists Error
If you see "Stack already exists", the import may have partially succeeded:
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name MichaelSupporterEngagement --region us-west-2

# If stuck, delete and retry
aws cloudformation delete-stack --stack-name MichaelSupporterEngagement --region us-west-2
aws cloudformation wait stack-delete-complete --stack-name MichaelSupporterEngagement --region us-west-2
```

## Alternative: Fresh Start

If you don't need the existing data (recommended for hackathon/demo):

```bash
bash scripts/delete-all-resources.sh
```

Then deploy normally:
```bash
npx cdk deploy MichaelSupporterEngagement --require-approval never --outputs-file cdk-outputs.json
```

## References

- [AWS CloudFormation Resource Import](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/resource-import.html)
- [CDK Resource Import](https://docs.aws.amazon.com/cdk/v2/guide/resources.html#resources_importing)
