#!/usr/bin/env ts-node

/**
 * Demo Script: Ideal User Journey for James
 * 
 * This script demonstrates the complete personalized journey for James:
 * 1. Dashboard with prior context (lapsed supporter)
 * 2. Motivational content about CRUK achievements
 * 3. Information seeking experience (user breaks flow)
 * 4. Personalized call to action (running/Race for Life)
 */

import { PersonalizationAgent, UserInput } from '../src/agent/PersonalizationAgent';

const JAMES_USER_ID = 'james-lapsed-001';

async function runIdealJourneyJames() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 IDEAL USER JOURNEY - JAMES (LAPSED SUPPORTER)');
  console.log('   Demonstrating: Dashboard → Motivation → Information Seeking → Call to Action');
  console.log('='.repeat(80) + '\n');

  const agent = new PersonalizationAgent();

  try {
    // Initialize session
    console.log('🔐 Initializing session with prior context...\n');
    const session = await agent.initializeSession(JAMES_USER_ID);
    console.log('✅ Session initialized with user attributes:');
    console.log('   • Name: James Wilson');
    console.log('   • Total Donations: £100 (one-time, 6 months ago)');
    console.log('   • Interests: Lung cancer research, biomarkers, running, Race for Life');
    console.log('   • Has attended events: No');
    console.log('   • Loved one affected: Yes (lung cancer)\n');
    
    await sleep(2000);

    // ========================================================================
    // STEP 1: DASHBOARD WITH PRIOR CONTEXT
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('📊 STEP 1: PERSONALIZED DASHBOARD (Lapsed Supporter Re-engagement)');
    console.log('━'.repeat(80) + '\n');
    console.log('💬 James returns after 6 months and sees his personalized dashboard\n');

    const dashboardInput: UserInput = {
      text: 'show my dashboard',
      timestamp: new Date(),
      metadata: { source: 'web', deviceType: 'mobile' }
    };

    const dashboardResponse = await agent.processInput(
      JAMES_USER_ID,
      dashboardInput,
      session.sessionId
    );

    console.log('✨ DASHBOARD RESPONSE:\n');
    console.log(dashboardResponse.text);
    console.log('\n' + '─'.repeat(80) + '\n');

    await sleep(3000);

    // ========================================================================
    // STEP 2: MOTIVATIONAL CONTENT ABOUT CRUK ACHIEVEMENTS
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('🌟 STEP 2: MOTIVATIONAL CONTENT (CRUK Achievements)');
    console.log('━'.repeat(80) + '\n');
    console.log('💬 James asks: "What impact has my support made?"\n');

    const motivationInput: UserInput = {
      text: 'What impact has my support made on lung cancer research?',
      timestamp: new Date(),
      metadata: { source: 'web', deviceType: 'mobile' }
    };

    const motivationResponse = await agent.processInput(
      JAMES_USER_ID,
      motivationInput,
      session.sessionId
    );

    console.log('✨ MOTIVATIONAL RESPONSE:\n');
    console.log(motivationResponse.text);
    console.log('\n' + '─'.repeat(80) + '\n');

    await sleep(3000);

    // ========================================================================
    // STEP 3: INFORMATION SEEKING (USER BREAKS FLOW)
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('🔍 STEP 3: INFORMATION SEEKING (User Breaks Flow)');
    console.log('━'.repeat(80) + '\n');
    console.log('💬 James breaks the flow: "I want to find information about lung cancer biomarkers"\n');

    const searchInput: UserInput = {
      text: 'I want to find information about lung cancer biomarkers',
      timestamp: new Date(),
      metadata: { source: 'web', deviceType: 'mobile' }
    };

    const searchResponse = await agent.processInput(
      JAMES_USER_ID,
      searchInput,
      session.sessionId
    );

    console.log('✨ SEARCH RESULTS:\n');
    console.log(searchResponse.text);
    console.log('\n📋 Note: System provides links/articles without creating summaries');
    console.log('📋 System validates: "Do you have everything you need?"\n');
    console.log('\n' + '─'.repeat(80) + '\n');

    await sleep(3000);

    // ========================================================================
    // STEP 4: PERSONALIZED CALL TO ACTION
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('🎯 STEP 4: PERSONALIZED CALL TO ACTION');
    console.log('━'.repeat(80) + '\n');
    console.log('💬 System prompts: "How would you like to support us further?"\n');

    const ctaInput: UserInput = {
      text: 'How can I support Cancer Research UK further?',
      timestamp: new Date(),
      metadata: { source: 'web', deviceType: 'mobile' }
    };

    const ctaResponse = await agent.processInput(
      JAMES_USER_ID,
      ctaInput,
      session.sessionId
    );

    console.log('✨ PERSONALIZED CALL TO ACTION:\n');
    console.log(ctaResponse.text);
    console.log('\n📋 Recommendations based on:');
    console.log('   • User interests: Lung cancer research, biomarkers, running, Race for Life');
    console.log('   • User history: One-time donor (£100, 6 months ago)');
    console.log('   • User attributes: Loved one affected by lung cancer');
    console.log('   • Location: Manchester, UK\n');
    console.log('\n' + '─'.repeat(80) + '\n');

    await sleep(2000);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('✅ IDEAL JOURNEY COMPLETE');
    console.log('━'.repeat(80) + '\n');
    console.log('📊 Journey Summary:\n');
    console.log('1. ✅ Dashboard presented with prior context');
    console.log('   → Lapsed supporter welcomed back without guilt-tripping\n');
    console.log('2. ✅ Motivational content about CRUK achievements');
    console.log('   → Personalized to user\'s interests (lung cancer research)\n');
    console.log('3. ✅ Information seeking experience');
    console.log('   → User broke flow to search for biomarker information');
    console.log('   → System provided links without summaries');
    console.log('   → System validated user needs\n');
    console.log('4. ✅ Personalized call to action');
    console.log('   → Race for Life featured prominently (running interest)');
    console.log('   → Lung cancer research donation option');
    console.log('   → Multiple engagement options presented\n');
    console.log('🎯 Result: Lapsed supporter re-engaged with personalized journey\n');
    console.log('💡 Key Personalization:');
    console.log('   • Race for Life (running interest) shown first');
    console.log('   • Lung cancer research highlighted');
    console.log('   • No pressure for being away 6 months');
    console.log('   • Impact of original donation emphasized\n');

    // End session
    await agent.endSession(session.sessionId);
    console.log('✅ Session ended and context persisted to AWS DynamoDB\n');

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
runIdealJourneyJames().catch(console.error);
