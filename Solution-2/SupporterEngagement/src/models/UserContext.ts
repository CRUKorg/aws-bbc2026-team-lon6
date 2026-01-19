/**
 * User Context Data Model
 * Represents the complete context for a user including profile and engagement history
 */

import { UserProfile } from './UserProfile';
import { EngagementRecord } from './EngagementRecord';
import { FlowState } from './SessionContext';

export interface UserPreferences {
  preferredTopics: string[];
  preferredCancerTypes: string[];
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface UserContext {
  userId: string;
  profile: UserProfile;
  engagementHistory: EngagementRecord[];
  preferences: UserPreferences;
  currentFlow?: FlowState;
  lastUpdated: Date;
  version: number;
}

export interface ContextVersion {
  version: number;
  context: UserContext;
  timestamp: Date;
  source: string;
}
