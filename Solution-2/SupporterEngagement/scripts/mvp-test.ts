/**
 * MVP Testing Script
 * Tests deployed stack with various scenarios
 */

import { PersonalizationAgent } from '../src/agent/PersonalizationAgent';
import { DashboardGenerator } from '../src/agent/dashboard/DashboardGenerator';
import { SearchHandler } from '../src/agent/search/SearchHandler';
import { MissingDataHandler } from '../src/agent/missing-data/MissingDataHandler';
import { ContextManagementService } from '../src/services/context-management/ContextManagementService';
import { UserContext } from '../src/models';

// Parse command line arguments
const args = process.argv.slice(2);
const scenario = args.find(arg => arg.startsWith('--scenario='))?.split('=')[1];
const userId = args.find(arg => arg.startsWith('--userId='))?.split('=')[1];
const query = args.find(arg => arg.startsWith('--query='))?.split('=')[1];

if (!scenario || !userId) {
  console.error('Usage: npx ts-node scripts/mvp-test.ts --scenario=<scenario> --userId=<userId> [--query=<query>]');
  console.error('\nScenarios:');
  console.error('  new-user      - Test new user onboarding');
  console.error('  dashboard     - Test dashboard generation');
  console.error('  search        - Test search functionality');
  console.error('  fundraiser    - Test fundraiser progress');
  console.error('  agent         - Test full agent interaction');
  process.exit(1);
}

/**
 * Test new user onboarding
 */
async function testNewUser(userId: string) {
  console.log('\n🆕 Testing New User Onboarding\n');
  console.log(`User ID: ${userId}\n`);
  
  const contextService = new ContextManagementService();
  const missingDataHandler = new MissingDataHandler();
  
  // Get user context
  const context = await contextService.getContext(userId);
  
  if (!context) {
    console.error('❌ User not found. Please run seed-databases.ts first.');
    return;
  }
  
  console.log(`✓ User found: ${context.profile.name}`);
  
  // Analyze missing data
  const missingDataResult = await missingDataHandler.analyzeMissingData(context);
  
  console.log(`\n📊 Missing Data Analysis:`);
  console.log(`  Has Missing Data: ${missingDataResult.hasMissingData}`);
  console.log(`  Missing Fields: ${missingDataResult.missingFields.length}`);
  console.log(`  Can Proceed: ${missingDataResult.canProceed}`);
  
  if (missingDataResult.hasMissingData) {
    console.log(`\n❓ Questions to Ask:`);
    missingDataResult.missingFields.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.question}`);
      console.log(`     Field: ${field.field} (${field.priority} priority)`);
    });
  }
  
  console.log(`\n🎨 UI Components: ${missingDataResult.uiComponents.length}`);
  missingDataResult.uiComponents.forEach((component, index) => {
    console.log(`  ${index + 1}. ${component.type}`);
  });
  
  console.log(`\n💬 Message: ${missingDataResult.message}`);
}

/**
 * Test dashboard generation
 */
async function testDashboard(userId: string) {
  console.log('\n📊 Testing Dashboard Generation\n');
  console.log(`User ID: ${userId}\n`);
  
  const contextService = new ContextManagementService();
  const dashboardGenerator = new DashboardGenerator();
  
  // Get user context
  const context = await contextService.getContext(userId);
  
  if (!context) {
    console.error('❌ User not found. Please run seed-databases.ts first.');
    return;
  }
  
  console.log(`✓ User found: ${context.profile.name}`);
  
  // Generate dashboard
  const dashboardResult = await dashboardGenerator.generateDashboard(context);
  
  console.log(`\n📈 Dashboard Generated:`);
  console.log(`  Success: ${dashboardResult.success}`);
  console.log(`  Total Donations: £${dashboardResult.dashboard?.totalDonations || 0}`);
  console.log(`  Has Missing Data: ${dashboardResult.hasMissingData}`);
  console.log(`  Missing Fields: ${dashboardResult.missingFields.join(', ')}`);
  
  if (dashboardResult.dashboard) {
    console.log(`\n💪 Impact Breakdown:`);
    dashboardResult.dashboard.impactBreakdown.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.description}: ${item.quantity}`);
    });
    
    console.log(`\n📄 Recommended Pages:`);
    dashboardResult.dashboard.recommendedPages.forEach((page, index) => {
      console.log(`  ${index + 1}. ${page.title}`);
      console.log(`     Reason: ${page.reason}`);
      console.log(`     URL: ${page.url}`);
    });
    
    if (dashboardResult.dashboard.currentCampaign) {
      console.log(`\n🎯 Active Campaign:`);
      console.log(`  Name: ${dashboardResult.dashboard.currentCampaign.campaignName}`);
      console.log(`  Progress: £${dashboardResult.dashboard.currentCampaign.currentAmount} / £${dashboardResult.dashboard.currentCampaign.targetAmount}`);
      console.log(`  Complete: ${dashboardResult.dashboard.currentCampaign.percentComplete.toFixed(1)}%`);
    }
    
    console.log(`\n🔬 Featured Research: ${dashboardResult.dashboard.featuredResearch.length} papers`);
  }
  
  console.log(`\n🎨 UI Components: ${dashboardResult.uiComponents.length}`);
}

/**
 * Test search functionality
 */
async function testSearch(userId: string, searchQuery?: string) {
  console.log('\n🔍 Testing Search Functionality\n');
  console.log(`User ID: ${userId}`);
  console.log(`Query: ${searchQuery || 'No query provided'}\n`);
  
  if (!searchQuery) {
    console.error('❌ Please provide a search query with --query=<query>');
    return;
  }
  
  const contextService = new ContextManagementService();
  const searchHandler = new SearchHandler(contextService);
  
  // Get user context
  const context = await contextService.getContext(userId);
  
  if (!context) {
    console.error('❌ User not found. Please run seed-databases.ts first.');
    return;
  }
  
  console.log(`✓ User found: ${context.profile.name}`);
  
  // Perform search
  const searchResult = await searchHandler.search(searchQuery, context);
  
  console.log(`\n🔎 Search Results:`);
  console.log(`  Success: ${searchResult.success}`);
  console.log(`  Query: "${searchResult.query}"`);
  console.log(`  Total Results: ${searchResult.totalResults}`);
  console.log(`  Message: ${searchResult.message}`);
  
  if (searchResult.results.length > 0) {
    console.log(`\n📄 Results:`);
    searchResult.results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.title}`);
      console.log(`     Summary: ${result.summary.substring(0, 100)}...`);
      console.log(`     URL: ${result.url}`);
      console.log(`     CRUK Verified: ${result.isCRUKVerified}`);
    });
  }
  
  // Get search suggestions
  const suggestions = await searchHandler.getSearchSuggestions(context);
  console.log(`\n💡 Search Suggestions:`);
  suggestions.forEach((suggestion, index) => {
    console.log(`  ${index + 1}. ${suggestion}`);
  });
}

/**
 * Test fundraiser progress
 */
async function testFundraiser(userId: string) {
  console.log('\n🎯 Testing Fundraiser Progress\n');
  console.log(`User ID: ${userId}\n`);
  
  const contextService = new ContextManagementService();
  const dashboardGenerator = new DashboardGenerator();
  
  // Get user context
  const context = await contextService.getContext(userId);
  
  if (!context) {
    console.error('❌ User not found. Please run seed-databases.ts first.');
    return;
  }
  
  console.log(`✓ User found: ${context.profile.name}`);
  
  // Check if user has fundraised
  if (!context.profile.hasFundraised) {
    console.log(`\n⚠️  User has not started fundraising yet.`);
    console.log(`\n💡 Recommendation: Suggest starting a fundraising campaign`);
    return;
  }
  
  // Generate dashboard to get campaign info
  const dashboardResult = await dashboardGenerator.generateDashboard(context);
  
  if (dashboardResult.dashboard?.currentCampaign) {
    const campaign = dashboardResult.dashboard.currentCampaign;
    console.log(`\n🎉 Active Fundraising Campaign:`);
    console.log(`  Campaign: ${campaign.campaignName}`);
    console.log(`  Current: £${campaign.currentAmount}`);
    console.log(`  Target: £${campaign.targetAmount}`);
    console.log(`  Progress: ${campaign.percentComplete.toFixed(1)}%`);
    console.log(`  Remaining: £${campaign.targetAmount - campaign.currentAmount}`);
    
    // Calculate suggested next steps
    const remaining = campaign.targetAmount - campaign.currentAmount;
    console.log(`\n📈 Suggested Next Steps:`);
    if (remaining > 0) {
      console.log(`  1. Share campaign on social media`);
      console.log(`  2. Send update to supporters`);
      console.log(`  3. Host a fundraising event`);
      console.log(`  4. Reach out to ${Math.ceil(remaining / 25)} potential donors (£25 each)`);
    } else {
      console.log(`  1. Celebrate reaching your goal! 🎊`);
      console.log(`  2. Thank your supporters`);
      console.log(`  3. Share your success story`);
      console.log(`  4. Consider setting a stretch goal`);
    }
  } else {
    console.log(`\n⚠️  No active campaign found.`);
    console.log(`\n💡 Recommendation: Start a new fundraising campaign`);
  }
}

/**
 * Test full agent interaction
 */
async function testAgent(userId: string, input?: string) {
  console.log('\n🤖 Testing Personalization Agent\n');
  console.log(`User ID: ${userId}`);
  console.log(`Input: ${input || 'No input provided'}\n`);
  
  const agent = new PersonalizationAgent();
  
  try {
    // Initialize session
    console.log('📝 Initializing session...');
    const session = await agent.initializeSession(userId);
    console.log(`✓ Session initialized: ${session.sessionId}`);
    console.log(`  User: ${session.cachedProfile?.name || 'Unknown'}`);
    console.log(`  Current Flow: ${session.currentFlow}`);
    console.log(`  Flow State: ${session.flowState.currentStep}`);
    
    if (input) {
      // Process input
      console.log(`\n💬 Processing input: "${input}"`);
      const userInput = {
        text: input,
        timestamp: new Date()
      };
      const response = await agent.processInput(userId, userInput, session.sessionId);
      
      console.log(`\n🤖 Agent Response:`);
      console.log(`  Text: ${response.text}`);
      console.log(`  Intent: ${response.metadata.intent}`);
      console.log(`  Confidence: ${response.metadata.confidence}`);
      console.log(`  Requires Input: ${response.requiresUserInput}`);
      console.log(`  UI Components: ${response.uiComponents?.length || 0}`);
      
      if (response.uiComponents && response.uiComponents.length > 0) {
        console.log(`\n🎨 UI Components:`);
        response.uiComponents.forEach((component, index) => {
          console.log(`  ${index + 1}. ${component.type || 'unknown'}`);
        });
      }
    }
    
    // End session
    console.log(`\n🔚 Ending session...`);
    await agent.endSession(session.sessionId);
    console.log(`✓ Session ended and context saved`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Main test runner
 */
async function runTest() {
  console.log('🧪 MVP Testing Script');
  console.log('='.repeat(50));
  
  try {
    switch (scenario) {
      case 'new-user':
        await testNewUser(userId!);
        break;
      case 'dashboard':
        await testDashboard(userId!);
        break;
      case 'search':
        await testSearch(userId!, query);
        break;
      case 'fundraiser':
        await testFundraiser(userId!);
        break;
      case 'agent':
        await testAgent(userId!, query);
        break;
      default:
        console.error(`❌ Unknown scenario: ${scenario}`);
        process.exit(1);
    }
    
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest();
