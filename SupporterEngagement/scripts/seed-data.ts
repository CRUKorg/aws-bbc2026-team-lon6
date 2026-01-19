#!/usr/bin/env ts-node

/**
 * Script to seed DynamoDB tables with data from CSV files
 * 
 * Usage:
 *   npm run seed-data
 *   
 * Or with custom table names:
 *   USER_TABLE_NAME=MyUsers DONATION_TABLE_NAME=MyDonations npm run seed-data
 */

import { DataSeeder } from '../lib/utils/data-seeder';

async function main() {
  console.log('Starting data seeding process...\n');
  
  // Get table names from environment or use defaults
  const userTableName = process.env.USER_TABLE_NAME || 'SupporterEngagement-Users';
  const donationTableName = process.env.DONATION_TABLE_NAME || 'SupporterEngagement-Donations';
  const region = process.env.AWS_REGION || 'us-west-2';
  
  console.log(`Region: ${region}`);
  console.log(`User Table: ${userTableName}`);
  console.log(`Donation Table: ${donationTableName}\n`);
  
  try {
    // Create seeder instance
    const seeder = new DataSeeder(region);
    
    // Seed all data
    await seeder.seedAll(userTableName, donationTableName);
    
    console.log('\n✅ Data seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the script
main();
