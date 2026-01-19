/**
 * Test script for Personalization Agent
 * Demonstrates the agent's core functionality with MCP server integration
 */

import { PersonalizationAgent } from '../src/agent';
import { logger } from '../src/utils/logger';

async function testPersonalizationAgent() {
  console.log('='.repeat(80));
  console.log('Testing Personalization Agent');
  console.log('='.repeat(80));

  const agent = new PersonalizationAgent();

  try {
    // Test 1: Initialize session
    console.log('\n--- Test 1: Initialize Session ---');
    const userId = 'test-user-001';
    const session = await agent.initializeSession(userId);
    console.log(`✓ Session initialized: ${session.sessionId}`);
    console.log(`  User ID: ${session.userId}`);
    console.log(`  Current Flow: ${session.currentFlow}`);
    console.log(`  Flow Type: ${session.flowState.flowType}`);

    // Test 2: Process information seeking input
    console.log('\n--- Test 2: Information Seeking ---');
    const infoInput = {
      text: 'What are the symptoms of breast cancer?',
      timestamp: new Date(),
    };
    const infoResponse = await agent.processInput(userId, infoInput, session.sessionId);
    console.log(`✓ Response generated`);
    console.log(`  Intent: ${infoResponse.metadata.intent}`);
    console.log(`  Confidence: ${infoResponse.metadata.confidence}`);
    console.log(`  Response: ${infoResponse.text.substring(0, 150)}...`);
    console.log(`  UI Components: ${infoResponse.uiComponents?.length || 0}`);

    // Test 3: Process personalization input
    console.log('\n--- Test 3: Personalization ---');
    const personalInput = {
      text: 'Show me my profile',
      timestamp: new Date(),
    };
    const personalResponse = await agent.processInput(userId, personalInput, session.sessionId);
    console.log(`✓ Response generated`);
    console.log(`  Intent: ${personalResponse.metadata.intent}`);
    console.log(`  Confidence: ${personalResponse.metadata.confidence}`);
    console.log(`  Response: ${personalResponse.text.substring(0, 150)}...`);
    console.log(`  UI Components: ${personalResponse.uiComponents?.length || 0}`);

    // Test 4: Process action input
    console.log('\n--- Test 4: Action Intent ---');
    const actionInput = {
      text: 'I want to donate',
      timestamp: new Date(),
    };
    const actionResponse = await agent.processInput(userId, actionInput, session.sessionId);
    console.log(`✓ Response generated`);
    console.log(`  Intent: ${actionResponse.metadata.intent}`);
    console.log(`  Confidence: ${actionResponse.metadata.confidence}`);
    console.log(`  Response: ${actionResponse.text.substring(0, 150)}...`);
    console.log(`  UI Components: ${actionResponse.uiComponents?.length || 0}`);

    // Test 5: Resume session
    console.log('\n--- Test 5: Resume Session ---');
    const resumedSession = await agent.resumeSession(session.sessionId);
    console.log(`✓ Session resumed: ${resumedSession.sessionId}`);
    console.log(`  Messages in history: ${resumedSession.messages.length}`);
    console.log(`  Last activity: ${resumedSession.lastActivityTime.toISOString()}`);

    // Test 6: Get session info
    console.log('\n--- Test 6: Get Session Info ---');
    const sessionInfo = agent.getSession(session.sessionId);
    console.log(`✓ Session info retrieved`);
    console.log(`  Session ID: ${sessionInfo?.sessionId}`);
    console.log(`  User ID: ${sessionInfo?.userId}`);
    console.log(`  Current Flow: ${sessionInfo?.currentFlow}`);
    console.log(`  Messages: ${sessionInfo?.messages.length}`);

    // Test 7: End session
    console.log('\n--- Test 7: End Session ---');
    await agent.endSession(session.sessionId);
    console.log(`✓ Session ended and context persisted`);

    // Verify session is removed
    const removedSession = agent.getSession(session.sessionId);
    console.log(`  Session removed: ${removedSession === undefined}`);

    console.log('\n' + '='.repeat(80));
    console.log('All tests completed successfully!');
    console.log('='.repeat(80));

    // Close agent connections
    await agent.close();

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    logger.error('Test failed', error as Error);
    process.exit(1);
  }
}

// Run tests
testPersonalizationAgent().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

