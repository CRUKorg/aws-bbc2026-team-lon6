/**
 * Test script for MissingDataHandler
 * Tests missing data detection and handling with various user profiles
 */

import { MissingDataHandler } from '../src/agent/missing-data/MissingDataHandler';
import { UserContext, UserProfile } from '../src/models';

async function testMissingDataHandler() {
  console.log('=== Testing MissingDataHandler ===\n');
  
  const handler = new MissingDataHandler();
  
  // Test Case 1: Complete profile (no missing data)
  console.log('\n--- Test 1: Complete Profile ---');
  const completeProfile: UserProfile = {
    userId: 'user_complete',
    email: 'complete@example.com',
    name: 'Complete User',
    age: 35,
    gender: 'Female',
    location: 'London, UK',
    totalDonations: 100,
    donationCount: 2,
    firstDonationDate: new Date('2025-01-01'),
    lastDonationDate: new Date('2025-12-01'),
    hasAttendedEvents: true,
    hasFundraised: false,
    hasVolunteered: false,
    isResearcher: false,
    isJournalist: false,
    isPhilanthropist: false,
    personallyAffected: false,
    lovedOneAffected: true,
    cancerType: 'breast-cancer',
    communicationPreferences: {
      email: true,
      sms: false,
      phone: false,
      preferredFrequency: 'monthly'
    },
    interests: ['research', 'support-services'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    consentGiven: true
  };
  
  const completeContext: UserContext = {
    userId: 'user_complete',
    profile: completeProfile,
    engagementHistory: [],
    preferences: {
      preferredTopics: ['research'],
      preferredCancerTypes: ['breast-cancer'],
      notificationSettings: {
        email: true,
        sms: false,
        push: false
      }
    },
    lastUpdated: new Date(),
    version: 1
  };
  
  const result1 = await handler.analyzeMissingData(completeContext);
  console.log('\nResult for Complete Profile:');
  console.log(JSON.stringify(result1, null, 2));
  console.log(`\nCan proceed: ${result1.canProceed} (should always be true)`);
  
  // Test Case 2: New user with minimal data
  console.log('\n\n--- Test 2: New User with Minimal Data ---');
  const minimalProfile: UserProfile = {
    userId: 'user_minimal',
    email: 'minimal@example.com',
    name: 'New User',
    totalDonations: 0,
    donationCount: 0,
    hasAttendedEvents: false,
    hasFundraised: false,
    hasVolunteered: false,
    isResearcher: false,
    isJournalist: false,
    isPhilanthropist: false,
    personallyAffected: false,
    lovedOneAffected: false,
    communicationPreferences: {
      email: true,
      sms: false,
      phone: false,
      preferredFrequency: 'monthly'
    },
    interests: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    consentGiven: true
  };
  
  const minimalContext: UserContext = {
    userId: 'user_minimal',
    profile: minimalProfile,
    engagementHistory: [],
    preferences: {
      preferredTopics: [],
      preferredCancerTypes: [],
      notificationSettings: {
        email: true,
        sms: false,
        push: false
      }
    },
    lastUpdated: new Date(),
    version: 1
  };
  
  const result2 = await handler.analyzeMissingData(minimalContext);
  console.log('\nResult for Minimal Profile:');
  console.log(JSON.stringify(result2, null, 2));
  console.log(`\nMissing fields count: ${result2.missingFields.length}`);
  console.log(`Can proceed: ${result2.canProceed} (should always be true)`);
  
  // Test Case 3: Partial profile (missing age and gender only)
  console.log('\n\n--- Test 3: Partial Profile (Missing High Priority Fields) ---');
  const partialProfile: UserProfile = {
    userId: 'user_partial',
    email: 'partial@example.com',
    name: 'Partial User',
    location: 'Manchester, UK',
    totalDonations: 50,
    donationCount: 1,
    lastDonationDate: new Date('2025-11-01'),
    hasAttendedEvents: false,
    hasFundraised: false,
    hasVolunteered: false,
    isResearcher: false,
    isJournalist: false,
    isPhilanthropist: false,
    personallyAffected: true,
    lovedOneAffected: false,
    cancerType: 'lung-cancer',
    communicationPreferences: {
      email: true,
      sms: true,
      phone: false,
      preferredFrequency: 'quarterly'
    },
    interests: ['prevention', 'treatment'],
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date(),
    consentGiven: true
  };
  
  const partialContext: UserContext = {
    userId: 'user_partial',
    profile: partialProfile,
    engagementHistory: [],
    preferences: {
      preferredTopics: ['prevention', 'treatment'],
      preferredCancerTypes: ['lung-cancer'],
      notificationSettings: {
        email: true,
        sms: true,
        push: false
      }
    },
    lastUpdated: new Date(),
    version: 1
  };
  
  const result3 = await handler.analyzeMissingData(partialContext);
  console.log('\nResult for Partial Profile:');
  console.log(JSON.stringify(result3, null, 2));
  console.log(`\nHigh priority fields missing: ${result3.missingFields.filter(f => f.priority === 'high').length}`);
  console.log(`Can proceed: ${result3.canProceed} (should always be true)`);
  
  // Test Case 4: Progressive collection strategy
  console.log('\n\n--- Test 4: Progressive Collection Strategy ---');
  const strategy = handler.getProgressiveCollectionStrategy(minimalProfile);
  console.log('\nProgressive Collection Strategy:');
  strategy.forEach((stage, index) => {
    console.log(`Stage ${index + 1}: ${stage.join(', ')}`);
  });
  
  // Test Case 5: Feature access check (should always allow)
  console.log('\n\n--- Test 5: Feature Access Check ---');
  const features = ['dashboard', 'search', 'donation', 'research'];
  features.forEach(feature => {
    const canAccess = handler.canAccessFeature(minimalContext, feature);
    console.log(`Can access ${feature}: ${canAccess} (should always be true)`);
  });
  
  // Test Case 6: Process responses
  console.log('\n\n--- Test 6: Process User Responses ---');
  const responses = {
    age: 42,
    gender: 'Male',
    location: 'Birmingham, UK'
  };
  const processResult = await handler.processResponses('user_minimal', responses);
  console.log('\nProcess Result:');
  console.log(JSON.stringify(processResult, null, 2));
  
  // Test Case 7: Generate questions for specific fields
  console.log('\n\n--- Test 7: Generate Questions for Specific Fields ---');
  const specificFields = await handler.generateQuestionsForFields(['age', 'gender']);
  console.log('\nQuestions for age and gender:');
  specificFields.forEach(field => {
    console.log(`\n${field.field} (${field.priority} priority):`);
    console.log(`  Question: ${field.question}`);
    console.log(`  Type: ${field.fieldType}`);
    if (field.options) {
      console.log(`  Options: ${field.options.join(', ')}`);
    }
  });
  
  console.log('\n\n=== All Missing Data Handler Tests Completed ===');
}

// Run tests
testMissingDataHandler().catch(console.error);
