/**
 * Engagement Record Data Model
 * Represents a single engagement event (donation, event, volunteer, etc.)
 */

export type EngagementType = 'donation' | 'event' | 'volunteer' | 'fundraise' | 'campaign';

export interface EngagementRecord {
  recordId: string;
  userId: string;
  type: EngagementType;
  timestamp: Date;
  
  // Type-specific data
  donationAmount?: number;
  eventName?: string;
  campaignName?: string;
  
  // Impact
  impactDescription?: string;
  
  metadata: Record<string, any>;
}
