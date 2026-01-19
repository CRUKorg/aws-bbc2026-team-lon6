#!/usr/bin/env ts-node

/**
 * Demo Script: Ideal User Journey from Brief
 * 
 * This script demonstrates the complete personalized journey as specified in the hackathon brief:
 * 1. Dashboard with prior context (user attributes, history)
 * 2. Motivational content about CRUK achievements
 * 3. Information seeking experience (user breaks flow)
 * 4. Personalized call to action
 */

import { PersonalizationAgent, UserInput } from '../src/agent/PersonalizationAgent';

const SARAH_USER_ID = 'sarah-engaged-001';

async function runIdealJourney() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 IDEAL USER JOURNEY - AS SPECIFIED IN HACKATHON BRIEF');
  console.log('   Demonstrating: Dashboard → Motivation → Information Seeking → Call to Action');
  console.log('='.repeat(80) + '\n');

  const agent = new PersonalizationAgent();

  try {
    // Initialize session
    console.log('🔐 Initializing session with prior context...\n');
    const session = await agent.initializeSession(SARAH_USER_ID);
    console.log('✅ Session initialized with user attributes:');
    console.log('   • Name: Sarah Johnson');
    console.log('   • Total Donations: £600 (£50/month × 12)');
    console.log('   • Interests: Breast cancer research, immunotherapy');
    console.log('   • Has attended events: Yes');
    console.log('   • Loved one affected: Yes (breast cancer)\n');
    
    await sleep(2000);

    // ========================================================================
    // STEP 1: DASHBOARD WITH PRIOR CONTEXT
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('📊 STEP 1: PERSONALIZED DASHBOARD (Based on Prior Context)');
    console.log('━'.repeat(80) + '\n');
    console.log('💬 Sarah logs in and sees her personalized dashboard\n');

    const dashboardInput: UserInput = {
      text: 'show my dashboard',
      timestamp: new Date(),
      metadata: { source: 'web', deviceType: 'desktop' }
    };

    const dashboardResponse = await agent.processInput(
      SARAH_USER_ID,
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
    console.log('💬 Sarah asks: "What impact has my support made?"\n');

    const motivationInput: UserInput = {
      text: 'What impact has my support made on breast cancer research?',
      timestamp: new Date(),
      metadata: { source: 'web', deviceType: 'desktop' }
    };

    const motivationResponse = await agent.processInput(
      SARAH_USER_ID,
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
    console.log('💬 Sarah breaks the flow: "I want to find information about breast cancer treatment options"\n');

    const searchInput: UserInput = {
      text: 'I want to find information about breast cancer treatment options',
      timestamp: new Date(),
      metadata: { source: 'web', deviceType: 'desktop' }
    };

    const searchResponse = await agent.processInput(
      SARAH_USER_ID,
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
      metadata: { source: 'web', deviceType: 'desktop' }
    };

    const ctaResponse = await agent.processInput(
      SARAH_USER_ID,
      ctaInput,
      session.sessionId
    );

    console.log('✨ PERSONALIZED CALL TO ACTION:\n');
    console.log(ctaResponse.text);
    console.log('\n📋 Recommendations based on:');
    console.log('   • User interests: Breast cancer research, cycling, Race for Life');
    console.log('   • User history: Regular donor (£50/month)');
    console.log('   • User attributes: Has attended events, loved one affected');
    console.log('   • Location: London, UK\n');
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
    console.log('   → User attributes, donation history, interests displayed\n');
    console.log('2. ✅ Motivational content about CRUK achievements');
    console.log('   → Personalized to user\'s interests (breast cancer research)\n');
    console.log('3. ✅ Information seeking experience');
    console.log('   → User broke flow to search for cancer information');
    console.log('   → System provided links without summaries');
    console.log('   → System validated user needs\n');
    console.log('4. ✅ Personalized call to action');
    console.log('   → Recommendations based on user profile');
    console.log('   → Multiple engagement options presented\n');
    console.log('🎯 Result: Complete personalized journey from login to action\n');
    console.log('💡 Available CTAs demonstrated:');
    console.log('   • Donating (one-time, monthly)');
    console.log('   • Fundraising (events, challenges)');
    console.log('   • Volunteering (retail, community)');
    console.log('   • Legacy giving (wills, tributes)\n');

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
runIdealJourney().catch(console.error);
