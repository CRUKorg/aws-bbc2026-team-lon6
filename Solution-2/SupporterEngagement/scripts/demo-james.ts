#!/usr/bin/env ts-node

/**
 * Demo Script: James's Journey (Lapsed Supporter)
 * 
 * This script demonstrates the re-engagement experience for a supporter
 * who donated once 6 months ago and hasn't engaged since.
 */

import { PersonalizationAgent, UserInput } from '../src/agent/PersonalizationAgent';

const JAMES_USER_ID = 'james-lapsed-001';

async function runJamesDemo() {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 DEMO: JAMES\'S RE-ENGAGEMENT EXPERIENCE');
  console.log('   Lapsed Supporter | £100 one-time | 6 months ago');
  console.log('='.repeat(70) + '\n');

  const agent = new PersonalizationAgent();

  // Scene 1: Lapsed Supporter Dashboard
  console.log('📱 Scene 1: James returns after 6 months\n');
  console.log('⏳ Loading personalized re-engagement dashboard...\n');

  const dashboardInput: UserInput = {
    text: 'show my dashboard',
    timestamp: new Date(),
    metadata: {
      source: 'web',
      deviceType: 'mobile'
    }
  };

  try {
    const dashboardResponse = await agent.processInput(
      JAMES_USER_ID,
      dashboardInput,
      'james-session-001'
    );

    console.log('✨ RE-ENGAGEMENT DASHBOARD\n');
    console.log(dashboardResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    // Wait for effect
    await sleep(2000);

    // Scene 2: Impact Story
    console.log('📱 Scene 2: Showing James the impact of his original donation\n');
    console.log('💬 James clicks: "What happened with my donation?"\n');
    console.log('⏳ AI retrieving research outcomes...\n');

    const impactInput: UserInput = {
      text: 'What happened with my donation?',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'mobile'
      }
    };

    const impactResponse = await agent.processInput(
      JAMES_USER_ID,
      impactInput,
      'james-session-001'
    );

    console.log('🔬 YOUR DONATION\'S IMPACT\n');
    console.log(impactResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    // Wait for effect
    await sleep(2000);

    // Scene 3: Contextual Donation Prompt
    console.log('📱 Scene 3: Intelligent donation suggestion\n');
    console.log('⏳ AI calculating personalized donation amount...\n');

    const donationInput: UserInput = {
      text: 'I want to donate again',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'mobile'
      }
    };

    const donationResponse = await agent.processInput(
      JAMES_USER_ID,
      donationInput,
      'james-session-001'
    );

    console.log('💝 PERSONALIZED DONATION PROMPT\n');
    console.log(donationResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    // Summary
    console.log('✅ DEMO COMPLETE: James\'s Re-engagement\n');
    console.log('Key Takeaways:');
    console.log('  • No guilt-tripping for being away');
    console.log('  • Shows IMPACT of original donation');
    console.log('  • Creates emotional connection to research');
    console.log('  • Contextual donation suggestion with clear reason\n');
    console.log('🎯 Result: Lapsed supporter motivated to give again\n');

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
runJamesDemo().catch(console.error);
