/**
 * Missing Data Handler
 * Detects missing profile fields and generates appropriate questions
 * Implements progressive data collection without blocking feature access
 */

import { UserProfile, UserContext, UIComponent } from '../../models';
import { logger } from '../../utils/logger';

/**
 * Missing field information
 */
export interface MissingField {
  field: string;
  question: string;
  priority: 'high' | 'medium' | 'low';
  fieldType: 'text' | 'number' | 'select' | 'multiselect';
  options?: string[];
}

/**
 * Missing data result
 */
export interface MissingDataResult {
  hasMissingData: boolean;
  missingFields: MissingField[];
  uiComponents: UIComponent[];
  message: string;
  canProceed: boolean; // Always true - never block access
}

/**
 * Missing Data Handler
 * Detects and handles missing profile data gracefully
 */
export class MissingDataHandler {
  /**
   * Analyze user context for missing data
   */
  async analyzeMissingData(context: UserContext): Promise<MissingDataResult> {
    logger.info('Analyzing missing data', {
      userId: context.userId,
      userName: context.profile.name,
    });

    const missingFields = this.detectMissingFields(context.profile);
    const hasMissingData = missingFields.length > 0;

    // Generate UI components for missing data prompt
    const uiComponents: UIComponent[] = [];
    if (hasMissingData) {
      uiComponents.push(this.createMissingDataPrompt(missingFields));
      uiComponents.push(this.createSearchBar());
    }

    const message = this.generateMessage(missingFields, context.profile.name);

    logger.info('Missing data analysis complete', {
      userId: context.userId,
      hasMissingData,
      missingFieldsCount: missingFields.length,
    });

    return {
      hasMissingData,
      missingFields,
      uiComponents,
      message,
      canProceed: true, // Never block access (Req 11.4)
    };
  }

  /**
   * Detect missing fields in user profile
   */
  private detectMissingFields(profile: UserProfile): MissingField[] {
    const missing: MissingField[] = [];

    // High priority fields (Req 11.2 - age and gender)
    if (!profile.age) {
      missing.push({
        field: 'age',
        question: 'What is your age? This helps us provide age-appropriate information.',
        priority: 'high',
        fieldType: 'number',
      });
    }

    if (!profile.gender) {
      missing.push({
        field: 'gender',
        question: 'What is your gender? This helps us personalize health information.',
        priority: 'high',
        fieldType: 'select',
        options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
      });
    }

    // Medium priority fields
    if (!profile.location) {
      missing.push({
        field: 'location',
        question: 'Where are you located? This helps us show local events and services.',
        priority: 'medium',
        fieldType: 'text',
      });
    }

    if (!profile.personallyAffected && !profile.lovedOneAffected) {
      missing.push({
        field: 'cancer_relationship',
        question: 'Have you or a loved one been affected by cancer? This helps us provide relevant support.',
        priority: 'medium',
        fieldType: 'select',
        options: [
          'I have been diagnosed with cancer',
          'A loved one has been diagnosed',
          'Both',
          'Neither - I support the cause',
          'Prefer not to say',
        ],
      });
    }

    // Low priority fields
    if (profile.interests.length === 0) {
      missing.push({
        field: 'interests',
        question: 'What topics interest you most? Select all that apply.',
        priority: 'low',
        fieldType: 'multiselect',
        options: [
          'Research and breakthroughs',
          'Prevention and early detection',
          'Treatment options',
          'Support services',
          'Fundraising and events',
          'Volunteering opportunities',
        ],
      });
    }

    // Sort by priority
    return missing.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Create missing data prompt UI component (Req 11.1)
   */
  private createMissingDataPrompt(missingFields: MissingField[]): UIComponent {
    return {
      type: 'missing_data_prompt',
      data: {
        title: 'Help us personalize your experience',
        description: 'Answer a few quick questions to get the most relevant information for you.',
        fields: missingFields,
        canSkip: true, // Users can always skip (Req 11.4)
        skipText: 'Maybe later',
      },
    };
  }

  /**
   * Create search bar UI component (Req 11.3)
   */
  private createSearchBar(): UIComponent {
    return {
      type: 'search_bar',
      data: {
        placeholder: 'what are you looking for today',
        alwaysVisible: true, // Always show search bar (Req 11.3, 12.1)
      },
    };
  }

  /**
   * Generate message for missing data
   */
  private generateMessage(missingFields: MissingField[], userName: string): string {
    if (missingFields.length === 0) {
      return `Welcome back, ${userName}! Your profile is complete.`;
    }

    const highPriorityCount = missingFields.filter((f) => f.priority === 'high').length;

    if (highPriorityCount > 0) {
      return `Hi ${userName}! We'd love to personalize your experience. Could you share a bit more about yourself? You can skip this and explore anytime.`;
    }

    return `Hi ${userName}! Help us show you the most relevant content by completing your profile. Or feel free to search for what you need right now.`;
  }

  /**
   * Generate questions for specific missing fields
   */
  async generateQuestionsForFields(fields: string[]): Promise<MissingField[]> {
    logger.debug('Generating questions for specific fields', { fields });

    const allFields = this.detectMissingFields({
      userId: '',
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
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
        preferredFrequency: 'monthly',
      },
      interests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      consentGiven: true,
    });

    return allFields.filter((f) => fields.includes(f.field));
  }

  /**
   * Process user responses to missing data questions
   */
  async processResponses(
    userId: string,
    responses: Record<string, any>
  ): Promise<{ success: boolean; message: string }> {
    logger.info('Processing missing data responses', {
      userId,
      fieldsProvided: Object.keys(responses),
    });

    // In a real implementation, this would update the user profile
    // via the User Profile MCP server
    // For now, we just validate and acknowledge

    const providedFields = Object.keys(responses);
    if (providedFields.length === 0) {
      return {
        success: false,
        message: 'No data provided',
      };
    }

    logger.info('Missing data responses processed', {
      userId,
      fieldsUpdated: providedFields.length,
    });

    return {
      success: true,
      message: `Thank you! We've updated your profile with ${providedFields.length} new field(s).`,
    };
  }

  /**
   * Check if feature access should be allowed (always true per Req 11.4)
   */
  canAccessFeature(context: UserContext, feature: string): boolean {
    // Never block feature access due to missing data (Req 11.4)
    logger.debug('Checking feature access', {
      userId: context.userId,
      feature,
      allowed: true,
    });

    return true;
  }

  /**
   * Get progressive data collection strategy
   * Returns fields to collect in order of priority
   */
  getProgressiveCollectionStrategy(profile: UserProfile): string[][] {
    const missing = this.detectMissingFields(profile);

    // Group by priority for progressive collection
    const high = missing.filter((f) => f.priority === 'high').map((f) => f.field);
    const medium = missing.filter((f) => f.priority === 'medium').map((f) => f.field);
    const low = missing.filter((f) => f.priority === 'low').map((f) => f.field);

    const strategy: string[][] = [];
    if (high.length > 0) strategy.push(high);
    if (medium.length > 0) strategy.push(medium);
    if (low.length > 0) strategy.push(low);

    logger.debug('Progressive collection strategy', {
      stages: strategy.length,
      totalFields: missing.length,
    });

    return strategy;
  }
}
