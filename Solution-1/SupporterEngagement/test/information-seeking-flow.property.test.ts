import * as fc from 'fast-check';
import { PersonalizationAgent } from '../lambda/personalization-agent/index';
import { UserInput, UserContext, UserProfile, UserPreferences, EngagementRecord } from '../lambda/shared/types';
import * as dynamodbUtils from '../lambda/shared/dynamodb-utils';

// Mock the DynamoDB utilities
jest.mock('../lambda/shared/dynamodb-utils');
jest.mock('../lambda/shared/data-access');
jest.mock('../lambda/intent-detection/index');

/**
 * Property-Based Tests for Information Seeking Feedback Loop
 * Feature: supporter-engagement-platform, Property 14: Information Seeking Feedback Loop
 * Validates: Requirements 5.2, 5.3, 5.4
 * 
 * Property 14: Information Seeking Feedback Loop
 * For any information provision, the system should validate completeness with the user,
 * gather sentiment feedback, and then ask to resume personalization flow.
 */
describe('Property 14: Information Seeking Feedback Loop', () => {
  let agent: PersonalizationAgent;
  
  const mockGetUserProfileFromDb = dynamodbUtils.getUserProfileFromDb as jest.MockedFunction<typeof dynamodbUtils.getUserProfileFromDb>;
  const mockGetUserContextFromDb = dynamodbUtils.getUserContextFromDb as jest.MockedFunction<typeof dynamodbUtils.getUserContextFromDb>;
  const mockSaveUserContextToDb = dynamodbUtils.saveUserContextToDb as jest.MockedFunction<typeof dynamodbUtils.saveUserContextToDb>;
  const mockGetNextContextVersion = dynamodbUtils.getNextContextVersion as jest.MockedFunction<typeof dynamodbUtils.getNextContextVersion>;
  const mockSaveSessionContextToDb = dynamodbUtils.saveSessionContextToDb as jest.MockedFunction<typeof dynamodbUtils.saveSessionContextToDb>;
  const mockGetSessionContextFromDb = dynamodbUtils.getSessionContextFromDb as jest.MockedFunction<typeof dynamodbUtils.getSessionContextFromDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new PersonalizationAgent('test-user-table', 'test-context-table', 'test-session-table');
    
    // Mock IntentDetectionService to return information_seeking intent
    const IntentDetectionService = require('../lambda/intent-detection/index').IntentDetectionService;
    IntentDetectionService.prototype.detectIntent = jest.fn().mockResolvedValue({
      primaryIntent: 'information_seeking',
      confidence: 0.9,
      entities: [],
      suggestedFlow: 'information_seeking_flow'
    });
    
    // Mock ContextManagementService
    const ContextManagementService = require('../lambda/context-management/index').ContextManagementService;
    ContextManagementService.prototype.updateFlowState = jest.fn().mockResolvedValue(undefined);
    
    // Mock data access functions
    const dataAccess = require('../lambda/shared/data-access');
    dataAccess.searchKnowledgeBase = jest.fn().mockResolvedValue([
      {
        articleId: 'article-1',
        title: 'Understanding Breast Cancer',
        summary: 'Comprehensive information about breast cancer',
        content: 'Detailed content about breast cancer...',
        url: 'https://www.cancerresearchuk.org/about-cancer/breast-cancer',
        category: 'Cancer Types',
        tags: ['breast cancer', 'information'],
        cancerTypes: ['breast cancer'],
        publishedDate: new Date(),
        lastUpdated: new Date(),
        author: 'Cancer Research UK',
        readingLevel: 'basic',
        availableLanguages: ['en']
      }
    ]);
    dataAccess.recordInteraction = jest.fn().mockResolvedValue(undefined);
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

  // Arbitrary for information seeking queries
  const informationQueryArbitrary = fc.oneof(
    fc.constant('What is breast cancer?'),
    fc.constant('Tell me about lung cancer research'),
    fc.constant('How does chemotherapy work?'),
    fc.constant('What are the symptoms of prostate cancer?'),
    fc.constant('How can I prevent cancer?')
  );

  // Arbitrary for validation responses
  const validationResponseArbitrary = fc.oneof(
    fc.constant('yes'),
    fc.constant('yes, thank you'),
    fc.constant('that\'s all I needed'),
    fc.constant('perfect, thanks'),
    fc.constant('great, that helps')
  );

  // Arbitrary for feedback text
  const feedbackArbitrary = fc.oneof(
    fc.constant('very helpful'),
    fc.constant('exactly what I needed'),
    fc.constant('clear and informative'),
    fc.constant('useful information'),
    fc.constant('good, thanks')
  );

  /**
   * Property 14: Information Seeking Feedback Loop
   * For any information provision, the system should:
   * 1. Validate completeness with the user (Requirement 5.2)
   * 2. Gather sentiment feedback (Requirement 5.3)
   * 3. Ask to resume personalization flow (Requirement 5.4)
   */
  it('should complete the feedback loop for any information seeking interaction', async () => {
    await fc.assert(
      fc.asyncProperty(
        userContextArbitrary,
        informationQueryArbitrary,
        validationResponseArbitrary,
        feedbackArbitrary,
        async (userContext, query, validationResponse, feedback) => {
          const userId = userContext.userId;
          const sessionId = `session-${userId}-${Date.now()}`;
          
          // Setup mocks with session tracking
          mockGetUserProfileFromDb.mockResolvedValue(userContext.profile);
          mockGetUserContextFromDb.mockResolvedValue(userContext);
          mockGetNextContextVersion.mockResolvedValue(userContext.version + 1);
          mockSaveUserContextToDb.mockResolvedValue({
            ...userContext,
            version: userContext.version + 1
          });
          
          // Track session state across calls
          let currentSession: any = null;
          mockSaveSessionContextToDb.mockImplementation(async (sid, session) => {
            currentSession = session;
            return session;
          });
          mockGetSessionContextFromDb.mockImplementation(async (sid) => currentSession);
          
          // Step 1: User asks information seeking query
          const initialInput: UserInput = {
            text: query,
            timestamp: new Date()
          };
          
          const response1 = await agent.processInput(userId, initialInput, sessionId);
          
          // Verify: Requirement 5.2 - System should validate with user whether they have everything they need
          expect(response1.text).toBeDefined();
          expect(response1.text.toLowerCase()).toMatch(/do you have|everything you need|would you like/);
          expect(response1.requiresUserInput).toBe(true);
          expect(response1.nextAction).toBe('validate_information');
          
          // Step 2: User confirms they have everything they need
          const validationInput: UserInput = {
            text: validationResponse,
            timestamp: new Date()
          };
          
          const response2 = await agent.processInput(userId, validationInput, sessionId);
          
          // Verify: Requirement 5.3 - System should gather user sentiment in a few words of feedback
          expect(response2.text).toBeDefined();
          expect(response2.text.toLowerCase()).toMatch(/feedback|how did you find|was it helpful|helpful/);
          expect(response2.requiresUserInput).toBe(true);
          expect(response2.nextAction).toBe('collect_feedback');
          
          // Step 3: User provides feedback
          const feedbackInput: UserInput = {
            text: feedback,
            timestamp: new Date()
          };
          
          const response3 = await agent.processInput(userId, feedbackInput, sessionId);
          
          // Verify: Requirement 5.4 - System should ask to resume personalization flow
          expect(response3.text).toBeDefined();
          expect(response3.text.toLowerCase()).toMatch(/continue|resume|would you like|support cancer research uk/);
          expect(response3.requiresUserInput).toBe(true);
          expect(response3.nextAction).toBe('ask_resume_personalization');
          
          // Verify: Complete feedback loop executed
          expect(mockSaveSessionContextToDb).toHaveBeenCalled();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 14 (Validation Step): Validation Question Always Asked
   * For any information provision, the system should always ask if the user has everything they need
   * 
   * Validates: Requirement 5.2
   */
  it('should always validate completeness after providing information', async () => {
    await fc.assert(
      fc.asyncProperty(
        userContextArbitrary,
        informationQueryArbitrary,
        async (userContext, query) => {
          const userId = userContext.userId;
          const sessionId = `session-${userId}-${Date.now()}`;
          
          // Setup mocks with session tracking
          mockGetUserProfileFromDb.mockResolvedValue(userContext.profile);
          mockGetUserContextFromDb.mockResolvedValue(userContext);
          mockGetNextContextVersion.mockResolvedValue(userContext.version + 1);
          mockSaveUserContextToDb.mockResolvedValue({
            ...userContext,
            version: userContext.version + 1
          });
          
          let currentSession: any = null;
          mockSaveSessionContextToDb.mockImplementation(async (sid, session) => {
            currentSession = session;
            return session;
          });
          mockGetSessionContextFromDb.mockImplementation(async (sid) => currentSession);
          
          // User asks information seeking query
          const input: UserInput = {
            text: query,
            timestamp: new Date()
          };
          
          const response = await agent.processInput(userId, input, sessionId);
          
          // Verify: Requirement 5.2 - Validation question is always asked
          expect(response.text).toBeDefined();
          expect(response.requiresUserInput).toBe(true);
          expect(response.nextAction).toBe('validate_information');
          
          // Verify: Response contains validation language
          const lowerText = response.text.toLowerCase();
          const hasValidationLanguage = 
            lowerText.includes('do you have') ||
            lowerText.includes('everything you need') ||
            lowerText.includes('would you like') ||
            lowerText.includes('need anything else');
          
          expect(hasValidationLanguage).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });
});
