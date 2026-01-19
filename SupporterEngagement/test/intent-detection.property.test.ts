import * as fc from 'fast-check';
import { IntentDetectionService } from '../lambda/intent-detection/index';
import { IntentResult, UserContext, UserProfile, UserPreferences, EngagementRecord } from '../lambda/shared/types';

/**
 * Property-Based Tests for Intent Detection Universality
 * Feature: supporter-engagement-platform, Property 4: Intent Detection Universality
 * Validates: Requirements 4.1, 4.2
 * 
 * NOTE: These tests make real calls to AWS Bedrock. Ensure you have:
 * - AWS credentials configured
 * - Access to Bedrock in your AWS account
 * - Model access enabled for Claude Sonnet 4.5
 */
describe('Property 4: Intent Detection Universality', () => {
  let intentService: IntentDetectionService;

  beforeEach(() => {
    // Use real AWS Bedrock with global cross-region inference profile
    intentService = new IntentDetectionService('us-east-1', 'global.anthropic.claude-sonnet-4-5-20250929-v1:0');
  });

  // Arbitraries for generating random test data
  const userIdArbitrary = fc.uuid();
  
  const nameArbitrary = fc.string({ minLength: 1, maxLength: 50 });
  
  const emailArbitrary = fc.emailAddress();
  
  const interestsArbitrary = fc.array(
    fc.oneof(
      fc.constant('Race for Life'),
      fc.constant('Breast Cancer'),
      fc.constant('Research'),
      fc.constant('Fundraising'),
      fc.constant('Volunteering')
    ),
    { minLength: 0, maxLength: 5 }
  );

  const communicationPreferencesArbitrary = fc.record({
    email: fc.boolean(),
    sms: fc.boolean(),
    phone: fc.boolean(),
    preferredFrequency: fc.oneof(
      fc.constant('weekly' as const),
      fc.constant('monthly' as const),
      fc.constant('quarterly' as const)
    )
  });

  const userProfileArbitrary: fc.Arbitrary<UserProfile> = fc.record({
    userId: userIdArbitrary,
    email: fc.option(emailArbitrary, { nil: undefined }),
    name: nameArbitrary,
    firstName: fc.option(nameArbitrary, { nil: undefined }),
    lastName: fc.option(nameArbitrary, { nil: undefined }),
    age: fc.option(fc.integer({ min: 18, max: 100 }), { nil: undefined }),
    gender: fc.option(fc.oneof(
      fc.constant('Man'),
      fc.constant('Woman'),
      fc.constant('Non-binary'),
      fc.constant('Prefer not to say')
    ), { nil: undefined }),
    location: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
    totalDonations: fc.nat({ max: 100000 }),
    donationCount: fc.nat({ max: 1000 }),
    firstDonationDate: fc.option(fc.date(), { nil: undefined }),
    lastDonationDate: fc.option(fc.date(), { nil: undefined }),
    hasAttendedEvents: fc.boolean(),
    hasFundraised: fc.boolean(),
    hasVolunteered: fc.boolean(),
    isResearcher: fc.boolean(),
    isJournalist: fc.boolean(),
    isPhilanthropist: fc.boolean(),
    personallyAffected: fc.boolean(),
    lovedOneAffected: fc.boolean(),
    cancerType: fc.option(fc.oneof(
      fc.constant('Breast Cancer'),
      fc.constant('Lung Cancer'),
      fc.constant('Prostate Cancer')
    ), { nil: undefined }),
    interests: interestsArbitrary,
    createdAt: fc.date(),
    updatedAt: fc.date(),
    consentGiven: fc.boolean(),
    consentDate: fc.option(fc.date(), { nil: undefined })
  });

  const engagementRecordArbitrary: fc.Arbitrary<EngagementRecord> = fc.record({
    recordId: fc.uuid(),
    userId: userIdArbitrary,
    type: fc.oneof(
      fc.constant('donation' as const),
      fc.constant('event' as const),
      fc.constant('volunteer' as const),
      fc.constant('fundraise' as const),
      fc.constant('campaign' as const)
    ),
    timestamp: fc.date(),
    donationAmount: fc.option(fc.float({ min: 1, max: 10000, noNaN: true }), { nil: undefined }),
    eventName: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    campaignName: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    impactDescription: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    metadata: fc.constant({})
  });

  const userPreferencesArbitrary: fc.Arbitrary<UserPreferences> = fc.record({
    interests: interestsArbitrary,
    communicationPreferences: communicationPreferencesArbitrary,
    preferredLanguage: fc.option(fc.constant('en'), { nil: undefined })
  });

  const userContextArbitrary: fc.Arbitrary<UserContext> = fc.record({
    userId: userIdArbitrary,
    profile: userProfileArbitrary,
    engagementHistory: fc.array(engagementRecordArbitrary, { minLength: 0, maxLength: 10 }),
    preferences: userPreferencesArbitrary,
    currentFlow: fc.option(fc.record({
      flowType: fc.string({ maxLength: 50 }),
      currentStep: fc.string({ maxLength: 50 }),
      completedSteps: fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 }),
      collectedData: fc.constant({}),
      canResume: fc.boolean()
    }), { nil: undefined }),
    lastUpdated: fc.date(),
    version: fc.integer({ min: 1, max: 100 })
  });

  // Arbitrary for user input queries - using simpler, more predictable queries for real API calls
  const userQueryArbitrary = fc.oneof(
    // Personalization queries
    fc.constant('I want to see my impact'),
    fc.constant('How can I support CRUK?'),
    fc.constant('Show me my donations'),
    
    // Information seeking queries
    fc.constant('What is breast cancer?'),
    fc.constant('Tell me about lung cancer research'),
    fc.constant('How does chemotherapy work?'),
    
    // Action queries
    fc.constant('I want to donate £50'),
    fc.constant('Sign me up for Race for Life'),
    fc.constant('I want to volunteer'),
    
    // Unclear queries
    fc.constant('Hello'),
    fc.constant('Hi there')
  );

  /**
   * Property 4: Intent Detection Universality
   * For any user query, the system should detect an intent classification
   * (personalization, information_seeking, action, or unclear) and route to the appropriate flow.
   * 
   * Validates: Requirements 4.1, 4.2
   */
  it('should detect an intent classification for any user query', async () => {
    await fc.assert(
      fc.asyncProperty(
        userQueryArbitrary,
        fc.option(userContextArbitrary, { nil: undefined }),
        async (query, context) => {
          // Skip empty queries as they're handled separately
          if (!query || query.trim().length === 0) {
            return;
          }

          // Execute intent detection with real Bedrock
          const result = await intentService.detectIntent(query, context);

          // Verify: Requirements 4.1 - Detect whether the intent is information seeking or personalization
          expect(result).toBeDefined();
          expect(result.primaryIntent).toBeDefined();
          
          // Verify: Intent is one of the valid classifications
          const validIntents = ['personalization', 'information_seeking', 'action', 'unclear'];
          expect(validIntents).toContain(result.primaryIntent);

          // Verify: Confidence is a valid number between 0 and 1
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(1);

          // Verify: Entities array is present
          expect(result.entities).toBeDefined();
          expect(Array.isArray(result.entities)).toBe(true);

          // Verify: Requirements 4.2 - Suggested flow is provided for routing
          expect(result.suggestedFlow).toBeDefined();
          expect(typeof result.suggestedFlow).toBe('string');
          expect(result.suggestedFlow.length).toBeGreaterThan(0);

          // Verify: Suggested flow matches the intent
          const validFlows = ['personalization_flow', 'information_seeking_flow', 'action_flow', 'clarification'];
          expect(validFlows).toContain(result.suggestedFlow);
        }
      ),
      { numRuns: 5 } // Reduced runs for real API calls
    );
  }, 60000); // Increased timeout for real API calls

  /**
   * Property 4 (Consistency): Intent and Flow Consistency
   * For any detected intent, the suggested flow should be appropriate for that intent type
   * 
   * Validates: Requirements 4.2
   */
  it('should provide a suggested flow that matches the detected intent', async () => {
    await fc.assert(
      fc.asyncProperty(
        userQueryArbitrary,
        fc.option(userContextArbitrary, { nil: undefined }),
        async (query, context) => {
          // Skip empty queries
          if (!query || query.trim().length === 0) {
            return;
          }

          // Execute intent detection with real Bedrock
          const result = await intentService.detectIntent(query, context);

          // Verify: Flow matches intent
          if (result.primaryIntent === 'personalization') {
            expect(result.suggestedFlow).toBe('personalization_flow');
          } else if (result.primaryIntent === 'information_seeking') {
            expect(result.suggestedFlow).toBe('information_seeking_flow');
          } else if (result.primaryIntent === 'action') {
            expect(result.suggestedFlow).toBe('action_flow');
          } else if (result.primaryIntent === 'unclear') {
            expect(result.suggestedFlow).toBe('clarification');
          }
        }
      ),
      { numRuns: 5 } // Reduced runs for real API calls
    );
  }, 60000); // Increased timeout for real API calls

  /**
   * Property 4 (Error Handling): Graceful Error Handling
   * For any Bedrock error, the system should return an 'unclear' intent
   * rather than crashing
   * 
   * Validates: Requirements 4.1
   * 
   * NOTE: This test uses an invalid model ID to trigger errors
   */
  it('should handle errors gracefully and return unclear intent', async () => {
    // Create service with invalid model to trigger errors
    const errorService = new IntentDetectionService('us-east-1', 'invalid-model-id');
    
    await fc.assert(
      fc.asyncProperty(
        userQueryArbitrary,
        fc.option(userContextArbitrary, { nil: undefined }),
        async (query, context) => {
          // Skip empty queries
          if (!query || query.trim().length === 0) {
            return;
          }

          // Execute intent detection - should handle error gracefully
          const result = await errorService.detectIntent(query, context);

          // Verify: System handles error gracefully
          expect(result).toBeDefined();
          expect(result.primaryIntent).toBe('unclear');
          expect(result.confidence).toBe(0);
          expect(result.suggestedFlow).toBe('clarification');
        }
      ),
      { numRuns: 3 } // Minimal runs since we're testing error handling
    );
  }, 30000); // Timeout for error cases

  /**
   * Property 4 (Entity Extraction): Entity Validation
   * For any entities extracted, they should have valid structure with type, value, and confidence
   * 
   * Validates: Requirements 4.1
   */
  it('should extract entities with valid structure when present', async () => {
    // Use queries that are likely to have entities
    const entityQueryArbitrary = fc.oneof(
      fc.constant('I want to donate £50'),
      fc.constant('Tell me about breast cancer'),
      fc.constant('Sign me up for Race for Life in London')
    );
    
    await fc.assert(
      fc.asyncProperty(
        entityQueryArbitrary,
        fc.option(userContextArbitrary, { nil: undefined }),
        async (query, context) => {
          // Execute intent detection with real Bedrock
          const result = await intentService.detectIntent(query, context);

          // Verify: All entities have required fields
          result.entities.forEach(entity => {
            expect(entity).toHaveProperty('type');
            expect(entity).toHaveProperty('value');
            expect(entity).toHaveProperty('confidence');
            
            expect(typeof entity.type).toBe('string');
            expect(typeof entity.value).toBe('string');
            expect(typeof entity.confidence).toBe('number');
            
            expect(entity.confidence).toBeGreaterThanOrEqual(0);
            expect(entity.confidence).toBeLessThanOrEqual(1);
          });
        }
      ),
      { numRuns: 3 } // Reduced runs for real API calls
    );
  }, 60000); // Increased timeout for real API calls

  /**
   * Property 4 (Context Awareness): Context-Aware Intent Detection
   * For any query with user context, the system should successfully process it
   * (context may influence classification but should not cause errors)
   * 
   * Validates: Requirements 4.1
   */
  it('should successfully detect intent with or without user context', async () => {
    await fc.assert(
      fc.asyncProperty(
        userQueryArbitrary,
        fc.boolean(),
        userContextArbitrary,
        async (query, includeContext, context) => {
          // Skip empty queries
          if (!query || query.trim().length === 0) {
            return;
          }

          // Execute with or without context using real Bedrock
          const result = await intentService.detectIntent(
            query,
            includeContext ? context : undefined
          );

          // Verify: Intent detection succeeds regardless of context presence
          expect(result).toBeDefined();
          expect(result.primaryIntent).toBeDefined();
          expect(['personalization', 'information_seeking', 'action', 'unclear']).toContain(result.primaryIntent);
        }
      ),
      { numRuns: 5 } // Reduced runs for real API calls
    );
  }, 60000); // Increased timeout for real API calls
});
