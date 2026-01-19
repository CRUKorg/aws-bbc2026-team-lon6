/**
 * User Profile MCP Server
 * Implements Model Context Protocol for user profile data access
 */

import { UserProfile, EngagementRecord } from '../../models';
import { dynamoDBClient } from './dynamodb-client';
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
 * User Profile MCP Server
 * Provides tools for accessing and managing user profile data
 */
export class UserProfileMCPServer {
  private serverName = 'user-profile';
  private version = '1.0.0';

  /**
   * Get server information
   */
  getServerInfo() {
    return {
      name: this.serverName,
      version: this.version,
      description: 'User Profile MCP Server - Provides access to user profile and engagement data',
    };
  }

  /**
   * List available tools
   */
  listTools() {
    return [
      {
        name: 'get_user_profile',
        description: 'Retrieve user profile by userId',
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
        name: 'update_user_profile',
        description: 'Update user profile fields',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The unique identifier for the user',
            },
            updates: {
              type: 'object',
              description: 'Fields to update in the user profile',
            },
          },
          required: ['userId', 'updates'],
        },
      },
      {
        name: 'get_engagement_history',
        description: 'Retrieve engagement history for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The unique identifier for the user',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of records to return (default: 50)',
            },
          },
          required: ['userId'],
        },
      },
    ];
  }

  /**
   * Execute a tool
   */
  async executeTool(input: MCPToolInput): Promise<MCPToolResult> {
    logger.info('Executing MCP tool', { tool: input.name, arguments: input.arguments });

    try {
      switch (input.name) {
        case 'get_user_profile':
          return await this.getUserProfile(input.arguments as { userId: string });
        
        case 'update_user_profile':
          return await this.updateUserProfile(input.arguments as { userId: string; updates: Record<string, any> });
        
        case 'get_engagement_history':
          return await this.getEngagementHistory(input.arguments as { userId: string; limit?: number });
        
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

  /**
   * Tool: get_user_profile
   */
  private async getUserProfile(args: { userId: string }): Promise<MCPToolResult> {
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

    const profile = await dynamoDBClient.getUserProfile(userId);

    if (!profile) {
      return {
        content: [{
          type: 'text',
          text: `User profile not found for userId: ${userId}`,
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'resource',
        resource: profile,
      }],
    };
  }

  /**
   * Tool: update_user_profile
   */
  private async updateUserProfile(args: { 
    userId: string; 
    updates: Record<string, any> 
  }): Promise<MCPToolResult> {
    const { userId, updates } = args;

    if (!userId || !updates) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameters: userId and updates',
        }],
        isError: true,
      };
    }

    // Validate that user exists first
    const existingProfile = await dynamoDBClient.getUserProfile(userId);
    if (!existingProfile) {
      return {
        content: [{
          type: 'text',
          text: `User profile not found for userId: ${userId}`,
        }],
        isError: true,
      };
    }

    const updatedProfile = await dynamoDBClient.updateUserProfile(userId, updates);

    return {
      content: [{
        type: 'resource',
        resource: updatedProfile,
      }],
    };
  }

  /**
   * Tool: get_engagement_history
   */
  private async getEngagementHistory(args: { 
    userId: string; 
    limit?: number 
  }): Promise<MCPToolResult> {
    const { userId, limit = 50 } = args;

    if (!userId) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameter: userId',
        }],
        isError: true,
      };
    }

    const history = await dynamoDBClient.getEngagementHistory(userId, limit);

    return {
      content: [{
        type: 'resource',
        resource: {
          userId,
          engagementHistory: history,
          count: history.length,
        },
      }],
    };
  }
}

// Singleton instance
export const userProfileMCPServer = new UserProfileMCPServer();
