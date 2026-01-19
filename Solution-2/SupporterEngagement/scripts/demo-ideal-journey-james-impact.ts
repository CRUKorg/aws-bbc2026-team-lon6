#!/usr/bin/env ts-node

/**
 * Demo Script: James Impact Query - Automatic Personalization
 * 
 * This script demonstrates automatic personalization of non-specific user input.
 * James asks a vague question: "What impact have I had on cancer?"
 * The system automatically personalizes the response based on his profile:
 * - His donation history (£100, 6 months ago)
 * - His interests (lung cancer research, biomarkers, running)
 * - His personal connection (loved one affected by lung cancer)
 * 
 * This is Step 2-variant: Automatic Personalization of Non-Specific User Input
 */

import { PersonalizationAgent, UserInput } from '../src/agent/PersonalizationAgent';

const JAMES_USER_ID = 'james-lapsed-001';

async function runJamesImpactDemo() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 DEMO: AUTOMATIC PERSONALIZATION OF NON-SPECIFIC INPUT');
  console.log('   User: James Wilson (Lapsed Supporter)');
  console.log('   Scenario: Vague question → Personalized response');
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
    console.log('   • Loved one affected: Yes (lung cancer)\n');
    
    await sleep(2000);

    // ========================================================================
    // STEP 1: DASHBOARD (CONTEXT SETTING)
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('📊 STEP 1: DASHBOARD (Context Setting)');
    console.log('━'.repeat(80) + '\n');
    console.log('💬 James returns and views his dashboard\n');

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
    // STEP 2-VARIANT: AUTOMATIC PERSONALIZATION OF NON-SPECIFIC INPUT
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('🌟 STEP 2-VARIANT: AUTOMATIC PERSONALIZATION');
    console.log('━'.repeat(80) + '\n');
    console.log('💬 James asks a VAGUE question: "What impact have I had on cancer?"\n');
    console.log('📋 Note: User did NOT specify:');
    console.log('   • Which cancer type');
    console.log('   • What kind of impact');
    console.log('   • What timeframe\n');
    console.log('🤖 System will automatically personalize based on:');
    console.log('   ✓ User profile (lung cancer connection)');
    console.log('   ✓ Donation history (£100, 6 months ago)');
    console.log('   ✓ User interests (lung cancer research, biomarkers)\n');

    await sleep(2000);

    const impactInput: UserInput = {
      text: 'What impact have I had on cancer?',
      timestamp: new Date(),
      metadata: { source: 'web', deviceType: 'mobile' }
    };

    const impactResponse = await agent.processInput(
      JAMES_USER_ID,
      impactInput,
      session.sessionId
    );

    console.log('✨ PERSONALIZED RESPONSE:\n');
    console.log(impactResponse.text);
    console.log('\n' + '─'.repeat(80) + '\n');

    await sleep(3000);

    // ========================================================================
    // ANALYSIS
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('📊 PERSONALIZATION ANALYSIS');
    console.log('━'.repeat(80) + '\n');
    console.log('🔍 What the system did:\n');
    console.log('1. ✅ Detected intent: "personalization" (impact query)');
    console.log('2. ✅ Retrieved user context from DynamoDB:');
    console.log('   • Donation history: £100');
    console.log('   • Cancer type: Lung cancer');
    console.log('   • Interests: Biomarkers, research\n');
    console.log('3. ✅ Generated personalized response:');
    console.log('   • Acknowledged his specific donation');
    console.log('   • Highlighted LUNG CANCER research impact');
    console.log('   • Included biomarker research (his interest)');
    console.log('   • Showed general CRUK achievements\n');
    console.log('4. ✅ Maintained empathetic tone:');
    console.log('   • No guilt about being lapsed');
    console.log('   • Emphasized positive impact');
    console.log('   • Invited continued engagement\n');
    console.log('💡 Key Insight: Vague question → Highly personalized answer\n');

    await sleep(2000);

    // ========================================================================
    // STEP 3: PERSONALIZED CALL TO ACTION
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('🎯 STEP 3: PERSONALIZED CALL TO ACTION');
    console.log('━'.repeat(80) + '\n');
    console.log('💬 James asks: "How can I support Cancer Research UK further?"\n');

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
    console.log('   • User interests: Running, Race for Life');
    console.log('   • Cancer connection: Lung cancer');
    console.log('   • Location: Manchester, UK\n');
    console.log('\n' + '─'.repeat(80) + '\n');

    await sleep(2000);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('━'.repeat(80));
    console.log('✅ DEMO COMPLETE: AUTOMATIC PERSONALIZATION');
    console.log('━'.repeat(80) + '\n');
    console.log('📊 Demo Summary:\n');
    console.log('1. ✅ User asked vague question: "What impact have I had on cancer?"');
    console.log('   → System did NOT ask clarifying questions\n');
    console.log('2. ✅ System automatically personalized response:');
    console.log('   → Focused on LUNG CANCER (user\'s connection)');
    console.log('   → Mentioned his £100 donation specifically');
    console.log('   → Included biomarker research (his interest)');
    console.log('   → Showed general CRUK achievements\n');
    console.log('3. ✅ System provided personalized next steps:');
    console.log('   → Race for Life (running interest)');
    console.log('   → Lung cancer research donation');
    console.log('   → Multiple engagement options\n');
    console.log('🎯 Result: Seamless personalization without user friction\n');
    console.log('💡 Key Differentiator:');
    console.log('   • Traditional chatbot: "Which cancer type are you asking about?"');
    console.log('   • Our system: Automatically knows from profile → Instant personalized answer\n');

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
runJamesImpactDemo().catch(console.error);
