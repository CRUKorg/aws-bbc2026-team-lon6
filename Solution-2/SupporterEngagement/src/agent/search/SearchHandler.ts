/**
 * Search Handler
 * Processes search queries and returns results from CRUK knowledge sources
 * Integrates with Knowledge Base MCP server and Context Management Service
 */

import { knowledgeBaseMCPServer } from '../../mcp-servers/knowledge-base/server';
import { ContextManagementService } from '../../services/context-management/ContextManagementService';
import { UserContext, UIComponent } from '../../models';
import { logger } from '../../utils/logger';

/**
 * Search result item
 */
export interface SearchResult {
  title: string;
  summary: string;
  url: string;
  relevanceScore: number;
  source: string;
  category?: string;
  isCRUKVerified: boolean;
}

/**
 * Search response
 */
export interface SearchResponse {
  success: boolean;
  query: string;
  results: SearchResult[];
  totalResults: number;
  uiComponents: UIComponent[];
  message?: string;
}

/**
 * Search Handler
 * Processes search queries and returns CRUK-verified results
 */
export class SearchHandler {
  private contextService: ContextManagementService;

  constructor(contextService: ContextManagementService) {
    this.contextService = contextService;
  }

  /**
   * Process search query (Req 12.2)
   */
  async search(query: string, context: UserContext): Promise<SearchResponse> {
    logger.info('Processing search query', {
      userId: context.userId,
      query,
    });

    try {
      // Validate query
      if (!query || query.trim().length === 0) {
        return {
          success: false,
          query,
          results: [],
          totalResults: 0,
          uiComponents: [],
          message: 'Please enter a search query',
        };
      }

      // Search Knowledge Base MCP server
      const searchResults = await this.searchKnowledgeBase(query);

      // Filter for CRUK-verified sources only (Req 12.5)
      const verifiedResults = this.filterCRUKSources(searchResults);

      // Format results with clickable links (Req 12.3)
      const formattedResults = this.formatResults(verifiedResults);

      // Record search query in context (Req 12.4)
      await this.recordSearchQuery(context.userId, query);

      // Generate UI components
      const uiComponents = this.createSearchResultsUI(query, formattedResults);

      logger.info('Search completed', {
        userId: context.userId,
        query,
        totalResults: formattedResults.length,
      });

      return {
        success: true,
        query,
        results: formattedResults,
        totalResults: formattedResults.length,
        uiComponents,
        message:
          formattedResults.length > 0
            ? `Found ${formattedResults.length} result(s) for "${query}"`
            : `No results found for "${query}". Try different keywords or browse our topics.`,
      };
    } catch (error) {
      logger.error('Error processing search', error as Error, {
        query,
        userId: context.userId,
      });

      return {
        success: false,
        query,
        results: [],
        totalResults: 0,
        uiComponents: [],
        message: 'Sorry, we encountered an error while searching. Please try again.',
      };
    }
  }

  /**
   * Search Knowledge Base MCP server
   */
  private async searchKnowledgeBase(query: string): Promise<any[]> {
    try {
      logger.debug('Searching knowledge base', { query });

      const response = await knowledgeBaseMCPServer.executeTool({
        name: 'search_articles',
        arguments: {
          query,
          limit: 20,
        },
      });

      if (response.content && response.content.length > 0) {
        const content = response.content[0];
        if (content.type === 'text' && content.text) {
          const data = JSON.parse(content.text);
          return data.articles || [];
        }
      }

      return [];
    } catch (error) {
      logger.error('Error searching knowledge base', error as Error, { query });
      return [];
    }
  }

  /**
   * Filter for CRUK-verified sources only (Req 12.5)
   */
  private filterCRUKSources(results: any[]): any[] {
    return results.filter((result) => {
      // Check if source is from CRUK domain
      const url = result.url || '';
      const isCRUKDomain =
        url.includes('cancerresearchuk.org') ||
        url.includes('cruk.org') ||
        result.source === 'CRUK' ||
        result.isCRUKVerified === true;

      if (!isCRUKDomain) {
        logger.debug('Filtering out non-CRUK source', {
          url,
          source: result.source,
        });
      }

      return isCRUKDomain;
    });
  }

  /**
   * Format search results with clickable links (Req 12.3)
   */
  private formatResults(results: any[]): SearchResult[] {
    return results.map((result) => ({
      title: result.title || 'Untitled',
      summary: result.summary || (result.content ? result.content.substring(0, 200) : ''),
      url: result.url || '',
      relevanceScore: result.relevanceScore || result.score || 0,
      source: result.source || 'CRUK',
      category: result.category || result.topic,
      isCRUKVerified: true, // All results are CRUK-verified after filtering
    }));
  }

  /**
   * Record search query in context (Req 12.4)
   */
  private async recordSearchQuery(userId: string, query: string): Promise<void> {
    try {
      logger.debug('Recording search query', { userId, query });

      // Update user context to include search query
      // In a real implementation, this would call contextService.updateContext
      // For now, we just log it
      logger.info('Search query recorded', { userId, query, timestamp: new Date().toISOString() });
    } catch (error) {
      logger.error('Error recording search query', error as Error, {
        userId,
        query,
      });
      // Don't fail the search if recording fails
    }
  }

  /**
   * Create search results UI component
   */
  private createSearchResultsUI(query: string, results: SearchResult[]): UIComponent[] {
    const components: UIComponent[] = [];

    // Always include search bar (Req 12.1)
    components.push({
      type: 'search_bar',
      data: {
        placeholder: 'what are you looking for today',
        alwaysVisible: true,
        currentQuery: query,
      },
    });

    // Add search results component
    if (results.length > 0) {
      components.push({
        type: 'search_results',
        data: {
          query,
          results: results.map((r) => ({
            title: r.title,
            summary: r.summary,
            url: r.url,
            relevanceScore: r.relevanceScore,
            category: r.category,
          })),
          totalResults: results.length,
        },
      });
    }

    return components;
  }

  /**
   * Get search suggestions based on user context
   */
  async getSearchSuggestions(context: UserContext): Promise<string[]> {
    const suggestions: string[] = [];

    // Suggest based on interests
    if (context.preferences.preferredTopics.length > 0) {
      suggestions.push(...context.preferences.preferredTopics.slice(0, 3));
    }

    // Suggest based on cancer types
    if (context.preferences.preferredCancerTypes.length > 0) {
      suggestions.push(
        ...context.preferences.preferredCancerTypes.map((type) => `${type} information`)
      );
    }

    // Add general suggestions
    if (suggestions.length < 5) {
      const general = [
        'cancer prevention',
        'latest research',
        'support services',
        'fundraising events',
        'volunteer opportunities',
      ];
      suggestions.push(...general.slice(0, 5 - suggestions.length));
    }

    logger.debug('Generated search suggestions', {
      userId: context.userId,
      suggestionsCount: suggestions.length,
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Get popular searches
   */
  async getPopularSearches(): Promise<string[]> {
    // In a real implementation, this would query analytics
    // For now, return common searches
    return [
      'breast cancer symptoms',
      'lung cancer treatment',
      'cancer prevention tips',
      'how to donate',
      'fundraising ideas',
      'volunteer opportunities',
      'latest research breakthroughs',
      'support for cancer patients',
    ];
  }
}
