import * as fc from 'fast-check';
import { ContextManagementService } from '../lambda/context-management/index';
import * as dynamodbUtils from '../lambda/shared/dynamodb-utils';
import { UserContext, UserProfile, EngagementRecord, UserPreferences } from '../lambda/shared/types';

// Mock the DynamoDB utilities
jest.mock('../lambda/shared/dynamodb-utils');

/**
 * Property-Based Tests for Context Versioning and Retrieval
 * Feature: supporter-engagement-platform, Property 2: Context Versioning and Retrieval
 * Validates: Requirements 8.2, 8.3
 */
describe('Property 2: Context Versioning and Retrieval', () => {
  const mockGetUserContextFromDb = dynamodbUtils.getUserContextFromDb as jest.MockedFunction<typeof dynamodbUtils.getUserContextFromDb>;
  const mockSaveUserContextToDb = dynamodbUtils.saveUserContextToDb as jest.MockedFunction<typeof dynamodbUtils.saveUserContextToDb>;
  const mockGetNextContextVersion = dynamodbUtils.getNextContextVersion as jest.MockedFunction<typeof dynamodbUtils.getNextContextVersion>;
  const mockGetUserProfileFromDb = dynamodbUtils.getUserProfileFromDb as jest.MockedFunction<typeof dynamodbUtils.getUserProfileFromDb>;

  let contextService: ContextManagementService;

  beforeEach(() => {
    jest.clearAllMocks();
    contextService = new ContextManagementService('test-context-table', 'test-user-table');
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

  /**
   * Property 2: Context Versioning and Retrieval
   * For any user context update, the system should store it in structured format,
   * and for any context retrieval, the system should return the most recent version.
   * 
   * Validates: Requirements 8.2, 8.3
   */
  it('should store context updates in structured format with incrementing versions', async () => {
    await fc.assert(
      fc.asyncProperty(
        userContextArbitrary,
        fc.record({
          newInterests: fc.array(fc.string({ maxLength: 50 }), { minLength: 1, maxLength: 3 }),
          newEngagement: engagementRecordArbitrary
        }),
        async (initialContext, updates) => {
          const userId = initialContext.userId;
          const currentVersion = initialContext.version;
          const nextVersion = currentVersion + 1;

          // Setup: existing context exists
          mockGetUserContextFromDb.mockResolvedValue(initialContext);
          mockGetNextContextVersion.mockResolvedValue(nextVersion);
          
          // Mock save to return the updated context with new version
          mockSaveUserContextToDb.mockImplementation(async (uid, ctx) => {
            return {
              ...ctx,
              version: nextVersion,
              lastUpdated: new Date()
            };
          });

          // Perform update
          const updatedContext = await contextService.updateContext(userId, {
            preferences: {
              ...initialContext.preferences,
              interests: updates.newInterests
            }
          });

          // Verify: Requirements 8.2 - Store context in structured format
          expect(updatedContext).toBeDefined();
          expect(updatedContext.userId).toBe(userId);
          expect(updatedContext.profile).toBeDefined();
          expect(updatedContext.preferences).toBeDefined();
          expect(updatedContext.engagementHistory).toBeDefined();
          expect(updatedContext.lastUpdated).toBeDefined();
          expect(updatedContext.version).toBeDefined();

          // Verify: Version increments
          expect(updatedContext.version).toBe(nextVersion);
          expect(updatedContext.version).toBeGreaterThan(currentVersion);

          // Verify: saveUserContextToDb was called with structured data
          expect(mockSaveUserContextToDb).toHaveBeenCalledWith(
            userId,
            expect.objectContaining({
              userId,
              profile: expect.any(Object),
              preferences: expect.any(Object),
              engagementHistory: expect.any(Array),
              version: nextVersion
            }),
            'test-context-table',
            'update'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2 (Retrieval): Most Recent Version Retrieval
   * For any context retrieval, the system should return the most recent version
   * 
   * Validates: Requirements 8.3
   */
  it('should retrieve the most recent version of user context', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        userContextArbitrary,
        async (userId, latestContext) => {
          // Setup: mock returns the latest context
          const contextWithUserId = { ...latestContext, userId };
          mockGetUserContextFromDb.mockResolvedValue(contextWithUserId);

          // Retrieve context
          const retrievedContext = await contextService.getContext(userId);

          // Verify: Requirements 8.3 - Use the most recent trusted information
          expect(retrievedContext).toBeDefined();
          expect(retrievedContext.userId).toBe(userId);
          expect(retrievedContext.version).toBe(latestContext.version);
          expect(retrievedContext.lastUpdated).toBeDefined();

          // Verify: getUserContextFromDb was called correctly
          expect(mockGetUserContextFromDb).toHaveBeenCalledWith(userId, 'test-context-table');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2 (Round-Trip): Context Update and Retrieval Consistency
   * For any context update followed by retrieval, the retrieved context should
   * contain the updated data with an incremented version
   * 
   * Validates: Requirements 8.2, 8.3
   */
  it('should maintain consistency between context updates and retrievals', async () => {
    await fc.assert(
      fc.asyncProperty(
        userContextArbitrary,
        fc.string({ minLength: 1, maxLength: 50 }),
        async (initialContext, newInterest) => {
          const userId = initialContext.userId;
          const currentVersion = initialContext.version;
          const nextVersion = currentVersion + 1;

          // First call: get existing context
          mockGetUserContextFromDb.mockResolvedValueOnce(initialContext);
          mockGetNextContextVersion.mockResolvedValue(nextVersion);
          
          // Save returns updated context
          const savedContext = {
            ...initialContext,
            preferences: {
              ...initialContext.preferences,
              interests: [...initialContext.preferences.interests, newInterest]
            },
            version: nextVersion,
            lastUpdated: new Date()
          };
          mockSaveUserContextToDb.mockResolvedValue(savedContext);

          // Perform update
          const updatedContext = await contextService.updateContext(userId, {
            preferences: {
              ...initialContext.preferences,
              interests: [...initialContext.preferences.interests, newInterest]
            }
          });

          // Second call: retrieve updated context
          mockGetUserContextFromDb.mockResolvedValueOnce(savedContext);
          const retrievedContext = await contextService.getContext(userId);

          // Verify: Retrieved context matches updated context
          expect(retrievedContext.userId).toBe(updatedContext.userId);
          expect(retrievedContext.version).toBe(updatedContext.version);
          expect(retrievedContext.version).toBe(nextVersion);
          expect(retrievedContext.preferences.interests).toContain(newInterest);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2 (Version Monotonicity): Version Numbers Always Increase
   * For any sequence of context updates, version numbers should always increase
   * 
   * Validates: Requirements 8.2
   */
  it('should ensure version numbers always increase with each update', async () => {
    await fc.assert(
      fc.asyncProperty(
        userContextArbitrary,
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
        async (initialContext, newInterests) => {
          const userId = initialContext.userId;
          let currentVersion = initialContext.version;
          const versions: number[] = [currentVersion];

          // Setup initial context
          mockGetUserContextFromDb.mockResolvedValue(initialContext);

          // Perform multiple updates
          for (let i = 0; i < newInterests.length; i++) {
            const nextVersion = currentVersion + 1;
            mockGetNextContextVersion.mockResolvedValue(nextVersion);
            
            const updatedContext = {
              ...initialContext,
              preferences: {
                ...initialContext.preferences,
                interests: [...initialContext.preferences.interests, newInterests[i]]
              },
              version: nextVersion,
              lastUpdated: new Date()
            };
            
            mockSaveUserContextToDb.mockResolvedValue(updatedContext);
            mockGetUserContextFromDb.mockResolvedValue(updatedContext);

            const result = await contextService.updateContext(userId, {
              preferences: {
                ...initialContext.preferences,
                interests: [...initialContext.preferences.interests, newInterests[i]]
              }
            });

            versions.push(result.version);
            currentVersion = nextVersion;
          }

          // Verify: All versions are strictly increasing
          for (let i = 1; i < versions.length; i++) {
            expect(versions[i]).toBeGreaterThan(versions[i - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
