#!/bin/bash

# Script to investigate CDK deployment failure

STACK_NAME="MichaelSupporterEngagement"
REGION="us-west-2"

echo "🔍 Investigating deployment failure for $STACK_NAME"
echo "=================================================="
echo ""

# Check current stack status
echo "📊 Current Stack Status:"
aws cloudformation describe-stacks \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "Stacks[0].{Status:StackStatus,Reason:StackStatusReason}" \
  --output table 2>/dev/null || echo "Stack not found or deleted"

echo ""
echo "=================================================="
echo ""

# Get failed events
echo "❌ Failed Events (most recent first):"
aws cloudformation describe-stack-events \
  --stack-name $STACK_NAME \
  --region $REGION \
  --query "StackEvents[?contains(ResourceStatus, 'FAILED')].{Time:Timestamp,Resource:LogicalResourceId,Type:ResourceType,Status:ResourceStatus,Reason:ResourceStatusReason}" \
  --output table 2>/dev/null || echo "No events found"

echo ""
echo "=================================================="
echo ""

# Get all recent events (last 20)
echo "📋 Recent Events (last 20):"
aws cloudformation describe-stack-events \
  --stack-name $STACK_NAME \
  --region $REGION \
  --max-items 20 \
  --query "StackEvents[*].{Time:Timestamp,Resource:LogicalResourceId,Status:ResourceStatus,Reason:ResourceStatusReason}" \
  --output table 2>/dev/null || echo "No events found"

echo ""
echo "=================================================="
echo ""

# Check for specific common issues
echo "🔎 Checking for Common Issues:"
echo ""

# Check VPC limits
echo "1. VPC Limits:"
VPC_COUNT=$(aws ec2 describe-vpcs --region $REGION --query "length(Vpcs)" --output text 2>/dev/null)
echo "   Current VPCs: $VPC_COUNT / 5 (default limit)"

# Check Elastic IP limits
EIP_COUNT=$(aws ec2 describe-addresses --region $REGION --query "length(Addresses)" --output text 2>/dev/null)
echo "   Current Elastic IPs: $EIP_COUNT / 5 (default limit)"

# Check NAT Gateway limits
NAT_COUNT=$(aws ec2 describe-nat-gateways --region $REGION --query "length(NatGateways[?State=='available'])" --output text 2>/dev/null)
echo "   Current NAT Gateways: $NAT_COUNT / 5 (default limit)"

# Check RDS instances
RDS_COUNT=$(aws rds describe-db-instances --region $REGION --query "length(DBInstances)" --output text 2>/dev/null)
echo "   Current RDS Instances: $RDS_COUNT / 40 (default limit)"

# Check ElastiCache clusters
CACHE_COUNT=$(aws elasticache describe-cache-clusters --region $REGION --query "length(CacheClusters)" --output text 2>/dev/null)
echo "   Current ElastiCache Clusters: $CACHE_COUNT / 50 (default limit)"

echo ""
echo "=================================================="
echo ""

# Get the synthesized CloudFormation template to check for issues
echo "📄 Checking CDK Synthesis:"
cd "$(dirname "$0")/.." && npx cdk synth $STACK_NAME 2>&1 | head -20

echo ""
echo "=================================================="
echo ""

echo "💡 Common Failure Reasons:"
echo ""
echo "1. Resource Limits: VPC, NAT Gateway, or Elastic IP limits reached"
echo "2. IAM Permissions: Missing permissions to create resources"
echo "3. Resource Names: Conflicts with existing resources"
echo "4. Availability Zones: Not enough AZs available in region"
echo "5. Service Quotas: RDS, ElastiCache, or other service limits"
echo ""
echo "To fix:"
echo "  - Check the failed events above for specific error messages"
echo "  - Verify service quotas: aws service-quotas list-service-quotas --service-code <service>"
echo "  - Request limit increases if needed"
echo "  - Simplify the stack (remove RDS/ElastiCache for MVP)"
echo ""
