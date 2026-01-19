import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { IntentResult, IntentType, Entity } from '../../models';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';

export class IntentRecognitionService {
  private bedrockClient: BedrockRuntimeClient;
  private modelId: string;

  constructor() {
    this.bedrockClient = new BedrockRuntimeClient({ region: config.aws.region });
    this.modelId = config.bedrock.modelId;
  }

  /**
   * Recognize intent from user input
   */
  async recognizeIntent(userInput: string, context?: any): Promise<IntentResult> {
    try {
      // For demo purposes, use pattern matching
      // In production, this would use Bedrock for ML-based intent recognition
      const intent = this.patternMatchIntent(userInput);
      
      logger.info(`Intent recognized: ${intent.primaryIntent} (confidence: ${intent.confidence})`);
      return intent;
    } catch (error) {
      logger.error('Error recognizing intent', error as Error);
      throw error;
    }
  }

  /**
   * Pattern-based intent matching (fallback/demo)
   */
  private patternMatchIntent(input: string): IntentResult {
    const lowerInput = input.toLowerCase();
    
    // Profile update patterns (PRIORITY 1 - check first)
    if (lowerInput.includes('update') && (lowerInput.includes('profile') || lowerInput.includes('information') || lowerInput.includes('details'))) {
      return {
        primaryIntent: 'profile_update',
        confidence: 0.95,
        entities: [{ type: 'action', value: 'profile_update', confidence: 0.95 }],
        suggestedFlow: 'profile_update',
      };
    }
    
    // Impact query patterns (PRIORITY 2 - check before support inquiry)
    if ((lowerInput.includes('impact') || lowerInput.includes('difference') || 
         lowerInput.includes('achievement') || lowerInput.includes('contribution') ||
         lowerInput.includes('made')) && 
        (lowerInput.includes('cancer') || lowerInput.includes('research') || 
         lowerInput.includes('donation') || lowerInput.includes('support'))) {
      const entities = this.extractImpactEntities(input);
      return {
        primaryIntent: 'personalization',
        confidence: 0.95,
        entities,
        suggestedFlow: 'personalization',
      };
    }
    
    // Support/action patterns (PRIORITY 3 - check before personal disclosure)
    if ((lowerInput.includes('how') || lowerInput.includes('ways')) && 
        (lowerInput.includes('support') || lowerInput.includes('help')) &&
        (lowerInput.includes('cruk') || lowerInput.includes('cancer research'))) {
      return {
        primaryIntent: 'support_inquiry',
        confidence: 0.90,
        entities: this.extractActionEntities(input),
        suggestedFlow: 'call_to_action',
      };
    }
    
    // Dashboard patterns (PRIORITY 3)
    if (lowerInput.includes('dashboard') || lowerInput.includes('show my')) {
      return {
        primaryIntent: 'dashboard',
        confidence: 0.90,
        entities: [],
        suggestedFlow: 'dashboard',
      };
    }
    
    // Personal disclosure patterns (PRIORITY 4 - check after support inquiry)
    if (lowerInput.includes('diagnosed') || 
        ((lowerInput.includes('mother') || lowerInput.includes('father') || lowerInput.includes('family')) && 
         (lowerInput.includes('breast') || lowerInput.includes('lung') || lowerInput.includes('cancer')))) {
      return {
        primaryIntent: 'personal_disclosure',
        confidence: 0.95,
        entities: this.extractCancerEntities(input),
        suggestedFlow: 'empathy_response',
      };
    }
    
    // Information seeking patterns
    if (lowerInput.includes('what is') || lowerInput.includes('tell me about') || 
        lowerInput.includes('learn about') || lowerInput.includes('information about')) {
      return {
        primaryIntent: 'information_seeking',
        confidence: 0.85,
        entities: this.extractTopicEntities(input),
        suggestedFlow: 'information_seeking',
      };
    }
    
    // Donation/action patterns
    if (lowerInput.includes('donat') || lowerInput.includes('give') || lowerInput.includes('contribute')) {
      return {
        primaryIntent: 'action',
        confidence: 0.85,
        entities: [{ type: 'action_type', value: 'donation', confidence: 0.9 }],
        suggestedFlow: 'donation',
      };
    }
    
    // General personalization patterns
    if (lowerInput.includes('my') || lowerInput.includes('profile') || lowerInput.includes('preference')) {
      return {
        primaryIntent: 'personalization',
        confidence: 0.75,
        entities: this.extractPersonalizationEntities(input),
        suggestedFlow: 'personalization',
      };
    }
    
    // Default to unclear
    return {
      primaryIntent: 'unclear',
      confidence: 0.60,
      entities: [],
      suggestedFlow: 'idle',
    };
  }
  
  /**
   * Extract impact-related entities from impact queries
   */
  private extractImpactEntities(input: string): Entity[] {
    const entities: Entity[] = [];
    const lowerInput = input.toLowerCase();
    
    // Mark as impact query
    entities.push({ type: 'query_type', value: 'impact', confidence: 0.95 });
    
    // Extract cancer type from query (takes priority over profile)
    const cancerTypeMap: Record<string, string> = {
      'breast': 'breast-cancer',
      'lung': 'lung-cancer',
      'prostate': 'prostate-cancer',
      'bowel': 'bowel-cancer',
      'colon': 'bowel-cancer',
      'skin': 'skin-cancer',
      'melanoma': 'skin-cancer',
      'blood': 'blood-cancer',
      'leukemia': 'blood-cancer',
      'leukaemia': 'blood-cancer',
    };
    
    for (const [keyword, cancerType] of Object.entries(cancerTypeMap)) {
      if (lowerInput.includes(keyword)) {
        entities.push({ 
          type: 'cancer_type', 
          value: cancerType, 
          confidence: 0.95,
        });
        break;
      }
    }
    
    return entities;
  }

  /**
   * Extract cancer-related entities from personal disclosures
   */
  private extractCancerEntities(input: string): Entity[] {
    const entities: Entity[] = [];
    const lowerInput = input.toLowerCase();
    
    // Cancer types
    const cancerTypeMap: Record<string, string> = {
      'breast': 'breast-cancer',
      'lung': 'lung-cancer',
      'prostate': 'prostate-cancer',
      'bowel': 'bowel-cancer',
      'colon': 'bowel-cancer',
      'skin': 'skin-cancer',
      'melanoma': 'skin-cancer',
      'blood': 'blood-cancer',
      'leukemia': 'blood-cancer',
      'leukaemia': 'blood-cancer',
    };
    
    for (const [keyword, cancerType] of Object.entries(cancerTypeMap)) {
      if (lowerInput.includes(keyword)) {
        entities.push({ 
          type: 'cancer_type', 
          value: cancerType, 
          confidence: 0.95 
        });
        break;
      }
    }
    
    // Relationship
    if (lowerInput.includes('mother') || lowerInput.includes('mom') || lowerInput.includes('mum')) {
      entities.push({ type: 'relationship', value: 'mother', confidence: 0.95 });
    } else if (lowerInput.includes('father') || lowerInput.includes('dad')) {
      entities.push({ type: 'relationship', value: 'father', confidence: 0.95 });
    } else if (lowerInput.includes('family') || lowerInput.includes('relative')) {
      entities.push({ type: 'relationship', value: 'family', confidence: 0.85 });
    }
    
    // Diagnosis status
    if (lowerInput.includes('diagnosed') || lowerInput.includes('diagnosis')) {
      entities.push({ type: 'status', value: 'diagnosed', confidence: 0.95 });
    }
    
    return entities;
  }

  /**
   * Extract personalization entities
   */
  private extractPersonalizationEntities(input: string): Entity[] {
    const entities: Entity[] = [];
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('profile')) {
      entities.push({ type: 'action', value: 'profile', confidence: 0.9 });
    }
    if (lowerInput.includes('preference')) {
      entities.push({ type: 'action', value: 'preferences', confidence: 0.9 });
    }
    
    return entities;
  }

  /**
   * Extract topic entities
   */
  private extractTopicEntities(input: string): Entity[] {
    const entities: Entity[] = [];
    const lowerInput = input.toLowerCase();
    
    // Cancer types
    const cancerTypes = ['breast', 'lung', 'prostate', 'bowel', 'skin', 'blood'];
    for (const type of cancerTypes) {
      if (lowerInput.includes(type)) {
        entities.push({ type: 'cancer_type', value: type, confidence: 0.85 });
        break;
      }
    }
    
    // Topics
    if (lowerInput.includes('symptom')) {
      entities.push({ type: 'topic', value: 'symptoms', confidence: 0.8 });
    } else if (lowerInput.includes('treatment')) {
      entities.push({ type: 'topic', value: 'treatment', confidence: 0.8 });
    } else if (lowerInput.includes('prevention')) {
      entities.push({ type: 'topic', value: 'prevention', confidence: 0.8 });
    }
    
    return entities;
  }

  /**
   * Extract action entities
   */
  private extractActionEntities(input: string): Entity[] {
    const entities: Entity[] = [];
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('donat')) {
      entities.push({ type: 'action_type', value: 'donation', confidence: 0.9 });
    } else if (lowerInput.includes('register') || lowerInput.includes('sign up')) {
      entities.push({ type: 'action_type', value: 'registration', confidence: 0.85 });
    } else if (lowerInput.includes('volunteer')) {
      entities.push({ type: 'action_type', value: 'volunteering', confidence: 0.85 });
    }
    
    return entities;
  }

  /**
   * Use Bedrock for advanced intent recognition (production)
   */
  private async recognizeIntentWithBedrock(userInput: string, context?: any): Promise<IntentResult> {
    try {
      const prompt = this.buildIntentPrompt(userInput, context);
      
      const command = new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt,
          max_tokens: 200,
          temperature: 0.3,
        }),
      });

      const response = await this.bedrockClient.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      return this.parseBedrockResponse(responseBody);
    } catch (error) {
      logger.error('Error calling Bedrock for intent recognition', error as Error);
      // Fallback to pattern matching
      return this.patternMatchIntent(userInput);
    }
  }

  /**
   * Build prompt for Bedrock
   */
  private buildIntentPrompt(userInput: string, context?: any): string {
    return `Analyze the following user input and identify the intent. 
Possible intents: personalization, information_seeking, action, unclear.

User input: "${userInput}"
${context ? `Context: ${JSON.stringify(context)}` : ''}

Respond with JSON containing: primaryIntent, confidence (0-1), entities (array of {type, value, confidence}), suggestedFlow.`;
  }

  /**
   * Parse Bedrock response
   */
  private parseBedrockResponse(response: any): IntentResult {
    // Parse the response and extract intent information
    // This is a simplified version
    return {
      primaryIntent: response.primaryIntent || 'unclear',
      confidence: response.confidence || 0.5,
      entities: response.entities || [],
      suggestedFlow: response.suggestedFlow || 'idle',
    };
  }
}
