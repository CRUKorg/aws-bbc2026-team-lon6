/**
 * Research Papers MCP Server
 * Implements Model Context Protocol for research paper data access
 */

import { ResearchPaper } from '../../models';
import { s3Client } from './s3-client';
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
 * Research Papers MCP Server
 * Provides tools for accessing CRUK research papers
 */
export class ResearchPapersMCPServer {
  private serverName = 'research-papers';
  private version = '1.0.0';
  
  // Mock database for papers metadata (in production, this would be DynamoDB or RDS)
  private papersMetadata: Map<string, ResearchPaper> = new Map();

  constructor() {
    // Initialize with some mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock featured papers
    const mockPaper: ResearchPaper = {
      paperId: 'paper-001',
      title: 'Advances in Immunotherapy for Cancer Treatment',
      authors: ['Dr. Jane Smith', 'Dr. John Doe'],
      journal: 'Nature Medicine',
      publicationDate: new Date('2024-01-15'),
      abstract: 'This study explores novel immunotherapy approaches...',
      url: 'https://cruk.org/research/papers/paper-001',
      tags: ['immunotherapy', 'treatment', 'clinical-trial'],
      cancerTypes: ['breast-cancer', 'lung-cancer'],
      researchArea: 'Treatment',
      citations: 45,
      impactFactor: 8.5,
      isFeatured: true,
      fundedByCRUK: true,
      fundingAmount: 500000,
    };
    
    this.papersMetadata.set('paper-001', mockPaper);
  }

  /**
   * Get server information
   */
  getServerInfo() {
    return {
      name: this.serverName,
      version: this.version,
      description: 'Research Papers MCP Server - Provides access to CRUK research papers',
    };
  }

  /**
   * List available tools
   */
  listTools() {
    return [
      {
        name: 'search_research_papers',
        description: 'Search for research papers by query, tags, or cancer types',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for paper title or abstract',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by tags',
            },
            cancerTypes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by cancer types',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of papers to return (default: 10)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_featured_papers',
        description: 'Get featured research papers',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of papers to return (default: 5)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_paper',
        description: 'Get a specific research paper by ID',
        inputSchema: {
          type: 'object',
          properties: {
            paperId: {
              type: 'string',
              description: 'The unique identifier for the paper',
            },
          },
          required: ['paperId'],
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
        case 'search_research_papers':
          return await this.searchResearchPapers(input.arguments as any);
        
        case 'get_featured_papers':
          return await this.getFeaturedPapers(input.arguments as { limit?: number });
        
        case 'get_paper':
          return await this.getPaper(input.arguments as { paperId: string });
        
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
   * Tool: search_research_papers
   */
  private async searchResearchPapers(args: {
    query?: string;
    tags?: string[];
    cancerTypes?: string[];
    limit?: number;
  }): Promise<MCPToolResult> {
    const { query, tags, cancerTypes, limit = 10 } = args;

    logger.debug('Searching research papers', { query, tags, cancerTypes, limit });

    // In production, this would query a database
    // For now, filter mock data
    let results = Array.from(this.papersMetadata.values());

    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(paper => 
        paper.title.toLowerCase().includes(lowerQuery) ||
        paper.abstract.toLowerCase().includes(lowerQuery)
      );
    }

    if (tags && tags.length > 0) {
      results = results.filter(paper =>
        tags.some(tag => paper.tags.includes(tag))
      );
    }

    if (cancerTypes && cancerTypes.length > 0) {
      results = results.filter(paper =>
        cancerTypes.some(type => paper.cancerTypes.includes(type))
      );
    }

    results = results.slice(0, limit);

    return {
      content: [{
        type: 'resource',
        resource: {
          papers: results,
          count: results.length,
          query: { query, tags, cancerTypes },
        },
      }],
    };
  }

  /**
   * Tool: get_featured_papers
   */
  private async getFeaturedPapers(args: { limit?: number }): Promise<MCPToolResult> {
    const { limit = 5 } = args;

    logger.debug('Getting featured papers', { limit });

    // In production, query database for featured papers
    const featured = Array.from(this.papersMetadata.values())
      .filter(paper => paper.isFeatured)
      .slice(0, limit);

    return {
      content: [{
        type: 'resource',
        resource: {
          papers: featured,
          count: featured.length,
        },
      }],
    };
  }

  /**
   * Tool: get_paper
   */
  private async getPaper(args: { paperId: string }): Promise<MCPToolResult> {
    const { paperId } = args;

    if (!paperId) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameter: paperId',
        }],
        isError: true,
      };
    }

    logger.debug('Getting paper', { paperId });

    // Try to get from metadata first
    const paper = this.papersMetadata.get(paperId);

    if (!paper) {
      // Try S3 as fallback
      try {
        const s3Paper = await s3Client.getPaper(paperId);
        if (s3Paper) {
          return {
            content: [{
              type: 'resource',
              resource: s3Paper,
            }],
          };
        }
      } catch (error) {
        logger.warn('Paper not found in S3', { paperId });
      }

      return {
        content: [{
          type: 'text',
          text: `Research paper not found: ${paperId}`,
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'resource',
        resource: paper,
      }],
    };
  }
}

// Singleton instance
export const researchPapersMCPServer = new ResearchPapersMCPServer();
