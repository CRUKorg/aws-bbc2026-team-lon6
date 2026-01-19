import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { createClient, RedisClientType } from 'redis';
import { UserContext, SessionContext, UserProfile, UserPreferences } from '../../models';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';

export class ContextManagementService {
  private dynamoClient: DynamoDBClient;
  private redisClient: RedisClientType | null = null;
  private tableName: string;
  private cacheEnabled: boolean;

  constructor() {
    this.dynamoClient = new DynamoDBClient({ region: config.aws.region });
    this.tableName = config.dynamodb.contextTable;
    this.cacheEnabled = false; // Disabled by default for demo

    if (this.cacheEnabled) {
      this.initializeRedis();
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: `redis://${config.redis.host}:${config.redis.port}`,
      });
      await this.redisClient.connect();
      logger.info('Redis client connected for context management');
    } catch (error) {
      logger.error('Failed to connect to Redis, continuing without cache', error as Error);
      this.cacheEnabled = false;
    }
  }

  /**
   * Get user context from cache or database
   */
  async getContext(userId: string): Promise<UserContext | null> {
    try {
      // Try cache first
      if (this.cacheEnabled && this.redisClient) {
        const cached = await this.redisClient.get(`context:${userId}`);
        if (cached) {
          logger.info(`Context cache hit for user ${userId}`);
          return JSON.parse(cached);
        }
      }

      // Fetch from DynamoDB using Query to get the latest version
      const command = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: marshall({
          ':userId': userId,
        }),
        ScanIndexForward: false, // Sort descending by version
        Limit: 1, // Get only the latest version
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Items || response.Items.length === 0) {
        return null;
      }

      const item = unmarshall(response.Items[0]);
      const context: UserContext = {
        userId: item.userId,
        profile: item.profile || this.createDefaultProfile(),
        preferences: item.preferences || this.createDefaultPreferences(),
        engagementHistory: item.engagementHistory || [],
        lastUpdated: new Date(item.lastUpdated),
        version: item.version || 1,
      };

      // Cache the result
      if (this.cacheEnabled && this.redisClient) {
        await this.redisClient.setEx(
          `context:${userId}`,
          300, // 5 minutes TTL
          JSON.stringify(context)
        );
      }

      return context;
    } catch (error) {
      logger.error(`Error getting context for user ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Update user context in database and cache
   */
  async updateContext(userId: string, context: Partial<UserContext>): Promise<void> {
    try {
      const existingContext = await this.getContext(userId);
      const updatedContext: UserContext = {
        userId,
        profile: context.profile || existingContext?.profile || this.createDefaultProfile(),
        preferences: context.preferences || existingContext?.preferences || this.createDefaultPreferences(),
        engagementHistory: context.engagementHistory || existingContext?.engagementHistory || [],
        lastUpdated: new Date(),
        version: (existingContext?.version || 0) + 1,
      };

      // Convert to serializable format (convert Date objects to ISO strings)
      const serializableContext = this.serializeContext(updatedContext);

      // Save to DynamoDB
      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(serializableContext, {
          removeUndefinedValues: true,
          convertClassInstanceToMap: true,
        }),
      });

      await this.dynamoClient.send(command);

      // Update cache
      if (this.cacheEnabled && this.redisClient) {
        await this.redisClient.setEx(
          `context:${userId}`,
          300, // 5 minutes TTL
          JSON.stringify(serializableContext)
        );
      }

      logger.info(`Context updated for user ${userId}`);
    } catch (error) {
      logger.error(`Error updating context for user ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Convert context to serializable format (Date objects to ISO strings)
   */
  private serializeContext(context: UserContext): any {
    return {
      ...context,
      lastUpdated: context.lastUpdated.toISOString(),
      profile: context.profile ? {
        ...context.profile,
        createdAt: context.profile.createdAt instanceof Date 
          ? context.profile.createdAt.toISOString() 
          : context.profile.createdAt,
        updatedAt: context.profile.updatedAt instanceof Date 
          ? context.profile.updatedAt.toISOString() 
          : context.profile.updatedAt,
        firstDonationDate: context.profile.firstDonationDate instanceof Date
          ? context.profile.firstDonationDate.toISOString()
          : context.profile.firstDonationDate,
        lastDonationDate: context.profile.lastDonationDate instanceof Date
          ? context.profile.lastDonationDate.toISOString()
          : context.profile.lastDonationDate,
        consentDate: context.profile.consentDate instanceof Date
          ? context.profile.consentDate.toISOString()
          : context.profile.consentDate,
      } : undefined,
      engagementHistory: context.engagementHistory.map(record => ({
        ...record,
        timestamp: record.timestamp instanceof Date 
          ? record.timestamp.toISOString() 
          : record.timestamp,
      })),
    };
  }

  /**
   * Merge new session context with existing context
   */
  async mergeContext(userId: string, updates: Partial<UserContext>): Promise<UserContext> {
    try {
      const existingContext = await this.getContext(userId);
      
      const updatedContext: UserContext = {
        userId,
        profile: updates.profile || existingContext?.profile || this.createDefaultProfile(),
        preferences: updates.preferences || existingContext?.preferences || this.createDefaultPreferences(),
        engagementHistory: updates.engagementHistory || existingContext?.engagementHistory || [],
        lastUpdated: new Date(),
        version: (existingContext?.version || 0) + 1,
      };

      await this.updateContext(userId, updatedContext);
      return updatedContext;
    } catch (error) {
      logger.error(`Error merging context for user ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Get context history for a user
   */
  async getContextHistory(userId: string, limit: number = 10): Promise<UserContext[]> {
    try {
      // For now, return the current context as a single-item array
      // In a production system, you'd query a separate history table
      const currentContext = await this.getContext(userId);
      return currentContext ? [currentContext] : [];
    } catch (error) {
      logger.error(`Error getting context history for user ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Clear context cache for a user
   */
  async clearCache(userId: string): Promise<void> {
    if (this.cacheEnabled && this.redisClient) {
      await this.redisClient.del(`context:${userId}`);
      logger.info(`Cache cleared for user ${userId}`);
    }
  }

  /**
   * Create default user profile
   */
  private createDefaultProfile(): UserProfile {
    return {
      userId: '',
      email: '',
      name: '',
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
      createdAt: new Date(),
      updatedAt: new Date(),
      consentGiven: false,
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
        preferredFrequency: 'monthly',
      },
      interests: [],
    };
  }

  /**
   * Create default user preferences
   */
  private createDefaultPreferences(): UserPreferences {
    return {
      preferredTopics: [],
      preferredCancerTypes: [],
      notificationSettings: {
        email: true,
        sms: false,
        push: false,
      },
    };
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}
