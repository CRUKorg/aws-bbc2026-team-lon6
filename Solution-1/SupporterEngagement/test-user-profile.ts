/**
 * Test script to invoke the getUserProfile Lambda handler directly
 * Usage: ts-node test-user-profile.ts <userId>
 */

import { handler } from './lambda/get-user-profile/index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Get userId from command line argument or use default
const userId = process.argv[2] || 'aisha_khan';

// Create a mock API Gateway event
const mockEvent: APIGatewayProxyEvent = {
  body: null,
  headers: {},
  multiValueHeaders: {},
  httpMethod: 'GET',
  isBase64Encoded: false,
  path: '/profile',
  pathParameters: null,
  queryStringParameters: { userId },
  multiValueQueryStringParameters: null,
  stageVariables: null,
  requestContext: {
    accountId: 'test',
    apiId: 'test',
    authorizer: null,
    protocol: 'HTTP/1.1',
    httpMethod: 'GET',
    identity: {
      accessKey: null,
      accountId: null,
      apiKey: null,
      apiKeyId: null,
      caller: null,
      clientCert: null,
      cognitoAuthenticationProvider: null,
      cognitoAuthenticationType: null,
      cognitoIdentityId: null,
      cognitoIdentityPoolId: null,
      principalOrgId: null,
      sourceIp: '127.0.0.1',
      user: null,
      userAgent: 'test',
      userArn: null
    },
    path: '/profile',
    stage: 'test',
    requestId: 'test-request-id',
    requestTimeEpoch: Date.now(),
    resourceId: 'test',
    resourcePath: '/profile'
  },
  resource: '/profile'
};

// Run the test
async function testUserProfile() {
  console.log(`\n🔍 Testing getUserProfile endpoint with userId: ${userId}\n`);
  console.log('=' .repeat(60));
  
  try {
    const result = await handler(mockEvent);
    
    console.log(`\n✅ Status Code: ${result.statusCode}`);
    console.log('\n📋 Response Headers:');
    console.log(JSON.stringify(result.headers, null, 2));
    
    console.log('\n📦 Response Body:');
    const body = JSON.parse(result.body);
    console.log(JSON.stringify(body, null, 2));
    
    if (result.statusCode === 200) {
      console.log('\n✨ Test PASSED - User profile retrieved successfully!');
      console.log(`\n👤 User: ${body.profile.name}`);
      console.log(`📍 Location: ${body.profile.location}`);
      console.log(`🎯 Profile Type: ${body.profileType}`);
      console.log(`💰 Total Donations: £${body.profile.totalDonations || 0}`);
      console.log(`🎁 Donation Count: ${body.donations.length}`);
      console.log(`❤️ Interests: ${body.profile.interests.join(', ') || 'None'}`);
    } else {
      console.log('\n❌ Test FAILED - Error response received');
    }
    
  } catch (error) {
    console.error('\n❌ Test FAILED with exception:');
    console.error(error);
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

testUserProfile();
