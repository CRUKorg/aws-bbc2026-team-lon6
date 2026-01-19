#!/usr/bin/env ts-node

/**
 * Demo Script: Sarah's Journey (Engaged Supporter)
 * 
 * This script demonstrates the personalized experience for an engaged supporter
 * who donates regularly and is interested in breast cancer research.
 */

import { PersonalizationAgent, UserInput } from '../src/agent/PersonalizationAgent';

const SARAH_USER_ID = 'sarah-engaged-001';

async function runSarahDemo() {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 DEMO: SARAH\'S PERSONALIZED EXPERIENCE');
  console.log('   Engaged Supporter | £50/month | Breast Cancer Research');
  console.log('='.repeat(70) + '\n');

  const agent = new PersonalizationAgent();

  try {
    // Initialize session first
    console.log('🔐 Initializing session for Sarah...\n');
    const session = await agent.initializeSession(SARAH_USER_ID);
    console.log(`✅ Session initialized: ${session.sessionId}\n`);

    // Scene 1: Initial Dashboard
    console.log('📱 Scene 1: Sarah logs in and sees her personalized dashboard\n');
    console.log('⏳ Loading personalized dashboard...\n');

    const dashboardInput: UserInput = {
      text: 'show my dashboard',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'desktop'
      }
    };

    const dashboardResponse = await agent.processInput(
      SARAH_USER_ID,
      dashboardInput,
      session.sessionId
    );

    console.log('✨ PERSONALIZED DASHBOARD\n');
    console.log(dashboardResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    // Wait for effect
    await sleep(2000);

    // Scene 2: Intelligent Search
    console.log('📱 Scene 2: Sarah searches for breast cancer research\n');
    console.log('💬 Sarah types: "What progress has been made on breast cancer treatment?"\n');
    console.log('⏳ AI analyzing query and personalizing results...\n');

    const searchInput: UserInput = {
      text: 'What progress has been made on breast cancer treatment?',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'desktop'
      }
    };

    const searchResponse = await agent.processInput(
      SARAH_USER_ID,
      searchInput,
      session.sessionId
    );

    console.log('🔍 PERSONALIZED SEARCH RESULTS\n');
    console.log(searchResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    // Wait for effect
    await sleep(2000);

    // Scene 3: Missing Data Collection
    console.log('📱 Scene 3: Progressive data collection (non-intrusive)\n');
    console.log('⏳ AI notices missing communication preferences...\n');

    const preferencesInput: UserInput = {
      text: 'update my preferences',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'desktop'
      }
    };

    const preferencesResponse = await agent.processInput(
      SARAH_USER_ID,
      preferencesInput,
      session.sessionId
    );

    console.log('💬 CONTEXTUAL QUESTION\n');
    console.log(preferencesResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    // Summary
    console.log('✅ DEMO COMPLETE: Sarah\'s Experience\n');
    console.log('Key Takeaways:');
    console.log('  • Personalized dashboard showing HER impact');
    console.log('  • Search results prioritized by HER interests');
    console.log('  • Progressive data collection (non-blocking)');
    console.log('  • Every interaction contextual and relevant\n');
    console.log('🎯 Result: Engaged supporter feels valued and connected\n');

    // End session
    await agent.endSession(session.sessionId);
    console.log('✅ Session ended and context saved\n');

  } catch (error) {
    console.error('\n❌ Demo Error:', error);
    console.error('\nPlease ensure:');
    console.error('  1. AWS credentials are configured');
    console.error('  2. Stack is deployed: npm run deploy');
    console.error('  3. Database is seeded: npm run seed\n');
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the demo
runSarahDemo().catch(console.error);
