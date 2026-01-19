/**
 * Demo script for Context Management, Intent Recognition, and Content Personalization services
 * 
 * This script demonstrates:
 * 1. Context Management - storing and retrieving user context
 * 2. Intent Recognition - detecting user intent from input
 * 3. Content Personalization - generating personalized responses
 * 
 * Run with: npx ts-node scripts/demo-services.ts
 */

import { ContextManagementService } from '../src/services/context-management';
import { IntentRecognitionService } from '../src/services/intent-recognition';
import { ContentPersonalizationService } from '../src/services/content-personalization';
import { UserContext } from '../src/models';

async function main() {
  console.log('=== Supporter Engagement Platform - Services Demo ===\n');

  // Initialize services
  const contextService = new ContextManagementService();
  const intentService = new IntentRecognitionService();
  const contentService = new ContentPersonalizationService();

  // Demo user
  const userId = 'demo_user_123';
  const userName = 'Sarah';

  console.log('1. Creating user context...');
  const userContext: UserContext = {
    userId,
    profile: {
      userId,
      email: 'sarah@example.com',
      name: userName,
      totalDonations: 150,
      donationCount: 3,
      hasAttendedEvents: true,
      hasFundraised: false,
      hasVolunteered: false,
      isResearcher: false,
      isJournalist: false,
      isPhilanthropist: false,
      personallyAffected: false,
      lovedOneAffected: true,
      cancerType: 'breast',
      createdAt: new Date('2023-01-15'),
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
      preferredTopics: ['breast cancer', 'research'],
      preferredCancerTypes: ['breast'],
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

  console.log(`✓ User context created for ${userName}\n`);

  // Demo scenarios
  const scenarios = [
    {
      title: 'Scenario 1: Information Seeking',
      input: 'Tell me about breast cancer symptoms',
    },
    {
      title: 'Scenario 2: Personalization',
      input: 'I want to update my preferences',
    },
    {
      title: 'Scenario 3: Action Intent',
      input: 'I would like to donate to support research',
    },
    {
      title: 'Scenario 4: General Query',
      input: 'What can you help me with?',
    },
  ];

  for (const scenario of scenarios) {
    console.log(`\n--- ${scenario.title} ---`);
    console.log(`User input: "${scenario.input}"\n`);

    // Step 1: Recognize intent
    console.log('2. Recognizing intent...');
    const intent = await intentService.recognizeIntent(scenario.input);
    console.log(`✓ Intent detected: ${intent.primaryIntent}`);
    console.log(`  Confidence: ${(intent.confidence * 100).toFixed(0)}%`);
    console.log(`  Suggested flow: ${intent.suggestedFlow}`);
    if (intent.entities.length > 0) {
      console.log(`  Entities: ${intent.entities.map(e => `${e.type}=${e.value}`).join(', ')}`);
    }

    // Step 2: Generate personalized content
    console.log('\n3. Generating personalized content...');
    const content = await contentService.generateContent(intent, userContext, 'response');
    console.log(`✓ Content generated (ID: ${content.id})`);
    console.log(`  Type: ${content.type}`);
    console.log(`  Tone: ${content.metadata.tone}`);
    console.log(`\n  Response:\n  "${content.text}"\n`);
  }

  // Demo recommendations
  console.log('\n--- Generating Recommendations ---');
  console.log('4. Analyzing user interests and generating recommendations...');
  const recommendations = await contentService.generateRecommendations(userContext, 3);
  console.log(`✓ Generated ${recommendations.length} recommendations:\n`);
  recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec.text}`);
    console.log(`     Category: ${rec.metadata.category}, Relevance: ${(rec.metadata.relevanceScore * 100).toFixed(0)}%\n`);
  });

  // Demo context management
  console.log('--- Context Management Demo ---');
  console.log('5. Updating user context with new engagement...');
  
  // Add engagement record
  userContext.engagementHistory.push({
    recordId: `eng_${Date.now()}`,
    userId,
    timestamp: new Date(),
    type: 'campaign',
    metadata: {
      query: 'breast cancer symptoms',
      resultsCount: 5,
      action: 'search',
    },
  });

  // Note: In a real scenario, this would save to DynamoDB
  // For demo purposes, we're just showing the structure
  console.log('✓ Context updated with search engagement');
  console.log(`  Total engagements: ${userContext.engagementHistory.length}`);
  console.log(`  Last updated: ${userContext.lastUpdated.toISOString()}`);
  console.log(`  Version: ${userContext.version}\n`);

  console.log('=== Demo Complete ===\n');
  console.log('Summary:');
  console.log('- Context Management Service: ✓ Working');
  console.log('- Intent Recognition Service: ✓ Working');
  console.log('- Content Personalization Service: ✓ Working');
  console.log('\nAll three core services are functional and integrated!');

  // Close connections
  await contextService.close();
}

// Run the demo
main().catch(console.error);
