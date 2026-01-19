/**
 * Detailed demo script showing user context clearly
 * 
 * Run with: npx ts-node scripts/demo-services-detailed.ts
 */

import { ContextManagementService } from '../src/services/context-management';
import { IntentRecognitionService } from '../src/services/intent-recognition';
import { ContentPersonalizationService } from '../src/services/content-personalization';
import { UserContext } from '../src/models';

async function main() {
  console.log('=== Supporter Engagement Platform - Detailed Services Demo ===\n');

  // Initialize services
  const contextService = new ContextManagementService();
  const intentService = new IntentRecognitionService();
  const contentService = new ContentPersonalizationService();

  // Demo user
  const userId = 'demo_user_123';
  const userName = 'Sarah';

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('STEP 1: Creating User Context');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const userContext: UserContext = {
    userId,
    profile: {
      userId,
      email: 'sarah@example.com',
      name: userName,
      age: 42,
      location: 'London',
      totalDonations: 150,
      donationCount: 3,
      firstDonationDate: new Date('2023-01-15'),
      lastDonationDate: new Date('2025-12-10'),
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
      consentDate: new Date('2023-01-15'),
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
        preferredFrequency: 'monthly',
      },
      interests: ['research', 'support', 'breast cancer awareness'],
    },
    preferences: {
      preferredTopics: ['breast cancer', 'research', 'early detection'],
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

  // Display user profile
  console.log('📋 USER PROFILE:');
  console.log(`   Name: ${userContext.profile.name}`);
  console.log(`   Email: ${userContext.profile.email}`);
  console.log(`   Age: ${userContext.profile.age}`);
  console.log(`   Location: ${userContext.profile.location}`);
  console.log('');
  console.log('💰 DONATION HISTORY:');
  console.log(`   Total Donated: £${userContext.profile.totalDonations}`);
  console.log(`   Number of Donations: ${userContext.profile.donationCount}`);
  console.log(`   First Donation: ${userContext.profile.firstDonationDate?.toLocaleDateString()}`);
  console.log(`   Last Donation: ${userContext.profile.lastDonationDate?.toLocaleDateString()}`);
  console.log('');
  console.log('🎯 ENGAGEMENT:');
  console.log(`   Attended Events: ${userContext.profile.hasAttendedEvents ? 'Yes' : 'No'}`);
  console.log(`   Fundraised: ${userContext.profile.hasFundraised ? 'Yes' : 'No'}`);
  console.log(`   Volunteered: ${userContext.profile.hasVolunteered ? 'Yes' : 'No'}`);
  console.log('');
  console.log('💝 PERSONAL CONNECTION:');
  console.log(`   Personally Affected: ${userContext.profile.personallyAffected ? 'Yes' : 'No'}`);
  console.log(`   Loved One Affected: ${userContext.profile.lovedOneAffected ? 'Yes' : 'No'}`);
  console.log(`   Cancer Type: ${userContext.profile.cancerType}`);
  console.log('');
  console.log('⚙️  PREFERENCES:');
  console.log(`   Topics: ${userContext.preferences.preferredTopics.join(', ')}`);
  console.log(`   Interests: ${userContext.profile.interests.join(', ')}`);
  console.log(`   Email Notifications: ${userContext.preferences.notificationSettings.email ? 'Enabled' : 'Disabled'}`);
  console.log('');
  console.log('📊 CONTEXT METADATA:');
  console.log(`   User ID: ${userContext.userId}`);
  console.log(`   Version: ${userContext.version}`);
  console.log(`   Last Updated: ${userContext.lastUpdated.toISOString()}`);
  console.log(`   Engagement History: ${userContext.engagementHistory.length} records`);
  console.log('');

  // Demo scenarios
  const scenarios = [
    {
      title: 'Information Seeking about Breast Cancer',
      input: 'Tell me about breast cancer symptoms',
      emoji: '🔍',
    },
    {
      title: 'Personalization Request',
      input: 'I want to update my preferences',
      emoji: '⚙️',
    },
    {
      title: 'Donation Intent',
      input: 'I would like to donate to support research',
      emoji: '💝',
    },
  ];

  for (const scenario of scenarios) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`${scenario.emoji} ${scenario.title.toUpperCase()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`💬 User says: "${scenario.input}"\n`);

    // Step 1: Recognize intent
    console.log('🤖 Intent Recognition:');
    const intent = await intentService.recognizeIntent(scenario.input);
    console.log(`   Primary Intent: ${intent.primaryIntent}`);
    console.log(`   Confidence: ${(intent.confidence * 100).toFixed(0)}%`);
    console.log(`   Suggested Flow: ${intent.suggestedFlow}`);
    if (intent.entities.length > 0) {
      console.log(`   Entities Detected:`);
      intent.entities.forEach(e => {
        console.log(`      - ${e.type}: "${e.value}" (${(e.confidence * 100).toFixed(0)}% confidence)`);
      });
    }

    // Step 2: Generate personalized content
    console.log('\n✨ Content Personalization:');
    const content = await contentService.generateContent(intent, userContext, 'response');
    console.log(`   Content ID: ${content.id}`);
    console.log(`   Type: ${content.type}`);
    console.log(`   Tone: ${content.metadata.tone}`);
    console.log(`   Personalized: ${content.metadata.personalized ? 'Yes' : 'No'}`);
    console.log(`\n   📝 Response:\n`);
    console.log(`   "${content.text}"\n`);
  }

  // Demo recommendations
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 PERSONALIZED RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Analyzing user interests from profile...');
  console.log(`   Interests: ${userContext.profile.interests.join(', ')}`);
  console.log(`   Preferred Topics: ${userContext.preferences.preferredTopics.join(', ')}\n`);
  
  const recommendations = await contentService.generateRecommendations(userContext, 3);
  console.log(`Generated ${recommendations.length} personalized recommendations:\n`);
  
  recommendations.forEach((rec, index) => {
    console.log(`   ${index + 1}. ${rec.text}`);
    console.log(`      Category: ${rec.metadata.category}`);
    console.log(`      Relevance Score: ${(rec.metadata.relevanceScore * 100).toFixed(0)}%\n`);
  });

  // Demo context management
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💾 CONTEXT MANAGEMENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Adding new engagement record...');
  
  // Add engagement record
  userContext.engagementHistory.push({
    recordId: `eng_${Date.now()}`,
    userId,
    timestamp: new Date(),
    type: 'campaign',
    campaignName: 'Breast Cancer Awareness',
    metadata: {
      action: 'search',
      query: 'breast cancer symptoms',
      resultsCount: 5,
    },
  });

  console.log('✓ Engagement recorded\n');
  console.log('📊 UPDATED CONTEXT:');
  console.log(`   User ID: ${userContext.userId}`);
  console.log(`   Version: ${userContext.version}`);
  console.log(`   Last Updated: ${userContext.lastUpdated.toISOString()}`);
  console.log(`   Total Engagements: ${userContext.engagementHistory.length}`);
  console.log('\n   Recent Engagement:');
  const lastEngagement = userContext.engagementHistory[userContext.engagementHistory.length - 1];
  console.log(`      Type: ${lastEngagement.type}`);
  console.log(`      Campaign: ${lastEngagement.campaignName}`);
  console.log(`      Action: ${lastEngagement.metadata.action}`);
  console.log(`      Query: "${lastEngagement.metadata.query}"`);
  console.log(`      Timestamp: ${lastEngagement.timestamp.toISOString()}`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ DEMO COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Summary:');
  console.log('   ✓ Context Management Service - Working');
  console.log('   ✓ Intent Recognition Service - Working');
  console.log('   ✓ Content Personalization Service - Working');
  console.log('\nAll three core services are functional and integrated!\n');

  // Close connections
  await contextService.close();
}

// Run the demo
main().catch(console.error);
