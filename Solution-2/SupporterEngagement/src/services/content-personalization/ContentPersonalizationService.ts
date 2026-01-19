import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { MotivationalContent, UserContext, IntentResult } from '../../models';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';

interface GeneratedContent {
  id: string;
  type: 'text' | 'recommendation' | 'response';
  text: string;
  metadata: Record<string, any>;
  timestamp: string;
}

export class ContentPersonalizationService {
  private bedrockClient: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({ region: config.aws.region });
    this.modelId = config.bedrock.modelId;
  }

  /**
   * Generate personalized content based on user context and intent
   */
  async generateContent(
    intent: IntentResult,
    userContext: UserContext,
    contentType: 'text' | 'recommendation' | 'response'
  ): Promise<GeneratedContent> {
    try {
      const content = await this.generateWithRules(intent, userContext, contentType);
      
      logger.info(`Generated ${contentType} content for intent ${intent.primaryIntent}`);
      return content;
    } catch (error) {
      logger.error('Error generating personalized content', error as Error);
      throw error;
    }
  }

  /**
   * Generate content using rule-based approach (demo/fallback)
   */
  private async generateWithRules(
    intent: IntentResult,
    userContext: UserContext,
    contentType: string
  ): Promise<GeneratedContent> {
    const userName = userContext.profile?.name || 'there';
    
    switch (intent.primaryIntent) {
      case 'personalization':
        return this.generatePersonalizationContent(intent, userName);
      
      case 'information_seeking':
        return this.generateInformationContent(intent, userName);
      
      case 'action':
        return this.generateActionContent(intent, userName);
      
      default:
        return this.generateDefaultContent(userName);
    }
  }

  /**
   * Generate personalization content
   */
  private generatePersonalizationContent(intent: IntentResult, userName: string): GeneratedContent {
    return {
      id: `content_${Date.now()}`,
      type: 'response',
      text: `Hi ${userName}! I can help you personalize your experience. What would you like to update - your profile or preferences?`,
      metadata: {
        intent: intent.primaryIntent,
        personalized: true,
        tone: 'helpful',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate information-seeking content
   */
  private generateInformationContent(intent: IntentResult, userName: string): GeneratedContent {
    const cancerType = intent.entities.find(e => e.type === 'cancer_type')?.value || 'cancer';
    const topic = intent.entities.find(e => e.type === 'topic')?.value || 'information';
    
    return {
      id: `content_${Date.now()}`,
      type: 'response',
      text: `Hi ${userName}, I can help you learn about ${cancerType} ${topic}. Cancer Research UK provides trusted, evidence-based information to help you understand cancer better. Would you like to explore our resources on this topic?`,
      metadata: {
        intent: intent.primaryIntent,
        personalized: true,
        tone: 'informative',
        cancerType,
        topic,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate action content
   */
  private generateActionContent(intent: IntentResult, userName: string): GeneratedContent {
    const actionType = intent.entities.find(e => e.type === 'action_type')?.value || 'action';
    
    return {
      id: `content_${Date.now()}`,
      type: 'response',
      text: `Great to see your interest in ${actionType}, ${userName}! Taking action is a fantastic way to support cancer research. How would you like to get started?`,
      metadata: {
        intent: intent.primaryIntent,
        personalized: true,
        tone: 'encouraging',
        actionType,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate default content
   */
  private generateDefaultContent(userName: string): GeneratedContent {
    return {
      id: `content_${Date.now()}`,
      type: 'response',
      text: `Welcome, ${userName}! How can I help you today? You can learn about cancer, find support, donate, or discover our latest research.`,
      metadata: {
        intent: 'unclear',
        personalized: true,
        tone: 'welcoming',
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate recommendations based on user history
   */
  async generateRecommendations(userContext: UserContext, limit: number = 3): Promise<GeneratedContent[]> {
    const recommendations: GeneratedContent[] = [];
    
    // Analyze engagement history
    const interests = this.analyzeInterests(userContext);
    
    // Generate recommendations based on interests
    if (interests.includes('research')) {
      recommendations.push({
        id: `rec_${Date.now()}_1`,
        type: 'recommendation',
        text: 'Latest Research: Breakthrough in immunotherapy shows promising results',
        metadata: {
          category: 'research',
          relevanceScore: 0.9,
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    if (interests.includes('support')) {
      recommendations.push({
        id: `rec_${Date.now()}_2`,
        type: 'recommendation',
        text: 'Support Services: Connect with others in our online community',
        metadata: {
          category: 'support',
          relevanceScore: 0.85,
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    if (interests.includes('donation')) {
      recommendations.push({
        id: `rec_${Date.now()}_3`,
        type: 'recommendation',
        text: 'Make an Impact: Your monthly donation can fund vital research',
        metadata: {
          category: 'donation',
          relevanceScore: 0.8,
        },
        timestamp: new Date().toISOString(),
      });
    }
    
    return recommendations.slice(0, limit);
  }

  /**
   * Analyze user interests from engagement history
   */
  private analyzeInterests(userContext: UserContext): string[] {
    const interests: Set<string> = new Set();
    
    // Analyze engagement history
    if (userContext.engagementHistory) {
      for (const engagement of userContext.engagementHistory) {
        if (engagement.metadata?.page) {
          const page = engagement.metadata.page as string;
          if (page.includes('research')) {
            interests.add('research');
          }
          if (page.includes('support')) {
            interests.add('support');
          }
          if (page.includes('donate')) {
            interests.add('donation');
          }
        }
      }
    }
    
    // Default interests if no history
    if (interests.size === 0) {
      interests.add('research');
      interests.add('support');
    }
    
    return Array.from(interests);
  }

  /**
   * Use Bedrock for advanced content generation (production)
   */
  private async generateWithBedrock(
    intent: IntentResult,
    userContext: UserContext,
    contentType: string
  ): Promise<GeneratedContent> {
    try {
      const prompt = this.buildContentPrompt(intent, userContext, contentType);
      
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt,
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return {
        id: `content_${Date.now()}`,
        type: contentType as any,
        text: responseBody.completion || responseBody.text,
        metadata: {
          intent: intent.primaryIntent,
          personalized: true,
          generatedBy: 'bedrock',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error calling Bedrock for content generation', error as Error);
      // Fallback to rule-based generation
      return this.generateWithRules(intent, userContext, contentType);
    }
  }

  /**
   * Build prompt for Bedrock
   */
  private buildContentPrompt(intent: IntentResult, userContext: UserContext, contentType: string): string {
    const userName = userContext.profile?.name || 'there';
    
    return `Generate personalized content for Cancer Research UK website.

User Intent: ${intent.primaryIntent}
Intent Entities: ${JSON.stringify(intent.entities)}
User Name: ${userName}
Content Type: ${contentType}

Guidelines:
- Be warm, supportive, and empathetic
- Use CRUK's tone of voice: inspiring, hopeful, and action-oriented
- Keep it concise and clear
- Include a call-to-action when appropriate
- Ensure medical information is accurate and evidence-based

Generate the content:`;
  }
}
