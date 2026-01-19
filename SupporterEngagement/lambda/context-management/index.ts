import { 
  getUserContextFromDb, 
  saveUserContextToDb, 
  getContextHistoryFromDb,
  getNextContextVersion,
  getUserProfileFromDb,
  docClient
} from '../shared/dynamodb-utils';
import { 
  UserContext, 
  ContextVersion, 
  UserProfile,
  EngagementRecord,
  UserPreferences,
  FlowState
} from '../shared/types';

// Environment variables
const CONTEXT_TABLE_NAME = process.env.CONTEXT_TABLE_NAME || 'SupporterEngagement-Context';
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'SupporterEngagement-Users';

/**
 * Context Management Service
 * 
 * Maintains user context across sessions and manages the context store.
 * Implements context versioning with timestamps and history tracking.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export class ContextManagementService {
  private contextTableName: string;
  private userTableName: string;

  constructor(contextTableName?: string, userTableName?: string) {
    this.contextTableName = contextTableName || CONTEXT_TABLE_NAME;
    this.userTableName = userTableName || USER_TABLE_NAME;
  }

  /**
   * Get user context (latest version)
   * Requirement 8.3: Retrieve user context using the most recent trusted information
   */
  async getContext(userId: string): Promise<UserContext> {
    try {
      // Try to get existing context
      const existingContext = await getUserContextFromDb(userId, this.contextTableName);
      
      if (existingContext) {
        return existingContext;
      }
      
      // If no context exists, create initial context from user profile
      const profile = await getUserProfileFromDb(userId, this.userTableName);
      
      if (!profile) {
        throw new Error(`User profile not found for userId: ${userId}`);
      }
      
      // Create initial context
      const initialContext: UserContext = {
        userId,
        profile,
        engagementHistory: [],
        preferences: {
          interests: profile.interests || [],
          communicationPreferences: profile.communicationPreferences || {
            email: true,
            sms: false,
            phone: false,
            preferredFrequency: 'monthly'
          },
          preferredLanguage: 'en'
        },
        lastUpdated: new Date(),
        version: 1
      };
      
      // Save initial context
      return await saveUserContextToDb(userId, initialContext, this.contextTableName, 'initialization');
    } catch (error) {
      console.error('Error getting context:', error);
      throw error;
    }
  }

  /**
   * Update user context with new data
   * Requirement 8.1: Save new personalization input with timestamp
   * Requirement 8.2: Store context in structured or semi-structured format
   */
  async updateContext(userId: string, updates: Partial<UserContext>): Promise<UserContext> {
    try {
      // Get current context
      const currentContext = await this.getContext(userId);
      
      // Get next version number
      const nextVersion = await getNextContextVersion(userId, this.contextTableName);
      
      // Create updated context
      const updatedContext: UserContext = {
        ...currentContext,
        ...updates,
        userId, // Ensure userId is not overwritten
        version: nextVersion,
        lastUpdated: new Date()
      };
      
      // Save updated context with new version
      return await saveUserContextToDb(userId, updatedContext, this.contextTableName, 'update');
    } catch (error) {
      console.error('Error updating context:', error);
      throw error;
    }
  }

  /**
   * Merge new context with existing context
   * Requirement 8.4: Maintain a history of user interactions including intent and sentiment
   * Requirement 8.5: Persist user context across sessions
   */
  async mergeContext(userId: string, newContext: Partial<UserContext>): Promise<UserContext> {
    try {
      // Get current context
      const currentContext = await this.getContext(userId);
      
      // Get next version number
      const nextVersion = await getNextContextVersion(userId, this.contextTableName);
      
      // Merge contexts intelligently
      const mergedContext: UserContext = {
        ...currentContext,
        userId,
        version: nextVersion,
        lastUpdated: new Date()
      };
      
      // Merge profile if provided
      if (newContext.profile) {
        mergedContext.profile = {
          ...currentContext.profile,
          ...newContext.profile
        };
      }
      
      // Merge engagement history (append new records)
      if (newContext.engagementHistory && newContext.engagementHistory.length > 0) {
        mergedContext.engagementHistory = [
          ...currentContext.engagementHistory,
          ...newContext.engagementHistory
        ];
      }
      
      // Merge preferences
      if (newContext.preferences) {
        mergedContext.preferences = {
          ...currentContext.preferences,
          ...newContext.preferences
        };
        
        // Merge interests array (avoid duplicates)
        if (newContext.preferences.interests) {
          const existingInterests = new Set(currentContext.preferences.interests);
          newContext.preferences.interests.forEach(interest => existingInterests.add(interest));
          mergedContext.preferences.interests = Array.from(existingInterests);
        }
        
        // Merge communication preferences
        if (newContext.preferences.communicationPreferences) {
          mergedContext.preferences.communicationPreferences = {
            ...currentContext.preferences.communicationPreferences,
            ...newContext.preferences.communicationPreferences
          };
        }
      }
      
      // Update current flow if provided
      if (newContext.currentFlow) {
        mergedContext.currentFlow = newContext.currentFlow;
      }
      
      // Save merged context with new version
      return await saveUserContextToDb(userId, mergedContext, this.contextTableName, 'merge');
    } catch (error) {
      console.error('Error merging context:', error);
      throw error;
    }
  }

  /**
   * Get context history for a user
   * Requirement 8.4: Maintain a history of user interactions
   */
  async getContextHistory(userId: string, limit: number = 10): Promise<ContextVersion[]> {
    try {
      return await getContextHistoryFromDb(userId, this.contextTableName, limit);
    } catch (error) {
      console.error('Error getting context history:', error);
      throw error;
    }
  }

  /**
   * Add engagement record to user context
   * Helper method for recording user interactions
   */
  async addEngagementRecord(userId: string, record: EngagementRecord): Promise<UserContext> {
    try {
      return await this.mergeContext(userId, {
        engagementHistory: [record]
      });
    } catch (error) {
      console.error('Error adding engagement record:', error);
      throw error;
    }
  }

  /**
   * Update current flow state
   * Helper method for managing conversation flow
   */
  async updateFlowState(userId: string, flowState: FlowState): Promise<UserContext> {
    try {
      return await this.updateContext(userId, {
        currentFlow: flowState
      });
    } catch (error) {
      console.error('Error updating flow state:', error);
      throw error;
    }
  }

  /**
   * Clear current flow (when flow completes or is cancelled)
   */
  async clearFlowState(userId: string): Promise<UserContext> {
    try {
      const currentContext = await this.getContext(userId);
      const nextVersion = await getNextContextVersion(userId, this.contextTableName);
      
      const updatedContext: UserContext = {
        ...currentContext,
        currentFlow: undefined,
        version: nextVersion,
        lastUpdated: new Date()
      };
      
      return await saveUserContextToDb(userId, updatedContext, this.contextTableName, 'clear_flow');
    } catch (error) {
      console.error('Error clearing flow state:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const contextManagementService = new ContextManagementService();
