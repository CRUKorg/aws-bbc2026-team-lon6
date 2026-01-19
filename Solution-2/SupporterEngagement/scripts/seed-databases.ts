#!/usr/bin/env ts-node

/**
 * Database Seeding Script
 * Populates DynamoDB tables with demo data for Sarah and James personas
 */

import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { config } from '../src/utils/config';

const dynamoClient = new DynamoDBClient({ region: config.aws.region });

/**
 * Seed User Profiles Table with Sarah and James
 */
async function seedUserProfiles() {
  console.log('\n📝 Seeding User Profiles...');
  
  const users = [
    // Sarah - Engaged Supporter
    {
      userId: 'sarah-engaged-001',
      email: 'sarah.johnson@example.com',
      name: 'Sarah Johnson',
      age: 42,
      gender: 'Female',
      location: 'London, UK',
      totalDonations: 600, // £50/month for 12 months
      donationCount: 12,
      firstDonationDate: new Date('2025-01-01').toISOString(),
      lastDonationDate: new Date('2026-01-01').toISOString(),
      hasAttendedEvents: true,
      hasFundraised: false,
      hasVolunteered: false,
      personallyAffected: false,
      lovedOneAffected: true,
      cancerType: 'breast-cancer',
      communicationPreferences: {
        email: true,
        sms: true,
        phone: false,
        preferredFrequency: 'monthly'
      },
      interests: ['breast-cancer-research', 'immunotherapy', 'early-detection', 'cycling', 'race-for-life'],
      createdAt: new Date('2025-01-01').toISOString(),
      updatedAt: new Date().toISOString(),
      consentGiven: true,
      consentDate: new Date('2025-01-01').toISOString()
    },
    // James - Lapsed Supporter
    {
      userId: 'james-lapsed-001',
      email: 'james.wilson@example.com',
      name: 'James Wilson',
      age: 38,
      gender: 'Male',
      location: 'Manchester, UK',
      totalDonations: 100, // One-time donation 6 months ago
      donationCount: 1,
      firstDonationDate: new Date('2025-07-01').toISOString(),
      lastDonationDate: new Date('2025-07-01').toISOString(),
      hasAttendedEvents: false,
      hasFundraised: false,
      hasVolunteered: false,
      personallyAffected: false,
      lovedOneAffected: true,
      cancerType: 'lung-cancer',
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
        preferredFrequency: 'quarterly'
      },
      interests: ['lung-cancer-research', 'biomarkers', 'running', 'race-for-life'],
      createdAt: new Date('2025-07-01').toISOString(),
      updatedAt: new Date().toISOString(),
      consentGiven: true,
      consentDate: new Date('2025-07-01').toISOString()
    },
    // John - New Supporter (minimal profile for update demo)
    {
      userId: 'john-new-supporter-001',
      email: 'john.davies@example.com',
      name: 'John Davies',
      age: 45,
      gender: 'Male',
      location: 'Birmingham, UK',
      totalDonations: 0,
      donationCount: 0,
      hasAttendedEvents: false,
      hasFundraised: false,
      hasVolunteered: false,
      personallyAffected: false,
      lovedOneAffected: false, // Will be updated during demo
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
        preferredFrequency: 'monthly'
      },
      interests: [], // Will be updated during demo
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      consentGiven: true,
      consentDate: new Date().toISOString()
    }
  ];

  for (const user of users) {
    try {
      const command = new PutItemCommand({
        TableName: config.dynamodb.userProfilesTable,
        Item: marshall(user)
      });
      await dynamoClient.send(command);
      console.log(`   ✅ Created profile: ${user.name} (${user.userId})`);
    } catch (error: any) {
      console.error(`   ❌ Failed to create ${user.name}:`, error.message);
    }
  }
}

/**
 * Seed Engagement History
 */
async function seedEngagementHistory() {
  console.log('\n📊 Seeding Engagement History...');
  
  const engagements = [
    // Sarah's engagement history - 12 monthly donations
    ...Array.from({ length: 12 }, (_, i) => ({
      userId: 'sarah-engaged-001',
      timestamp: new Date(2025, i, 1).toISOString(),
      type: 'donation',
      amount: 50,
      currency: 'GBP',
      campaign: 'monthly-giving',
      metadata: { channel: 'direct-debit', recurring: true }
    })),
    // Sarah's content engagement
    {
      userId: 'sarah-engaged-001',
      timestamp: new Date('2025-12-15').toISOString(),
      type: 'content_view',
      contentId: 'research-paper-001',
      contentTitle: 'Novel Immunotherapy Approaches for Breast Cancer',
      duration: 420, // 7 minutes
      metadata: { category: 'research', topic: 'immunotherapy' }
    },
    {
      userId: 'sarah-engaged-001',
      timestamp: new Date('2025-12-10').toISOString(),
      type: 'search',
      query: 'breast cancer treatment progress',
      resultsCount: 15,
      clickedResults: 3,
      metadata: { source: 'web' }
    },
    {
      userId: 'sarah-engaged-001',
      timestamp: new Date('2025-11-20').toISOString(),
      type: 'event_attendance',
      eventName: 'Breast Cancer Research Webinar',
      metadata: { duration: 60, format: 'online' }
    },
    // James's engagement history - single donation
    {
      userId: 'james-lapsed-001',
      timestamp: new Date('2025-07-01').toISOString(),
      type: 'donation',
      amount: 100,
      currency: 'GBP',
      campaign: 'lung-cancer-research',
      metadata: { channel: 'website', oneTime: true }
    }
  ];

  for (const engagement of engagements) {
    try {
      const command = new PutItemCommand({
        TableName: config.dynamodb.engagementTable,
        Item: marshall(engagement)
      });
      await dynamoClient.send(command);
      console.log(`   ✅ Created engagement: ${engagement.type} for ${engagement.userId}`);
    } catch (error: any) {
      console.error(`   ❌ Failed to create engagement:`, error.message);
    }
  }
}

/**
 * Seed Analytics Data
 */
async function seedAnalytics() {
  console.log('\n📈 Seeding Analytics Data...');
  
  const analytics = [
    // Sarah's analytics - multiple interactions
    {
      userId: 'sarah-engaged-001',
      interactionId: 'int-sarah-001',
      timestamp: new Date('2025-12-15').toISOString(),
      sessionId: 'session-sarah-001',
      intent: 'information_seeking',
      confidence: 0.95,
      responseTime: 1200,
      satisfied: true,
      metadata: { query: 'breast cancer research', resultsShown: 5 }
    },
    {
      userId: 'sarah-engaged-001',
      interactionId: 'int-sarah-002',
      timestamp: new Date('2025-12-10').toISOString(),
      sessionId: 'session-sarah-002',
      intent: 'search',
      confidence: 0.92,
      responseTime: 800,
      satisfied: true,
      metadata: { query: 'treatment progress', resultsShown: 15 }
    },
    {
      userId: 'sarah-engaged-001',
      interactionId: 'int-sarah-003',
      timestamp: new Date('2025-12-01').toISOString(),
      sessionId: 'session-sarah-003',
      intent: 'donation',
      confidence: 0.98,
      responseTime: 2000,
      satisfied: true,
      metadata: { amount: 50, recurring: true }
    },
    // James's analytics - single interaction
    {
      userId: 'james-lapsed-001',
      interactionId: 'int-james-001',
      timestamp: new Date('2025-07-01').toISOString(),
      sessionId: 'session-james-001',
      intent: 'donation',
      confidence: 0.98,
      responseTime: 1500,
      satisfied: true,
      metadata: { amount: 100, oneTime: true }
    }
  ];

  for (const analytic of analytics) {
    try {
      const command = new PutItemCommand({
        TableName: config.dynamodb.analyticsTable,
        Item: marshall(analytic)
      });
      await dynamoClient.send(command);
      console.log(`   ✅ Created analytic: ${analytic.interactionId}`);
    } catch (error: any) {
      console.error(`   ❌ Failed to create analytic:`, error.message);
    }
  }
}

/**
 * Seed Context Table
 */
async function seedContext() {
  console.log('\n🧠 Seeding Context Data...');
  
  const contexts = [
    // Sarah's context
    {
      userId: 'sarah-engaged-001',
      sessionId: 'session-sarah-latest',
      version: 1,
      timestamp: new Date().toISOString(),
      conversationHistory: [
        { role: 'user', content: 'Show me my dashboard', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Welcome back, Sarah! Here\'s your personalized dashboard...', timestamp: new Date().toISOString() }
      ],
      currentIntent: 'dashboard_view',
      contextData: {
        lastVisit: new Date('2025-12-15').toISOString(),
        preferredTopics: ['breast-cancer-research', 'immunotherapy'],
        engagementLevel: 'high'
      }
    },
    // James's context
    {
      userId: 'james-lapsed-001',
      sessionId: 'session-james-latest',
      version: 1,
      timestamp: new Date().toISOString(),
      conversationHistory: [],
      currentIntent: null,
      contextData: {
        lastVisit: new Date('2025-07-01').toISOString(),
        preferredTopics: ['lung-cancer-research'],
        engagementLevel: 'lapsed'
      }
    },
    // John's context
    {
      userId: 'john-new-supporter-001',
      sessionId: 'session-john-latest',
      version: 1,
      timestamp: new Date().toISOString(),
      conversationHistory: [],
      currentIntent: null,
      contextData: {
        lastVisit: new Date().toISOString(),
        preferredTopics: [],
        engagementLevel: 'new'
      }
    }
  ];

  for (const context of contexts) {
    try {
      const command = new PutItemCommand({
        TableName: config.dynamodb.contextTable,
        Item: marshall(context)
      });
      await dynamoClient.send(command);
      console.log(`   ✅ Created context: ${context.userId}`);
    } catch (error: any) {
      console.error(`   ❌ Failed to create context:`, error.message);
    }
  }
}

/**
 * Main seeding function
 */
async function seedDatabases() {
  console.log('\n' + '='.repeat(70));
  console.log('🌱 SEEDING DEMO DATA');
  console.log('='.repeat(70));

  try {
    await seedUserProfiles();
    await seedEngagementHistory();
    await seedAnalytics();
    // Skip seeding context - let PersonalizationAgent create it on first use
    // await seedContext();

    console.log('\n' + '='.repeat(70));
    console.log('✅ SEEDING COMPLETE');
    console.log('='.repeat(70) + '\n');
    console.log('Demo personas created:');
    console.log('  • Sarah Johnson (sarah-engaged-001) - Engaged supporter');
    console.log('    - £600 total (£50/month × 12 months)');
    console.log('    - Interested in breast cancer research');
    console.log('    - High engagement level\n');
    console.log('  • James Wilson (james-lapsed-001) - Lapsed supporter');
    console.log('    - £100 one-time donation (6 months ago)');
    console.log('    - Interested in lung cancer research');
    console.log('    - Lapsed engagement\n');
    console.log('  • John Davies (john-new-supporter-001) - New supporter');
    console.log('    - No donations yet');
    console.log('    - Minimal profile (for update demo)');
    console.log('    - Ready for personalization\n');
    console.log('💡 Run demos:');
    console.log('   • npm run demo:sarah (engaged supporter)');
    console.log('   • npm run demo:james (lapsed supporter)');
    console.log('   • npm run demo:john (profile update)\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabases();
