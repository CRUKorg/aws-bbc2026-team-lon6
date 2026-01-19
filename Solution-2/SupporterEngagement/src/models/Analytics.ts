/**
 * Analytics Data Models
 * Represents user interactions and analytics tracking
 */

export interface Interaction {
  interactionId: string;
  userId: string;
  type: 'click' | 'view' | 'search' | 'input' | 'navigation';
  timestamp: Date;
  intent?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  metadata: Record<string, any>;
}

export interface UserAnalytics {
  userId: string;
  totalInteractions: number;
  lastInteractionDate: Date;
  mostCommonIntent: string;
  averageSentiment: number;
  pageVisits: PageVisit[];
  searchQueries: string[];
}

export interface PageVisit {
  pageUrl: string;
  timestamp: Date;
  duration?: number;
  referrer?: string;
}
