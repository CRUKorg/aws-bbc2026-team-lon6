/**
 * Test script for DashboardGenerator
 * Tests dashboard generation with various user profiles
 */

import { DashboardGenerator } from '../src/agent/dashboard/DashboardGenerator';
import { UserContext, UserProfile, EngagementRecord } from '../src/models';

async function testDashboardGenerator() {
  console.log('=== Testing DashboardGenerator ===\n');
  
  const generator = new DashboardGenerator();
  
  // Test Case 1: New user with no donations
  console.log('\n--- Test 1: New User Dashboard ---');
  const newUserProfile: UserProfile = {
    userId: 'user_new',
    email: 'newuser@example.com',
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
    interests: ['breast-cancer'],
    createdAt: new Date(),
    updatedAt: new Date(),
    consentGiven: true
  };
  
  const newUserContext: UserContext = {
    userId: 'user_new',
    profile: newUserProfile,
    engagementHistory: [],
    preferences: {
      preferredTopics: ['breast-cancer'],
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
  
  const dashboard1 = await generator.generateDashboard(newUserContext);
  console.log('\nDashboard for New User:');
  console.log(JSON.stringify(dashboard1, null, 2));
  
  // Test Case 2: Active donor
  console.log('\n\n--- Test 2: Active Donor Dashboard ---');
  const activeDonorProfile: UserProfile = {
    userId: 'user_active',
    email: 'donor@example.com',
    name: 'Active Donor',
    totalDonations: 250,
    donationCount: 5,
    firstDonationDate: new Date('2024-01-01'),
    lastDonationDate: new Date('2025-12-15'),
    hasAttendedEvents: true,
    hasFundraised: false,
    hasVolunteered: false,
    isResearcher: false,
    isJournalist: false,
    isPhilanthropist: false,
    personallyAffected: false,
    lovedOneAffected: true,
    cancerType: 'lung-cancer',
    communicationPreferences: {
      email: true,
      sms: true,
      phone: false,
      preferredFrequency: 'monthly'
    },
    interests: ['lung-cancer', 'research'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    consentGiven: true
  };
  
  const activeDonorContext: UserContext = {
    userId: 'user_active',
    profile: activeDonorProfile,
    engagementHistory: [],
    preferences: {
      preferredTopics: ['lung-cancer', 'research'],
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
  
  const dashboard2 = await generator.generateDashboard(activeDonorContext);
  console.log('\nDashboard for Active Donor:');
  console.log(JSON.stringify(dashboard2, null, 2));
  
  // Test Case 3: User with specific interests
  console.log('\n\n--- Test 3: Research-Focused User Dashboard ---');
  const researchUserProfile: UserProfile = {
    userId: 'user_research',
    email: 'researcher@example.com',
    name: 'Research Enthusiast',
    totalDonations: 100,
    donationCount: 2,
    firstDonationDate: new Date('2025-06-01'),
    lastDonationDate: new Date('2025-10-01'),
    hasAttendedEvents: false,
    hasFundraised: false,
    hasVolunteered: false,
    isResearcher: true,
    isJournalist: false,
    isPhilanthropist: false,
    personallyAffected: false,
    lovedOneAffected: false,
    communicationPreferences: {
      email: true,
      sms: false,
      phone: false,
      preferredFrequency: 'quarterly'
    },
    interests: ['research', 'clinical-trials'],
    createdAt: new Date('2025-06-01'),
    updatedAt: new Date(),
    consentGiven: true
  };
  
  const researchUserContext: UserContext = {
    userId: 'user_research',
    profile: researchUserProfile,
    engagementHistory: [],
    preferences: {
      preferredTopics: ['research', 'clinical-trials'],
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
  
  const dashboard3 = await generator.generateDashboard(researchUserContext);
  console.log('\nDashboard for Research-Focused User:');
  console.log(JSON.stringify(dashboard3, null, 2));
  
  // Test Case 4: Lapsed donor
  console.log('\n\n--- Test 4: Lapsed Donor Dashboard ---');
  const lapsedDonorProfile: UserProfile = {
    userId: 'user_lapsed',
    email: 'lapsed@example.com',
    name: 'Lapsed Donor',
    totalDonations: 150,
    donationCount: 3,
    firstDonationDate: new Date('2023-01-01'),
    lastDonationDate: new Date('2024-12-01'),
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
    interests: ['general'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date(),
    consentGiven: true
  };
  
  const lapsedDonorContext: UserContext = {
    userId: 'user_lapsed',
    profile: lapsedDonorProfile,
    engagementHistory: [],
    preferences: {
      preferredTopics: ['general'],
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
  
  const dashboard4 = await generator.generateDashboard(lapsedDonorContext);
  console.log('\nDashboard for Lapsed Donor:');
  console.log(JSON.stringify(dashboard4, null, 2));
  
  console.log('\n\n=== All Dashboard Tests Completed ===');
}

// Run tests
testDashboardGenerator().catch(console.error);
