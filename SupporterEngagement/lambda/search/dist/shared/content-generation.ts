import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { 
  UserContext, 
  MotivationalContent, 
  CallToAction, 
  ResearchPaper,
  Donation,
  ImpactItem,
  Achievement
} from './types';
import { searchResearchPapers } from './data-access';

// Environment variables
const AWS_REGION = process.env.AWS_REGION || 'us-west-2';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20240620-v1:0';

/**
 * Content Generation Service
 * 
 * Generates personalized content including motivational messages and calls to action.
 * Uses Amazon Bedrock with Claude 3.5 Sonnet for content generation.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4
 */
export class ContentGenerationService {
  private bedrockClient: BedrockRuntimeClient;
  private modelId: string;

  constructor(region?: string, modelId?: string) {
    this.bedrockClient = new BedrockRuntimeClient({ 
      region: region || AWS_REGION 
    });
    this.modelId = modelId || BEDROCK_MODEL_ID;
  }

  /**
   * Generate motivational content based on user context
   * 
   * Requirement 6.1: Produce relevant information about CRUK's achievements
   * Requirement 6.2: Tailor content based on user context
   * Requirement 6.3: Retrieve high-impact research papers relevant to supporter's interests
   * Requirement 6.4: Present achievement information in inspiring format
   * 
   * @param context - User context for personalization
   * @returns Motivational content with achievements and personalized message
   */
  async generateMotivationalContent(context: UserContext): Promise<MotivationalContent> {
    try {
      // Build prompt for motivational content
      const prompt = this.buildMotivationalPrompt(context);
      
      // Call Bedrock
      const response = await this.invokeBedrockModel(prompt);
      
      // Parse response
      const content = this.parseMotivationalResponse(response);
      
      return content;
    } catch (error) {
      console.error('Error generating motivational content:', error);
      
      // Return fallback content
      return this.getFallbackMotivationalContent(context);
    }
  }

  /**
   * Generate personalized call to action
   * 
   * Requirement 7.1: Present a call to action at the final stage
   * Requirement 7.2: Recommend donation amounts based on previous behavior
   * Requirement 7.3: Present "become a regular giver" for supporters with capacity
   * Requirement 7.4: Tailor CTA based on user context (skills, location, interests)
   * 
   * @param context - User context for personalization
   * @returns Personalized call to action
   */
  async generateCallToAction(context: UserContext): Promise<CallToAction> {
    try {
      // Build prompt for CTA
      const prompt = this.buildCallToActionPrompt(context);
      
      // Call Bedrock
      const response = await this.invokeBedrockModel(prompt);
      
      // Parse response
      const cta = this.parseCallToActionResponse(response, context);
      
      return cta;
    } catch (error) {
      console.error('Error generating call to action:', error);
      
      // Return fallback CTA
      return this.getFallbackCallToAction(context);
    }
  }

  /**
   * Select research papers relevant to user context
   * 
   * Requirement 6.3: Retrieve high-impact research papers relevant to supporter's interests
   * 
   * @param context - User context for personalization
   * @param limit - Maximum number of papers to return
   * @param researchPapersTableName - DynamoDB table name for research papers
   * @returns Array of relevant research papers
   */
  async selectResearchPapers(
    context: UserContext, 
    limit: number,
    researchPapersTableName: string
  ): Promise<ResearchPaper[]> {
    try {
      // Extract relevant tags from user context
      const tags = this.extractRelevantTags(context);
      const cancerTypes = context.profile.cancerType ? [context.profile.cancerType] : undefined;
      
      // Search for papers matching user interests
      const papers = await searchResearchPapers(
        researchPapersTableName,
        undefined, // No text query
        tags.length > 0 ? tags : undefined,
        cancerTypes,
        limit
      );
      
      // Sort by relevance (featured first, then by citations)
      papers.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.citations - a.citations;
      });
      
      return papers;
    } catch (error) {
      console.error('Error selecting research papers:', error);
      return [];
    }
  }

  /**
   * Format impact breakdown from donations
   * 
   * Requirement 6.4: Present achievement information in inspiring format
   * 
   * @param donations - Array of user donations
   * @returns Array of impact items showing what donations funded
   */
  async formatImpactBreakdown(donations: Donation[]): Promise<ImpactItem[]> {
    try {
      // Calculate total donation amount
      const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0);
      
      // Define impact metrics (based on CRUK's actual impact data)
      const impactMetrics = [
        { threshold: 25, description: 'hours of groundbreaking research', perPound: 0.5, icon: '🔬' },
        { threshold: 50, description: 'cancer information booklets', perPound: 0.2, icon: '📚' },
        { threshold: 100, description: 'days of vital equipment use', perPound: 0.1, icon: '🏥' },
        { threshold: 250, description: 'patient support sessions', perPound: 0.05, icon: '🤝' },
        { threshold: 500, description: 'clinical trials supported', perPound: 0.01, icon: '💊' }
      ];
      
      // Calculate impact items based on total amount
      const impactItems: ImpactItem[] = [];
      
      for (const metric of impactMetrics) {
        if (totalAmount >= metric.threshold) {
          const quantity = Math.floor(totalAmount * metric.perPound);
          if (quantity > 0) {
            impactItems.push({
              description: metric.description,
              quantity,
              icon: metric.icon
            });
          }
        }
      }
      
      // If no impact items (very small donation), add a generic one
      if (impactItems.length === 0 && totalAmount > 0) {
        impactItems.push({
          description: 'contribution to cancer research',
          quantity: 1,
          icon: '❤️'
        });
      }
      
      return impactItems;
    } catch (error) {
      console.error('Error formatting impact breakdown:', error);
      return [];
    }
  }

  /**
   * Build prompt for motivational content generation
   */
  private buildMotivationalPrompt(context: UserContext): string {
    const profile = context.profile;
    const interests = context.preferences.interests.join(', ') || 'cancer research';
    const personalConnection = profile.personallyAffected || profile.lovedOneAffected;
    const cancerType = profile.cancerType || 'cancer';
    
    return `You are a content writer for Cancer Research UK, creating inspiring and motivational content for supporters.

User Context:
- Name: ${profile.name}
- Total Donations: £${profile.totalDonations}
- Donation Count: ${profile.donationCount}
- Interests: ${interests}
- Personally Affected: ${profile.personallyAffected}
- Loved One Affected: ${profile.lovedOneAffected}
- Cancer Type: ${cancerType}
- Has Fundraised: ${profile.hasFundraised}
- Has Volunteered: ${profile.hasVolunteered}

Your task is to create motivational content that:
1. Highlights CRUK's recent achievements and breakthroughs
2. Shows the real-world impact of supporter contributions
3. Is personalized to the user's interests and connection to cancer
4. Is inspiring, warm, and authentic (following CRUK's tone of voice)
5. Focuses on hope, progress, and the power of collective action

${personalConnection ? `The user has a personal connection to ${cancerType}. Be empathetic and acknowledge their journey while focusing on hope and progress.` : ''}

Respond in the following JSON format:
{
  "headline": "Compelling headline (max 60 characters)",
  "body": "Main motivational message (2-3 paragraphs, warm and inspiring)",
  "achievements": [
    {
      "title": "Achievement title",
      "description": "Brief description of the achievement",
      "date": "2024-01-15",
      "impact": "Real-world impact statement"
    }
  ],
  "personalizedMessage": "Personal message to the supporter (1-2 sentences)"
}

Include 2-3 recent achievements that are relevant to the user's interests.
Keep the tone warm, optimistic, and grounded in facts.
Avoid medical jargon and keep language accessible.

Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Build prompt for call to action generation
   */
  private buildCallToActionPrompt(context: UserContext): string {
    const profile = context.profile;
    const avgDonation = profile.donationCount > 0 
      ? profile.totalDonations / profile.donationCount 
      : 0;
    const hasCapacityForRegularGiving = profile.donationCount >= 2 && avgDonation >= 10;
    
    return `You are creating a personalized call to action for a Cancer Research UK supporter.

User Context:
- Name: ${profile.name}
- Total Donations: £${profile.totalDonations}
- Donation Count: ${profile.donationCount}
- Average Donation: £${avgDonation.toFixed(2)}
- Has Fundraised: ${profile.hasFundraised}
- Has Volunteered: ${profile.hasVolunteered}
- Location: ${profile.location || 'UK'}
- Interests: ${context.preferences.interests.join(', ') || 'cancer research'}
- Has Capacity for Regular Giving: ${hasCapacityForRegularGiving}

Your task is to create a personalized call to action that:
1. Recommends the most appropriate action (donate, volunteer, fundraise, campaign)
2. Is tailored to the user's history, location, and interests
3. ${hasCapacityForRegularGiving ? 'MUST include "become a regular giver" as an option' : 'Suggests appropriate one-time or recurring actions'}
4. Includes suggested donation amounts based on previous behavior (if applicable)
5. Is compelling but not pushy

Respond in the following JSON format:
{
  "type": "donate|volunteer|fundraise|campaign",
  "title": "Compelling CTA title",
  "description": "Description of the action and its impact (2-3 sentences)",
  "suggestedAmounts": [10, 25, 50, 100],
  "actionUrl": "https://www.cancerresearchuk.org/donate"
}

For donation CTAs:
- Suggest amounts based on previous donations (slightly higher to encourage growth)
- Include at least 4 suggested amounts
- Round to nice numbers (5, 10, 25, 50, 100, etc.)

For other CTAs:
- Omit suggestedAmounts
- Provide appropriate actionUrl

Respond ONLY with valid JSON, no additional text.`;
  }

  /**
   * Invoke Bedrock model with prompt
   */
  private async invokeBedrockModel(prompt: string): Promise<string> {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      temperature: 0.7, // Higher temperature for creative content
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
   * Parse motivational content response
   */
  private parseMotivationalResponse(response: string): MotivationalContent {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Parse achievements with date conversion
      const achievements: Achievement[] = (parsed.achievements || []).map((a: any) => ({
        title: a.title || 'CRUK Achievement',
        description: a.description || '',
        date: new Date(a.date || Date.now()),
        impact: a.impact || ''
      }));
      
      return {
        headline: parsed.headline || 'Together, we\'re beating cancer',
        body: parsed.body || 'Your support is making a real difference in the fight against cancer.',
        achievements,
        personalizedMessage: parsed.personalizedMessage || 'Thank you for your continued support.'
      };
    } catch (error) {
      console.error('Error parsing motivational response:', error);
      throw error;
    }
  }

  /**
   * Parse call to action response
   */
  private parseCallToActionResponse(response: string, context: UserContext): CallToAction {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate type
      const validTypes = ['donate', 'volunteer', 'fundraise', 'campaign'];
      const type = validTypes.includes(parsed.type) ? parsed.type : 'donate';
      
      return {
        type: type as 'donate' | 'volunteer' | 'fundraise' | 'campaign',
        title: parsed.title || 'Support Cancer Research UK',
        description: parsed.description || 'Your support helps us beat cancer sooner.',
        suggestedAmounts: parsed.suggestedAmounts || undefined,
        actionUrl: parsed.actionUrl || 'https://www.cancerresearchuk.org/donate'
      };
    } catch (error) {
      console.error('Error parsing call to action response:', error);
      throw error;
    }
  }

  /**
   * Get fallback motivational content (when Bedrock fails)
   */
  private getFallbackMotivationalContent(context: UserContext): MotivationalContent {
    return {
      headline: 'Together, we\'re beating cancer',
      body: `Thanks to supporters like you, ${context.profile.name}, we're making incredible progress in cancer research. Every contribution brings us closer to a world where everyone can live longer, better lives, free from the fear of cancer. Your generosity is funding groundbreaking research, supporting patients and families, and helping us work towards our vision of beating cancer.`,
      achievements: [
        {
          title: 'Groundbreaking Research',
          description: 'Our scientists have made significant advances in understanding cancer biology',
          date: new Date('2024-01-15'),
          impact: 'Leading to new treatment possibilities for thousands of patients'
        },
        {
          title: 'Patient Support',
          description: 'We\'ve provided vital information and support to cancer patients and their families',
          date: new Date('2024-02-01'),
          impact: 'Helping people navigate their cancer journey with confidence'
        }
      ],
      personalizedMessage: 'Your continued support is making a real difference. Thank you for being part of our community.'
    };
  }

  /**
   * Get fallback call to action (when Bedrock fails)
   */
  private getFallbackCallToAction(context: UserContext): CallToAction {
    const profile = context.profile;
    const avgDonation = profile.donationCount > 0 
      ? profile.totalDonations / profile.donationCount 
      : 25;
    
    // Calculate suggested amounts based on average
    const baseAmount = Math.ceil(avgDonation / 5) * 5;
    const suggestedAmounts = [
      Math.max(10, baseAmount),
      Math.max(25, baseAmount * 1.5),
      Math.max(50, baseAmount * 2),
      Math.max(100, baseAmount * 3)
    ].map(a => Math.round(a));
    
    return {
      type: 'donate',
      title: 'Continue your impact',
      description: 'Your donations fund vital cancer research and support services. Every pound brings us closer to beating cancer sooner.',
      suggestedAmounts,
      actionUrl: 'https://www.cancerresearchuk.org/donate'
    };
  }

  /**
   * Extract relevant tags from user context for research paper selection
   */
  private extractRelevantTags(context: UserContext): string[] {
    const tags: string[] = [];
    
    // Add interests as tags
    tags.push(...context.preferences.interests);
    
    // Add cancer type if available
    if (context.profile.cancerType) {
      tags.push(context.profile.cancerType);
    }
    
    // Add activity-based tags
    if (context.profile.isResearcher) {
      tags.push('research', 'clinical-trials');
    }
    
    if (context.profile.personallyAffected || context.profile.lovedOneAffected) {
      tags.push('patient-support', 'treatment');
    }
    
    return tags;
  }
}

// Export singleton instance
export const contentGenerationService = new ContentGenerationService();
