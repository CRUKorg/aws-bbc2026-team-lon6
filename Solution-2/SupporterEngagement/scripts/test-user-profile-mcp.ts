#!/usr/bin/env ts-node
/**
 * Manual Testing Script for User Profile MCP Server
 * 
 * This script demonstrates how to use the User Profile MCP Server
 * and can be used for manual testing without AWS infrastructure.
 * 
 * Usage: npx ts-node scripts/test-user-profile-mcp.ts
 */

import { userProfileMCPServer } from '../src/mcp-servers/user-profile';

async function testMCPServer() {
  console.log('='.repeat(60));
  console.log('User Profile MCP Server - Manual Test');
  console.log('='.repeat(60));
  console.log();

  // Test 1: Get Server Info
  console.log('Test 1: Get Server Info');
  console.log('-'.repeat(60));
  const serverInfo = userProfileMCPServer.getServerInfo();
  console.log(JSON.stringify(serverInfo, null, 2));
  console.log();

  // Test 2: List Available Tools
  console.log('Test 2: List Available Tools');
  console.log('-'.repeat(60));
  const tools = userProfileMCPServer.listTools();
  tools.forEach((tool, index) => {
    console.log(`\n${index + 1}. ${tool.name}`);
    console.log(`   Description: ${tool.description}`);
    console.log(`   Required params: ${tool.inputSchema.required.join(', ')}`);
  });
  console.log();

  // Test 3: Execute get_user_profile (will fail without DynamoDB)
  console.log('Test 3: Execute get_user_profile');
  console.log('-'.repeat(60));
  console.log('Note: This will fail without DynamoDB connection');
  try {
    const result = await userProfileMCPServer.executeTool({
      name: 'get_user_profile',
      arguments: { userId: 'test-user-123' },
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('Expected error (no DynamoDB):', (error as Error).message);
  }
  console.log();

  // Test 4: Test with missing parameters
  console.log('Test 4: Test with missing parameters');
  console.log('-'.repeat(60));
  const invalidResult = await userProfileMCPServer.executeTool({
    name: 'get_user_profile',
    arguments: {},
  });
  console.log('Result:', JSON.stringify(invalidResult, null, 2));
  console.log();

  // Test 5: Test unknown tool
  console.log('Test 5: Test unknown tool');
  console.log('-'.repeat(60));
  const unknownResult = await userProfileMCPServer.executeTool({
    name: 'unknown_tool',
    arguments: {},
  });
  console.log('Result:', JSON.stringify(unknownResult, null, 2));
  console.log();

  console.log('='.repeat(60));
  console.log('Manual Test Complete');
  console.log('='.repeat(60));
}

// Run the test
testMCPServer().catch(console.error);
