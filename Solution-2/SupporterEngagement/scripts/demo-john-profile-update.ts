#!/usr/bin/env ts-node

/**
 * Demo Script: John's Profile Update Journey
 * 
 * This script demonstrates:
 * 1. User updating their profile details
 * 2. Disclosing new preferences (cancer type interest)
 * 3. Asking how to support CRUK
 * 4. Receiving personalized suggestions based on updated profile
 */

import { PersonalizationAgent, UserInput } from '../src/agent/PersonalizationAgent';
import { userProfileMCPServer } from '../src/mcp-servers/user-profile/server';

const JOHN_USER_ID = 'john-new-supporter-001';

async function runJohnDemo() {
  console.log('\n' + '='.repeat(70));
  console.log('🎯 DEMO: JOHN\'S PROFILE UPDATE & SUPPORT JOURNEY');
  console.log('   New Supporter | Profile Update | Preference Disclosure');
  console.log('='.repeat(70) + '\n');

  const agent = new PersonalizationAgent();

  try {
    // Scene 1: John logs in for the first time
    console.log('📱 Scene 1: John logs in and sees basic dashboard\n');
    console.log('⏳ Initializing session...\n');

    const session = await agent.initializeSession(JOHN_USER_ID);
    console.log(`✅ Session created: ${session.sessionId}\n`);

    const dashboardInput: UserInput = {
      text: 'show my dashboard',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'desktop'
      }
    };

    const dashboardResponse = await agent.processInput(
      JOHN_USER_ID,
      dashboardInput,
      session.sessionId
    );

    console.log('✨ INITIAL DASHBOARD\n');
    console.log(dashboardResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    await sleep(2000);

    // Scene 2: John updates his profile with new information
    console.log('📱 Scene 2: John updates his profile\n');
    console.log('💬 John says: "I want to update my profile"\n');
    console.log('⏳ AI recognizes profile update intent...\n');

    const updateIntentInput: UserInput = {
      text: 'I want to update my profile',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'desktop'
      }
    };

    const updateIntentResponse = await agent.processInput(
      JOHN_USER_ID,
      updateIntentInput,
      session.sessionId
    );

    console.log('💬 AI RESPONSE\n');
    console.log(updateIntentResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    await sleep(2000);

    // Scene 3: John discloses new preference - his mother has breast cancer
    console.log('📱 Scene 3: John discloses personal connection to cancer\n');
    console.log('💬 John says: "My mother was recently diagnosed with breast cancer"\n');
    console.log('⏳ Updating profile with new preference...\n');

    // Update profile via MCP server
    const updateResult = await userProfileMCPServer.executeTool({
      name: 'update_user_profile',
      arguments: {
        userId: JOHN_USER_ID,
        updates: {
          lovedOneAffected: true,
          cancerType: 'breast-cancer',
          interests: ['breast-cancer-research', 'support-services', 'treatment-options'],
          updatedAt: new Date().toISOString()
        }
      }
    });

    if (!updateResult.isError) {
      console.log('✅ Profile updated successfully\n');
      console.log('   • Loved one affected: Yes');
      console.log('   • Cancer type: Breast cancer');
      console.log('   • New interests: Research, Support, Treatment\n');
    }

    const preferenceInput: UserInput = {
      text: 'My mother was recently diagnosed with breast cancer',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'desktop'
      }
    };

    const preferenceResponse = await agent.processInput(
      JOHN_USER_ID,
      preferenceInput,
      session.sessionId
    );

    console.log('💬 AI RESPONSE (with empathy)\n');
    console.log(preferenceResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    await sleep(2000);

    // Scene 4: John asks how he can support CRUK
    console.log('📱 Scene 4: John asks how to support CRUK\n');
    console.log('💬 John says: "How can I support Cancer Research UK?"\n');
    console.log('⏳ AI generating personalized support options...\n');

    const supportInput: UserInput = {
      text: 'How can I support Cancer Research UK?',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'desktop'
      }
    };

    const supportResponse = await agent.processInput(
      JOHN_USER_ID,
      supportInput,
      session.sessionId
    );

    console.log('💝 PERSONALIZED SUPPORT OPTIONS\n');
    console.log(supportResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    await sleep(2000);

    // Scene 5: Show updated personalized dashboard
    console.log('📱 Scene 5: John views his updated personalized dashboard\n');
    console.log('⏳ Loading dashboard with new preferences...\n');

    const updatedDashboardInput: UserInput = {
      text: 'show my dashboard',
      timestamp: new Date(),
      metadata: {
        source: 'web',
        deviceType: 'desktop'
      }
    };

    const updatedDashboardResponse = await agent.processInput(
      JOHN_USER_ID,
      updatedDashboardInput,
      session.sessionId
    );

    console.log('✨ UPDATED PERSONALIZED DASHBOARD\n');
    console.log(updatedDashboardResponse.text);
    console.log('\n' + '-'.repeat(70) + '\n');

    // End session
    await agent.endSession(session.sessionId);

    // Summary
    console.log('✅ DEMO COMPLETE: John\'s Profile Update Journey\n');
    console.log('Key Takeaways:');
    console.log('  • User can update profile at any time');
    console.log('  • AI recognizes and responds to personal disclosures with empathy');
    console.log('  • Support options personalized based on updated preferences');
    console.log('  • Dashboard immediately reflects new interests');
    console.log('  • Breast cancer content prioritized after disclosure\n');
    console.log('🎯 Result: User feels heard, supported, and empowered to help\n');

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
runJohnDemo().catch(console.error);
