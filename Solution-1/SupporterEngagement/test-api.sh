#!/bin/bash

# Test script for Supporter Engagement Platform API
# Make sure your AWS credentials are valid before running

echo "=========================================="
echo "Testing Supporter Engagement Platform API"
echo "=========================================="
echo ""

# Get API URL from CloudFormation stack
echo "📡 Getting API URL from CloudFormation..."
API_URL=$(aws cloudformation describe-stacks \
  --stack-name SupporterEngagementStack \
  --region us-west-2 \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
  --output text)

if [ -z "$API_URL" ]; then
  echo "❌ Failed to get API URL. Using default..."
  API_URL="https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/"
fi

echo "✅ API URL: $API_URL"
echo ""

# Test 1: Get User Profile (should return 404 or profile data)
echo "=========================================="
echo "Test 1: GET /profile?userId=test-user-123"
echo "=========================================="
curl -X GET "${API_URL}profile?userId=test-user-123" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (not JSON)"
echo ""

# Test 2: Personalization Agent
echo "=========================================="
echo "Test 2: POST /agent (Personalization Engine)"
echo "=========================================="
echo "Request: Asking for donation recommendations..."

curl -X POST "${API_URL}agent" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "userId": "test-user-123",
    "input": {
      "text": "I want to make a donation to support breast cancer research. What would you recommend?",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    },
    "sessionId": "test-session-'$(date +%s)'"
  }' \
  -s | jq '.' 2>/dev/null || echo "Response received (not JSON)"
echo ""

# Test 3: Search
echo "=========================================="
echo "Test 3: POST /search"
echo "=========================================="
echo "Request: Searching for breast cancer information..."

curl -X POST "${API_URL}search" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -d '{
    "userId": "test-user-123",
    "query": "breast cancer research",
    "limit": 5
  }' \
  -s | jq '.' 2>/dev/null || echo "Response received (not JSON)"
echo ""

# Test 4: Check Lambda function status
echo "=========================================="
echo "Test 4: Lambda Function Status"
echo "=========================================="
echo "Checking PersonalizationAgent Lambda..."

aws lambda get-function \
  --function-name SupporterEngagement-PersonalizationAgent \
  --region us-west-2 \
  --query '{Name:Configuration.FunctionName, Runtime:Configuration.Runtime, Handler:Configuration.Handler, State:Configuration.State, LastModified:Configuration.LastModified}' \
  --output table 2>/dev/null || echo "❌ Failed to get Lambda info"
echo ""

# Test 5: Check recent Lambda logs
echo "=========================================="
echo "Test 5: Recent Lambda Logs (Last 5 minutes)"
echo "=========================================="
echo "Fetching logs from PersonalizationAgent..."

aws logs tail /aws/lambda/SupporterEngagement-PersonalizationAgent \
  --since 5m \
  --region us-west-2 \
  --format short 2>/dev/null | head -20 || echo "❌ No recent logs or failed to fetch"
echo ""

echo "=========================================="
echo "✅ Testing Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Check HTTP status codes (200 = success, 503 = Lambda error)"
echo "2. Review Lambda logs for errors"
echo "3. If 503 errors, check Lambda handler configuration"
echo "4. Test WebSocket: wscat -c wss://[websocket-url]/prod?userId=test-user"
