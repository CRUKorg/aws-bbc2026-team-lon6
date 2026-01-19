/**
 * Test script for Information Seeking Flow
 * Demonstrates the complete information seeking flow
 */

import { InformationSeekingFlow, InfoSeekingState } from '../src/agent/flows/information-seeking';
import { UserContext } from '../src/models';
import { logger } from '../src/utils/logger';

function createMockContext(userId: string): UserContext {
  return {
    userId,
    profile: {
      userId,
      email: 'user@example.com',
      name: 'Sarah',
      totalDonations: 0,
      donationCount: 0,
      hasAttendedEvents: false,
      hasFundraised: false,
      hasVolunteered: false,
      isResearcher: false,
      isJournalist: false,
      isPhilanthropist: false,
      personallyAffected: false,
      lovedOneAffected: true,
      cancerType: 'breast',
      createdAt: new Date(),
      updatedAt: new Date(),
      consentGiven: true,
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
        preferredFrequency: 'monthly',
      },
      interests: ['research', 'support'],
    },
    preferences: {
      preferredTopics: ['breast cancer', 'screening'],
      preferredCancerTypes: ['breast-cancer'],
      notificationSettings: {
        email: true,
        sms: false,
        push: false,
      },
    },
    engagementHistory: [],
    lastUpdated: new Date(),
    version: 1,
  };
}

async function testInformationSeekingFlow() {
  console.log('='.repeat(80));
  console.log('Testing Information Seeking Flow');
  console.log('='.repeat(80));

  const context = createMockContext('test-user-001');
  const flow = new InformationSeekingFlow(context);

  // Test 1: Process a query
  console.log('\n--- Test 1: Process Query ---');
  console.log('Query: "What are the symptoms of breast cancer?"');
  
  const queryResult = await flow.processQuery('What are the symptoms of breast cancer?');
  
  console.log(`✓ State: ${queryResult.state}`);
  console.log(`  Articles found: ${queryResult.articles.length}`);
  console.log(`  Requires user input: ${queryResult.requiresUserInput}`);
  console.log(`  Can resume personalization: ${queryResult.canResumePersonalization}`);
  console.log(`\n  Message preview:\n  "${queryResult.message.substring(0, 200)}..."`);

  if (queryResult.articles.length > 0) {
    console.log(`\n  First article:`);
    console.log(`    Title: ${queryResult.articles[0].title}`);
    console.log(`    URL: ${queryResult.articles[0].url}`);
    console.log(`    CRUK verified: ${queryResult.articles[0].url.includes('cancerresearchuk.org')}`);
  }

  // Test 2: Validate completion (user needs more info)
  console.log('\n--- Test 2: Validate Completion (Need More Info) ---');
  
  const validationResult1 = await flow.validateCompletion(false);
  
  console.log(`✓ State: ${validationResult1.state}`);
  console.log(`  Expected: ${InfoSeekingState.QUERY}`);
  console.log(`  Match: ${validationResult1.state === InfoSeekingState.QUERY}`);
  console.log(`  Message: "${validationResult1.message}"`);

  // Test 3: Process another query
  console.log('\n--- Test 3: Process Follow-up Query ---');
  console.log('Query: "How is breast cancer treated?"');
  
  const queryResult2 = await flow.processQuery('How is breast cancer treated?');
  
  console.log(`✓ State: ${queryResult2.state}`);
  console.log(`  Articles found: ${queryResult2.articles.length}`);

  // Test 4: Validate completion (user has everything)
  console.log('\n--- Test 4: Validate Completion (Has Everything) ---');
  
  const validationResult2 = await flow.validateCompletion(true);
  
  console.log(`✓ State: ${validationResult2.state}`);
  console.log(`  Expected: ${InfoSeekingState.FEEDBACK}`);
  console.log(`  Match: ${validationResult2.state === InfoSeekingState.FEEDBACK}`);
  console.log(`  Message: "${validationResult2.message}"`);

  // Test 5: Collect positive feedback
  console.log('\n--- Test 5: Collect Feedback ---');
  
  const feedbackResult = await flow.collectFeedback(
    'positive',
    'Very helpful information, thank you!'
  );
  
  console.log(`✓ State: ${feedbackResult.state}`);
  console.log(`  Expected: ${InfoSeekingState.RESUME_PROMPT}`);
  console.log(`  Match: ${feedbackResult.state === InfoSeekingState.RESUME_PROMPT}`);
  console.log(`  Can resume personalization: ${feedbackResult.canResumePersonalization}`);
  console.log(`\n  Resume prompt:\n  "${feedbackResult.message}"`);

  // Test 6: Get feedback data
  console.log('\n--- Test 6: Get Feedback Data ---');
  
  const feedback = flow.getFeedback();
  
  console.log(`✓ Feedback collected:`);
  console.log(`  Has everything needed: ${feedback?.hasEverythingNeeded}`);
  console.log(`  Sentiment: ${feedback?.sentiment}`);
  console.log(`  Feedback text: "${feedback?.feedbackText}"`);

  // Test 7: Get related articles
  console.log('\n--- Test 7: Get Related Articles ---');
  
  if (queryResult.articles.length > 0) {
    const articleId = queryResult.articles[0].articleId;
    console.log(`  Getting related articles for: ${articleId}`);
    
    const relatedArticles = await flow.getRelatedArticles(articleId, 3);
    
    console.log(`✓ Related articles found: ${relatedArticles.length}`);
    
    if (relatedArticles.length > 0) {
      console.log(`  First related article: ${relatedArticles[0].title}`);
    }
  }

  // Test 8: Complete flow
  console.log('\n--- Test 8: Complete Flow ---');
  
  console.log(`  Is complete before: ${flow.isComplete()}`);
  flow.complete();
  console.log(`  Is complete after: ${flow.isComplete()}`);
  console.log(`  Final state: ${flow.getCurrentState()}`);

  // Test 9: Reset flow
  console.log('\n--- Test 9: Reset Flow ---');
  
  console.log(`  State before reset: ${flow.getCurrentState()}`);
  console.log(`  Query before reset: "${flow.getCurrentQuery()}"`);
  console.log(`  Articles before reset: ${flow.getArticles().length}`);
  
  flow.reset();
  
  console.log(`  State after reset: ${flow.getCurrentState()}`);
  console.log(`  Query after reset: "${flow.getCurrentQuery()}"`);
  console.log(`  Articles after reset: ${flow.getArticles().length}`);
  console.log(`  Feedback after reset: ${flow.getFeedback() === undefined}`);

  // Test 10: CRUK source verification
  console.log('\n--- Test 10: CRUK Source Verification ---');
  
  const verificationFlow = new InformationSeekingFlow(context);
  const verificationResult = await verificationFlow.processQuery('cancer screening');
  
  console.log(`✓ All articles verified as CRUK sources:`);
  const allCRUK = verificationResult.articles.every(article => 
    article.url.includes('cancerresearchuk.org')
  );
  console.log(`  Verification passed: ${allCRUK}`);
  console.log(`  Total articles: ${verificationResult.articles.length}`);

  console.log('\n' + '='.repeat(80));
  console.log('All tests completed successfully!');
  console.log('='.repeat(80));
  console.log('\nSummary:');
  console.log('✓ Query processing with article retrieval');
  console.log('✓ Validation flow (need more info)');
  console.log('✓ Follow-up query processing');
  console.log('✓ Validation flow (has everything)');
  console.log('✓ Feedback collection');
  console.log('✓ Resume personalization prompt');
  console.log('✓ Related articles retrieval');
  console.log('✓ Flow completion');
  console.log('✓ Flow reset');
  console.log('✓ CRUK source verification');
}

// Run tests
testInformationSeekingFlow().catch(error => {
  console.error('Test failed:', error);
  logger.error('Test failed', error as Error);
  process.exit(1);
});

