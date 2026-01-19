import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import {
  UserProfile,
  Donation,
  UserDetailsCsv,
  DonationsCsv,
  InterestsCsv,
  SupporterInterestTagCsv
} from '../types';

export class DataSeeder {
  private docClient: DynamoDBDocumentClient;
  private dataPath: string;

  constructor(region: string = 'us-west-2', dataPath: string = '../../../Data') {
    const client = new DynamoDBClient({ region });
    // Configure DynamoDB Document Client to handle Date objects
    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: {
        convertClassInstanceToMap: true,
        removeUndefinedValues: true
      }
    });
    this.dataPath = dataPath;
  }

  /**
   * Load CSV file and parse it
   */
  private loadCsv<T>(filename: string): T[] {
    const filePath = path.join(__dirname, this.dataPath, filename);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    return records as T[];
  }

  /**
   * Parse semicolon-separated values
   */
  private parseSemicolonList(value: string): string[] {
    if (!value || value.trim() === '') {
      return [];
    }
    return value.split(';').map(item => item.trim()).filter(item => item !== '');
  }

  /**
   * Parse donation amounts from semicolon-separated string
   */
  private parseDonationAmounts(donationsStr: string): number[] {
    const amounts = this.parseSemicolonList(donationsStr);
    return amounts.map(amount => parseFloat(amount)).filter(amount => !isNaN(amount));
  }

  /**
   * Load user details from CSV
   */
  public loadUserDetails(): UserDetailsCsv[] {
    return this.loadCsv<UserDetailsCsv>('user_details.csv');
  }

  /**
   * Load donations from CSV
   */
  public loadDonations(): DonationsCsv[] {
    return this.loadCsv<DonationsCsv>('donations.csv');
  }

  /**
   * Load interests from CSV
   */
  public loadInterests(): InterestsCsv[] {
    return this.loadCsv<InterestsCsv>('interests.csv');
  }

  /**
   * Load supporter interest tags from CSV
   */
  public loadSupporterInterestTags(): SupporterInterestTagCsv[] {
    return this.loadCsv<SupporterInterestTagCsv>('supporter_interest_tags.csv');
  }

  /**
   * Transform CSV data into UserProfile objects
   */
  public transformToUserProfiles(): UserProfile[] {
    const userDetails = this.loadUserDetails();
    const donations = this.loadDonations();
    const interests = this.loadInterests();

    // Create a map for quick lookup
    const donationsMap = new Map<string, number[]>();
    donations.forEach(d => {
      donationsMap.set(d.username, this.parseDonationAmounts(d.donations));
    });

    const interestsMap = new Map<string, string[]>();
    interests.forEach(i => {
      interestsMap.set(i.username, this.parseSemicolonList(i.interests));
    });

    // Transform to UserProfile
    return userDetails.map(user => {
      const userDonations = donationsMap.get(user.username) || [];
      const userInterests = interestsMap.get(user.username) || [];
      
      const totalDonations = userDonations.reduce((sum, amount) => sum + amount, 0);
      const donationCount = userDonations.length;

      const now = new Date();
      
      return {
        userId: user.username,
        email: `${user.username}@example.com`,
        name: user.name,
        firstName: user.name.split(' ')[0],
        lastName: user.name.split(' ').slice(1).join(' '),
        age: user.age,
        gender: user.gender === 'M' ? 'Man' : user.gender === 'F' ? 'Woman' : 'Prefer not to say',
        location: user.location,
        
        // Engagement attributes
        totalDonations,
        donationCount,
        firstDonationDate: donationCount > 0 ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) : undefined,
        lastDonationDate: donationCount > 0 ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : undefined,
        
        // Activity flags (mock data)
        hasAttendedEvents: donationCount > 2,
        hasFundraised: donationCount > 3,
        hasVolunteered: false,
        isResearcher: false,
        isJournalist: false,
        isPhilanthropist: totalDonations > 200,
        
        // Personal context (mock data based on interests)
        personallyAffected: userInterests.some(i => i.includes('Cancer')),
        lovedOneAffected: userInterests.some(i => i.includes('Cancer')),
        cancerType: userInterests.find(i => i.includes('Cancer')),
        
        // Preferences
        communicationPreferences: {
          email: true,
          sms: false,
          phone: false,
          preferredFrequency: 'monthly' as const
        },
        interests: userInterests,
        
        // Metadata
        createdAt: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000), // 2 years ago
        updatedAt: now,
        consentGiven: true,
        consentDate: new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000),
        
        // Flags
        doNotContact: false,
        isDeceased: false,
        isAnonymous: false,
        isHighValueSupporter: totalDonations > 200
      } as UserProfile;
    });
  }

  /**
   * Transform CSV data into Donation objects
   */
  public transformToDonations(): Donation[] {
    const donations = this.loadDonations();
    const allDonations: Donation[] = [];

    donations.forEach(userDonation => {
      const amounts = this.parseDonationAmounts(userDonation.donations);
      
      amounts.forEach((amount, index) => {
        const now = new Date();
        const daysAgo = (amounts.length - index) * 60; // Space donations 60 days apart
        const donationDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        allDonations.push({
          donationId: `${userDonation.username}_${index + 1}`,
          userId: userDonation.username,
          amount,
          currency: 'GBP',
          donationType: 'Payment',
          paymentType: 'Credit Card',
          paymentStatus: 'Completed',
          receivedDate: donationDate,
          paymentDate: donationDate,
          
          // Gift Aid
          isGiftAided: amount >= 20, // Mock: Gift aid for donations >= £20
          giftAidAmount: amount >= 20 ? amount * 0.25 : undefined,
          
          // Direct Debit (mock: recurring if more than 3 donations)
          directDebitFrequency: amounts.length > 3 ? 'Monthly' : 'Single',
          
          // Metadata
          motivation: 'Support cancer research',
          appealName: 'General Fund',
          
          createdAt: donationDate,
          updatedAt: donationDate
        });
      });
    });

    return allDonations;
  }

  /**
   * Seed DynamoDB table with user profiles
   */
  public async seedUserProfiles(tableName: string): Promise<void> {
    const profiles = this.transformToUserProfiles();
    
    console.log(`Seeding ${profiles.length} user profiles to ${tableName}...`);
    
    for (const profile of profiles) {
      try {
        await this.docClient.send(new PutCommand({
          TableName: tableName,
          Item: profile
        }));
        console.log(`Seeded user: ${profile.userId}`);
      } catch (error) {
        console.error(`Error seeding user ${profile.userId}:`, error);
      }
    }
    
    console.log('User profiles seeding complete!');
  }

  /**
   * Seed DynamoDB table with donations
   */
  public async seedDonations(tableName: string): Promise<void> {
    const donations = this.transformToDonations();
    
    console.log(`Seeding ${donations.length} donations to ${tableName}...`);
    
    // Batch write in groups of 25 (DynamoDB limit)
    const batchSize = 25;
    for (let i = 0; i < donations.length; i += batchSize) {
      const batch = donations.slice(i, i + batchSize);
      
      try {
        await this.docClient.send(new BatchWriteCommand({
          RequestItems: {
            [tableName]: batch.map(donation => ({
              PutRequest: {
                Item: donation
              }
            }))
          }
        }));
        console.log(`Seeded batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(donations.length / batchSize)}`);
      } catch (error) {
        console.error(`Error seeding batch:`, error);
      }
    }
    
    console.log('Donations seeding complete!');
  }

  /**
   * Seed all data
   */
  public async seedAll(userTableName: string, donationTableName: string): Promise<void> {
    await this.seedUserProfiles(userTableName);
    await this.seedDonations(donationTableName);
  }
}

// Export a function to run seeding from command line
export async function runSeeding() {
  const seeder = new DataSeeder();
  
  const userTableName = process.env.USER_TABLE_NAME || 'SupporterEngagement-Users';
  const donationTableName = process.env.DONATION_TABLE_NAME || 'SupporterEngagement-Donations';
  
  await seeder.seedAll(userTableName, donationTableName);
}

// Run if called directly
if (require.main === module) {
  runSeeding().catch(console.error);
}
