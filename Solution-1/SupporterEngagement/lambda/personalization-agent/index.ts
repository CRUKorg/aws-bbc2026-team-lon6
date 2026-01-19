import { 
  UserInput, 
  AgentResponse, 
  SessionContext, 
  UserContext,
  FlowState,
  Message,
  UIComponent,
  DashboardData,
  ProfileType,
  CampaignProgress,
  PageRecommendation,
  FundraisingPage,
  EngagementRecord,
  UserProfile,
  DonationSummary,
  KnowledgeArticle
} from '../shared/types';
import { IntentDetectionService } from '../intent-detection/index';
import { ContextManagementService } from '../context-management/index';
import { ContentGenerationService } from '../shared/content-generation';
import { 
  getUserProfileFromDb,
  saveSessionContextToDb,
  getSessionContextFromDb
} from '../shared/dynamodb-utils.js';

// Environment variables
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'SupporterEngagement-Users';
const CONTEXT_TABLE_NAME = process.env.CONTEXT_TABLE_NAME || 'SupporterEngagement-Context';
const SESSION_TABLE_NAME = process.env.SESSION_TABLE_NAME || 'SupporterEngagement-Sessions';

/**
 * Personalization Agent
 * 
 * Central orchestrator that manages all user interactions and coordinates between services.
 * Implements conversation state machine and flow routing.
 * 
 * Requirements: 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4
 * Version: 1.0.1 - Fixed DynamoDB Date marshalling
 */
export class PersonalizationAgent {
  private intentDetectionService: IntentDetectionService;
  private contextManagementService: ContextManagementService;
  private contentGenerationService: ContentGenerationService;
  private userTableName: string;
  private contextTableName: string;
  private sessionTableName: string;

  constructor(
    userTableName?: string,
    contextTableName?: string,
    sessionTableName?: string
  ) {
    this.intentDetectionService = new IntentDetectionService();
    this.contextManagementService = new ContextManagementService(contextTableName);
    this.contentGenerationService = new ContentGenerationService();
    this.userTableName = userTableName || USER_TABLE_NAME;
    this.contextTableName = contextTableName || CONTEXT_TABLE_NAME;
    this.sessionTableName = sessionTableName || SESSION_TABLE_NAME;
  }

  /**
   * Process user input and return response
   * 
   * Requirement 1.2: Display Dashboard for profiles with engagement context
   * Requirement 1.3: Initiate simplified flow for profiles with basic info
   * Requirement 1.4: Initiate new user flow for profiles with no context
   * Requirement 4.1: Detect whether intent is information seeking or personalization
   * Requirement 4.2: Trigger appropriate flow based on detected intent
   * Requirement 4.3: Ask to resume personalization flow after information seeking
   * Requirement 4.4: Pause personalization when user indicates they want to stop
   * 
   * @param userId - User ID
   * @param input - User input
   * @param sessionId - Session ID
   * @returns Agent response with text, UI components, and next action
   */
  async processInput(userId: string, input: UserInput, sessionId: string): Promise<AgentResponse> {
    try {
      console.log(`Processing input for user ${userId}, session ${sessionId}`);
      console.log(`Input text: ${input.text}`);
      
      // Get or create session context
      let session = await this.getOrCreateSession(userId, sessionId);
      console.log('Session retrieved/created');
      
      // Add user message to conversation history
      session.messages.push({
        role: 'user',
        content: input.text,
        timestamp: input.timestamp,
        metadata: input.metadata
      });
      
      // Get user context
      console.log('Getting user context...');
      const userContext = await this.contextManagementService.getContext(userId);
      console.log('User context retrieved');
      
      // Detect intent
      console.log('Detecting intent...');
      const intentResult = await this.intentDetectionService.detectIntent(
        input.text,
        userContext
      );
      console.log(`Intent detected: ${intentResult.primaryIntent}`);
      
      // Route to appropriate flow based on intent and current state
      let response: AgentResponse;
      
      if (intentResult.primaryIntent === 'information_seeking') {
        // Requirement 4.2: Trigger information seeking flow
        response = await this.handleInformationSeekingFlow(
          userId,
          input,
          session,
          userContext,
          intentResult
        );
      } else if (intentResult.primaryIntent === 'action') {
        // Handle action intent (e.g., donate, volunteer)
        response = await this.handleActionFlow(
          userId,
          input,
          session,
          userContext,
          intentResult
        );
      } else if (intentResult.primaryIntent === 'personalization') {
        // Handle personalization flow
        response = await this.handlePersonalizationFlow(
          userId,
          input,
          session,
          userContext
        );
      } else {
        // Handle unclear intent
        response = await this.handleUnclearIntent(
          userId,
          input,
          session,
          userContext
        );
      }
      
      // Add assistant message to conversation history
      session.messages.push({
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        metadata: { intent: intentResult.primaryIntent }
      });
      
      // Update session
      session.lastActivityTime = new Date();
      await saveSessionContextToDb(sessionId, session, this.sessionTableName);
      
      console.log('Response generated successfully');
      return response;
    } catch (error) {
      console.error('Error processing input:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Return error response with more details
      return {
        text: `I apologize, but I encountered an error processing your request. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        requiresUserInput: true,
        nextAction: 'retry'
      };
    }
  }

  /**
   * Initialize new user session
   * 
   * Requirement 1.2: Display Dashboard for returning users
   * Requirement 1.3: Initiate simplified flow for users with basic info
   * Requirement 1.4: Initiate new user flow for new users
   * 
   * @param userId - User ID
   * @returns Session context
   */
  async initializeSession(userId: string): Promise<SessionContext> {
    try {
      // Get user profile
      const profile = await getUserProfileFromDb(userId, this.userTableName);
      
      if (!profile) {
        throw new Error(`User profile not found for userId: ${userId}`);
      }
      
      // Get user context
      const userContext = await this.contextManagementService.getContext(userId);
      
      // Determine profile type
      const profileType = this.determineProfileType(userContext);
      
      // Create session
      const sessionId = this.generateSessionId(userId);
      const session: SessionContext = {
        sessionId,
        userId,
        startTime: new Date(),
        lastActivityTime: new Date(),
        currentFlow: 'idle',
        flowState: {
          flowType: 'initialization',
          currentStep: 'welcome',
          completedSteps: [],
          collectedData: { profileType },
          canResume: false
        },
        messages: [],
        cachedProfile: profile,
        cachedContext: userContext
      };
      
      // Save session
      await saveSessionContextToDb(sessionId, session, this.sessionTableName);
      
      return session;
    } catch (error) {
      console.error('Error initializing session:', error);
      throw error;
    }
  }

  /**
   * Resume existing session
   * 
   * @param sessionId - Session ID
   * @returns Session context
   */
  async resumeSession(sessionId: string): Promise<SessionContext> {
    try {
      const session = await getSessionContextFromDb(sessionId, this.sessionTableName);
      
      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      
      // Update last activity time
      session.lastActivityTime = new Date();
      await saveSessionContextToDb(sessionId, session, this.sessionTableName);
      
      return session;
    } catch (error) {
      console.error('Error resuming session:', error);
      throw error;
    }
  }

  /**
   * End session and persist context
   * 
   * @param sessionId - Session ID
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      const session = await getSessionContextFromDb(sessionId, this.sessionTableName);
      
      if (!session) {
        console.warn(`Session not found: ${sessionId}`);
        return;
      }
      
      // If there's an active flow, save its state to user context
      if (session.flowState && session.flowState.canResume) {
        await this.contextManagementService.updateFlowState(
          session.userId,
          session.flowState
        );
      }
      
      // Mark session as ended (in a real implementation, we might delete or archive)
      session.currentFlow = 'idle';
      session.lastActivityTime = new Date();
      await saveSessionContextToDb(sessionId, session, this.sessionTableName);
      
      console.log(`Session ended: ${sessionId}`);
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Determine profile type based on user context
   * 
   * Requirement 1.2: Profiles with engagement context → Dashboard
   * Requirement 1.3: Profiles with basic info → Simplified flow
   * Requirement 1.4: Profiles with no context → New user flow
   */
  private determineProfileType(context: UserContext): ProfileType {
    const profile = context.profile;
    
    // Check if user has engagement history
    const hasEngagementHistory = context.engagementHistory.length > 0 ||
      profile.donationCount > 0 ||
      profile.hasFundraised ||
      profile.hasVolunteered ||
      profile.hasAttendedEvents;
    
    if (hasEngagementHistory) {
      return ProfileType.RETURNING_USER;
    }
    
    // Check if user has basic information
    const hasBasicInfo = !!(profile.name && profile.age && profile.location);
    
    if (hasBasicInfo) {
      return ProfileType.BASIC_INFO;
    }
    
    // New user with minimal information
    return ProfileType.NEW_USER;
  }

  /**
   * Handle information seeking flow
   * 
   * Requirement 4.2: Trigger information seeking flow
   * Requirement 4.3: Ask to resume personalization flow after completion
   * Requirement 5.1: Retrieve relevant links and articles exclusively from CRUK sources
   * Requirement 5.2: Validate with user whether they have everything they need
   * Requirement 5.3: Gather user sentiment in a few words of feedback
   * Requirement 5.4: Ask to resume personalization flow after feedback
   * Requirement 5.5: Record the information seeking request and user intent
   * Requirement 5.6: Only return information from verified CRUK knowledge sources
   */
  private async handleInformationSeekingFlow(
    userId: string,
    input: UserInput,
    session: SessionContext,
    userContext: UserContext,
    intentResult: any
  ): Promise<AgentResponse> {
    // Store previous flow if we're interrupting personalization
    const previousFlow = session.currentFlow;
    
    // Update session to information seeking flow
    session.currentFlow = 'information_seeking';
    
    // Check if we're continuing an existing information seeking flow
    if (session.flowState && 
        session.flowState.flowType === 'information_seeking' &&
        session.flowState.currentStep !== 'complete') {
      return await this.continueInformationSeekingFlow(
        userId,
        input,
        session,
        userContext
      );
    }
    
    // Start new information seeking flow
    session.flowState = {
      flowType: 'information_seeking',
      currentStep: 'processing_query',
      completedSteps: [],
      collectedData: {
        query: input.text,
        previousFlow,
        queryTimestamp: input.timestamp
      },
      canResume: previousFlow === 'personalization'
    };
    
    // Requirement 5.5: Record the information seeking request
    await this.recordInformationSeekingRequest(userId, input.text, intentResult);
    
    // Requirement 5.1, 5.6: Search knowledge base for relevant CRUK articles
    const articles = await this.searchCRUKKnowledgeBase(input.text, userContext);
    
    // Store articles in flow state
    session.flowState.collectedData.articles = articles;
    session.flowState.currentStep = 'presenting_results';
    session.flowState.completedSteps.push('processing_query');
    
    // Format articles for presentation
    const articlesText = this.formatArticlesForPresentation(articles);
    
    const response: AgentResponse = {
      text: `I found some relevant information from Cancer Research UK that might help:\n\n${articlesText}\n\nDo you have everything you need, or would you like me to search for something else?`,
      uiComponents: [{
        type: 'search_results',
        data: {
          query: input.text,
          articles,
          source: 'Cancer Research UK'
        }
      }],
      requiresUserInput: true,
      nextAction: 'validate_information'
    };
    
    return response;
  }

  /**
   * Continue information seeking flow
   * 
   * Requirement 5.2: Validate with user whether they have everything they need
   * Requirement 5.3: Gather user sentiment in a few words of feedback
   * Requirement 5.4: Ask to resume personalization flow after feedback
   */
  private async continueInformationSeekingFlow(
    userId: string,
    input: UserInput,
    session: SessionContext,
    userContext: UserContext
  ): Promise<AgentResponse> {
    const flowState = session.flowState;
    
    if (flowState.currentStep === 'presenting_results') {
      // User is responding to validation question
      const userResponse = input.text.toLowerCase();
      
      // Check if user has everything they need
      const hasEverything = userResponse.includes('yes') ||
                           userResponse.includes('thank') ||
                           userResponse.includes('that\'s all') ||
                           userResponse.includes('perfect') ||
                           userResponse.includes('great');
      
      const needsMore = userResponse.includes('no') ||
                       userResponse.includes('more') ||
                       userResponse.includes('else') ||
                       userResponse.includes('also') ||
                       userResponse.includes('another');
      
      if (needsMore) {
        // User wants more information - process as new query
        flowState.currentStep = 'processing_query';
        flowState.completedSteps.push('presenting_results');
        
        // Search for new information
        const articles = await this.searchCRUKKnowledgeBase(input.text, userContext);
        
        flowState.collectedData.articles = [...(flowState.collectedData.articles || []), ...articles];
        flowState.currentStep = 'presenting_results';
        flowState.completedSteps.push('processing_query');
        
        const articlesText = this.formatArticlesForPresentation(articles);
        
        return {
          text: `Here's what I found:\n\n${articlesText}\n\nDo you have everything you need now?`,
          uiComponents: [{
            type: 'search_results',
            data: {
              query: input.text,
              articles,
              source: 'Cancer Research UK'
            }
          }],
          requiresUserInput: true,
          nextAction: 'validate_information'
        };
      }
      
      if (hasEverything) {
        // Requirement 5.3: Gather user sentiment feedback
        flowState.currentStep = 'gathering_feedback';
        flowState.completedSteps.push('presenting_results');
        
        return {
          text: `I'm glad I could help! In just a few words, how did you find this information? Was it helpful?`,
          requiresUserInput: true,
          nextAction: 'collect_feedback'
        };
      }
      
      // Unclear response - ask for clarification
      return {
        text: `I want to make sure you have what you need. Do you have all the information you were looking for, or would you like me to search for something else?`,
        requiresUserInput: true,
        nextAction: 'validate_information'
      };
    }
    
    if (flowState.currentStep === 'gathering_feedback') {
      // User has provided feedback
      flowState.collectedData.feedback = input.text;
      flowState.collectedData.feedbackTimestamp = input.timestamp;
      flowState.completedSteps.push('gathering_feedback');
      
      // Record feedback
      await this.recordInformationSeekingFeedback(
        userId,
        flowState.collectedData.query,
        flowState.collectedData.articles,
        input.text
      );
      
      // Requirement 5.4: Ask to resume personalization flow
      if (flowState.canResume && flowState.collectedData.previousFlow === 'personalization') {
        flowState.currentStep = 'asking_resume';
        flowState.completedSteps.push('gathering_feedback');
        
        return {
          text: `Thank you for the feedback! Now that you have the information you needed, would you like me to continue helping you discover ways to support Cancer Research UK?`,
          requiresUserInput: true,
          nextAction: 'ask_resume_personalization'
        };
      } else {
        // No personalization flow to resume
        flowState.currentStep = 'complete';
        flowState.canResume = false;
        
        return {
          text: `Thank you for the feedback! Is there anything else I can help you with today?`,
          requiresUserInput: true,
          nextAction: 'information_seeking_complete'
        };
      }
    }
    
    if (flowState.currentStep === 'asking_resume') {
      // User is responding to resume personalization question
      const userResponse = input.text.toLowerCase();
      
      const wantsToResume = userResponse.includes('yes') ||
                           userResponse.includes('sure') ||
                           userResponse.includes('okay') ||
                           userResponse.includes('continue');
      
      const doesNotWantToResume = userResponse.includes('no') ||
                                 userResponse.includes('not now') ||
                                 userResponse.includes('later') ||
                                 userResponse.includes('stop');
      
      if (wantsToResume) {
        // Resume personalization flow
        flowState.currentStep = 'complete';
        flowState.canResume = false;
        session.currentFlow = 'personalization';
        
        return {
          text: `Great! Let's continue. ${await this.getPersonalizationResumeMessage(userContext)}`,
          requiresUserInput: true,
          nextAction: 'resume_personalization'
        };
      }
      
      if (doesNotWantToResume) {
        // Requirement 4.4: Pause personalization when user indicates they want to stop
        flowState.currentStep = 'complete';
        flowState.canResume = false;
        session.currentFlow = 'idle';
        
        return {
          text: `No problem! I'm here whenever you need me. Feel free to ask me anything about cancer research or how to support CRUK.`,
          requiresUserInput: false,
          nextAction: 'information_seeking_complete'
        };
      }
      
      // Unclear response
      return {
        text: `Would you like to continue exploring ways to support Cancer Research UK, or would you prefer to stop for now?`,
        requiresUserInput: true,
        nextAction: 'ask_resume_personalization'
      };
    }
    
    // Fallback
    return {
      text: `I'm here to help you find information about cancer from Cancer Research UK. What would you like to know?`,
      requiresUserInput: true,
      nextAction: 'information_seeking'
    };
  }

  /**
   * Search CRUK knowledge base for relevant articles
   * 
   * Requirement 5.1: Retrieve relevant links and articles exclusively from CRUK sources
   * Requirement 5.6: Only return information from verified CRUK knowledge sources
   */
  private async searchCRUKKnowledgeBase(
    query: string,
    userContext: UserContext
  ): Promise<KnowledgeArticle[]> {
    try {
      const { searchKnowledgeBase } = await import('../shared/data-access.js');
      const knowledgeBaseTableName = process.env.KNOWLEDGE_BASE_TABLE_NAME || 
                                     'SupporterEngagement-KnowledgeBase';
      
      // Extract potential cancer types from query
      const cancerTypes = this.extractCancerTypesFromQuery(query);
      
      // Search knowledge base
      const articles = await searchKnowledgeBase(
        knowledgeBaseTableName,
        query,
        undefined, // category
        undefined, // tags
        cancerTypes.length > 0 ? cancerTypes : undefined,
        5 // limit to 5 most relevant articles
      );
      
      return articles;
    } catch (error) {
      console.error('Error searching CRUK knowledge base:', error);
      
      // Return fallback articles
      return this.getFallbackArticles(query);
    }
  }

  /**
   * Extract cancer types from query text
   */
  private extractCancerTypesFromQuery(query: string): string[] {
    const cancerTypes: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    const knownCancerTypes = [
      'breast cancer', 'lung cancer', 'prostate cancer', 'bowel cancer',
      'skin cancer', 'melanoma', 'leukaemia', 'lymphoma',
      'ovarian cancer', 'pancreatic cancer', 'kidney cancer',
      'bladder cancer', 'brain cancer', 'liver cancer'
    ];
    
    for (const cancerType of knownCancerTypes) {
      if (lowerQuery.includes(cancerType)) {
        cancerTypes.push(cancerType);
      }
    }
    
    return cancerTypes;
  }

  /**
   * Get fallback articles when knowledge base search fails
   */
  private getFallbackArticles(query: string): KnowledgeArticle[] {
    const fallbackArticles: KnowledgeArticle[] = [
      {
        articleId: 'fallback-1',
        title: 'About Cancer',
        summary: 'Learn about cancer, its causes, and how it develops.',
        content: 'Cancer is a disease where cells grow and reproduce uncontrollably...',
        url: 'https://www.cancerresearchuk.org/about-cancer',
        category: 'General Information',
        tags: ['cancer', 'information', 'basics'],
        cancerTypes: [],
        publishedDate: new Date(),
        lastUpdated: new Date(),
        author: 'Cancer Research UK',
        readingLevel: 'basic',
        availableLanguages: ['en']
      },
      {
        articleId: 'fallback-2',
        title: 'Cancer Types',
        summary: 'Information about different types of cancer.',
        content: 'There are more than 200 different types of cancer...',
        url: 'https://www.cancerresearchuk.org/about-cancer/type',
        category: 'Cancer Types',
        tags: ['cancer types', 'information'],
        cancerTypes: [],
        publishedDate: new Date(),
        lastUpdated: new Date(),
        author: 'Cancer Research UK',
        readingLevel: 'basic',
        availableLanguages: ['en']
      }
    ];
    
    return fallbackArticles;
  }

  /**
   * Format articles for text presentation
   */
  private formatArticlesForPresentation(articles: KnowledgeArticle[]): string {
    if (articles.length === 0) {
      return 'I couldn\'t find specific articles matching your query, but you can browse our comprehensive cancer information at https://www.cancerresearchuk.org/about-cancer';
    }
    
    return articles.map((article, index) => {
      return `${index + 1}. **${article.title}**\n   ${article.summary}\n   Read more: ${article.url}`;
    }).join('\n\n');
  }

  /**
   * Record information seeking request
   * 
   * Requirement 5.5: Record the information seeking request and user intent
   */
  private async recordInformationSeekingRequest(
    userId: string,
    query: string,
    intentResult: any
  ): Promise<void> {
    try {
      const { recordInteraction } = await import('../shared/data-access.js');
      const interactionsTableName = process.env.INTERACTIONS_TABLE_NAME || 
                                    'SupporterEngagement-Interactions';
      
      await recordInteraction(
        userId,
        'search' as any,
        interactionsTableName,
        {
          query,
          intent: intentResult.primaryIntent,
          confidence: intentResult.confidence,
          entities: intentResult.entities,
          timestamp: new Date().toISOString()
        }
      );
      
      console.log(`Information seeking request recorded for user ${userId}: ${query}`);
    } catch (error) {
      console.error('Error recording information seeking request:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Record information seeking feedback
   * 
   * Requirement 5.3: Gather user sentiment in a few words of feedback
   */
  private async recordInformationSeekingFeedback(
    userId: string,
    query: string,
    articles: KnowledgeArticle[],
    feedback: string
  ): Promise<void> {
    try {
      const { recordInteraction } = await import('../shared/data-access.js');
      const interactionsTableName = process.env.INTERACTIONS_TABLE_NAME || 
                                    'SupporterEngagement-Interactions';
      
      await recordInteraction(
        userId,
        'search' as any,
        interactionsTableName,
        {
          query,
          feedback,
          articlesProvided: articles.map(a => ({
            articleId: a.articleId,
            title: a.title,
            url: a.url
          })),
          feedbackTimestamp: new Date().toISOString()
        }
      );
      
      console.log(`Information seeking feedback recorded for user ${userId}`);
    } catch (error) {
      console.error('Error recording information seeking feedback:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get personalization resume message
   */
  private async getPersonalizationResumeMessage(userContext: UserContext): Promise<string> {
    const profileType = this.determineProfileType(userContext);
    
    if (profileType === ProfileType.NEW_USER) {
      return 'Tell me about your relationship with Cancer Research UK. Are you new to CRUK? What do you know about us?';
    } else if (profileType === ProfileType.BASIC_INFO) {
      return 'I\'d love to learn more about what brings you to Cancer Research UK today. What are you most interested in?';
    } else {
      return 'Let me show you your personalized dashboard with your impact and recommended activities.';
    }
  }

  /**
   * Handle action flow (donate, volunteer, etc.)
   */
  private async handleActionFlow(
    userId: string,
    input: UserInput,
    session: SessionContext,
    userContext: UserContext,
    intentResult: any
  ): Promise<AgentResponse> {
    // Extract action type from entities
    const actionEntity = intentResult.entities.find((e: any) => e.type === 'action_type');
    const actionType = actionEntity?.value || 'donate';
    
    // Generate appropriate call to action
    const cta = await this.contentGenerationService.generateCallToAction(userContext);
    
    const response: AgentResponse = {
      text: `I can help you ${actionType}. ${cta.description}`,
      uiComponents: [{
        type: 'call_to_action',
        data: cta
      }],
      requiresUserInput: false,
      nextAction: 'action_complete'
    };
    
    return response;
  }

  /**
   * Handle personalization flow
   * 
   * Requirement 1.2: Display Dashboard for returning users
   * Requirement 1.3: Initiate simplified flow for users with basic info
   * Requirement 1.4: Initiate new user flow for new users
   */
  private async handlePersonalizationFlow(
    userId: string,
    input: UserInput,
    session: SessionContext,
    userContext: UserContext
  ): Promise<AgentResponse> {
    // Update session flow
    session.currentFlow = 'personalization';
    
    // Check if we're continuing an existing flow
    if (session.flowState && session.flowState.flowType === 'new_user_personalization' && 
        session.flowState.currentStep !== 'complete') {
      // Continue the new user flow
      return await this.continueNewUserFlow(userId, input, session, userContext);
    }
    
    if (session.flowState && session.flowState.flowType === 'simplified_personalization' && 
        session.flowState.currentStep !== 'complete') {
      // Continue the simplified flow
      return await this.continueSimplifiedPersonalizationFlow(userId, input, session, userContext);
    }
    
    // Determine profile type for new flows
    const profileType = this.determineProfileType(userContext);
    
    if (profileType === ProfileType.RETURNING_USER) {
      // Requirement 1.2: Display Dashboard
      return await this.generateDashboardResponse(userId, userContext);
    } else if (profileType === ProfileType.BASIC_INFO) {
      // Requirement 1.3: Simplified personalization flow
      return await this.startSimplifiedPersonalizationFlow(userId, session, userContext);
    } else {
      // Requirement 1.4: New user flow
      return await this.startNewUserFlow(userId, session, userContext);
    }
  }

  /**
   * Handle unclear intent
   */
  private async handleUnclearIntent(
    userId: string,
    input: UserInput,
    session: SessionContext,
    userContext: UserContext
  ): Promise<AgentResponse> {
    const response: AgentResponse = {
      text: `I'm not quite sure what you're looking for. Are you interested in learning more about how you can support Cancer Research UK, or would you like information about cancer research and treatments?`,
      requiresUserInput: true,
      nextAction: 'clarification'
    };
    
    return response;
  }

  /**
   * Generate dashboard response for returning users
   * 
   * Requirement 1.2: Display Dashboard with personalized information
   * Requirement 2.1: Show total amount raised for CRUK
   * Requirement 2.2: Display current campaign amount vs target
   * Requirement 2.3: Show impact breakdown of what donations have funded
   * Requirement 2.4: Recommend CRUK pages based on activity history
   * Requirement 2.5: Display high-impact research papers relevant to supporter
   * Requirement 9.1: Display personalization container with user's name
   * Requirement 9.2: Show total donations bar
   * Requirement 9.3: Show recommended donation buttons based on previous behavior
   * Requirement 9.4: Show impact breakdown
   * Requirement 9.5: Show recommended CRUK pages based on activity
   */
  private async generateDashboardResponse(
    userId: string,
    userContext: UserContext
  ): Promise<AgentResponse> {
    try {
      const profile = userContext.profile;
      
      // Get donation summary and recent transactions
      const { getDonationSummary, getRecentTransactions } = await import('../shared/data-access.js');
      const donationsTableName = process.env.DONATIONS_TABLE_NAME || 'SupporterEngagement-Donations';
      
      const donationSummary = await getDonationSummary(userId, donationsTableName);
      const recentDonations = await getRecentTransactions(userId, donationsTableName, 20);
      
      // Requirement 2.3: Generate impact breakdown
      const impactBreakdown = await this.contentGenerationService.formatImpactBreakdown(
        recentDonations
      );
      
      // Requirement 2.5: Get featured research papers relevant to supporter
      const researchPapersTableName = process.env.RESEARCH_PAPERS_TABLE_NAME || 'SupporterEngagement-ResearchPapers';
      const featuredResearch = await this.contentGenerationService.selectResearchPapers(
        userContext,
        5,
        researchPapersTableName
      );
      
      // Requirement 2.4: Generate recommended pages based on activity history
      const recommendedPages = await this.generateRecommendedPages(userContext);
      
      // Requirement 2.2: Check for active campaign
      let currentCampaign: CampaignProgress | undefined;
      const activeCampaign = await this.getActiveCampaign(userId);
      if (activeCampaign) {
        currentCampaign = {
          campaignName: activeCampaign.pageTitle || 'Your Fundraising Campaign',
          currentAmount: activeCampaign.pledgeAmount || 0,
          targetAmount: activeCampaign.targetAmount || 0,
          percentComplete: activeCampaign.targetAmount 
            ? Math.round(((activeCampaign.pledgeAmount || 0) / activeCampaign.targetAmount) * 100)
            : 0
        };
      }
      
      // Build dashboard data
      const dashboardData: DashboardData = {
        userName: profile.name,
        totalDonations: donationSummary.totalAmount,
        currentCampaign,
        impactBreakdown,
        recommendedPages,
        featuredResearch
      };
      
      // Generate personalized welcome message
      const welcomeMessage = this.generateWelcomeMessage(profile, donationSummary, currentCampaign);
      
      // Generate suggested links
      const suggestedLinks = this.generateSuggestedLinks(userContext);
      
      const response: AgentResponse = {
        text: welcomeMessage,
        uiComponents: [{
          type: 'dashboard',
          data: dashboardData
        }],
        suggestedLinks,
        requiresUserInput: false,
        nextAction: 'dashboard_displayed'
      };
      
      return response;
    } catch (error) {
      console.error('Error generating dashboard:', error);
      
      // Return fallback dashboard
      return this.getFallbackDashboard(userContext);
    }
  }

  /**
   * Generate recommended pages based on user activity history
   * 
   * Requirement 2.4: Recommend CRUK pages based on activity history
   * Requirement 9.5: Show recommended CRUK pages based on activity
   */
  private async generateRecommendedPages(userContext: UserContext): Promise<PageRecommendation[]> {
    const recommendations: PageRecommendation[] = [];
    const profile = userContext.profile;
    
    // Recommend based on interests
    if (profile.interests.includes('research') || profile.interests.includes('clinical trials')) {
      recommendations.push({
        title: 'Our Research',
        url: 'https://www.cancerresearchuk.org/about-us/our-research',
        reason: 'Based on your interest in cancer research',
        thumbnail: '/images/research.jpg'
      });
    }
    
    if (profile.interests.includes('fundraising') || profile.hasFundraised) {
      recommendations.push({
        title: 'Fundraising Ideas',
        url: 'https://www.cancerresearchuk.org/get-involved/find-an-event',
        reason: 'Based on your fundraising activity',
        thumbnail: '/images/fundraising.jpg'
      });
    }
    
    if (profile.interests.includes('volunteering') || profile.hasVolunteered) {
      recommendations.push({
        title: 'Volunteer Opportunities',
        url: 'https://www.cancerresearchuk.org/get-involved/volunteer',
        reason: 'Based on your volunteering interest',
        thumbnail: '/images/volunteer.jpg'
      });
    }
    
    // Recommend based on cancer type
    if (profile.cancerType) {
      const cancerTypeFormatted = profile.cancerType.replace(/_/g, '-').toLowerCase();
      recommendations.push({
        title: `${profile.cancerType} Information`,
        url: `https://www.cancerresearchuk.org/about-cancer/type/${cancerTypeFormatted}`,
        reason: 'Information about the cancer type you\'re interested in',
        thumbnail: '/images/cancer-info.jpg'
      });
    }
    
    // Recommend based on personal connection
    if (profile.personallyAffected || profile.lovedOneAffected) {
      recommendations.push({
        title: 'Support Services',
        url: 'https://www.cancerresearchuk.org/about-cancer/coping',
        reason: 'Support and information for people affected by cancer',
        thumbnail: '/images/support.jpg'
      });
    }
    
    // Always recommend events
    if (recommendations.length < 5) {
      recommendations.push({
        title: 'Upcoming Events',
        url: 'https://www.cancerresearchuk.org/get-involved/find-an-event',
        reason: 'Join us at one of our upcoming events',
        thumbnail: '/images/events.jpg'
      });
    }
    
    // Limit to 5 recommendations
    return recommendations.slice(0, 5);
  }

  /**
   * Get active fundraising campaign for user
   * 
   * Requirement 2.2: Display current campaign amount vs target
   */
  private async getActiveCampaign(userId: string): Promise<FundraisingPage | undefined> {
    try {
      const { QueryCommand } = await import('@aws-sdk/lib-dynamodb');
      const { docClient } = await import('../shared/dynamodb-utils.js');
      
      const fundraisingTableName = process.env.FUNDRAISING_TABLE_NAME || 'SupporterEngagement-Fundraising';
      
      const response = await docClient.send(new QueryCommand({
        TableName: fundraisingTableName,
        KeyConditionExpression: 'userId = :userId',
        FilterExpression: 'pageStatus = :status',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':status': 'Open'
        },
        Limit: 1,
        ScanIndexForward: false // Get most recent first
      }));
      
      if (response.Items && response.Items.length > 0) {
        return response.Items[0] as FundraisingPage;
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting active campaign:', error);
      return undefined;
    }
  }

  /**
   * Generate personalized welcome message
   * 
   * Requirement 9.1: Display personalization container with user's name
   */
  private generateWelcomeMessage(
    profile: UserProfile,
    donationSummary: DonationSummary,
    currentCampaign?: CampaignProgress
  ): string {
    const timeOfDay = this.getTimeOfDay();
    let message = `${timeOfDay}, ${profile.name}! `;
    
    if (donationSummary.totalAmount > 0) {
      message += `Thank you for your incredible support. You've raised £${donationSummary.totalAmount.toFixed(2)} for Cancer Research UK. `;
    }
    
    if (currentCampaign) {
      message += `Your ${currentCampaign.campaignName} is ${currentCampaign.percentComplete}% complete! `;
    }
    
    message += `Here's your personalized dashboard showing your impact and recommended activities.`;
    
    return message;
  }

  /**
   * Get time of day greeting
   */
  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      return 'Good morning';
    } else if (hour < 18) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  }

  /**
   * Get fallback dashboard when data retrieval fails
   */
  private getFallbackDashboard(userContext: UserContext): AgentResponse {
    const profile = userContext.profile;
    
    const dashboardData: DashboardData = {
      userName: profile.name,
      totalDonations: profile.totalDonations,
      impactBreakdown: [],
      recommendedPages: [
        {
          title: 'Our Research',
          url: 'https://www.cancerresearchuk.org/about-us/our-research',
          reason: 'Discover how we\'re beating cancer',
          thumbnail: '/images/research.jpg'
        },
        {
          title: 'Get Involved',
          url: 'https://www.cancerresearchuk.org/get-involved',
          reason: 'Find ways to support our mission',
          thumbnail: '/images/get-involved.jpg'
        }
      ],
      featuredResearch: []
    };
    
    // Generate suggested links
    const suggestedLinks = this.generateSuggestedLinks(userContext);
    
    return {
      text: `Welcome back, ${profile.name}! Here's your personalized dashboard.`,
      uiComponents: [{
        type: 'dashboard',
        data: dashboardData
      }],
      suggestedLinks,
      requiresUserInput: false,
      nextAction: 'dashboard_displayed'
    };
  }

  /**
   * Start simplified personalization flow for users with basic info
   * 
   * Requirement 1.3: Initiate simplified flow
   */
  private async startSimplifiedPersonalizationFlow(
    userId: string,
    session: SessionContext,
    userContext: UserContext
  ): Promise<AgentResponse> {
    session.flowState = {
      flowType: 'simplified_personalization',
      currentStep: 'gather_interests',
      completedSteps: [],
      collectedData: {},
      canResume: true
    };
    
    const response: AgentResponse = {
      text: `Hi ${userContext.profile.name}! I'd love to learn more about what brings you to Cancer Research UK today. What are you most interested in?`,
      requiresUserInput: true,
      nextAction: 'collect_interests'
    };
    
    return response;
  }

  /**
   * Continue simplified personalization flow
   * 
   * Requirement 1.3: Simplified flow for users with basic info
   */
  private async continueSimplifiedPersonalizationFlow(
    userId: string,
    input: UserInput,
    session: SessionContext,
    userContext: UserContext
  ): Promise<AgentResponse> {
    const flowState = session.flowState;
    
    if (flowState.currentStep === 'gather_interests') {
      // Store interests
      flowState.collectedData.interests = input.text;
      
      // Save to context
      const interests = this.extractInterestsFromText(input.text);
      await this.contextManagementService.mergeContext(userId, {
        preferences: {
          interests,
          communicationPreferences: userContext.preferences.communicationPreferences
        }
      });
      
      // Mark flow as complete
      flowState.currentStep = 'complete';
      flowState.completedSteps.push('gather_interests');
      flowState.canResume = false;
      
      // Generate motivational content and CTA
      const motivationalContent = await this.contentGenerationService.generateMotivationalContent(userContext);
      const cta = await this.contentGenerationService.generateCallToAction(userContext);
      
      const response: AgentResponse = {
        text: `Thank you for sharing that! ${motivationalContent.personalizedMessage}\n\n${motivationalContent.headline}\n\n${motivationalContent.body}\n\n${cta.title}: ${cta.description}`,
        uiComponents: [
          {
            type: 'call_to_action',
            data: cta
          }
        ],
        requiresUserInput: false,
        nextAction: 'personalization_complete'
      };
      
      return response;
    }
    
    // Fallback
    return {
      text: `I'd love to learn more about what brings you to Cancer Research UK today. What are you most interested in?`,
      requiresUserInput: true,
      nextAction: 'collect_interests'
    };
  }

  /**
   * Extract interests from user text
   */
  private extractInterestsFromText(text: string): string[] {
    const interests: string[] = [];
    const lowerText = text.toLowerCase();
    
    const interestKeywords = [
      'research', 'fundraising', 'volunteering', 'events',
      'breast cancer', 'lung cancer', 'prostate cancer', 'bowel cancer',
      'prevention', 'treatment', 'patient support', 'clinical trials',
      'donate', 'donation', 'giving'
    ];
    
    for (const keyword of interestKeywords) {
      if (lowerText.includes(keyword)) {
        interests.push(keyword);
      }
    }
    
    return interests.length > 0 ? interests : ['cancer research'];
  }

  /**
   * Start new user flow
   * 
   * Requirement 1.4: Initiate new user flow
   * Requirement 3.1: Ask initial question for new users
   */
  private async startNewUserFlow(
    userId: string,
    session: SessionContext,
    userContext: UserContext
  ): Promise<AgentResponse> {
    session.flowState = {
      flowType: 'new_user_personalization',
      currentStep: 'initial_question',
      completedSteps: [],
      collectedData: {},
      canResume: true
    };
    
    const response: AgentResponse = {
      text: `Welcome! Are you new to Cancer Research UK? What do you know about CRUK? Have you supported us in any way before?`,
      requiresUserInput: true,
      nextAction: 'collect_initial_context'
    };
    
    return response;
  }

  /**
   * Continue new user personalization flow
   * 
   * Requirement 3.2: Summarize input and confirm accuracy
   * Requirement 3.3: Save information when confirmed
   * Requirement 3.4: Use as trusted information for future interactions
   * Requirement 3.5: Record when user updated personalization with timestamps
   */
  private async continueNewUserFlow(
    userId: string,
    input: UserInput,
    session: SessionContext,
    userContext: UserContext
  ): Promise<AgentResponse> {
    const flowState = session.flowState;
    
    if (flowState.currentStep === 'initial_question') {
      // User has provided their initial context
      // Store the raw input
      flowState.collectedData.rawInput = input.text;
      flowState.collectedData.inputTimestamp = input.timestamp;
      
      // Summarize the input using Bedrock
      const summary = await this.summarizePersonalizationInput(input.text, userContext);
      
      // Store the summary
      flowState.collectedData.summary = summary;
      
      // Move to confirmation step
      flowState.currentStep = 'confirm_summary';
      flowState.completedSteps.push('initial_question');
      
      const response: AgentResponse = {
        text: `Thank you for sharing that with me. Let me make sure I've understood correctly:\n\n${summary}\n\nIs this accurate?`,
        requiresUserInput: true,
        nextAction: 'confirm_personalization'
      };
      
      return response;
    } else if (flowState.currentStep === 'confirm_summary') {
      // User is confirming or correcting the summary
      const confirmation = input.text.toLowerCase();
      const isConfirmed = confirmation.includes('yes') || 
                          confirmation.includes('correct') || 
                          confirmation.includes('accurate') ||
                          confirmation.includes('right');
      
      if (isConfirmed) {
        // Requirement 3.3: Save the information with timestamp
        // Requirement 3.5: Record when user updated personalization
        await this.savePersonalizationData(
          userId,
          flowState.collectedData.rawInput,
          flowState.collectedData.summary,
          flowState.collectedData.inputTimestamp
        );
        
        // Mark flow as complete
        flowState.currentStep = 'complete';
        flowState.completedSteps.push('confirm_summary');
        flowState.canResume = false;
        
        // Generate motivational content and CTA
        const motivationalContent = await this.contentGenerationService.generateMotivationalContent(userContext);
        const cta = await this.contentGenerationService.generateCallToAction(userContext);
        
        const response: AgentResponse = {
          text: `Perfect! I've saved your information. ${motivationalContent.personalizedMessage}\n\n${motivationalContent.headline}\n\n${motivationalContent.body}\n\n${cta.title}: ${cta.description}`,
          uiComponents: [
            {
              type: 'call_to_action',
              data: cta
            }
          ],
          requiresUserInput: false,
          nextAction: 'personalization_complete'
        };
        
        return response;
      } else {
        // User wants to correct the summary
        flowState.currentStep = 'initial_question';
        flowState.completedSteps = [];
        
        const response: AgentResponse = {
          text: `I apologize for the misunderstanding. Let's try again. Could you tell me about your relationship with Cancer Research UK? Are you new to CRUK? What do you know about us? Have you supported us in any way before?`,
          requiresUserInput: true,
          nextAction: 'collect_initial_context'
        };
        
        return response;
      }
    }
    
    // Fallback
    return {
      text: `I'm not sure where we are in the conversation. Let's start over. Are you new to Cancer Research UK? What do you know about CRUK? Have you supported us in any way before?`,
      requiresUserInput: true,
      nextAction: 'collect_initial_context'
    };
  }

  /**
   * Summarize personalization input using Bedrock
   * 
   * Requirement 3.2: Summarize the input and confirm accuracy
   */
  private async summarizePersonalizationInput(input: string, context: UserContext): Promise<string> {
    try {
      const prompt = `You are helping to summarize a user's response about their relationship with Cancer Research UK.

User's response:
"${input}"

Your task is to create a clear, concise summary that captures:
1. Whether they are new to CRUK or have prior knowledge
2. What they know about CRUK
3. Any previous support they've provided (donations, volunteering, fundraising, etc.)
4. Any personal connection to cancer (if mentioned)
5. Their interests or motivations (if mentioned)

Format the summary as a bulleted list with clear, factual statements.
Keep it concise (3-5 bullet points maximum).
Use the user's own words where possible.

Example format:
• New to Cancer Research UK, learning about the organization
• Aware that CRUK funds cancer research
• Has not supported CRUK before but interested in getting involved
• Personal connection: family member affected by breast cancer

Respond ONLY with the bulleted summary, no additional text.`;

      // Use the content generation service's Bedrock client
      const bedrockClient = (this.contentGenerationService as any).bedrockClient;
      const modelId = (this.contentGenerationService as any).modelId;
      
      const payload = {
        anthropic_version: 'bedrock-2025-02-19',
        max_tokens: 500,
        temperature: 0.3, // Lower temperature for more factual summaries
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      };

      const { InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(payload)
      });

      const response = await bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const summary = responseBody.content[0].text.trim();
      
      return summary;
    } catch (error) {
      console.error('Error summarizing personalization input:', error);
      
      // Return a basic summary as fallback
      return `• Provided information about their relationship with Cancer Research UK\n• Response recorded on ${new Date().toLocaleDateString()}`;
    }
  }

  /**
   * Save personalization data to user context
   * 
   * Requirement 3.3: Save information in structured/semi-structured format with timestamp
   * Requirement 3.4: Use as trusted information for future interactions
   * Requirement 3.5: Record when user updated personalization with date and time stamps
   */
  private async savePersonalizationData(
    userId: string,
    rawInput: string,
    summary: string,
    timestamp: Date
  ): Promise<void> {
    try {
      // Create engagement record for personalization
      const engagementRecord: EngagementRecord = {
        recordId: `${userId}-personalization-${Date.now()}`,
        userId,
        type: 'campaign' as any, // Using 'campaign' as closest match
        timestamp,
        metadata: {
          flowType: 'new_user_personalization',
          rawInput,
          summary,
          recordedAt: timestamp.toISOString()
        }
      };
      
      // Parse summary to extract structured data
      const structuredData = this.parsePersonalizationSummary(summary);
      
      // Update user context with personalization data
      await this.contextManagementService.mergeContext(userId, {
        engagementHistory: [engagementRecord],
        preferences: {
          interests: structuredData.interests,
          communicationPreferences: {
            email: true,
            sms: false,
            phone: false,
            preferredFrequency: 'monthly'
          }
        },
        profile: {
          ...structuredData.profileUpdates,
          updatedAt: timestamp
        } as any
      });
      
      console.log(`Personalization data saved for user ${userId} at ${timestamp.toISOString()}`);
    } catch (error) {
      console.error('Error saving personalization data:', error);
      throw error;
    }
  }

  /**
   * Parse personalization summary to extract structured data
   */
  private parsePersonalizationSummary(summary: string): {
    interests: string[];
    profileUpdates: Partial<UserProfile>;
  } {
    const interests: string[] = [];
    const profileUpdates: Partial<UserProfile> = {};
    
    const lowerSummary = summary.toLowerCase();
    
    // Extract interests from common keywords
    const interestKeywords = [
      'research', 'fundraising', 'volunteering', 'events',
      'breast cancer', 'lung cancer', 'prostate cancer', 'bowel cancer',
      'prevention', 'treatment', 'patient support', 'clinical trials'
    ];
    
    for (const keyword of interestKeywords) {
      if (lowerSummary.includes(keyword)) {
        interests.push(keyword);
      }
    }
    
    // Check for personal connection
    if (lowerSummary.includes('personal connection') || 
        lowerSummary.includes('family member') ||
        lowerSummary.includes('loved one') ||
        lowerSummary.includes('affected by')) {
      profileUpdates.personallyAffected = lowerSummary.includes('personally affected') || 
                                          lowerSummary.includes('i have') ||
                                          lowerSummary.includes('i was diagnosed');
      profileUpdates.lovedOneAffected = lowerSummary.includes('family') || 
                                        lowerSummary.includes('loved one') ||
                                        lowerSummary.includes('friend');
    }
    
    // Check for previous support
    if (lowerSummary.includes('donated') || lowerSummary.includes('donation')) {
      // Note: actual donation count will come from donation records
      profileUpdates.donationCount = 0; // Will be updated from actual records
    }
    
    if (lowerSummary.includes('volunteered') || lowerSummary.includes('volunteer')) {
      profileUpdates.hasVolunteered = true;
    }
    
    if (lowerSummary.includes('fundraised') || lowerSummary.includes('fundraising')) {
      profileUpdates.hasFundraised = true;
    }
    
    if (lowerSummary.includes('event') || lowerSummary.includes('race for life')) {
      profileUpdates.hasAttendedEvents = true;
    }
    
    return {
      interests: interests.length > 0 ? interests : ['cancer research'],
      profileUpdates
    };
  }

  /**
   * Get or create session
   */
  private async getOrCreateSession(userId: string, sessionId: string): Promise<SessionContext> {
    try {
      // Try to get existing session
      const existingSession = await getSessionContextFromDb(sessionId, this.sessionTableName);
      
      if (existingSession) {
        return existingSession;
      }
      
      // Create new session
      return await this.initializeSession(userId);
    } catch (error) {
      console.error('Error getting or creating session:', error);
      // If we can't get session, create a new one
      return await this.initializeSession(userId);
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${userId}-${timestamp}-${random}`;
  }

  /**
   * Generate suggested links based on user context
   * Returns 3 relevant links from cancerresearchuk.org
   */
  private generateSuggestedLinks(userContext: UserContext): { title: string; url: string; description: string }[] {
    const profile = userContext.profile;
    const links: { title: string; url: string; description: string }[] = [];
    
    // Link 1: Based on cancer type or general research
    if (profile.cancerType) {
      const cancerTypeSlug = profile.cancerType.toLowerCase().replace(/\s+/g, '-');
      links.push({
        title: `${profile.cancerType} Research`,
        url: `https://www.cancerresearchuk.org/about-cancer/${cancerTypeSlug}`,
        description: `Learn about the latest ${profile.cancerType.toLowerCase()} research and treatment advances`
      });
    } else {
      links.push({
        title: 'Our Research',
        url: 'https://www.cancerresearchuk.org/our-research',
        description: 'Discover how we\'re working to beat cancer through world-class research'
      });
    }
    
    // Link 2: Based on engagement history
    if (profile.hasFundraised) {
      links.push({
        title: 'Fundraising Ideas',
        url: 'https://www.cancerresearchuk.org/get-involved/find-an-event',
        description: 'Find new fundraising events and ideas to support cancer research'
      });
    } else if (profile.hasVolunteered) {
      links.push({
        title: 'Volunteer Opportunities',
        url: 'https://www.cancerresearchuk.org/get-involved/volunteer',
        description: 'Explore ways to volunteer and make a difference in your community'
      });
    } else if (profile.donationCount > 0) {
      links.push({
        title: 'Your Impact',
        url: 'https://www.cancerresearchuk.org/about-us/our-impact',
        description: 'See how donations like yours are helping us beat cancer sooner'
      });
    } else {
      links.push({
        title: 'Ways to Give',
        url: 'https://www.cancerresearchuk.org/get-involved/donate',
        description: 'Explore different ways you can support life-saving cancer research'
      });
    }
    
    // Link 3: Based on interests or general support
    const interests = userContext.preferences.interests;
    if (interests.includes('Race for Life') || interests.includes('running') || interests.includes('events')) {
      links.push({
        title: 'Race for Life',
        url: 'https://www.cancerresearchuk.org/get-involved/find-an-event/race-for-life-events',
        description: 'Join thousands in our iconic Race for Life events across the UK'
      });
    } else if (interests.includes('research') || profile.isResearcher) {
      links.push({
        title: 'Research Breakthroughs',
        url: 'https://www.cancerresearchuk.org/about-us/cancer-news',
        description: 'Read about the latest breakthroughs in cancer research and treatment'
      });
    } else if (profile.personallyAffected || profile.lovedOneAffected) {
      links.push({
        title: 'Cancer Support',
        url: 'https://www.cancerresearchuk.org/about-cancer/coping',
        description: 'Find support and information for people affected by cancer'
      });
    } else {
      links.push({
        title: 'Get Involved',
        url: 'https://www.cancerresearchuk.org/get-involved',
        description: 'Discover all the ways you can help us beat cancer'
      });
    }
    
    return links;
  }
}

// Export singleton instance
export const personalizationAgent = new PersonalizationAgent();

// Export handler for Lambda invocation
export const handler = async (event: any): Promise<any> => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // Parse body if it's from API Gateway
    let requestBody;
    if (event.body) {
      // API Gateway event
      requestBody = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      // Direct invocation
      requestBody = event;
    }
    
    const { userId, input, sessionId } = requestBody;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'userId is required'
        })
      };
    }
    
    if (!input) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'input is required'
        })
      };
    }
    
    // If no sessionId provided, initialize new session
    if (!sessionId) {
      const session = await personalizationAgent.initializeSession(userId);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          message: 'Session initialized'
        })
      };
    }
    
    // Process input
    const response = await personalizationAgent.processInput(userId, input, sessionId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error in personalization agent handler:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      })
    };
  }
};
