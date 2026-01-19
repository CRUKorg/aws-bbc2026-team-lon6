/**
 * DynamoDB Client Wrapper for User Profile MCP Server
 * Provides connection pooling and error handling for DynamoDB operations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  QueryCommand,
  UpdateCommand 
} from '@aws-sdk/lib-dynamodb';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';

class DynamoDBClientWrapper {
  private client: DynamoDBDocumentClient;
  private userProfilesTable: string;
  private engagementTable: string;

  constructor() {
    const baseClient = new DynamoDBClient({
      region: config.aws.region,
    });

    // Create document client with connection pooling
    this.client = DynamoDBDocumentClient.from(baseClient, {
      marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      },
      unmarshallOptions: {
        wrapNumbers: false,
      },
    });

    this.userProfilesTable = config.dynamodb.userProfilesTable;
    this.engagementTable = config.dynamodb.engagementTable;
  }

  /**
   * Get user profile by userId
   */
  async getUserProfile(userId: string): Promise<any | null> {
    try {
      logger.debug('Getting user profile', { userId });

      const command = new GetCommand({
        TableName: this.userProfilesTable,
        Key: { userId },
      });

      const response = await this.client.send(command);
      
      if (!response.Item) {
        logger.info('User profile not found', { userId });
        return null;
      }

      logger.debug('User profile retrieved', { userId });
      return response.Item;
    } catch (error) {
      logger.error('Error getting user profile', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Create or update user profile
   */
  async putUserProfile(profile: any): Promise<void> {
    try {
      logger.debug('Putting user profile', { userId: profile.userId });

      const command = new PutCommand({
        TableName: this.userProfilesTable,
        Item: {
          ...profile,
          updatedAt: new Date().toISOString(),
        },
      });

      await this.client.send(command);
      logger.info('User profile saved', { userId: profile.userId });
    } catch (error) {
      logger.error('Error putting user profile', error as Error, { userId: profile.userId });
      throw error;
    }
  }

  /**
   * Update specific fields in user profile
   */
  async updateUserProfile(userId: string, updates: Record<string, any>): Promise<any> {
    try {
      // Remove updatedAt from updates if present (we'll add it ourselves)
      const { updatedAt, ...cleanUpdates } = updates;
      
      logger.debug('Updating user profile', { userId, updates: cleanUpdates });

      // Build update expression
      const updateExpressions: string[] = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, any> = {};

      Object.keys(cleanUpdates).forEach((key, index) => {
        const placeholder = `#attr${index}`;
        const valuePlaceholder = `:val${index}`;
        updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
        expressionAttributeNames[placeholder] = key;
        expressionAttributeValues[valuePlaceholder] = cleanUpdates[key];
      });

      // Always update the updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeNames['#updatedAt'] = 'updatedAt';
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();

      const command = new UpdateCommand({
        TableName: this.userProfilesTable,
        Key: { userId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      });

      const response = await this.client.send(command);
      logger.info('User profile updated', { userId });
      return response.Attributes;
    } catch (error) {
      logger.error('Error updating user profile', error as Error, { userId });
      throw error;
    }
  }

  /**
   * Get engagement history for a user
   */
  async getEngagementHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      logger.debug('Getting engagement history', { userId, limit });

      const command = new QueryCommand({
        TableName: this.engagementTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        ScanIndexForward: false, // Sort by timestamp descending
        Limit: limit,
      });

      const response = await this.client.send(command);
      logger.debug('Engagement history retrieved', { 
        userId, 
        count: response.Items?.length || 0 
      });

      return response.Items || [];
    } catch (error) {
      logger.error('Error getting engagement history', error as Error, { userId });
      throw error;
    }
  }
}

// Singleton instance
export const dynamoDBClient = new DynamoDBClientWrapper();
