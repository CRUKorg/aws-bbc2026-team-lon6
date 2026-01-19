# Testing the Personalization Engine

This directory contains test scripts to validate the deployed Supporter Engagement Platform API.

## Prerequisites

1. **Valid AWS Credentials**: Ensure your AWS credentials are not expired
   ```bash
   aws sts get-caller-identity
   ```

2. **API URL**: Get your API URL from CloudFormation outputs
   ```bash
   aws cloudformation describe-stacks \
     --stack-name SupporterEngagementStack \
     --region us-west-2 \
     --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
     --output text
   ```

## Test Scripts

### Option 1: Bash Script (Recommended for quick testing)

```bash
chmod +x test-api.sh
./test-api.sh
```

**Features:**
- Tests all API endpoints (GET /profile, POST /agent, POST /search)
- Checks Lambda function status
- Displays recent CloudWatch logs
- Requires: `curl`, `jq`, `aws-cli`

### Option 2: Node.js Script (Detailed testing)

```bash
node test-personalization.js [API_URL]
```

**Example:**
```bash
node test-personalization.js https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/
```

**Features:**
- 5 comprehensive test scenarios
- Tests personalization engine with different user queries
- Measures response times
- No external dependencies (uses built-in Node.js modules)

### Option 3: Python Script (Cross-platform)

```bash
python3 test-personalization.py [API_URL]
```

**Example:**
```bash
python3 test-personalization.py https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/
```

**Features:**
- Same test scenarios as Node.js version
- Works on any platform with Python 3
- No external dependencies (uses standard library)

## Test Scenarios

All scripts test the following scenarios:

### 1. First-time Donor Inquiry
```json
{
  "userId": "test-user-001",
  "input": {
    "text": "I want to make my first donation to support cancer research. What would you recommend?"
  }
}
```

### 2. Returning Supporter
```json
{
  "userId": "test-user-002",
  "input": {
    "text": "I donated £50 last year. How has my contribution helped?"
  }
}
```

### 3. Event Participation
```json
{
  "userId": "test-user-003",
  "input": {
    "text": "I want to participate in Race for Life. What do I need to know?"
  }
}
```

### 4. Research Information
```json
{
  "userId": "test-user-004",
  "input": {
    "text": "Tell me about the latest breast cancer research breakthroughs."
  }
}
```

### 5. User Profile Retrieval
```
GET /profile?userId=test-user-001
```

## Expected Results

### Success (HTTP 200)
```json
{
  "text": "AI-generated personalized response...",
  "uiComponents": [...],
  "requiresUserInput": true
}
```

### Service Unavailable (HTTP 503)
This indicates a Lambda function error. Common causes:
1. **Incorrect handler path** - Check Lambda configuration
2. **Missing dependencies** - Verify node_modules are included
3. **Runtime errors** - Check CloudWatch logs

**Fix:**
```bash
# Update Lambda handler configuration
aws lambda update-function-configuration \
  --function-name SupporterEngagement-PersonalizationAgent \
  --handler personalization-agent/index.handler \
  --region us-west-2
```

### Not Found (HTTP 404)
User or resource doesn't exist in DynamoDB. This is expected for test users.

## Troubleshooting

### 1. AWS Token Expired
```bash
# Refresh your AWS credentials
aws sso login
# or
aws configure
```

### 2. Lambda Handler Error (503)
```bash
# Check Lambda logs
aws logs tail /aws/lambda/SupporterEngagement-PersonalizationAgent \
  --since 10m \
  --region us-west-2 \
  --follow

# Verify handler configuration
aws lambda get-function-configuration \
  --function-name SupporterEngagement-PersonalizationAgent \
  --region us-west-2 \
  --query 'Handler'
```

Expected handler: `personalization-agent/index.handler`

### 3. Permission Errors
```bash
# Check Lambda execution role
aws lambda get-function \
  --function-name SupporterEngagement-PersonalizationAgent \
  --region us-west-2 \
  --query 'Configuration.Role'

# Verify Bedrock permissions
aws iam get-role-policy \
  --role-name [ROLE_NAME] \
  --policy-name [POLICY_NAME]
```

### 4. Rate Limiting (429)
The API has rate limits:
- 100 requests/second
- 200 burst capacity
- 10,000 requests/day (with API key)

Wait a few seconds and retry.

## Manual Testing with curl

### Test Personalization Agent
```bash
curl -X POST https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/agent \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "input": {
      "text": "I want to donate to cancer research",
      "timestamp": "2026-01-15T10:00:00Z"
    },
    "sessionId": "session-123"
  }'
```

### Test User Profile
```bash
curl -X GET "https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/profile?userId=test-user-123"
```

### Test Search
```bash
curl -X POST https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/search \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "query": "breast cancer research",
    "limit": 5
  }'
```

## WebSocket Testing

### Using wscat
```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "wss://i1fwoeho25.execute-api.us-west-2.amazonaws.com/prod?userId=test-user-123"

# Send message
{"action": "message", "userId": "test-user-123", "input": {"text": "Hello", "timestamp": "2026-01-15T10:00:00Z"}, "sessionId": "session-123"}
```

## Monitoring

### View CloudWatch Logs
```bash
# Personalization Agent logs
aws logs tail /aws/lambda/SupporterEngagement-PersonalizationAgent \
  --since 1h \
  --region us-west-2 \
  --follow

# Get User Profile logs
aws logs tail /aws/lambda/SupporterEngagement-GetUserProfile \
  --since 1h \
  --region us-west-2 \
  --follow

# Search logs
aws logs tail /aws/lambda/SupporterEngagement-Search \
  --since 1h \
  --region us-west-2 \
  --follow
```

### Check API Gateway Metrics
```bash
# Get API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value="Supporter Engagement API" \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-west-2
```

## Performance Benchmarking

### Using Apache Bench
```bash
# Test 100 requests with 10 concurrent connections
ab -n 100 -c 10 -p payload.json -T application/json \
  https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/agent
```

### Using wrk
```bash
# Test for 30 seconds with 10 connections
wrk -t10 -c10 -d30s \
  -s post.lua \
  https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/agent
```

## Next Steps

1. **Fix Lambda Handler** (if getting 503 errors)
   - Update handler path to `personalization-agent/index.handler`
   - Redeploy with `cdk deploy`

2. **Seed Test Data**
   - Run `npm run seed` to populate DynamoDB with test users
   - Rerun tests with real user IDs

3. **Monitor Performance**
   - Check CloudWatch metrics
   - Review Lambda execution times
   - Monitor Bedrock token usage

4. **Load Testing**
   - Use Apache Bench or wrk for load testing
   - Verify auto-scaling behavior
   - Check rate limiting thresholds

## Support

For issues or questions:
1. Check CloudWatch logs first
2. Verify Lambda handler configuration
3. Ensure AWS credentials are valid
4. Review API Gateway request validation errors
