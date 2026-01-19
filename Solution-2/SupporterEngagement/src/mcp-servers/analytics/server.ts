/**
 * Analytics MCP Server
 * Implements Model Context Protocol for analytics and interaction tracking
 */

import { Interaction, UserAnalytics, PageVisit } from '../../models';
import { logger } from '../../utils/logger';

export interface MCPToolInput {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: any;
  }>;
  isError?: boolean;
}

/**
 * Analytics MCP Server
 * Provides tools for tracking and retrieving user analytics
 */
export class AnalyticsMCPServer {
  private serverName = 'analytics';
  private version = '1.0.0';
  
  // Mock analytics storage (in production, this would be DynamoDB)
  private interactions: Map<string, Interaction[]> = new Map();
  private pageVisits: Map<string, PageVisit[]> = new Map();

  getServerInfo() {
    return {
      name: this.serverName,
      version: this.version,
      description: 'Analytics MCP Server - Provides analytics tracking and retrieval',
    };
  }

  listTools() {
    return [
      {
        name: 'record_interaction',
        description: 'Record a user interaction',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The unique identifier for the user',
            },
            interaction: {
              type: 'object',
              description: 'Interaction details (type, intent, sentiment, metadata)',
            },
          },
          required: ['userId', 'interaction'],
        },
      },
      {
        name: 'get_user_analytics',
        description: 'Get analytics summary for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The unique identifier for the user',
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'record_page_visit',
        description: 'Record a page visit',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The unique identifier for the user',
            },
            pageUrl: {
              type: 'string',
              description: 'The URL of the visited page',
            },
            timestamp: {
              type: 'string',
              description: 'Timestamp of the visit (ISO format)',
            },
          },
          required: ['userId', 'pageUrl', 'timestamp'],
        },
      },
    ];
  }

  async executeTool(input: MCPToolInput): Promise<MCPToolResult> {
    logger.info('Executing MCP tool', { tool: input.name, arguments: input.arguments });

    try {
      switch (input.name) {
        case 'record_interaction':
          return await this.recordInteraction(input.arguments as any);
        
        case 'get_user_analytics':
          return await this.getUserAnalytics(input.arguments as { userId: string });
        
        case 'record_page_visit':
          return await this.recordPageVisit(input.arguments as any);
        
        default:
          return {
            content: [{
              type: 'text',
              text: `Unknown tool: ${input.name}`,
            }],
            isError: true,
          };
      }
    } catch (error) {
      logger.error('Error executing MCP tool', error as Error, { tool: input.name });
      return {
        content: [{
          type: 'text',
          text: `Error executing tool: ${(error as Error).message}`,
        }],
        isError: true,
      };
    }
  }

  private async recordInteraction(args: {
    userId: string;
    interaction: Partial<Interaction>;
  }): Promise<MCPToolResult> {
    const { userId, interaction } = args;

    if (!userId || !interaction) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameters: userId and interaction',
        }],
        isError: true,
      };
    }

    logger.debug('Recording interaction', { userId, interaction });

    // Create full interaction record
    const fullInteraction: Interaction = {
      interactionId: `int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: interaction.type || 'view',
      timestamp: interaction.timestamp || new Date(),
      intent: interaction.intent,
      sentiment: interaction.sentiment,
      metadata: interaction.metadata || {},
    };

    // Store interaction
    const userInteractions = this.interactions.get(userId) || [];
    userInteractions.push(fullInteraction);
    this.interactions.set(userId, userInteractions);

    logger.info('Interaction recorded', { 
      userId, 
      interactionId: fullInteraction.interactionId 
    });

    return {
      content: [{
        type: 'resource',
        resource: {
          success: true,
          interactionId: fullInteraction.interactionId,
        },
      }],
    };
  }

  private async getUserAnalytics(args: { userId: string }): Promise<MCPToolResult> {
    const { userId } = args;

    if (!userId) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameter: userId',
        }],
        isError: true,
      };
    }

    logger.debug('Getting user analytics', { userId });

    const interactions = this.interactions.get(userId) || [];
    const visits = this.pageVisits.get(userId) || [];

    // Calculate analytics
    const intentCounts: Record<string, number> = {};
    let totalSentiment = 0;
    let sentimentCount = 0;

    interactions.forEach(interaction => {
      if (interaction.intent) {
        intentCounts[interaction.intent] = (intentCounts[interaction.intent] || 0) + 1;
      }
      if (interaction.sentiment) {
        const sentimentValue = 
          interaction.sentiment === 'positive' ? 1 :
          interaction.sentiment === 'negative' ? -1 : 0;
        totalSentiment += sentimentValue;
        sentimentCount++;
      }
    });

    const mostCommonIntent = Object.entries(intentCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'unknown';

    const analytics: UserAnalytics = {
      userId,
      totalInteractions: interactions.length,
      lastInteractionDate: interactions[interactions.length - 1]?.timestamp || new Date(),
      mostCommonIntent,
      averageSentiment: sentimentCount > 0 ? totalSentiment / sentimentCount : 0,
      pageVisits: visits,
      searchQueries: interactions
        .filter(i => i.type === 'search')
        .map(i => i.metadata?.query)
        .filter(Boolean) as string[],
    };

    return {
      content: [{
        type: 'resource',
        resource: analytics,
      }],
    };
  }

  private async recordPageVisit(args: {
    userId: string;
    pageUrl: string;
    timestamp: string;
  }): Promise<MCPToolResult> {
    const { userId, pageUrl, timestamp } = args;

    if (!userId || !pageUrl || !timestamp) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameters: userId, pageUrl, and timestamp',
        }],
        isError: true,
      };
    }

    logger.debug('Recording page visit', { userId, pageUrl });

    const visit: PageVisit = {
      pageUrl,
      timestamp: new Date(timestamp),
    };

    const userVisits = this.pageVisits.get(userId) || [];
    userVisits.push(visit);
    this.pageVisits.set(userId, userVisits);

    logger.info('Page visit recorded', { userId, pageUrl });

    return {
      content: [{
        type: 'resource',
        resource: {
          success: true,
        },
      }],
    };
  }
}

export const analyticsMCPServer = new AnalyticsMCPServer();
