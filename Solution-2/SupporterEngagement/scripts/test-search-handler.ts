/**
 * Test script for SearchHandler
 * Tests search functionality with various queries
 */

import { SearchHandler } from '../src/agent/search/SearchHandler';
import { ContextManagementService } from '../src/services/context-management/ContextManagementService';
import { UserContext, UserProfile } from '../src/models';

async function testSearchHandler() {
  console.log('=== Testing SearchHandler ===\n');
  
  const contextService = new ContextManagementService();
  const handler = new SearchHandler(contextService);
  
  // Create test user context
  const testProfile: UserProfile = {
    userId: 'user_search_test',
    email: 'search@example.com',
    name: 'Search Tester',
    age: 40,
    gender: 'Female',
    location: 'London, UK',
    totalDonations: 100,
    donationCount: 2,
    lastDonationDate: new Date('2025-11-01'),
    hasAttendedEvents: false,
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
    interests: ['prevention', 'support-services'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    consentGiven: true
  };
  
  const testContext: UserContext = {
    userId: 'user_search_test',
    profile: testProfile,
    engagementHistory: [],
    preferences: {
      preferredTopics: ['prevention', 'support-services'],
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
  
  // Test Case 1: Valid search query
  console.log('\n--- Test 1: Search for "breast cancer screening" ---');
  const result1 = await handler.search('breast cancer screening', testContext);
  console.log('\nSearch Result:');
  console.log(`Success: ${result1.success}`);
  console.log(`Query: "${result1.query}"`);
  console.log(`Total Results: ${result1.totalResults}`);
  console.log(`Message: ${result1.message}`);
  console.log(`UI Components: ${result1.uiComponents.length}`);
  if (result1.results.length > 0) {
    console.log('\nFirst Result:');
    console.log(`  Title: ${result1.results[0].title}`);
    console.log(`  Summary: ${result1.results[0].summary.substring(0, 100)}...`);
    console.log(`  URL: ${result1.results[0].url}`);
    console.log(`  CRUK Verified: ${result1.results[0].isCRUKVerified}`);
  }
  
  // Test Case 2: Empty query
  console.log('\n\n--- Test 2: Empty Query ---');
  const result2 = await handler.search('', testContext);
  console.log('\nSearch Result:');
  console.log(`Success: ${result2.success}`);
  console.log(`Message: ${result2.message}`);
  console.log(`Total Results: ${result2.totalResults}`);
  
  // Test Case 3: Search for cancer prevention
  console.log('\n\n--- Test 3: Search for "cancer prevention" ---');
  const result3 = await handler.search('cancer prevention', testContext);
  console.log('\nSearch Result:');
  console.log(`Success: ${result3.success}`);
  console.log(`Query: "${result3.query}"`);
  console.log(`Total Results: ${result3.totalResults}`);
  console.log(`Message: ${result3.message}`);
  
  // Test Case 4: Search suggestions
  console.log('\n\n--- Test 4: Get Search Suggestions ---');
  const suggestions = await handler.getSearchSuggestions(testContext);
  console.log('\nSearch Suggestions:');
  suggestions.forEach((suggestion, index) => {
    console.log(`  ${index + 1}. ${suggestion}`);
  });
  
  // Test Case 5: Popular searches
  console.log('\n\n--- Test 5: Get Popular Searches ---');
  const popular = await handler.getPopularSearches();
  console.log('\nPopular Searches:');
  popular.forEach((search, index) => {
    console.log(`  ${index + 1}. ${search}`);
  });
  
  // Test Case 6: Search with different interests
  console.log('\n\n--- Test 6: Search for "fundraising ideas" ---');
  const result6 = await handler.search('fundraising ideas', testContext);
  console.log('\nSearch Result:');
  console.log(`Success: ${result6.success}`);
  console.log(`Query: "${result6.query}"`);
  console.log(`Total Results: ${result6.totalResults}`);
  console.log(`Message: ${result6.message}`);
  
  // Test Case 7: Verify UI components
  console.log('\n\n--- Test 7: Verify UI Components ---');
  const result7 = await handler.search('support services', testContext);
  console.log('\nUI Components Generated:');
  result7.uiComponents.forEach((component, index) => {
    console.log(`  ${index + 1}. Type: ${component.type}`);
    if (component.type === 'search_bar') {
      console.log(`     - Placeholder: ${component.data.placeholder}`);
      console.log(`     - Always Visible: ${component.data.alwaysVisible}`);
      console.log(`     - Current Query: ${component.data.currentQuery}`);
    } else if (component.type === 'search_results') {
      console.log(`     - Total Results: ${component.data.totalResults}`);
      console.log(`     - Query: ${component.data.query}`);
    }
  });
  
  console.log('\n\n=== All Search Handler Tests Completed ===');
}

// Run tests
testSearchHandler().catch(console.error);
