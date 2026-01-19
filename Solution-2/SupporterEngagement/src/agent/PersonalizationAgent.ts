/**
 * Personalization Agent
 * Orchestrates all services and MCP servers to provide personalized user experiences
 */

import { ContextManagementService } from '../services/context-management';
import { IntentRecognitionService } from '../services/intent-recognition';
import { ContentPersonalizationService } from '../services/content-personalization';
import { userProfileMCPServer } from '../mcp-servers/user-profile/server';
import { transactionMCPServer } from '../mcp-servers/transaction/server';
import { researchPapersMCPServer } from '../mcp-servers/research-papers/server';
import { knowledgeBaseMCPServer } from '../mcp-servers/knowledge-base/server';
import { analyticsMCPServer } from '../mcp-servers/analytics/server';
import { UserContext, SessionContext, IntentResult, Message, UserProfile } from '../models';
import { logger } from '../utils/logger';

export interface UserInput {
  text: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  text: string;
  uiComponents?: any[];
  nextAction?: string;
  requiresUserInput: boolean;
  sessionId: string;
  metadata: {
    intent: string;
    confidence: number;
    entities: any[];
  };
}

export class PersonalizationAgent {
  private contextService: ContextManagementService;
  private intentService: IntentRecognitionService;
  private contentService: ContentPersonalizationService;
  private activeSessions: Map<string, SessionContext>;

  // MCP Server instances
  private userProfileMCP = userProfileMCPServer;
  private transactionMCP = transactionMCPServer;
  private researchPapersMCP = researchPapersMCPServer;
  private knowledgeBaseMCP = knowledgeBaseMCPServer;
  private analyticsMCP = analyticsMCPServer;

  constructor() {
    this.contextService = new ContextManagementService();
    this.intentService = new IntentRecognitionService();
    this.contentService = new ContentPersonalizationService();
    this.activeSessions = new Map();
    
    logger.info('PersonalizationAgent initialized with all MCP servers');
  }

  /**
   * Initialize a new session for a user
   * Retrieves user profile from MCP server and sets up session context
   */
  async initializeSession(userId: string): Promise<SessionContext> {
    try {
      logger.info(`Initializing session for user ${userId}`);

      // Retrieve user profile from User Profile MCP Server
      const profileResult = await this.userProfileMCP.executeTool({
        name: 'get_user_profile',
        arguments: { userId },
      });

      let userProfile: UserProfile | null = null;
      if (!profileResult.isError && profileResult.content[0]?.resource) {
        userProfile = profileResult.content[0].resource as UserProfile;
        logger.info(`User profile retrieved for ${userId}`, { 
          name: userProfile.name,
          totalDonations: userProfile.totalDonations,
          interests: userProfile.interests 
        });
      } else {
        logger.warn(`No profile found for user ${userId}, will create default`);
      }

      // Retrieve user context from Context Management Service
      let userContext = await this.contextService.getContext(userId);

      // If no context exists, create a default one
      if (!userContext) {
        logger.info(`No existing context for user ${userId}, creating new context`);
        userContext = this.createDefaultContext(userId, userProfile);
        await this.contextService.updateContext(userId, userContext);
      } else if (userProfile) {
        // Update context with latest profile data
        userContext.profile = userProfile;
      }

      // Retrieve engagement history from User Profile MCP Server
      const historyResult = await this.userProfileMCP.executeTool({
        name: 'get_engagement_history',
        arguments: { userId, limit: 50 },
      });

      if (!historyResult.isError && historyResult.content[0]?.resource) {
        const historyData = historyResult.content[0].resource as any;
        userContext.engagementHistory = historyData.engagementHistory || [];
      }

      // Create session
      const sessionId = `session_${Date.now()}_${userId}`;
      const session: SessionContext = {
        sessionId,
        userId,
        startTime: new Date(),
        lastActivityTime: new Date(),
        currentFlow: this.determineInitialFlow(userContext),
        flowState: {
          flowType: this.determineInitialFlow(userContext),
          currentStep: 'start',
          completedSteps: [],
          collectedData: {},
          canResume: false,
        },
        messages: [],
        cachedProfile: userProfile || undefined, // Convert null to undefined for type compatibility
        cachedContext: userContext,
      };

      logger.info(`Session created with cached profile`, {
        sessionId,
        hasProfile: !!session.cachedProfile,
        profileName: session.cachedProfile?.name,
        profileDonations: session.cachedProfile?.totalDonations,
        profileInterests: session.cachedProfile?.interests
      });

      this.activeSessions.set(sessionId, session);
      
      // Record session initialization in analytics
      await this.analyticsMCP.executeTool({
        name: 'record_interaction',
        arguments: {
          userId,
          interaction: {
            type: 'session_start',
            timestamp: new Date(),
            metadata: { sessionId },
          },
        },
      });

      logger.info(`Session ${sessionId} initialized for user ${userId} with flow: ${session.currentFlow}`);

      return session;
    } catch (error) {
      logger.error(`Error initializing session for user ${userId}`, error as Error);
      throw error;
    }
  }

  /**
   * Process user input and generate response
   * Integrates with all MCP servers based on intent
   */
  async processInput(userId: string, input: UserInput, sessionId: string): Promise<AgentResponse> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      logger.info(`Processing input for session ${sessionId}: "${input.text}"`);

      // Update last activity time
      session.lastActivityTime = new Date();

      // Add user message to conversation history
      const userMessage: Message = {
        role: 'user',
        content: input.text,
        timestamp: input.timestamp || new Date(),
        metadata: input.metadata,
      };
      session.messages.push(userMessage);

      // Recognize intent
      const intent = await this.intentService.recognizeIntent(input.text, session.cachedContext);
      logger.info(`Intent detected: ${intent.primaryIntent} (confidence: ${intent.confidence})`);

      // Update flow based on intent
      this.updateFlow(session, intent);

      // Process based on intent and integrate with appropriate MCP servers
      let responseText: string;
      let uiComponents: any[] = [];
      let requiresUserInput = true;

      switch (intent.primaryIntent) {
        case 'profile_update':
          ({ responseText, uiComponents } = await this.handleProfileUpdate(session, input.text, intent));
          break;
          
        case 'personal_disclosure':
          ({ responseText, uiComponents } = await this.handlePersonalDisclosure(session, input.text, intent));
          break;
          
        case 'support_inquiry':
          ({ responseText, uiComponents } = await this.handleSupportInquiry(session, input.text, intent));
          break;
          
        case 'dashboard':
          ({ responseText, uiComponents } = await this.handleDashboard(session));
          break;
        
        case 'information_seeking':
          ({ responseText, uiComponents } = await this.handleInformationSeeking(session, input.text, intent));
          break;
        
        case 'personalization':
          ({ responseText, uiComponents } = await this.handlePersonalization(session, input.text, intent));
          break;
        
        case 'action':
          ({ responseText, uiComponents } = await this.handleAction(session, input.text, intent));
          break;
        
        default:
          responseText = await this.handleUnclear(session, input.text);
          break;
      }

      // Add assistant message to conversation history
      const assistantMessage: Message = {
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        metadata: {
          intent: intent.primaryIntent,
          confidence: intent.confidence,
        },
      };
      session.messages.push(assistantMessage);

      // Record interaction in analytics
      await this.analyticsMCP.executeTool({
        name: 'record_interaction',
        arguments: {
          userId,
          interaction: {
            type: 'message',
            timestamp: new Date(),
            intent: intent.primaryIntent,
            sentiment: this.detectSentiment(input.text),
            metadata: {
              sessionId,
              userInput: input.text,
              response: responseText,
            },
          },
        },
      });

      // Update context with interaction
      if (session.cachedContext) {
        session.cachedContext.engagementHistory.push({
          recordId: `eng_${Date.now()}`,
          userId: session.userId,
          type: 'campaign',
          timestamp: new Date(),
          metadata: {
            sessionId,
            intent: intent.primaryIntent,
            userInput: input.text,
            response: responseText,
          },
        });
        session.cachedContext.version += 1;
        session.cachedContext.lastUpdated = new Date();
      }

      const response: AgentResponse = {
        text: responseText,
        uiComponents,
        nextAction: intent.suggestedFlow,
        requiresUserInput,
        sessionId,
        metadata: {
          intent: intent.primaryIntent,
          confidence: intent.confidence,
          entities: intent.entities,
        },
      };

      logger.info(`Response generated for session ${sessionId}`);
      return response;
    } catch (error) {
      logger.error(`Error processing input for session ${sessionId}`, error as Error);
      throw error;
    }
  }

  /**
   * Resume an existing session
   * Restores context from Context Management Service
   */
  async resumeSession(sessionId: string): Promise<SessionContext> {
    try {
      logger.info(`Resuming session ${sessionId}`);

      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Refresh user context from Context Management Service
      const userContext = await this.contextService.getContext(session.userId);
      if (userContext) {
        session.cachedContext = userContext;
        session.cachedProfile = userContext.profile;
      }

      // Refresh user profile from MCP server
      const profileResult = await this.userProfileMCP.executeTool({
        name: 'get_user_profile',
        arguments: { userId: session.userId },
      });

      if (!profileResult.isError && profileResult.content[0]?.resource) {
        session.cachedProfile = profileResult.content[0].resource as UserProfile;
        if (session.cachedContext) {
          session.cachedContext.profile = session.cachedProfile;
        }
      }

      session.lastActivityTime = new Date();
      
      // Record session resumption in analytics
      await this.analyticsMCP.executeTool({
        name: 'record_interaction',
        arguments: {
          userId: session.userId,
          interaction: {
            type: 'session_resume',
            timestamp: new Date(),
            metadata: { sessionId },
          },
        },
      });

      logger.info(`Session ${sessionId} resumed`);

      return session;
    } catch (error) {
      logger.error(`Error resuming session ${sessionId}`, error as Error);
      throw error;
    }
  }

  /**
   * End a session and persist context
   * Saves all session data to Context Management Service
   */
  async endSession(sessionId: string): Promise<void> {
    try {
      logger.info(`Ending session ${sessionId}`);

      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Persist updated context to Context Management Service
      if (session.cachedContext) {
        await this.contextService.updateContext(session.userId, session.cachedContext);
      }

      // Record session end in analytics
      await this.analyticsMCP.executeTool({
        name: 'record_interaction',
        arguments: {
          userId: session.userId,
          interaction: {
            type: 'session_end',
            timestamp: new Date(),
            metadata: {
              sessionId,
              duration: Date.now() - session.startTime.getTime(),
              messageCount: session.messages.length,
            },
          },
        },
      });

      // Remove session from active sessions
      this.activeSessions.delete(sessionId);
      logger.info(`Session ${sessionId} ended and context persisted`);
    } catch (error) {
      logger.error(`Error ending session ${sessionId}`, error as Error);
      throw error;
    }
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): SessionContext | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): SessionContext[] {
    return Array.from(this.activeSessions.values()).filter(
      session => session.userId === userId
    );
  }

  /**
   * Update flow based on detected intent
   */
  private updateFlow(session: SessionContext, intent: IntentResult): void {
    switch (intent.primaryIntent) {
      case 'personalization':
        session.currentFlow = 'personalization';
        session.flowState.flowType = 'personalization';
        break;
      case 'information_seeking':
        session.currentFlow = 'information_seeking';
        session.flowState.flowType = 'information_seeking';
        break;
      case 'action':
        session.currentFlow = 'personalization';
        session.flowState.flowType = 'action';
        break;
      default:
        session.currentFlow = 'idle';
        session.flowState.flowType = 'idle';
    }

    session.flowState.canResume = true;
  }

  /**
   * Handle profile update intent
   */
  private async handleProfileUpdate(
    session: SessionContext,
    input: string,
    intent: IntentResult
  ): Promise<{ responseText: string; uiComponents: any[] }> {
    logger.info('Handling profile update intent');

    const userName = session.cachedProfile?.name || 'there';
    
    const responseText = `Of course, ${userName}! I can help you update your profile. What would you like to update?\n\n` +
      `You can tell me about:\n` +
      `• Personal connections to cancer\n` +
      `• Your interests and preferences\n` +
      `• Communication preferences\n` +
      `• Any other information you'd like to share\n\n` +
      `Just let me know what you'd like to update, and I'll make sure your profile reflects your current situation.`;

    return { responseText, uiComponents: [] };
  }

  /**
   * Handle personal disclosure (cancer diagnosis, family connection)
   */
  private async handlePersonalDisclosure(
    session: SessionContext,
    input: string,
    intent: IntentResult
  ): Promise<{ responseText: string; uiComponents: any[] }> {
    logger.info('Handling personal disclosure with empathy');

    const userName = session.cachedProfile?.name || 'there';
    const cancerEntity = intent.entities.find(e => e.type === 'cancer_type');
    const relationshipEntity = intent.entities.find(e => e.type === 'relationship');
    
    // Extract cancer type and relationship
    const cancerType = cancerEntity?.value || 'cancer';
    const relationship = relationshipEntity?.value || 'loved one';
    
    // Build empathetic response
    let responseText = `${userName}, I'm truly sorry to hear about your ${relationship}'s diagnosis. `;
    responseText += `This must be a very difficult time for you and your family.\n\n`;
    
    responseText += `Cancer Research UK is here to support you. We have:\n`;
    responseText += `• Information about ${cancerType.replace('-', ' ')} and treatment options\n`;
    responseText += `• Support services for families affected by cancer\n`;
    responseText += `• Research updates on the latest breakthroughs\n`;
    responseText += `• Ways you can help fund life-saving research\n\n`;
    
    responseText += `I've updated your profile to reflect your connection to ${cancerType.replace('-', ' ')}. `;
    responseText += `This helps me provide you with the most relevant information and support.\n\n`;
    
    responseText += `Would you like to learn more about ${cancerType.replace('-', ' ')}, find support services, or explore ways to help fund research?`;

    const uiComponents = [{
      type: 'empathy_card',
      data: {
        cancerType,
        relationship,
        supportResources: [
          { title: `Understanding ${cancerType.replace('-', ' ')}`, url: '#' },
          { title: 'Support for families', url: '#' },
          { title: 'Latest research updates', url: '#' },
        ],
      },
    }];

    return { responseText, uiComponents };
  }

  /**
   * Handle support inquiry ("How can I support CRUK?")
   */
  private async handleSupportInquiry(
    session: SessionContext,
    input: string,
    intent: IntentResult
  ): Promise<{ responseText: string; uiComponents: any[] }> {
    const profile = session.cachedProfile;
    
    logger.info('Handling support inquiry', {
      hasProfile: !!profile,
      profileName: profile?.name,
      profileInterests: profile?.interests,
      profileLocation: profile?.location,
      profileDonations: profile?.totalDonations,
      profileDonationCount: profile?.donationCount,
      fullProfile: profile
    });

    const userName = profile?.name || 'there';
    const AVERAGE_REGULAR_DONATION = 10; // £10/month average
    const isRegularGiver = (profile?.totalDonations || 0) > 0 && (profile?.donationCount || 0) > 1;
    const monthlyAmount = isRegularGiver && profile?.totalDonations && profile?.donationCount 
      ? profile.totalDonations / profile.donationCount 
      : 0;
    const isGenerousDonor = monthlyAmount > AVERAGE_REGULAR_DONATION;
    
    // Personalize based on profile
    let responseText = `Thank you for wanting to support Cancer Research UK, ${userName}! `;
    responseText += `There are many meaningful ways you can help us beat cancer:\n\n`;
    
    // Check for cycling/race-for-life interests
    const hasCyclingInterest = profile?.interests?.some((interest: string) => 
      interest.toLowerCase().includes('cycling')
    ) || false;
    
    // Check for running/race-for-life interests
    const hasRunningInterest = profile?.interests?.some((interest: string) => 
      interest.toLowerCase().includes('running') || 
      interest.toLowerCase().includes('race-for-life')
    ) || false;
    
    let ctaNumber = 1;
    
    // PRIORITY 1A: Interest-based CTAs (running/Race for Life) - show first for engaged supporters
    if (hasRunningInterest && profile?.location) {
      responseText += `**${ctaNumber}. Fundraise Through Race for Life**\n`;
      responseText += `Since you're interested in running, you might love Race for Life events in ${profile.location}! `;
      responseText += `You can walk, jog, or run to raise funds and honor loved ones affected by cancer. `;
      responseText += `We'll support you every step of the way.\n\n`;
      ctaNumber++;
    }
    
    // PRIORITY 1B: Interest-based CTAs (cycling) - show first for engaged supporters
    if (hasCyclingInterest && profile?.location) {
      responseText += `**${ctaNumber}. Fundraise Through Cycling Events**\n`;
      responseText += `Since you're interested in cycling, you might love the London to Brighton Cycle Ride 2026! `;
      responseText += `You can also organize your own cycling challenge or join one of our other sponsored rides. `;
      responseText += `We'll support you every step of the way.\n\n`;
      ctaNumber++;
    }
    
    // PRIORITY 2: Cancer-specific donation (if loved one affected)
    if (profile?.lovedOneAffected && profile?.cancerType) {
      const cancerTypeName = profile.cancerType.replace('-', ' ');
      responseText += `**${ctaNumber}. Fund ${cancerTypeName} Research**\n`;
      responseText += `Your donation directly supports research into ${cancerTypeName}, helping find better treatments and ultimately a cure. `;
      if (isGenerousDonor) {
        responseText += `Your current support of £${monthlyAmount.toFixed(0)}/month is incredibly generous and makes a huge difference. `;
        responseText += `You're welcome to increase your regular giving at any time if you'd like to do even more.\n\n`;
      } else if (isRegularGiver) {
        responseText += `Even a small monthly donation makes a huge difference.\n\n`;
      } else {
        responseText += `You can make a one-time donation or set up regular monthly giving.\n\n`;
      }
      ctaNumber++;
    } else if (!isRegularGiver) {
      // Only show general donation CTA if not already a regular giver
      responseText += `**${ctaNumber}. Make a Donation**\n`;
      responseText += `Your donation funds life-saving research across all cancer types. Every pound helps us get closer to beating cancer.\n\n`;
      ctaNumber++;
    }
    
    // PRIORITY 3: Regular giving (only for non-regular givers or generous donors)
    if (!isRegularGiver) {
      responseText += `**${ctaNumber}. Become a Regular Giver**\n`;
      responseText += `Regular monthly donations provide steady funding for long-term research projects. `;
      responseText += `You can start from as little as £5 per month.\n\n`;
      ctaNumber++;
    } else if (isGenerousDonor) {
      // Thank generous donors
      responseText += `**${ctaNumber}. Your Incredible Generosity**\n`;
      responseText += `Thank you for your regular support of £${monthlyAmount.toFixed(0)}/month - you're giving more than our average supporter! `;
      responseText += `Your commitment is funding long-term research projects. You're welcome to increase your giving at any time.\n\n`;
      ctaNumber++;
    }
    
    // PRIORITY 4: Fundraising (if not already shown as cycling)
    if (!hasCyclingInterest) {
      responseText += `**${ctaNumber}. Fundraise for Us**\n`;
      if (profile?.location) {
        responseText += `Join an event in ${profile.location} or create your own fundraising campaign. `;
      } else {
        responseText += `Join one of our events or create your own fundraising campaign. `;
      }
      responseText += `We'll support you every step of the way.\n\n`;
      ctaNumber++;
    }
    
    // PRIORITY 5: Volunteer
    responseText += `**${ctaNumber}. Volunteer Your Time**\n`;
    responseText += `Help in your local community, at events, or with our campaigns. Your time and skills make a real impact.\n\n`;
    ctaNumber++;
    
    // PRIORITY 6: Spread Awareness
    responseText += `**${ctaNumber}. Spread Awareness**\n`;
    responseText += `Share our research updates, cancer prevention information, and fundraising campaigns with your network.\n\n`;
    
    responseText += `Which of these options interests you most? I can provide more details about any of them.`;

    const uiComponents = [{
      type: 'call_to_action',
      data: {
        type: 'support_options',
        options: this.buildSupportOptions(profile, hasCyclingInterest, hasRunningInterest, isRegularGiver, isGenerousDonor, monthlyAmount),
      },
    }];

    return { responseText, uiComponents };
  }

  /**
   * Build support options for UI components
   */
  private buildSupportOptions(
    profile: UserProfile | undefined,
    hasCyclingInterest: boolean,
    hasRunningInterest: boolean,
    isRegularGiver: boolean,
    isGenerousDonor: boolean,
    monthlyAmount: number
  ): any[] {
    const options: any[] = [];

    // Interest-based fundraising first - running/Race for Life
    if (hasRunningInterest) {
      options.push({
        title: 'Fundraise Through Race for Life',
        description: 'Walk, jog, or run to raise funds and honor loved ones',
        action: 'fundraise_running',
      });
    }

    // Interest-based fundraising - cycling
    if (hasCyclingInterest) {
      options.push({
        title: 'Fundraise Through Cycling',
        description: 'London to Brighton Cycle Ride 2026 and other cycling challenges',
        action: 'fundraise_cycling',
      });
    }

    // Cancer-specific donation
    if (profile?.cancerType) {
      options.push({
        title: `Fund ${profile.cancerType.replace('-', ' ')} Research`,
        description: isGenerousDonor 
          ? `Current: £${monthlyAmount.toFixed(0)}/month - Thank you!`
          : 'One-time or monthly donation',
        suggestedAmounts: isGenerousDonor 
          ? [Math.ceil(monthlyAmount * 1.2), Math.ceil(monthlyAmount * 1.5), Math.ceil(monthlyAmount * 2)]
          : [10, 25, 50, 100],
        action: 'donate',
      });
    } else if (!isRegularGiver) {
      options.push({
        title: 'Make a Donation',
        description: 'One-time or monthly donation',
        suggestedAmounts: [10, 25, 50, 100],
        action: 'donate',
      });
    }

    // Regular giving (only for non-regular givers)
    if (!isRegularGiver) {
      options.push({
        title: 'Become a Regular Giver',
        description: 'Monthly support from £5',
        suggestedAmounts: [5, 10, 20],
        action: 'regular_giving',
      });
    }

    // General fundraising (if not cycling)
    if (!hasCyclingInterest) {
      options.push({
        title: 'Fundraise',
        description: 'Create your own campaign',
        action: 'fundraise',
      });
    }

    // Volunteer
    options.push({
      title: 'Volunteer',
      description: 'Give your time and skills',
      action: 'volunteer',
    });

    return options;
  }

  /**
   * Handle dashboard request
   */
  private async handleDashboard(
    session: SessionContext
  ): Promise<{ responseText: string; uiComponents: any[] }> {
    logger.info('Handling dashboard request', {
      sessionId: session.sessionId,
      hasCachedProfile: !!session.cachedProfile,
      profileName: session.cachedProfile?.name,
      profileDonations: session.cachedProfile?.totalDonations,
      profileInterests: session.cachedProfile?.interests
    });

    const userName = session.cachedProfile?.name || 'there';
    const profile = session.cachedProfile;
    
    let responseText = `Welcome, ${userName}! Here's your personalized dashboard:\n\n`;
    
    // Donation summary
    if (profile && profile.totalDonations > 0) {
      responseText += `**Your Impact**\n`;
      responseText += `• Total donated: £${profile.totalDonations.toFixed(2)}\n`;
      responseText += `• Number of donations: ${profile.donationCount}\n`;
      if (profile.lastDonationDate) {
        const lastDate = new Date(profile.lastDonationDate);
        responseText += `• Last donation: ${lastDate.toLocaleDateString()}\n`;
      }
      responseText += `\n`;
    }
    
    // Personalized content based on interests
    if (profile?.interests && profile.interests.length > 0) {
      responseText += `**Recommended for You**\n`;
      responseText += `Based on your interests in ${profile.interests.join(', ')}:\n`;
      responseText += `• Latest research updates\n`;
      responseText += `• Support resources\n`;
      responseText += `• Upcoming events\n\n`;
    }
    
    // Cancer-specific content
    if (profile?.cancerType) {
      const cancerTypeName = profile.cancerType.replace('-', ' ');
      responseText += `**${cancerTypeName.charAt(0).toUpperCase() + cancerTypeName.slice(1)} Resources**\n`;
      responseText += `• Understanding ${cancerTypeName}\n`;
      responseText += `• Latest ${cancerTypeName} research\n`;
      responseText += `• Support for families\n\n`;
    }
    
    responseText += `What would you like to explore today?`;

    const uiComponents = [{
      type: 'dashboard',
      data: {
        userName,
        totalDonations: profile?.totalDonations || 0,
        donationCount: profile?.donationCount || 0,
        interests: profile?.interests || [],
        cancerType: profile?.cancerType,
        recommendedContent: [],
      },
    }];

    return { responseText, uiComponents };
  }

  /**
   * Handle information seeking intent
   * Integrates with Knowledge Base MCP Server
   */
  private async handleInformationSeeking(
    session: SessionContext,
    query: string,
    intent: IntentResult
  ): Promise<{ responseText: string; uiComponents: any[] }> {
    logger.info('Handling information seeking intent', { query });

    // Search knowledge base using MCP server
    const searchResult = await this.knowledgeBaseMCP.executeTool({
      name: 'search_knowledge_base',
      arguments: {
        query,
        filters: {
          cancerTypes: intent.entities
            .filter(e => e.type === 'cancer_type')
            .map(e => e.value),
        },
      },
    });

    let responseText: string;
    const uiComponents: any[] = [];

    if (!searchResult.isError && searchResult.content[0]?.resource) {
      const searchData = searchResult.content[0].resource as any;
      const articles = searchData.articles || [];

      if (articles.length > 0) {
        responseText = `I found ${articles.length} article${articles.length > 1 ? 's' : ''} about "${query}" from Cancer Research UK:\n\n`;
        
        articles.slice(0, 3).forEach((article: any, index: number) => {
          responseText += `${index + 1}. ${article.title}\n   ${article.summary}\n   ${article.url}\n\n`;
        });

        responseText += 'Does this help answer your question? Would you like to explore any of these topics further?';

        uiComponents.push({
          type: 'search_results',
          data: {
            query,
            articles: articles.slice(0, 5),
            source: 'CRUK Knowledge Base',
          },
        });
      } else {
        responseText = `I couldn't find specific articles about "${query}", but I can help you explore related topics. What aspect of cancer information are you most interested in?`;
      }
    } else {
      responseText = 'I encountered an issue searching our knowledge base. Could you rephrase your question or try a different topic?';
    }

    return { responseText, uiComponents };
  }

  /**
   * Handle personalization intent
   * Integrates with User Profile and Transaction MCP Servers
   */
  private async handlePersonalization(
    session: SessionContext,
    input: string,
    intent: IntentResult
  ): Promise<{ responseText: string; uiComponents: any[] }> {
    logger.info('Handling personalization intent', { input });

    const userName = session.cachedProfile?.name || 'there';
    const profile = session.cachedProfile;
    let responseText: string;
    const uiComponents: any[] = [];

    // Check if user is asking about impact
    const isImpactQuery = intent.entities.some(e => e.type === 'query_type' && e.value === 'impact');

    if (isImpactQuery) {
      return await this.handleImpact(session, input, intent);
    }

    // Get donation summary from Transaction MCP Server
    const donationResult = await this.transactionMCP.executeTool({
      name: 'get_donation_summary',
      arguments: { userId: session.userId },
    });

    // Get featured research papers from Research Papers MCP Server
    const researchResult = await this.researchPapersMCP.executeTool({
      name: 'get_featured_papers',
      arguments: { limit: 3 },
    });

    if (!donationResult.isError && donationResult.content[0]?.resource) {
      const summary = donationResult.content[0].resource as any;
      
      responseText = `Hi ${userName}! Thank you for your continued support. `;
      
      if (summary.totalAmount > 0) {
        responseText += `You've donated £${summary.totalAmount.toFixed(2)} across ${summary.transactionCount} donation${summary.transactionCount > 1 ? 's' : ''}. `;
        responseText += `Your generosity is helping fund vital cancer research. `;
      }

      responseText += `\n\nWould you like to see your personalized dashboard or learn more about how your donations are making an impact?`;

      uiComponents.push({
        type: 'dashboard',
        data: {
          userName,
          totalDonations: summary.totalAmount,
          donationCount: summary.transactionCount,
          suggestedNextAmount: summary.suggestedNextAmount,
        },
      });
    } else {
      responseText = `Hi ${userName}! I can help you personalize your experience with Cancer Research UK. What would you like to explore - your profile, donation options, or ways to get involved?`;
    }

    // Add featured research if available
    if (!researchResult.isError && researchResult.content[0]?.resource) {
      const researchData = researchResult.content[0].resource as any;
      if (researchData.papers && researchData.papers.length > 0) {
        uiComponents.push({
          type: 'featured_research',
          data: {
            papers: researchData.papers,
          },
        });
      }
    }

    return { responseText, uiComponents };
  }

  /**
   * Handle impact queries with full personalization
   * Prioritizes user's explicit query over profile preferences
   */
  private async handleImpact(
    session: SessionContext,
    input: string,
    intent: IntentResult
  ): Promise<{ responseText: string; uiComponents: any[] }> {
    logger.info('Handling impact query with personalization', { 
      input, 
      entities: intent.entities,
      profileCancerType: session.cachedProfile?.cancerType,
      profileDonations: session.cachedProfile?.totalDonations
    });

    const userName = session.cachedProfile?.name || 'there';
    const profile = session.cachedProfile;
    const uiComponents: any[] = [];

    // PRIORITY 1: Check if user specified cancer type in their query
    const queryCancerEntity = intent.entities.find(e => e.type === 'cancer_type');
    const queryCancerType = queryCancerEntity?.value;
    
    // PRIORITY 2: Fall back to profile cancer type
    const cancerType = queryCancerType || profile?.cancerType;
    const cancerTypeName = cancerType ? cancerType.replace('-', ' ') : 'cancer';
    
    // Get donation summary
    let donationAmount = profile?.totalDonations || 0;
    let donationCount = profile?.donationCount || 0;
    let lastDonationDate = profile?.lastDonationDate;
    
    // Try to get more detailed donation info from Transaction MCP
    try {
      const donationResult = await this.transactionMCP.executeTool({
        name: 'get_donation_summary',
        arguments: { userId: session.userId },
      });
      
      if (!donationResult.isError && donationResult.content[0]?.resource) {
        const summary = donationResult.content[0].resource as any;
        donationAmount = summary.totalAmount || donationAmount;
        donationCount = summary.transactionCount || donationCount;
      }
    } catch (error) {
      logger.warn('Could not fetch detailed donation summary, using profile data', error as Error);
    }

    // Build personalized impact response
    let responseText = `${userName}, thank you for asking! Your support is making a real difference in the fight against cancer.\n\n`;
    
    // Personal donation impact
    if (donationAmount > 0) {
      responseText += `**Your Personal Contribution**\n`;
      responseText += `You've donated £${donationAmount.toFixed(2)}`;
      if (donationCount > 1) {
        responseText += ` across ${donationCount} donation${donationCount > 1 ? 's' : ''}`;
      }
      if (lastDonationDate) {
        const monthsAgo = Math.floor((Date.now() - new Date(lastDonationDate).getTime()) / (1000 * 60 * 60 * 24 * 30));
        if (monthsAgo > 0) {
          responseText += `, with your last donation ${monthsAgo} month${monthsAgo > 1 ? 's' : ''} ago`;
        }
      }
      responseText += `. Every pound you give helps fund life-saving research.\n\n`;
    }
    
    // Cancer-specific impact (prioritize query cancer type over profile)
    if (cancerType) {
      responseText += `**${cancerTypeName.charAt(0).toUpperCase() + cancerTypeName.slice(1)} Research Impact**\n`;
      responseText += this.getCancerSpecificImpact(cancerType, profile);
      responseText += `\n\n`;
    }
    
    // Interest-based impact
    if (profile?.interests && profile.interests.length > 0) {
      const interestImpact = this.getInterestBasedImpact(profile.interests);
      if (interestImpact) {
        responseText += `**Research Areas You Care About**\n`;
        responseText += interestImpact;
        responseText += `\n\n`;
      }
    }
    
    // General CRUK achievements
    responseText += `**Cancer Research UK's Overall Impact**\n`;
    responseText += `• Cancer survival has doubled in the last 40 years\n`;
    responseText += `• We've helped develop 50+ cancer drugs used worldwide\n`;
    responseText += `• £443m committed to research in 2021/22\n`;
    responseText += `• Supporting 500+ PhD students and researchers\n\n`;
    
    responseText += `Your support is part of this incredible progress. Thank you for being part of our mission to beat cancer sooner.`;

    return { responseText, uiComponents };
  }

  /**
   * Get cancer-specific impact statements
   */
  private getCancerSpecificImpact(cancerType: string, profile?: UserProfile): string {
    const impactMap: Record<string, string> = {
      'lung-cancer': `Lung cancer research is advancing rapidly:\n` +
        `• The TRACERx study is tracking 815 patients to understand how lung cancer evolves\n` +
        `• New targeted therapies are improving survival rates\n` +
        `• Early detection programs are catching lung cancer sooner\n` +
        (profile?.interests?.some(i => i.toLowerCase().includes('biomarker')) 
          ? `• Biomarker research is helping identify the best treatments for each patient\n`
          : ''),
      
      'breast-cancer': `Breast cancer research has transformed outcomes:\n` +
        `• 10-year survival has increased from 40% in the 1970s to almost 80% today\n` +
        `• If diagnosed at the earliest stage, 98% survive 5+ years\n` +
        `• Tamoxifen helps prevent breast cancer returning after surgery\n` +
        `• New immunotherapies are showing promising results\n`,
      
      'bowel-cancer': `Bowel cancer research is saving lives:\n` +
        `• Screening programs are catching cancer earlier\n` +
        `• New treatments are improving survival rates\n` +
        `• Research into prevention is identifying risk factors\n`,
      
      'prostate-cancer': `Prostate cancer research is advancing:\n` +
        `• Better diagnostic tools are reducing unnecessary biopsies\n` +
        `• New treatments are targeting aggressive cancers\n` +
        `• Research is helping distinguish slow-growing from aggressive cancers\n`,
      
      'blood-cancer': `Blood cancer research is making breakthroughs:\n` +
        `• New immunotherapies are achieving remarkable results\n` +
        `• CAR-T cell therapy is transforming treatment\n` +
        `• Research is improving bone marrow transplant success rates\n`,
    };
    
    return impactMap[cancerType] || `Research into ${cancerType.replace('-', ' ')} is advancing every day, bringing us closer to better treatments and ultimately a cure.\n`;
  }

  /**
   * Get impact statements based on user interests
   */
  private getInterestBasedImpact(interests: string[]): string {
    const interestMap: Record<string, string> = {
      'biomarker': `• Biomarker research is helping match patients to the most effective treatments\n`,
      'biomarkers': `• Biomarker research is helping match patients to the most effective treatments\n`,
      'immunotherapy': `• Immunotherapy breakthroughs are helping the immune system fight cancer\n`,
      'early-detection': `• Early detection research is catching cancer at more treatable stages\n`,
      'prevention': `• Prevention research is identifying ways to reduce cancer risk\n`,
      'treatment': `• Treatment research is developing more effective and less toxic therapies\n`,
    };
    
    let impact = '';
    interests.forEach(interest => {
      const lowerInterest = interest.toLowerCase();
      for (const [key, value] of Object.entries(interestMap)) {
        if (lowerInterest.includes(key)) {
          impact += value;
          break;
        }
      }
    });
    
    return impact;
  }

  /**
   * Get personalized impact statements based on user profile
   * Returns 3-5 impact statements, prioritizing user interests
   */
  private getImpactStatements(profile?: UserProfile): Array<{ title: string; description: string }> {
    const allStatements = [
      // General impact
      {
        title: 'Cancer Survival Has Doubled',
        description: 'Cancer survival in the UK has doubled over the past 40 years thanks to research. 10+ year survival has increased from 1 in 4 people in the 1970s to 2 in 4 today, with an ambition of 3 in 4 by 2034.',
        interests: ['general']
      },
      {
        title: '£443m Committed to Research',
        description: 'In 2021/22, CRUK committed £443m to research spanning discover, detect, prevent and treat. This funding supports 500+ PhD students and researchers throughout their careers.',
        interests: ['general', 'research']
      },
      {
        title: '50+ Cancer Drugs Developed',
        description: 'CRUK-funded science has contributed to the development of 50+ cancer drugs used worldwide. In the UK, 125,000+ patients a year are treated with these drugs.',
        interests: ['general', 'treatment']
      },
      // Breast cancer specific
      {
        title: 'Breast Cancer Survival Transformed',
        description: 'Breast cancer 10+ year survival has increased from 4 in 10 women in the 1970s to almost 8 in 10 today. If diagnosed at the earliest stage, 98% survive 5+ years.',
        interests: ['breast-cancer', 'breast-cancer-research']
      },
      {
        title: 'Tamoxifen Breakthrough',
        description: 'CRUK\'s founding organisations funded work showing tamoxifen can help prevent breast cancer returning after surgery and can help prevent breast cancer in high-risk women.',
        interests: ['breast-cancer', 'breast-cancer-research']
      },
      // Early detection
      {
        title: 'Early Detection Saves Lives',
        description: 'CRUK is pushing for NHS changes to catch cancer earlier, including bowel screening improvements, targeted lung health check pilots, and specialist diagnostic centres.',
        interests: ['early-detection', 'prevention']
      },
      {
        title: 'HPV Vaccine Success',
        description: 'Research found the HPV vaccine reduced cervical cancer rates by almost 90% in women in their 20s who were offered it at age 12-13.',
        interests: ['early-detection', 'prevention']
      },
      // Research innovation
      {
        title: 'TRACERx Lung Cancer Study',
        description: '250 investigators at 13 UK hospital sites are tracking samples from 815 people with non-small cell lung cancer over time, leading to breakthroughs in understanding cancer evolution.',
        interests: ['research', 'immunotherapy']
      },
    ];

    // Filter and prioritize based on user interests
    let prioritized: Array<{ title: string; description: string }> = [];
    let general: Array<{ title: string; description: string }> = [];

    allStatements.forEach(statement => {
      const matchesInterest = profile?.interests?.some(interest => 
        statement.interests.some(statementInterest => 
          interest.toLowerCase().includes(statementInterest.toLowerCase()) ||
          statementInterest.toLowerCase().includes(interest.toLowerCase())
        )
      );

      if (matchesInterest && statement.interests[0] !== 'general') {
        prioritized.push({ title: statement.title, description: statement.description });
      } else if (statement.interests.includes('general')) {
        general.push({ title: statement.title, description: statement.description });
      }
    });

    // Combine: 2-3 interest-based + 2 general = 4-5 total
    const result = [...prioritized.slice(0, 3), ...general.slice(0, 2)];
    
    // Ensure we have at least 3 statements
    if (result.length < 3) {
      return [...result, ...general.slice(result.length - prioritized.length)].slice(0, 5);
    }

    return result.slice(0, 5);
  }

  /**
   * Handle action intent
   * Integrates with Transaction MCP Server for donation suggestions
   */
  private async handleAction(
    session: SessionContext,
    input: string,
    intent: IntentResult
  ): Promise<{ responseText: string; uiComponents: any[] }> {
    logger.info('Handling action intent', { input });

    const userName = session.cachedProfile?.name || 'there';
    const actionType = intent.entities.find(e => e.type === 'action_type')?.value || 'support';
    
    let responseText: string;
    const uiComponents: any[] = [];

    // Get donation summary for personalized suggestions
    const donationResult = await this.transactionMCP.executeTool({
      name: 'get_donation_summary',
      arguments: { userId: session.userId },
    });

    if (actionType === 'donation') {
      responseText = `That's wonderful, ${userName}! Every donation helps fund life-saving cancer research. `;
      
      if (!donationResult.isError && donationResult.content[0]?.resource) {
        const summary = donationResult.content[0].resource as any;
        const suggested = summary.suggestedNextAmount || 25;
        
        responseText += `Based on your previous support, we suggest a donation of £${suggested}. `;
        responseText += `Of course, any amount you can give makes a real difference.`;

        uiComponents.push({
          type: 'call_to_action',
          data: {
            type: 'donate',
            suggestedAmounts: [suggested * 0.5, suggested, suggested * 2],
            message: 'Your donation funds vital research',
          },
        });
      } else {
        responseText += `Would you like to make a one-time donation or become a regular giver?`;
        
        uiComponents.push({
          type: 'call_to_action',
          data: {
            type: 'donate',
            suggestedAmounts: [10, 25, 50],
            message: 'Start supporting cancer research today',
          },
        });
      }
    } else {
      responseText = `Great to see your interest in ${actionType}, ${userName}! `;
      responseText += `There are many ways to support Cancer Research UK. Would you like to learn more about volunteering, fundraising, or participating in events?`;
    }

    return { responseText, uiComponents };
  }

  /**
   * Handle unclear intent
   */
  private async handleUnclear(session: SessionContext, input: string): Promise<string> {
    logger.info('Handling unclear intent', { input });

    const userName = session.cachedProfile?.name || 'there';
    
    return `Hi ${userName}, I want to make sure I understand how I can help you. Are you looking for:\n` +
           `1. Information about cancer (symptoms, treatment, prevention)\n` +
           `2. Ways to support Cancer Research UK (donate, volunteer, fundraise)\n` +
           `3. Your personalized dashboard and impact summary\n\n` +
           `Please let me know what interests you most!`;
  }

  /**
   * Determine initial flow based on user context
   * Implements Requirements 1.3, 1.4, 1.5
   */
  private determineInitialFlow(context: UserContext): 'personalization' | 'information_seeking' | 'idle' {
    const profile = context.profile;

    // If user has engagement history, show dashboard (personalization flow)
    if (context.engagementHistory.length > 0 || profile.donationCount > 0) {
      return 'personalization';
    }

    // If user has only basic information, start simplified personalization
    if (profile.name && profile.email && !profile.personallyAffected && !profile.lovedOneAffected) {
      return 'personalization';
    }

    // New user with no context - start idle and wait for intent
    return 'idle';
  }

  /**
   * Detect sentiment from user input (simple implementation)
   */
  private detectSentiment(input: string): 'positive' | 'negative' | 'neutral' {
    const lowerInput = input.toLowerCase();
    
    const positiveWords = ['thank', 'great', 'wonderful', 'excellent', 'love', 'happy', 'good'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'frustrated'];
    
    const positiveCount = positiveWords.filter(word => lowerInput.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerInput.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Create default user context
   */
  private createDefaultContext(userId: string, profile?: UserProfile | null): UserContext {
    const defaultProfile: UserProfile = profile || {
      userId,
      email: '',
      name: '',
      totalDonations: 0,
      donationCount: 0,
      hasAttendedEvents: false,
      hasFundraised: false,
      hasVolunteered: false,
      isResearcher: false,
      isJournalist: false,
      isPhilanthropist: false,
      personallyAffected: false,
      lovedOneAffected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      consentGiven: false,
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
        preferredFrequency: 'monthly',
      },
      interests: [],
    };

    return {
      userId,
      profile: defaultProfile,
      preferences: {
        preferredTopics: [],
        preferredCancerTypes: [],
        notificationSettings: {
          email: true,
          sms: false,
          push: false,
        },
      },
      engagementHistory: [],
      lastUpdated: new Date(),
      version: 1,
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.contextService.close();
  }
}
