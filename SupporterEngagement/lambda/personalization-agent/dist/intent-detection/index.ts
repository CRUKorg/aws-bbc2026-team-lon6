import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { IntentResult, Entity, UserContext } from '../shared/types';

// Environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-west-2';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20240620-v1:0';

/**
 * Intent Detection Service
 * 
 * Analyzes user input to determine whether the user wants personalization or information seeking.
 * Uses Amazon Bedrock with Claude 3.5 Sonnet for natural language understanding.
 * 
 * Requirements: 4.1, 4.2
 */
export class IntentDetectionService {
  private bedrockClient: BedrockRuntimeClient;
  private modelId: string;

  constructor(region?: string, modelId?: string) {
    this.bedrockClient = new BedrockRuntimeClient({ 
      region: region || AWS_REGION 
    });
    this.modelId = modelId || BEDROCK_MODEL_ID;
  }

  /**
   * Detect user intent from input text
   * 
   * Requirement 4.1: Detect whether the intent is information seeking or personalization
   * Requirement 4.2: Trigger appropriate flow based on detected intent
   * 
   * @param input - User's input text
   * @param context - User context for personalized intent detection
   * @returns IntentResult with classification, confidence, entities, and suggested flow
   */
  async detectIntent(input: string, context?: UserContext): Promise<IntentResult> {
    try {
      // Build prompt for Claude
      const prompt = this.buildIntentDetectionPrompt(input, context);
      
      // Call Bedrock
      const response = await this.invokeBedrockModel(prompt);
      
      // Parse response
      const intentResult = this.parseIntentResponse(response);
      
      return intentResult;
    } catch (error) {
      console.error('Error detecting intent:', error);
      
      // Return unclear intent on error
      return {
        primaryIntent: 'unclear',
        confidence: 0,
        entities: [],
        suggestedFlow: 'clarification'
      };
    }
  }

  /**
   * Build prompt for intent detection
   * Uses prompt engineering to guide Claude to classify intent accurately
   */
  private buildIntentDetectionPrompt(input: string, context?: UserContext): string {
    const contextInfo = context ? `
User Context:
- Name: ${context.profile.name}
- Total Donations: £${context.profile.totalDonations}
- Has Engagement History: ${context.engagementHistory.length > 0}
- Interests: ${context.preferences.interests.join(', ') || 'None'}
- Personally Affected: ${context.profile.personallyAffected}
- Loved One Affected: ${context.profile.lovedOneAffected}
` : '';

    return `You are an intent classification system for Cancer Research UK's supporter engagement platform.

Your task is to analyze user input and classify it into one of four intent categories:

1. **personalization** - User wants to engage with CRUK, learn about personalized ways to support, see their impact, or receive tailored recommendations
2. **information_seeking** - User wants factual information about cancer, research, treatments, or CRUK's work
3. **action** - User wants to take a specific action (donate, volunteer, register for event, etc.)
4. **unclear** - Intent is ambiguous or cannot be determined

${contextInfo}

User Input: "${input}"

Analyze the input and respond in the following JSON format:
{
  "primaryIntent": "personalization|information_seeking|action|unclear",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of classification",
  "entities": [
    {
      "type": "entity_type",
      "value": "entity_value",
      "confidence": 0.0-1.0
    }
  ],
  "suggestedFlow": "flow_name"
}

Entity types to extract:
- cancer_type (e.g., "breast cancer", "lung cancer")
- action_type (e.g., "donate", "volunteer", "fundraise")
- topic (e.g., "research", "treatment", "prevention")
- amount (e.g., "£50", "£100")
- location (e.g., "London", "Manchester")

Suggested flows:
- "personalization_flow" for personalization intent
- "information_seeking_flow" for information seeking intent
- "action_flow" for action intent
- "clarification" for unclear intent

Guidelines:
- Questions about cancer facts, research, or treatments → information_seeking
- Expressions of interest in supporting CRUK or seeing impact → personalization
- Direct requests to donate, sign up, or take action → action
- Greetings or vague statements → unclear
- Consider user context when available to improve classification

Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Invoke Bedrock model with prompt
   */
  private async invokeBedrockModel(prompt: string): Promise<string> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 1000,
      temperature: 0.1, // Low temperature for consistent classification
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload)
    });

    const response = await this.bedrockClient.send(command);
    
    // Parse response body
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extract text from Claude's response
    const text = responseBody.content[0].text;
    
    return text;
  }

  /**
   * Parse Claude's response into IntentResult
   */
  private parseIntentResponse(response: string): IntentResult {
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize intent
      const validIntents = ['personalization', 'information_seeking', 'action', 'unclear'];
      const primaryIntent = validIntents.includes(parsed.primaryIntent) 
        ? parsed.primaryIntent 
        : 'unclear';
      
      // Build IntentResult
      const intentResult: IntentResult = {
        primaryIntent: primaryIntent as 'personalization' | 'information_seeking' | 'action' | 'unclear',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        entities: this.parseEntities(parsed.entities || []),
        suggestedFlow: parsed.suggestedFlow || 'clarification'
      };
      
      return intentResult;
    } catch (error) {
      console.error('Error parsing intent response:', error);
      
      // Return unclear intent on parse error
      return {
        primaryIntent: 'unclear',
        confidence: 0,
        entities: [],
        suggestedFlow: 'clarification'
      };
    }
  }

  /**
   * Parse and validate entities from response
   */
  private parseEntities(entities: any[]): Entity[] {
    return entities
      .filter(e => e.type && e.value)
      .map(e => ({
        type: e.type,
        value: e.value,
        confidence: Math.max(0, Math.min(1, e.confidence || 0.5))
      }));
  }
}

// Export singleton instance
export const intentDetectionService = new IntentDetectionService();

// Export handler for Lambda invocation
export const handler = async (event: any): Promise<any> => {
  try {
    const { input, context } = event;
    
    if (!input) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Input text is required'
        })
      };
    }
    
    const result = await intentDetectionService.detectIntent(input, context);
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error in intent detection handler:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
