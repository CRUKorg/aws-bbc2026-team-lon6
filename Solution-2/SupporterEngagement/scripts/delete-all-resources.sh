#!/bin/bash

# Script to delete all leftover resources from failed deployment
# ⚠️  WARNING: This is DESTRUCTIVE and will permanently delete data!

REGION="us-west-2"
ACCOUNT="226892087814"

echo "⚠️  WARNING: This will DELETE all michael-supporter-engagement resources!"
echo "=========================================================="
echo ""
echo "This includes:"
echo "  - DynamoDB Tables (all data will be lost)"
echo "  - S3 Buckets (all files will be lost)"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Aborted. No resources were deleted."
  exit 0
fi

echo ""
echo "🗑️  Deleting resources..."
echo ""

# Delete DynamoDB Tables
echo "📊 Deleting DynamoDB Tables..."
for table in "michael-supporter-engagement-user-profiles" \
             "michael-supporter-engagement-context" \
             "michael-supporter-engagement-engagement" \
             "michael-supporter-engagement-analytics"; do
  echo "  Deleting table: $table"
  aws dynamodb delete-table --table-name $table --region $REGION 2>/dev/null && echo "    ✅ Deleted" || echo "    ⚠️  Not found or already deleted"
done

echo ""
echo "🪣 Deleting S3 Buckets..."
for bucket in "michael-supporter-engagement-research-papers-${ACCOUNT}" \
              "michael-supporter-engagement-content-${ACCOUNT}"; do
  echo "  Emptying bucket: $bucket"
  aws s3 rm s3://$bucket --recursive --region $REGION 2>/dev/null && echo "    ✅ Emptied" || echo "    ⚠️  Not found or already empty"
  echo "  Deleting bucket: $bucket"
  aws s3 rb s3://$bucket --region $REGION 2>/dev/null && echo "    ✅ Deleted" || echo "    ⚠️  Not found or already deleted"
done

echo ""
echo "=========================================================="
echo "✅ Cleanup complete!"
echo ""
echo "You can now deploy the stack:"
echo "  npx cdk deploy MichaelSupporterEngagement --require-approval never --outputs-file cdk-outputs.json"
echo ""
