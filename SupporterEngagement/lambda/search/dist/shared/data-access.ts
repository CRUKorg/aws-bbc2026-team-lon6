import { DynamoDBDocumentClient, QueryCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, convertDatesToObjects } from './dynamodb-utils';
import { 
  Donation, 
  DonationSummary, 
  ResearchPaper, 
  KnowledgeArticle,
  EngagementRecord 
} from './types';

/**
 * Get recent transactions (donations) for a user
 * @param userId - User ID
 * @param tableName - DynamoDB table name for donations
 * @param limit - Maximum number of transactions to return (default: 10)
 * @returns Array of recent donations
 */
export async function getRecentTransactions(
  userId: string,
  tableName: string,
  limit: number = 10
): Promise<Donation[]> {
  try {
    const response = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false, // Sort by most recent first
      Limit: limit
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
    console.error('Error retrieving recent transactions:', error);
    throw error;
  }
}

/**
 * Get donation summary for a user
 * @param userId - User ID
 * @param tableName - DynamoDB table name for donations
 * @returns Donation summary with totals and statistics
 */
export async function getDonationSummary(
  userId: string,
  tableName: string
): Promise<DonationSummary> {
  try {
    // Query all donations for the user
    const response = await docClient.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }));
    
    if (!response.Items || response.Items.length === 0) {
      return {
        userId,
        totalAmount: 0,
        transactionCount: 0,
        averageAmount: 0,
        recurringDonations: 0,
        lastDonationDate: undefined,
        suggestedNextAmount: 10 // Default suggestion
      };
    }
    
    const donations = response.Items as Donation[];
    
    // Calculate summary statistics
    const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
    const transactionCount = donations.length;
    const averageAmount = totalAmount / transactionCount;
    const recurringDonations = donations.filter(d => 
      d.directDebitFrequency && d.directDebitFrequency !== 'Single'
    ).length;
    
    // Find most recent donation date
    const sortedDonations = donations
      .filter(d => d.receivedDate)
      .sort((a, b) => {
        const dateA = typeof a.receivedDate === 'string' ? new Date(a.receivedDate) : a.receivedDate;
        const dateB = typeof b.receivedDate === 'string' ? new Date(b.receivedDate) : b.receivedDate;
        return dateB.getTime() - dateA.getTime();
      });
    
    const lastDonationDate = sortedDonations.length > 0 
      ? (typeof sortedDonations[0].receivedDate === 'string' 
          ? new Date(sortedDonations[0].receivedDate) 
          : sortedDonations[0].receivedDate)
      : undefined;
    
    // Calculate suggested next amount (round up average to nearest 5)
    const suggestedNextAmount = Math.ceil(averageAmount / 5) * 5;
    
    return {
      userId,
      totalAmount,
      transactionCount,
      averageAmount,
      recurringDonations,
      lastDonationDate,
      suggestedNextAmount: Math.max(suggestedNextAmount, 10) // Minimum £10
    };
  } catch (error) {
    console.error('Error calculating donation summary:', error);
    throw error;
  }
}

/**
 * Search research papers by query, tags, or cancer types
 * @param tableName - DynamoDB table name for research papers
 * @param query - Optional search query for title/abstract
 * @param tags - Optional array of tags to filter by
 * @param cancerTypes - Optional array of cancer types to filter by
 * @param limit - Maximum number of papers to return (default: 10)
 * @returns Array of research papers matching the criteria
 */
export async function searchResearchPapers(
  tableName: string,
  query?: string,
  tags?: string[],
  cancerTypes?: string[],
  limit: number = 10
): Promise<ResearchPaper[]> {
  try {
    // For now, use Scan (in production, consider using GSI for better performance)
    const response = await docClient.send(new ScanCommand({
      TableName: tableName,
      Limit: limit * 2 // Get more items to filter
    }));
    
    if (!response.Items || response.Items.length === 0) {
      return [];
    }
    
    let papers = response.Items.map(item => {
      const dateFields = ['publicationDate'];
      return convertDatesToObjects(item as any, dateFields) as ResearchPaper;
    });
    
    // Apply filters
    if (query) {
      const lowerQuery = query.toLowerCase();
      papers = papers.filter(paper => 
        paper.title.toLowerCase().includes(lowerQuery) ||
        paper.abstract.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (tags && tags.length > 0) {
      papers = papers.filter(paper => 
        paper.tags.some(tag => tags.includes(tag))
      );
    }
    
    if (cancerTypes && cancerTypes.length > 0) {
      papers = papers.filter(paper => 
        paper.cancerTypes.some(type => cancerTypes.includes(type))
      );
    }
    
    // Return limited results
    return papers.slice(0, limit);
  } catch (error) {
    console.error('Error searching research papers:', error);
    throw error;
  }
}

/**
 * Get featured research papers
 * @param tableName - DynamoDB table name for research papers
 * @param limit - Maximum number of papers to return (default: 5)
 * @returns Array of featured research papers
 */
export async function getFeaturedPapers(
  tableName: string,
  limit: number = 5
): Promise<ResearchPaper[]> {
  try {
    const response = await docClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: 'isFeatured = :featured',
      ExpressionAttributeValues: {
        ':featured': true
      },
      Limit: limit
    }));
    
    if (!response.Items || response.Items.length === 0) {
      return [];
    }
    
    const dateFields = ['publicationDate'];
    return response.Items.map(item => 
      convertDatesToObjects(item as any, dateFields) as ResearchPaper
    );
  } catch (error) {
    console.error('Error retrieving featured papers:', error);
    throw error;
  }
}

/**
 * Search knowledge base articles
 * @param tableName - DynamoDB table name for knowledge articles
 * @param query - Search query
 * @param category - Optional category filter
 * @param tags - Optional array of tags to filter by
 * @param cancerTypes - Optional array of cancer types to filter by
 * @param limit - Maximum number of articles to return (default: 10)
 * @returns Array of knowledge articles matching the criteria
 */
export async function searchKnowledgeBase(
  tableName: string,
  query: string,
  category?: string,
  tags?: string[],
  cancerTypes?: string[],
  limit: number = 10
): Promise<KnowledgeArticle[]> {
  try {
    // For now, use Scan (in production, consider using GSI or ElasticSearch)
    const response = await docClient.send(new ScanCommand({
      TableName: tableName,
      Limit: limit * 2 // Get more items to filter
    }));
    
    if (!response.Items || response.Items.length === 0) {
      return [];
    }
    
    let articles = response.Items.map(item => {
      const dateFields = ['publishedDate', 'lastUpdated'];
      return convertDatesToObjects(item as any, dateFields) as KnowledgeArticle;
    });
    
    // Apply search query filter
    const lowerQuery = query.toLowerCase();
    articles = articles.filter(article => 
      article.title.toLowerCase().includes(lowerQuery) ||
      article.summary.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery)
    );
    
    // Apply category filter
    if (category) {
      articles = articles.filter(article => article.category === category);
    }
    
    // Apply tags filter
    if (tags && tags.length > 0) {
      articles = articles.filter(article => 
        article.tags.some(tag => tags.includes(tag))
      );
    }
    
    // Apply cancer types filter
    if (cancerTypes && cancerTypes.length > 0) {
      articles = articles.filter(article => 
        article.cancerTypes.some(type => cancerTypes.includes(type))
      );
    }
    
    // Return limited results
    return articles.slice(0, limit);
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    throw error;
  }
}

/**
 * Record user interaction in DynamoDB
 * @param userId - User ID
 * @param interactionType - Type of interaction (donation, event, volunteer, etc.)
 * @param tableName - DynamoDB table name for interactions
 * @param metadata - Additional metadata about the interaction
 * @returns The created engagement record
 */
export async function recordInteraction(
  userId: string,
  interactionType: 'donation' | 'event' | 'volunteer' | 'fundraise' | 'campaign' | 'search' | 'page_visit' | 'info_request',
  tableName: string,
  metadata: Record<string, any> = {}
): Promise<EngagementRecord> {
  try {
    const recordId = `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();
    
    const record: EngagementRecord = {
      recordId,
      userId,
      type: interactionType as any,
      timestamp,
      metadata
    };
    
    // Add type-specific data from metadata
    if (metadata.donationAmount) {
      record.donationAmount = metadata.donationAmount;
    }
    if (metadata.eventName) {
      record.eventName = metadata.eventName;
    }
    if (metadata.campaignName) {
      record.campaignName = metadata.campaignName;
    }
    if (metadata.impactDescription) {
      record.impactDescription = metadata.impactDescription;
    }
    
    // Save to DynamoDB
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: {
        ...record,
        timestamp: timestamp.toISOString()
      }
    }));
    
    return record;
  } catch (error) {
    console.error('Error recording interaction:', error);
    throw error;
  }
}

/**
 * Record page visit
 * @param userId - User ID
 * @param pageUrl - URL of the page visited
 * @param tableName - DynamoDB table name for interactions
 * @param additionalMetadata - Additional metadata about the visit
 * @returns The created engagement record
 */
export async function recordPageVisit(
  userId: string,
  pageUrl: string,
  tableName: string,
  additionalMetadata: Record<string, any> = {}
): Promise<EngagementRecord> {
  try {
    return await recordInteraction(
      userId,
      'page_visit' as any,
      tableName,
      {
        pageUrl,
        ...additionalMetadata
      }
    );
  } catch (error) {
    console.error('Error recording page visit:', error);
    throw error;
  }
}
