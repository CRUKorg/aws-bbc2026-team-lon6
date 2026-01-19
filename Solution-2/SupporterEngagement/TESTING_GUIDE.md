# Testing Guide: User Profile MCP Server

This guide explains how to test the User Profile MCP Server implementation.

## Table of Contents

1. [Unit Tests](#unit-tests)
2. [Manual Testing](#manual-testing)
3. [Integration Testing with AWS](#integration-testing-with-aws)
4. [Testing with Mock Data](#testing-with-mock-data)

---

## Unit Tests

Unit tests use Jest with mocked DynamoDB client to test the MCP server logic without AWS infrastructure.

### Running Unit Tests

```bash
# Run all tests
npm test

# Run only User Profile MCP tests
npm test -- test/mcp-servers/user-profile

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### What the Unit Tests Cover

- ✅ Server information retrieval
- ✅ Tool listing and schema validation
- ✅ get_user_profile tool execution
- ✅ update_user_profile tool execution
- ✅ get_engagement_history tool execution
- ✅ Error handling for missing parameters
- ✅ Error handling for non-existent users
- ✅ Error handling for DynamoDB failures
- ✅ Unknown tool handling

### Expected Output

```
PASS  test/mcp-servers/user-profile/server.test.ts
  UserProfileMCPServer
    ✓ should return server information
    ✓ should return list of available tools
    ✓ should retrieve user profile successfully
    ✓ should return error when user not found
    ...

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

---

## Manual Testing

Manual testing allows you to interact with the MCP server directly without AWS infrastructure.

### Running the Manual Test Script

```bash
# Make the script executable
chmod +x scripts/test-user-profile-mcp.ts

# Run the script
npx ts-node scripts/test-user-profile-mcp.ts
```

### What the Manual Test Does

1. **Get Server Info** - Displays server name, version, and description
2. **List Tools** - Shows all available tools with their schemas
3. **Test Tool Execution** - Attempts to execute tools (will fail without DynamoDB)
4. **Test Validation** - Tests parameter validation
5. **Test Error Handling** - Tests unknown tool handling

### Expected Output

```
============================================================
User Profile MCP Server - Manual Test
============================================================

Test 1: Get Server Info
------------------------------------------------------------
{
  "name": "user-profile",
  "version": "1.0.0",
  "description": "User Profile MCP Server - Provides access to user profile and engagement data"
}

Test 2: List Available Tools
------------------------------------------------------------

1. get_user_profile
   Description: Retrieve user profile by userId
   Required params: userId

2. update_user_profile
   Description: Update user profile fields
   Required params: userId, updates

3. get_engagement_history
   Description: Retrieve engagement history for a user
   Required params: userId

...
```

---

## Integration Testing with AWS

To test with real AWS infrastructure, you need to set up DynamoDB tables first.

### Prerequisites

1. **AWS Credentials Configured**
   ```bash
   aws configure
   ```

2. **Deploy Infrastructure**
   ```bash
   cd SupporterEngagement
   cdk deploy
   ```

3. **Update Environment Variables**
   
   After deployment, update `.env` with the actual table names and endpoints from CDK outputs.

### Create Test Data

Create a test script to populate DynamoDB with sample data:

```typescript
// scripts/seed-test-data.ts
import { dynamoDBClient } from '../src/mcp-servers/user-profile/dynamodb-client';

async function seedTestData() {
  const testProfile = {
    userId: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    totalDonations: 250,
    donationCount: 5,
    hasAttendedEvents: true,
    hasFundraised: false,
    hasVolunteered: true,
    personallyAffected: false,
    lovedOneAffected: true,
    communicationPreferences: {
      email: true,
      sms: false,
      phone: false,
      preferredFrequency: 'monthly',
    },
    interests: ['breast-cancer', 'research'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    consentGiven: true,
    consentDate: new Date().toISOString(),
  };

  await dynamoDBClient.putUserProfile(testProfile);
  console.log('Test data seeded successfully');
}

seedTestData().catch(console.error);
```

Run it:
```bash
npx ts-node scripts/seed-test-data.ts
```

### Test with Real Data

```typescript
// scripts/test-with-aws.ts
import { userProfileMCPServer } from '../src/mcp-servers/user-profile';

async function testWithAWS() {
  // Test 1: Get user profile
  const profile = await userProfileMCPServer.executeTool({
    name: 'get_user_profile',
    arguments: { userId: 'test-user-123' },
  });
  console.log('Profile:', JSON.stringify(profile, null, 2));

  // Test 2: Update profile
  const updated = await userProfileMCPServer.executeTool({
    name: 'update_user_profile',
    arguments: {
      userId: 'test-user-123',
      updates: { totalDonations: 300 },
    },
  });
  console.log('Updated:', JSON.stringify(updated, null, 2));

  // Test 3: Get engagement history
  const history = await userProfileMCPServer.executeTool({
    name: 'get_engagement_history',
    arguments: { userId: 'test-user-123', limit: 10 },
  });
  console.log('History:', JSON.stringify(history, null, 2));
}

testWithAWS().catch(console.error);
```

---

## Testing with Mock Data

For local development without AWS, you can create a mock DynamoDB client.

### Create Mock Client

```typescript
// src/mcp-servers/user-profile/mock-client.ts
export class MockDynamoDBClient {
  private profiles: Map<string, any> = new Map();
  private engagementHistory: Map<string, any[]> = new Map();

  async getUserProfile(userId: string) {
    return this.profiles.get(userId) || null;
  }

  async putUserProfile(profile: any) {
    this.profiles.set(profile.userId, profile);
  }

  async updateUserProfile(userId: string, updates: any) {
    const existing = this.profiles.get(userId);
    if (!existing) throw new Error('User not found');
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.profiles.set(userId, updated);
    return updated;
  }

  async getEngagementHistory(userId: string, limit: number) {
    const history = this.engagementHistory.get(userId) || [];
    return history.slice(0, limit);
  }

  // Helper methods for testing
  seedProfile(profile: any) {
    this.profiles.set(profile.userId, profile);
  }

  seedEngagement(userId: string, records: any[]) {
    this.engagementHistory.set(userId, records);
  }
}
```

### Use Mock in Tests

```typescript
import { MockDynamoDBClient } from './mock-client';

const mockClient = new MockDynamoDBClient();

// Seed test data
mockClient.seedProfile({
  userId: 'test-123',
  name: 'Test User',
  email: 'test@example.com',
  totalDonations: 100,
});

// Now test your MCP server with the mock client
```

---

## Troubleshooting

### Common Issues

**1. "Cannot find module" errors**
```bash
npm install
npm run build
```

**2. "AWS credentials not configured"**
```bash
aws configure
# Or set environment variables:
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=eu-west-2
```

**3. "Table does not exist"**
```bash
# Deploy infrastructure first
cd SupporterEngagement
cdk deploy
```

**4. "Connection timeout"**
- Check VPC security groups
- Ensure Lambda has VPC access if needed
- Verify DynamoDB endpoint is accessible

---

## Next Steps

After testing the User Profile MCP Server:

1. ✅ Verify all unit tests pass
2. ✅ Run manual tests to understand the API
3. ✅ Deploy to AWS and test with real data
4. ✅ Move on to implementing other MCP servers (Transaction, Research Papers, etc.)

---

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [DynamoDB Developer Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
