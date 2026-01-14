import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { UserProfile, Donation, UserContext, ContextVersion, SessionContext } from './types';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(client);

/**
 * Convert DynamoDB item date strings to Date objects
 */
export function convertDatesToObjects<T extends Record<string, any>>(item: T, dateFields: string[]): T {
  const converted: any = { ...item };
  for (const field of dateFields) {
    if (converted[field] && typeof converted[field] === 'string') {
      converted[field] = new Date(converted[field]);
    }
  }
  return converted as T;
}

/**
 * Retrieve user profile from DynamoDB
 */
export async function getUserProfileFromDb(userId: string, tableName: string): Promise<UserProfile | null> {
  try {
    const response = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { userId }
    }));
    
    if (!response.Item) {
      return null;
    }
    
    // Convert date strings back to Date objects
    const dateFields = ['createdAt', 'updatedAt', 'consentDate', 'firstDonationDate', 'lastDonationDate'];
    return convertDatesToObjects(response.Item as any, dateFields) as UserProfile;
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    throw error;
  }
}

/**
 * Retrieve donation history for a user
 */
export async function getDonationHistoryFromDb(userId: string, tableName: string): Promise<Donation[]> {
  try {
    const response = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false // Sort by most recent first
    }));
    
    if (!response.Items || response.Items.length === 0) {
      return [];
    }
    
    // Convert date strings back to Date objects
    const dateFields = ['receivedDate', 'paymentDate', 'createdAt', 'updatedAt', 'directDebitStartDate'];
    return response.Items.map(item => 
      convertDatesToObjects(item as any, dateFields) as Donation
    );
  } catch (error) {
    console.error('Error retrieving donation history:', error);
    throw error;
  }
}

/**
 * Retrieve user context from DynamoDB (latest version)
 */
export async function getUserContextFromDb(userId: string, tableName: string): Promise<UserContext | null> {
  try {
    // Query for the latest version (descending order)
    const response = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Sort by version descending
      Limit: 1
    }));
    
    if (!response.Items || response.Items.length === 0) {
      return null;
    }
    
    // Convert date strings back to Date objects
    const dateFields = ['lastUpdated'];
    const item = convertDatesToObjects(response.Items[0] as any, dateFields);
    
    // Parse nested profile dates if present
    if (item.profile) {
      const profileDateFields = ['createdAt', 'updatedAt', 'consentDate', 'firstDonationDate', 'lastDonationDate'];
      item.profile = convertDatesToObjects(item.profile, profileDateFields);
    }
    
    // Parse engagement history dates if present
    if (item.engagementHistory && Array.isArray(item.engagementHistory)) {
      item.engagementHistory = item.engagementHistory.map((record: any) => 
        convertDatesToObjects(record, ['timestamp'])
      );
    }
    
    return item as UserContext;
  } catch (error) {
    console.error('Error retrieving user context:', error);
    throw error;
  }
}

/**
 * Save user context to DynamoDB with versioning
 */
export async function saveUserContextToDb(
  userId: string, 
  context: UserContext, 
  tableName: string,
  source: string = 'system'
): Promise<UserContext> {
  try {
    // Ensure version is set
    const version = context.version || 1;
    const timestamp = new Date();
    
    const contextToSave = {
      ...context,
      userId,
      version,
      lastUpdated: timestamp.toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: contextToSave
    }));
    
    return {
      ...contextToSave,
      lastUpdated: timestamp
    };
  } catch (error) {
    console.error('Error saving user context:', error);
    throw error;
  }
}

/**
 * Get context history for a user
 */
export async function getContextHistoryFromDb(
  userId: string, 
  tableName: string, 
  limit: number = 10
): Promise<ContextVersion[]> {
  try {
    const response = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Sort by version descending
      Limit: limit
    }));
    
    if (!response.Items || response.Items.length === 0) {
      return [];
    }
    
    // Convert to ContextVersion format
    return response.Items.map(item => {
      const dateFields = ['lastUpdated'];
      const convertedItem = convertDatesToObjects(item as any, dateFields);
      
      return {
        version: convertedItem.version,
        context: convertedItem as UserContext,
        timestamp: convertedItem.lastUpdated,
        source: 'system' // Default source, can be enhanced later
      } as ContextVersion;
    });
  } catch (error) {
    console.error('Error retrieving context history:', error);
    throw error;
  }
}

/**
 * Get the next version number for a user's context
 */
export async function getNextContextVersion(userId: string, tableName: string): Promise<number> {
  try {
    const response = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Sort by version descending
      Limit: 1,
      ProjectionExpression: 'version'
    }));
    
    if (!response.Items || response.Items.length === 0) {
      return 1; // First version
    }
    
    return (response.Items[0].version as number) + 1;
  } catch (error) {
    console.error('Error getting next context version:', error);
    throw error;
  }
}

/**
 * Save session context to DynamoDB
 */
export async function saveSessionContextToDb(
  sessionId: string,
  session: SessionContext,
  tableName: string
): Promise<SessionContext> {
  try {
    const sessionToSave = {
      ...session,
      sessionId,
      startTime: session.startTime.toISOString(),
      lastActivityTime: session.lastActivityTime.toISOString(),
      messages: session.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }))
    };
    
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: sessionToSave
    }));
    
    return session;
  } catch (error) {
    console.error('Error saving session context:', error);
    throw error;
  }
}

/**
 * Retrieve session context from DynamoDB
 */
export async function getSessionContextFromDb(
  sessionId: string,
  tableName: string
): Promise<SessionContext | null> {
  try {
    const response = await docClient.send(new GetCommand({
      TableName: tableName,
      Key: { sessionId }
    }));
    
    if (!response.Item) {
      return null;
    }
    
    // Convert date strings back to Date objects
    const item = response.Item as any;
    
    return {
      ...item,
      startTime: new Date(item.startTime),
      lastActivityTime: new Date(item.lastActivityTime),
      messages: item.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })),
      cachedProfile: item.cachedProfile ? convertDatesToObjects(
        item.cachedProfile,
        ['createdAt', 'updatedAt', 'consentDate', 'firstDonationDate', 'lastDonationDate']
      ) : undefined,
      cachedContext: item.cachedContext ? {
        ...item.cachedContext,
        lastUpdated: new Date(item.cachedContext.lastUpdated),
        profile: convertDatesToObjects(
          item.cachedContext.profile,
          ['createdAt', 'updatedAt', 'consentDate', 'firstDonationDate', 'lastDonationDate']
        )
      } : undefined
    } as SessionContext;
  } catch (error) {
    console.error('Error retrieving session context:', error);
    throw error;
  }
}
