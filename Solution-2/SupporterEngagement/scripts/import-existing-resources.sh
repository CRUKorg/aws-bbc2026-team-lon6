#!/bin/bash

# Script to import existing resources into the new CDK stack
# This preserves all existing data in DynamoDB tables and S3 buckets

STACK_NAME="MichaelSupporterEngagement"
REGION="us-west-2"
ACCOUNT="226892087814"

echo "📦 Importing existing resources into CDK stack"
echo "=========================================================="
echo ""

# Step 1: Create a resources-to-import.json file
echo "📝 Creating import configuration..."

cat > /tmp/resources-to-import.json << 'EOF'
[
  {
    "ResourceType": "AWS::DynamoDB::Table",
    "LogicalResourceId": "UserProfilesTableF49D814C",
    "ResourceIdentifier": {
      "TableName": "michael-supporter-engagement-user-profiles"
    }
  },
  {
    "ResourceType": "AWS::DynamoDB::Table",
    "LogicalResourceId": "ContextTableE95A339A",
    "ResourceIdentifier": {
      "TableName": "michael-supporter-engagement-context"
    }
  },
  {
    "ResourceType": "AWS::DynamoDB::Table",
    "LogicalResourceId": "EngagementTableA44AD095",
    "ResourceIdentifier": {
      "TableName": "michael-supporter-engagement-engagement"
    }
  },
  {
    "ResourceType": "AWS::DynamoDB::Table",
    "LogicalResourceId": "AnalyticsTable3F84C304",
    "ResourceIdentifier": {
      "TableName": "michael-supporter-engagement-analytics"
    }
  },
  {
    "ResourceType": "AWS::S3::Bucket",
    "LogicalResourceId": "ResearchPapersBucketB4EFD1DD",
    "ResourceIdentifier": {
      "BucketName": "michael-supporter-engagement-research-papers-226892087814"
    }
  },
  {
    "ResourceType": "AWS::S3::Bucket",
    "LogicalResourceId": "ContentBucket52D4B12C",
    "ResourceIdentifier": {
      "BucketName": "michael-supporter-engagement-content-226892087814"
    }
  }
]
EOF

echo "✅ Import configuration created"
echo ""

# Step 2: Verify resources exist
echo "🔍 Verifying resources exist..."
echo ""

echo "  Checking DynamoDB tables..."
for table in "michael-supporter-engagement-user-profiles" \
             "michael-supporter-engagement-context" \
             "michael-supporter-engagement-engagement" \
             "michael-supporter-engagement-analytics"; do
  if aws dynamodb describe-table --table-name $table --region $REGION &>/dev/null; then
    echo "    ✅ $table exists"
  else
    echo "    ❌ $table NOT FOUND"
    exit 1
  fi
done

echo ""
echo "  Checking S3 buckets..."
for bucket in "michael-supporter-engagement-research-papers-${ACCOUNT}" \
              "michael-supporter-engagement-content-${ACCOUNT}"; do
  if aws s3 ls s3://$bucket --region $REGION &>/dev/null; then
    echo "    ✅ $bucket exists"
  else
    echo "    ❌ $bucket NOT FOUND"
    exit 1
  fi
done

echo ""
echo "✅ All resources verified"
echo ""

# Step 3: Generate the CloudFormation template
echo "📄 Generating CloudFormation template..."
cd "$(dirname "$0")/.." && npx cdk synth $STACK_NAME --json 2>&1 | python3 -c "
import sys, json
# Read all input
content = sys.stdin.read()
# Find the JSON part (starts with { and ends with })
start = content.find('{')
if start != -1:
    json_content = content[start:]
    # Parse and pretty print
    try:
        data = json.loads(json_content)
        print(json.dumps(data, indent=2))
    except:
        print(json_content)
else:
    print(content)
" > /tmp/stack-template.json

if [ ! -s /tmp/stack-template.json ] || ! grep -q "Resources" /tmp/stack-template.json; then
  echo "❌ Failed to synthesize CDK stack"
  cat /tmp/stack-template.json
  exit 1
fi

echo "✅ Template generated"
echo ""

# Step 4: Create the stack with import
echo "🚀 Creating stack with resource import..."
echo ""
echo "This will:"
echo "  1. Create a new CloudFormation stack"
echo "  2. Import the existing resources into it"
echo "  3. Allow CDK to manage these resources going forward"
echo ""

aws cloudformation create-stack \
  --stack-name $STACK_NAME \
  --template-body file:///tmp/stack-template.json \
  --resources-to-import file:///tmp/resources-to-import.json \
  --capabilities CAPABILITY_IAM \
  --region $REGION

if [ $? -ne 0 ]; then
  echo "❌ Failed to create stack with imports"
  echo ""
  echo "This might be because:"
  echo "  1. The stack already exists (check AWS Console)"
  echo "  2. The logical resource IDs don't match"
  echo "  3. Some resources are missing"
  echo ""
  echo "You can check the CloudFormation console for more details:"
  echo "  https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2"
  exit 1
fi

echo ""
echo "⏳ Waiting for stack import to complete..."
echo "   This may take several minutes..."
echo ""

aws cloudformation wait stack-create-complete \
  --stack-name $STACK_NAME \
  --region $REGION

if [ $? -eq 0 ]; then
  echo ""
  echo "=========================================================="
  echo "✅ Stack import complete!"
  echo ""
  echo "The existing resources are now managed by CDK."
  echo "You can now use 'npx cdk deploy' for future updates."
  echo ""
  echo "Next steps:"
  echo "  1. Verify the stack in AWS Console"
  echo "  2. Run: npx cdk deploy MichaelSupporterEngagement --outputs-file cdk-outputs.json"
  echo "  3. This will add the remaining resources (VPC, RDS, etc.)"
  echo ""
else
  echo ""
  echo "❌ Stack import failed or timed out"
  echo ""
  echo "Check the CloudFormation console for details:"
  echo "  https://us-west-2.console.aws.amazon.com/cloudformation/home?region=us-west-2"
  echo ""
fi
