/**
 * Knowledge Base MCP Server
 * Implements Model Context Protocol for CRUK knowledge base access
 */

import { KnowledgeArticle, SearchFilters } from '../../models';
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
 * Knowledge Base MCP Server
 * Provides tools for accessing CRUK knowledge base articles
 */
export class KnowledgeBaseMCPServer {
  private serverName = 'knowledge-base';
  private version = '1.0.0';
  
  // Mock knowledge base (in production, this would be a database)
  private articles: Map<string, KnowledgeArticle> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    const mockArticles: KnowledgeArticle[] = [
      {
        articleId: 'article-001',
        title: 'Understanding Breast Cancer',
        summary: 'Comprehensive guide to breast cancer symptoms, diagnosis, and treatment options.',
        content: 'Breast cancer is the most common cancer in the UK. Learn about symptoms, risk factors, and treatment options.',
        url: 'https://www.cancerresearchuk.org/about-cancer/breast-cancer',
        category: 'Cancer Types',
        tags: ['breast-cancer', 'symptoms', 'treatment'],
        cancerTypes: ['breast-cancer'],
        publishedDate: new Date('2024-01-01'),
        lastUpdated: new Date('2024-01-10'),
        author: 'CRUK Medical Team',
        readingLevel: 'basic',
        availableLanguages: ['en'],
      },
      {
        articleId: 'article-002',
        title: 'Cancer Screening: What You Need to Know',
        summary: 'Information about NHS cancer screening programmes and eligibility.',
        content: 'Regular screening can help detect cancer early when treatment is most effective.',
        url: 'https://www.cancerresearchuk.org/about-cancer/screening',
        category: 'Prevention',
        tags: ['screening', 'prevention', 'early-detection'],
        cancerTypes: ['breast-cancer', 'cervical-cancer', 'bowel-cancer'],
        publishedDate: new Date('2024-01-05'),
        lastUpdated: new Date('2024-01-12'),
        author: 'CRUK Medical Team',
        readingLevel: 'basic',
        availableLanguages: ['en'],
      },
      {
        articleId: 'article-003',
        title: 'Living with Cancer: Support and Resources',
        summary: 'Practical advice and support resources for people living with cancer.',
        content: 'Living with cancer can be challenging. Find support services, practical advice, and resources for patients and families.',
        url: 'https://www.cancerresearchuk.org/about-cancer/coping',
        category: 'Support',
        tags: ['support', 'coping', 'resources'],
        cancerTypes: [],
        publishedDate: new Date('2024-01-08'),
        lastUpdated: new Date('2024-01-15'),
        author: 'CRUK Support Team',
        readingLevel: 'basic',
        availableLanguages: ['en'],
      },
      {
        articleId: 'article-004',
        title: 'Ways to Support Cancer Research UK',
        summary: 'Discover the many ways you can help fund life-saving cancer research.',
        content: 'From donations to fundraising, volunteering to campaigning - find out how you can support our mission to beat cancer.',
        url: 'https://www.cancerresearchuk.org/get-involved',
        category: 'Get Involved',
        tags: ['support', 'donate', 'fundraise', 'volunteer'],
        cancerTypes: [],
        publishedDate: new Date('2024-01-10'),
        lastUpdated: new Date('2024-01-18'),
        author: 'CRUK Fundraising Team',
        readingLevel: 'basic',
        availableLanguages: ['en'],
      },
      {
        articleId: 'article-005',
        title: 'Donate to Cancer Research',
        summary: 'Your donation funds life-saving research. Learn how your support makes a difference.',
        content: 'Every donation helps fund vital research into preventing, diagnosing and treating cancer. See how your support saves lives.',
        url: 'https://www.cancerresearchuk.org/donate',
        category: 'Get Involved',
        tags: ['donate', 'support', 'research-funding'],
        cancerTypes: [],
        publishedDate: new Date('2024-01-12'),
        lastUpdated: new Date('2024-01-20'),
        author: 'CRUK Fundraising Team',
        readingLevel: 'basic',
        availableLanguages: ['en'],
      },
      {
        articleId: 'article-006',
        title: 'Breast Cancer Research Breakthroughs',
        summary: 'Latest advances in breast cancer research funded by Cancer Research UK.',
        content: 'Discover the latest breakthroughs in breast cancer research, from new treatments to early detection methods.',
        url: 'https://www.cancerresearchuk.org/about-cancer/breast-cancer/research',
        category: 'Research',
        tags: ['breast-cancer', 'research', 'breakthroughs'],
        cancerTypes: ['breast-cancer'],
        publishedDate: new Date('2024-01-15'),
        lastUpdated: new Date('2024-01-22'),
        author: 'CRUK Research Team',
        readingLevel: 'intermediate',
        availableLanguages: ['en'],
      },
      {
        articleId: 'article-007',
        title: 'Support Services for Cancer Patients and Families',
        summary: 'Find emotional, practical and financial support for people affected by cancer.',
        content: 'We provide support services including counseling, financial advice, and practical help for cancer patients and their families.',
        url: 'https://www.cancerresearchuk.org/about-cancer/coping/support-services',
        category: 'Support',
        tags: ['support', 'services', 'families', 'counseling'],
        cancerTypes: [],
        publishedDate: new Date('2024-01-18'),
        lastUpdated: new Date('2024-01-25'),
        author: 'CRUK Support Team',
        readingLevel: 'basic',
        availableLanguages: ['en'],
      },
    ];

    mockArticles.forEach(article => {
      this.articles.set(article.articleId, article);
    });
  }

  getServerInfo() {
    return {
      name: this.serverName,
      version: this.version,
      description: 'Knowledge Base MCP Server - Provides access to CRUK knowledge base articles',
    };
  }

  listTools() {
    return [
      {
        name: 'search_knowledge_base',
        description: 'Search knowledge base articles by query and filters',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for article title or content',
            },
            filters: {
              type: 'object',
              description: 'Optional filters (category, tags, cancerTypes, readingLevel)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_article',
        description: 'Get a specific article by ID',
        inputSchema: {
          type: 'object',
          properties: {
            articleId: {
              type: 'string',
              description: 'The unique identifier for the article',
            },
          },
          required: ['articleId'],
        },
      },
      {
        name: 'get_related_articles',
        description: 'Get articles related to a specific article',
        inputSchema: {
          type: 'object',
          properties: {
            articleId: {
              type: 'string',
              description: 'The unique identifier for the article',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of related articles to return (default: 5)',
            },
          },
          required: ['articleId'],
        },
      },
    ];
  }

  async executeTool(input: MCPToolInput): Promise<MCPToolResult> {
    logger.info('Executing MCP tool', { tool: input.name, arguments: input.arguments });

    try {
      switch (input.name) {
        case 'search_knowledge_base':
          return await this.searchKnowledgeBase(input.arguments as any);
        
        case 'get_article':
          return await this.getArticle(input.arguments as { articleId: string });
        
        case 'get_related_articles':
          return await this.getRelatedArticles(input.arguments as any);
        
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

  private async searchKnowledgeBase(args: {
    query: string;
    filters?: SearchFilters;
  }): Promise<MCPToolResult> {
    const { query, filters } = args;

    if (!query) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameter: query',
        }],
        isError: true,
      };
    }

    logger.debug('Searching knowledge base', { query, filters });

    // Filter articles based on query and filters
    let results = Array.from(this.articles.values());
    const lowerQuery = query.toLowerCase();

    // Text search
    results = results.filter(article =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.summary.toLowerCase().includes(lowerQuery) ||
      article.content.toLowerCase().includes(lowerQuery)
    );

    // Apply filters
    if (filters?.category) {
      results = results.filter(a => a.category === filters.category);
    }
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter(a =>
        filters.tags!.some(tag => a.tags.includes(tag))
      );
    }
    if (filters?.cancerTypes && filters.cancerTypes.length > 0) {
      results = results.filter(a =>
        filters.cancerTypes!.some(type => a.cancerTypes.includes(type))
      );
    }
    if (filters?.readingLevel) {
      results = results.filter(a => a.readingLevel === filters.readingLevel);
    }

    // Verify all results are from CRUK sources
    results = results.filter(article =>
      article.url.includes('cancerresearchuk.org')
    );

    return {
      content: [{
        type: 'resource',
        resource: {
          articles: results,
          count: results.length,
          query,
          filters,
          source: 'CRUK Knowledge Base',
        },
      }],
    };
  }

  private async getArticle(args: { articleId: string }): Promise<MCPToolResult> {
    const { articleId } = args;

    if (!articleId) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameter: articleId',
        }],
        isError: true,
      };
    }

    logger.debug('Getting article', { articleId });

    const article = this.articles.get(articleId);

    if (!article) {
      return {
        content: [{
          type: 'text',
          text: `Article not found: ${articleId}`,
        }],
        isError: true,
      };
    }

    // Verify article is from CRUK source
    if (!article.url.includes('cancerresearchuk.org')) {
      logger.warn('Non-CRUK article detected', { articleId, url: article.url });
      return {
        content: [{
          type: 'text',
          text: 'Article source verification failed',
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'resource',
        resource: article,
      }],
    };
  }

  private async getRelatedArticles(args: {
    articleId: string;
    limit?: number;
  }): Promise<MCPToolResult> {
    const { articleId, limit = 5 } = args;

    if (!articleId) {
      return {
        content: [{
          type: 'text',
          text: 'Missing required parameter: articleId',
        }],
        isError: true,
      };
    }

    logger.debug('Getting related articles', { articleId, limit });

    const article = this.articles.get(articleId);

    if (!article) {
      return {
        content: [{
          type: 'text',
          text: `Article not found: ${articleId}`,
        }],
        isError: true,
      };
    }

    // Find related articles based on tags and cancer types
    const related = Array.from(this.articles.values())
      .filter(a => a.articleId !== articleId)
      .filter(a => {
        const sharedTags = a.tags.filter(tag => article.tags.includes(tag));
        const sharedTypes = a.cancerTypes.filter(type => article.cancerTypes.includes(type));
        return sharedTags.length > 0 || sharedTypes.length > 0 || a.category === article.category;
      })
      .slice(0, limit);

    return {
      content: [{
        type: 'resource',
        resource: {
          articleId,
          relatedArticles: related,
          count: related.length,
        },
      }],
    };
  }
}

export const knowledgeBaseMCPServer = new KnowledgeBaseMCPServer();
