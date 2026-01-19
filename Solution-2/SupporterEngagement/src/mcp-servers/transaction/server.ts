/**
 * Transaction MCP Server
 * Implements Model Context Protocol for transaction and donation data access
 */

import { Transaction, DonationSummary, TransactionValidation } from '../../models';
import { rdsClient } from './rds-client';
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
 * Transaction MCP Server
 * Provides tools for accessing transaction and donation data
 */
export class TransactionMCPServer {
  private serverName = 'transaction';
  private version = '1.0.0';

  /**
   * Get server information
   */
  getServerInfo() {
    return {
      name: this.serverName,
      version: this.version,
      description: 'Transaction MCP Server - Provides access to transaction and donation data',
    };
  }

  /**
   * List available tools
   */
  listTools() {
    return [
      {
        name: 'get_recent_transactions',
        description: 'Retrieve recent transactions for a user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The unique identifier for the user',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of transactions to return (default: 10)',
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'validate_transaction',
        description: 'Validate a transaction by ID',
        inputSchema: {
          type: 'object',
          properties: {
            transactionId: {
              type: 'string',
              description: 'The unique identifier for the transaction',
            },
          },
          required: ['transactionId'],
        },
      },
      {
        name: 'get_donation_summary',
        description: 'Get donation summary and statistics for a user',
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
    ];
  }

  /**
   * Execute a tool
   */
  async executeTool(input: MCPToolInput): Promise<MCPToolResult> {
    logger.info('Executing MCP tool', { tool: input.name, arguments: input.arguments });

    try {
      switch (input.name) {
        case 'get_recent_transactions':
          return await this.getRecentTransactions(input.arguments as { userId: string; limit?: number });
        
        case 'validate_transaction':
          return await this.validateTransaction(input.arguments as { transactionId: string });
        
        case 'get_donation_summary':
          return await this.getDonationSummary(input.arguments as { userId: string });
        
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
   * Tool: get_recent_transactions
   */
  private async getRecentTransactions(args: { 
    userId: string; 
    limit?: number 
  }): Promise<MCPToolResult> {
    const { userId, limit = 10 } = args;

    if (!userId) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameter: userId',
        }],
        isError: true,
      };
    }

    const transactions = await rdsClient.getRecentTransactions(userId, limit);

    return {
      content: [{
        type: 'resource',
        resource: {
          userId,
          transactions,
          count: transactions.length,
        },
      }],
    };
  }

  /**
   * Tool: validate_transaction
   */
  private async validateTransaction(args: { 
    transactionId: string 
  }): Promise<MCPToolResult> {
    const { transactionId } = args;

    if (!transactionId) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameter: transactionId',
        }],
        isError: true,
      };
    }

    const validation = await rdsClient.validateTransaction(transactionId);

    if (!validation) {
      return {
        content: [{
          type: 'text',
          text: `Transaction not found: ${transactionId}`,
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'resource',
        resource: validation,
      }],
    };
  }

  /**
   * Tool: get_donation_summary
   */
  private async getDonationSummary(args: { 
    userId: string 
  }): Promise<MCPToolResult> {
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

    const summary = await rdsClient.getDonationSummary(userId);

    return {
      content: [{
        type: 'resource',
        resource: summary,
      }],
    };
  }
}

// Singleton instance
export const transactionMCPServer = new TransactionMCPServer();
