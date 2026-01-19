/**
 * Information Seeking Flow Handler
 * Manages the information seeking flow for users looking for cancer information
 */

import { knowledgeBaseMCPServer } from '../../../mcp-servers/knowledge-base/server';
import { analyticsMCPServer } from '../../../mcp-servers/analytics/server';
import { UserContext, KnowledgeArticle } from '../../../models';
import { logger } from '../../../utils/logger';

/**
 * Information seeking flow state
 */
export enum InfoSeekingState {
  QUERY = 'query',
  RESULTS = 'results',
  VALIDATION = 'validation',
  FEEDBACK = 'feedback',
  RESUME_PROMPT = 'resume_prompt',
  COMPLETE = 'complete',
}

/**
 * Information seeking result
 */
export interface InfoSeekingResult {
  state: InfoSeekingState;
  articles: KnowledgeArticle[];
  message: string;
  requiresUserInput: boolean;
  canResumePersonalization: boolean;
}

/**
 * Feedback data
 */
export interface FeedbackData {
  hasEverythingNeeded: boolean;
  sentiment: 'positive' | 'negative' | 'neutral';
  feedbackText?: string;
}

/**
 * Information Seeking Flow Handler
 * Handles the complete information seeking flow from query to feedback
 */
export class InformationSeekingFlow {
  private currentState: InfoSeekingState;
  private context: UserContext;
  private query: string = '';
  private articles: KnowledgeArticle[] = [];
  private feedbackData?: FeedbackData;

  constructor(context: UserContext) {
    this.context = context;
    this.currentState = InfoSeekingState.QUERY;
    
    logger.info('InformationSeekingFlow initialized', {
      userId: context.userId,
      initialState: this.currentState,
    });
  }

  /**
   * Process a query and retrieve relevant articles
   */
  async processQuery(query: string): Promise<InfoSeekingResult> {
    logger.info('Processing information seeking query', {
      userId: this.context.userId,
      query,
    });

    this.query = query;
    this.currentState = InfoSeekingState.QUERY;

    try {
      // Search knowledge base using MCP server
      const searchResult = await knowledgeBaseMCPServer.executeTool({
        name: 'search_knowledge_base',
        arguments: {
          query,
          filters: this.buildSearchFilters(),
        },
      });

      if (searchResult.isError || !searchResult.content[0]?.resource) {
        logger.warn('Knowledge base search failed', {
          userId: this.context.userId,
          query,
        });

        return {
          state: InfoSeekingState.RESULTS,
          articles: [],
          message: this.generateNoResultsMessage(),
          requiresUserInput: true,
          canResumePersonalization: false,
        };
      }

      const searchData = searchResult.content[0].resource as any;
      this.articles = searchData.articles || [];

      // Verify all articles are from CRUK sources
      this.articles = this.verifyCRUKSources(this.articles);

      // Record the search in analytics
      await this.recordSearch(query, this.articles.length);

      this.currentState = InfoSeekingState.RESULTS;

      logger.info('Articles retrieved', {
        userId: this.context.userId,
        count: this.articles.length,
      });

      return {
        state: InfoSeekingState.RESULTS,
        articles: this.articles,
        message: this.generateResultsMessage(),
        requiresUserInput: true,
        canResumePersonalization: false,
      };
    } catch (error) {
      logger.error('Error processing query', error as Error, {
        userId: this.context.userId,
        query,
      });

      return {
        state: InfoSeekingState.RESULTS,
        articles: [],
        message: 'I encountered an issue searching for information. Could you try rephrasing your question?',
        requiresUserInput: true,
        canResumePersonalization: false,
      };
    }
  }

  /**
   * Validate if user has everything they need
   */
  async validateCompletion(hasEverything: boolean): Promise<InfoSeekingResult> {
    logger.info('Validating information completeness', {
      userId: this.context.userId,
      hasEverything,
    });

    this.currentState = InfoSeekingState.VALIDATION;

    if (!hasEverything) {
      // User needs more information
      return {
        state: InfoSeekingState.QUERY,
        articles: this.articles,
        message: 'What else would you like to know? I can help you find more information.',
        requiresUserInput: true,
        canResumePersonalization: false,
      };
    }

    // User has everything, move to feedback
    this.currentState = InfoSeekingState.FEEDBACK;

    return {
      state: InfoSeekingState.FEEDBACK,
      articles: this.articles,
      message: 'Great! Could you share a few words about how helpful this information was?',
      requiresUserInput: true,
      canResumePersonalization: false,
    };
  }

  /**
   * Collect user feedback
   */
  async collectFeedback(
    sentiment: 'positive' | 'negative' | 'neutral',
    feedbackText?: string
  ): Promise<InfoSeekingResult> {
    logger.info('Collecting user feedback', {
      userId: this.context.userId,
      sentiment,
      hasFeedbackText: !!feedbackText,
    });

    this.feedbackData = {
      hasEverythingNeeded: true,
      sentiment,
      feedbackText,
    };

    // Record feedback in analytics
    await this.recordFeedback(sentiment, feedbackText);

    this.currentState = InfoSeekingState.RESUME_PROMPT;

    return {
      state: InfoSeekingState.RESUME_PROMPT,
      articles: this.articles,
      message: this.generateResumePrompt(),
      requiresUserInput: true,
      canResumePersonalization: true,
    };
  }

  /**
   * Generate prompt to resume personalization flow
   */
  generateResumePrompt(): string {
    const userName = this.context.profile.name || 'there';
    
    return `Thank you for your feedback, ${userName}! ` +
           `I'm here to help you explore more about Cancer Research UK. ` +
           `Would you like to see your personalized dashboard and learn about ways you can support our mission?`;
  }

  /**
   * Get related articles for a specific article
   */
  async getRelatedArticles(articleId: string, limit: number = 3): Promise<KnowledgeArticle[]> {
    logger.info('Getting related articles', {
      userId: this.context.userId,
      articleId,
      limit,
    });

    try {
      const relatedResult = await knowledgeBaseMCPServer.executeTool({
        name: 'get_related_articles',
        arguments: {
          articleId,
          limit,
        },
      });

      if (relatedResult.isError || !relatedResult.content[0]?.resource) {
        logger.warn('Failed to get related articles', { articleId });
        return [];
      }

      const relatedData = relatedResult.content[0].resource as any;
      const relatedArticles = relatedData.relatedArticles || [];

      // Verify CRUK sources
      return this.verifyCRUKSources(relatedArticles);
    } catch (error) {
      logger.error('Error getting related articles', error as Error, { articleId });
      return [];
    }
  }

  /**
   * Get current state
   */
  getCurrentState(): InfoSeekingState {
    return this.currentState;
  }

  /**
   * Get current query
   */
  getCurrentQuery(): string {
    return this.query;
  }

  /**
   * Get retrieved articles
   */
  getArticles(): KnowledgeArticle[] {
    return this.articles;
  }

  /**
   * Get feedback data
   */
  getFeedback(): FeedbackData | undefined {
    return this.feedbackData;
  }

  /**
   * Check if flow is complete
   */
  isComplete(): boolean {
    return this.currentState === InfoSeekingState.COMPLETE;
  }

  /**
   * Mark flow as complete
   */
  complete(): void {
    this.currentState = InfoSeekingState.COMPLETE;
    logger.info('Information seeking flow completed', {
      userId: this.context.userId,
      query: this.query,
      articlesFound: this.articles.length,
    });
  }

  /**
   * Reset flow to initial state
   */
  reset(): void {
    this.currentState = InfoSeekingState.QUERY;
    this.query = '';
    this.articles = [];
    this.feedbackData = undefined;
    
    logger.info('Information seeking flow reset', {
      userId: this.context.userId,
    });
  }

  /**
   * Build search filters based on user context
   */
  private buildSearchFilters(): any {
    const filters: any = {};

    // Add cancer type filters if user has preferences
    if (this.context.preferences.preferredCancerTypes.length > 0) {
      filters.cancerTypes = this.context.preferences.preferredCancerTypes;
    }

    // Add topic filters if user has preferred topics
    if (this.context.preferences.preferredTopics.length > 0) {
      filters.tags = this.context.preferences.preferredTopics;
    }

    return filters;
  }

  /**
   * Verify all articles are from CRUK sources
   * Implements Requirement 5.1 and 5.6
   */
  private verifyCRUKSources(articles: KnowledgeArticle[]): KnowledgeArticle[] {
    const verified = articles.filter(article => {
      const isCRUK = article.url.includes('cancerresearchuk.org');
      
      if (!isCRUK) {
        logger.warn('Non-CRUK article filtered out', {
          articleId: article.articleId,
          url: article.url,
        });
      }
      
      return isCRUK;
    });

    logger.info('CRUK source verification complete', {
      totalArticles: articles.length,
      verifiedArticles: verified.length,
      filtered: articles.length - verified.length,
    });

    return verified;
  }

  /**
   * Generate results message
   */
  private generateResultsMessage(): string {
    const userName = this.context.profile.name || 'there';

    if (this.articles.length === 0) {
      return this.generateNoResultsMessage();
    }

    let message = `Hi ${userName}, I found ${this.articles.length} article${this.articles.length > 1 ? 's' : ''} about "${this.query}" from Cancer Research UK:\n\n`;

    // Include top 3 articles in message
    this.articles.slice(0, 3).forEach((article, index) => {
      message += `${index + 1}. **${article.title}**\n`;
      message += `   ${article.summary}\n`;
      message += `   ${article.url}\n\n`;
    });

    if (this.articles.length > 3) {
      message += `...and ${this.articles.length - 3} more article${this.articles.length - 3 > 1 ? 's' : ''}.\n\n`;
    }

    message += 'Does this help answer your question? Do you have everything you need?';

    return message;
  }

  /**
   * Generate no results message
   */
  private generateNoResultsMessage(): string {
    const userName = this.context.profile.name || 'there';

    return `Hi ${userName}, I couldn't find specific articles about "${this.query}" in our knowledge base. ` +
           `Could you try rephrasing your question or asking about a different topic? ` +
           `I can help you find information about cancer types, symptoms, treatments, prevention, and support services.`;
  }

  /**
   * Record search in analytics
   * Implements Requirement 5.5
   */
  private async recordSearch(query: string, resultsCount: number): Promise<void> {
    try {
      await analyticsMCPServer.executeTool({
        name: 'record_interaction',
        arguments: {
          userId: this.context.userId,
          interaction: {
            type: 'search',
            timestamp: new Date(),
            intent: 'information_seeking',
            metadata: {
              query,
              resultsCount,
              source: 'knowledge_base',
            },
          },
        },
      });

      logger.debug('Search recorded in analytics', {
        userId: this.context.userId,
        query,
        resultsCount,
      });
    } catch (error) {
      logger.error('Failed to record search in analytics', error as Error);
    }
  }

  /**
   * Record feedback in analytics
   */
  private async recordFeedback(
    sentiment: 'positive' | 'negative' | 'neutral',
    feedbackText?: string
  ): Promise<void> {
    try {
      await analyticsMCPServer.executeTool({
        name: 'record_interaction',
        arguments: {
          userId: this.context.userId,
          interaction: {
            type: 'feedback',
            timestamp: new Date(),
            intent: 'information_seeking',
            sentiment,
            metadata: {
              query: this.query,
              articlesProvided: this.articles.length,
              feedbackText,
            },
          },
        },
      });

      logger.debug('Feedback recorded in analytics', {
        userId: this.context.userId,
        sentiment,
      });
    } catch (error) {
      logger.error('Failed to record feedback in analytics', error as Error);
    }
  }
}

