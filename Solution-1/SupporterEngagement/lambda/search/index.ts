import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { KnowledgeArticle, ErrorResponse } from '../shared/types';
import { searchKnowledgeBase } from '../shared/data-access';

// Environment variables
const KNOWLEDGE_BASE_TABLE_NAME = process.env.KNOWLEDGE_BASE_TABLE_NAME || 'SupporterEngagement-KnowledgeBase';
const INTERACTION_TABLE_NAME = process.env.INTERACTION_TABLE_NAME || 'SupporterEngagement-Interactions';

/**
 * Search Request Interface
 */
interface SearchRequest {
  userId: string;
  query: string;
  filters?: {
    category?: string;
    tags?: string[];
    cancerTypes?: string[];
  };
  limit?: number;
}

/**
 * Search Response Interface
 */
interface SearchResponse {
  query: string;
  articles: KnowledgeArticle[];
  totalResults: number;
  source: string;
}

/**
 * Lambda handler for POST /search
 * 
 * Implements search functionality with knowledge base integration
 * Returns relevant CRUK pages and articles
 * Records search queries in user context
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Search Event:', JSON.stringify(event, null, 2));
  
  try {
    // Parse request body
    if (!event.body) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'MISSING_BODY',
          message: 'Request body is required',
          userMessage: 'Please provide search parameters',
          retryable: false
        }
      };
      
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(errorResponse)
      };
    }
    
    const request: SearchRequest = JSON.parse(event.body);
    
    // Validate required fields
    if (!request.userId || !request.query) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'MISSING_REQUIRED_FIELDS',
          message: 'userId and query are required',
          userMessage: 'Please provide a user ID and search query',
          retryable: false
        }
      };
      
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(errorResponse)
      };
    }
    
    // Requirement 11.2: Search knowledge base for relevant CRUK articles
    // Requirement 11.5: Only return results from verified CRUK knowledge sources
    const articles = await searchKnowledgeBase(
      KNOWLEDGE_BASE_TABLE_NAME,
      request.query,
      request.filters?.category,
      request.filters?.tags,
      request.filters?.cancerTypes,
      request.limit || 10
    );
    
    // Requirement 11.4: Record search query in user context
    await recordSearchQuery(request.userId, request.query, articles.length);
    
    // Requirement 11.3: Provide links to relevant CRUK pages and articles
    const response: SearchResponse = {
      query: request.query,
      articles,
      totalResults: articles.length,
      source: 'Cancer Research UK'
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error in search handler:', error);
    
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        userMessage: 'An error occurred while searching. Please try again later.',
        retryable: true
      }
    };
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(errorResponse)
    };
  }
};

/**
 * Record search query in user context
 * 
 * Requirement 11.4: Record search queries as part of User_Context
 */
async function recordSearchQuery(
  userId: string,
  query: string,
  resultsCount: number
): Promise<void> {
  try {
    const { recordInteraction } = await import('../shared/data-access.js');
    
    await recordInteraction(
      userId,
      'search' as any,
      INTERACTION_TABLE_NAME,
      {
        query,
        resultsCount,
        timestamp: new Date().toISOString()
      }
    );
    
    console.log(`Search query recorded for user ${userId}: ${query}`);
  } catch (error) {
    console.error('Error recording search query:', error);
    // Don't throw - this is non-critical
  }
}
