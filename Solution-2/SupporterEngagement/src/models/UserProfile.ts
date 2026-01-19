/**
 * User Profile Data Model
 * Represents a supporter's profile with engagement history and preferences
 */

export interface CommunicationPreferences {
  email: boolean;
  sms: boolean;
  phone: boolean;
  preferredFrequency: 'weekly' | 'monthly' | 'quarterly';
}

export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  age?: number;
  gender?: string;
  location?: string;
  
  // Engagement attributes
  totalDonations: number;
  donationCount: number;
  firstDonationDate?: Date;
  lastDonationDate?: Date;
  
  // Activity flags
  hasAttendedEvents: boolean;
  hasFundraised: boolean;
  hasVolunteered: boolean;
  isResearcher: boolean;
  isJournalist: boolean;
  isPhilanthropist: boolean;
  
  // Personal context
  personallyAffected: boolean;
  lovedOneAffected: boolean;
  cancerType?: string;
  
  // Preferences
  communicationPreferences: CommunicationPreferences;
  interests: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  consentGiven: boolean;
  consentDate?: Date;
}
