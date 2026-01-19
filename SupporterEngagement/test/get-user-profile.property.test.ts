import * as fc from 'fast-check';
import { handler } from '../lambda/get-user-profile/index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as dynamodbUtils from '../lambda/shared/dynamodb-utils';
import { UserProfile, Donation, ProfileType } from '../lambda/shared/types';

// Mock the DynamoDB utilities
jest.mock('../lambda/shared/dynamodb-utils');

/**
 * Property-Based Tests for Profile Retrieval
 * Feature: supporter-engagement-platform, Property 1: Profile Retrieval
 * Validates: Requirements 1.1, 1.5
 */
describe('Property 1: Profile Retrieval', () => {
  const mockGetUserProfileFromDb = dynamodbUtils.getUserProfileFromDb as jest.MockedFunction<typeof dynamodbUtils.getUserProfileFromDb>;
  const mockGetDonationHistoryFromDb = dynamodbUtils.getDonationHistoryFromDb as jest.MockedFunction<typeof dynamodbUtils.getDonationHistoryFromDb>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockEvent = (userId: string): APIGatewayProxyEvent => ({
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/profile',
    pathParameters: null,
    queryStringParameters: { userId },
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  // Arbitraries for generating random test data
  const userIdArbitrary = fc.uuid();
  
  const emailArbitrary = fc.emailAddress();
  
  const nameArbitrary = fc.string({ minLength: 1, maxLength: 50 });
  
  const ageArbitrary = fc.integer({ min: 18, max: 100 });
  
  const genderArbitrary = fc.oneof(
    fc.constant('Man'),
    fc.constant('Woman'),
    fc.constant('Non-binary'),
    fc.constant('Prefer not to say')
  );
  
  const locationArbitrary = fc.string({ minLength: 1, maxLength: 100 });
  
  const cancerTypeArbitrary = fc.oneof(
    fc.constant('Breast Cancer'),
    fc.constant('Lung Cancer'),
    fc.constant('Prostate Cancer'),
    fc.constant('Bowel Cancer'),
    fc.constant('Skin Cancer')
  );
  
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

  const userProfileArbitrary: fc.Arbitrary<UserProfile> = fc.record({
    userId: userIdArbitrary,
    email: emailArbitrary,
    name: nameArbitrary,
    firstName: fc.option(nameArbitrary, { nil: undefined }),
    lastName: fc.option(nameArbitrary, { nil: undefined }),
    age: fc.option(ageArbitrary, { nil: undefined }),
    gender: fc.option(genderArbitrary, { nil: undefined }),
    location: fc.option(locationArbitrary, { nil: undefined }),
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
    cancerType: fc.option(cancerTypeArbitrary, { nil: undefined }),
    interests: interestsArbitrary,
    createdAt: fc.date(),
    updatedAt: fc.date(),
    consentGiven: fc.boolean(),
    consentDate: fc.option(fc.date(), { nil: undefined })
  });

  const donationArbitrary: fc.Arbitrary<Donation> = fc.record({
    donationId: fc.uuid(),
    userId: userIdArbitrary,
    amount: fc.float({ min: 1, max: 10000, noNaN: true }),
    currency: fc.constant('GBP'),
    donationType: fc.oneof(
      fc.constant('Payment' as const), 
      fc.constant('Expense' as const), 
      fc.constant('Legacy Income' as const),
      fc.constant('Refund' as const),
      fc.constant('Reversal' as const),
      fc.constant('Tax Reclaim' as const)
    ),
    paymentType: fc.oneof(fc.constant('Credit Card'), fc.constant('PayPal'), fc.constant('Bank Transfer')),
    paymentStatus: fc.oneof(
      fc.constant('Completed' as const), 
      fc.constant('Pending' as const), 
      fc.constant('Failed' as const),
      fc.constant('Cancelled' as const),
      fc.constant('Query' as const),
      fc.constant('Authorised' as const)
    ),
    receivedDate: fc.date(),
    paymentDate: fc.option(fc.date(), { nil: undefined }),
    isGiftAided: fc.boolean(),
    giftAidAmount: fc.option(fc.float({ min: 0, max: 2500, noNaN: true }), { nil: undefined }),
    directDebitFrequency: fc.option(fc.oneof(fc.constant('Monthly'), fc.constant('Single')), { nil: undefined }),
    motivation: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
    appealName: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
    createdAt: fc.date(),
    updatedAt: fc.date()
  });

  const donationsArrayArbitrary = fc.array(donationArbitrary, { minLength: 0, maxLength: 20 });

  /**
   * Property 1: Profile Retrieval
   * For any user access, the system should retrieve the user profile including all user attributes
   * (donation history, event participation, personal circumstances)
   */
  it('should retrieve user profile with all attributes for any valid user', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArbitrary,
        donationsArrayArbitrary,
        async (mockProfile, mockDonations) => {
          // Setup mocks
          mockGetUserProfileFromDb.mockResolvedValue(mockProfile);
          mockGetDonationHistoryFromDb.mockResolvedValue(mockDonations);

          // Execute handler
          const event = createMockEvent(mockProfile.userId);
          const result = await handler(event);

          // Verify successful response
          expect(result.statusCode).toBe(200);
          
          const body = JSON.parse(result.body);
          
          // Verify profile is retrieved
          expect(body.profile).toBeDefined();
          expect(body.profile.userId).toBe(mockProfile.userId);
          
          // Verify all user attributes are present (Requirements 1.1, 1.5)
          // User identification
          expect(body.profile).toHaveProperty('userId');
          expect(body.profile).toHaveProperty('name');
          
          // Donation history attributes
          expect(body.profile).toHaveProperty('totalDonations');
          expect(body.profile).toHaveProperty('donationCount');
          expect(body.donations).toBeDefined();
          expect(Array.isArray(body.donations)).toBe(true);
          expect(body.donations.length).toBe(mockDonations.length);
          
          // Event participation attributes
          expect(body.profile).toHaveProperty('hasAttendedEvents');
          expect(body.profile).toHaveProperty('hasFundraised');
          expect(body.profile).toHaveProperty('hasVolunteered');
          
          // Personal circumstances attributes
          expect(body.profile).toHaveProperty('personallyAffected');
          expect(body.profile).toHaveProperty('lovedOneAffected');
          expect(body.profile).toHaveProperty('interests');
          
          // Verify profile type is determined
          expect(body.profileType).toBeDefined();
          expect(Object.values(ProfileType)).toContain(body.profileType);
          
          // Verify engagement context flag is set
          expect(body).toHaveProperty('hasEngagementContext');
          expect(typeof body.hasEngagementContext).toBe('boolean');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1 (Edge Case): Profile Retrieval with Minimal Data
   * For any user with minimal profile data, the system should still retrieve the profile
   * with all required attributes present (even if some are empty/default values)
   */
  it('should retrieve profile with all required attributes even for minimal user data', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        nameArbitrary,
        async (userId, name) => {
          // Create minimal profile
          const minimalProfile: UserProfile = {
            userId,
            name,
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
            interests: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            consentGiven: true
          };

          mockGetUserProfileFromDb.mockResolvedValue(minimalProfile);
          mockGetDonationHistoryFromDb.mockResolvedValue([]);

          const event = createMockEvent(userId);
          const result = await handler(event);

          expect(result.statusCode).toBe(200);
          
          const body = JSON.parse(result.body);
          
          // Verify all required attributes are present
          expect(body.profile.userId).toBe(userId);
          expect(body.profile.name).toBe(name);
          expect(body.profile.totalDonations).toBe(0);
          expect(body.profile.donationCount).toBe(0);
          expect(body.profile.hasAttendedEvents).toBe(false);
          expect(body.profile.hasFundraised).toBe(false);
          expect(body.profile.hasVolunteered).toBe(false);
          expect(body.profile.personallyAffected).toBe(false);
          expect(body.profile.lovedOneAffected).toBe(false);
          expect(body.profile.interests).toEqual([]);
          expect(body.donations).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1 (Consistency): Profile and Donations Consistency
   * For any user, the donation history returned should match the userId in the profile
   */
  it('should return donations that match the requested user profile', async () => {
    await fc.assert(
      fc.asyncProperty(
        userProfileArbitrary,
        donationsArrayArbitrary,
        async (mockProfile, mockDonations) => {
          // Ensure all donations have the correct userId
          const correctDonations = mockDonations.map(d => ({
            ...d,
            userId: mockProfile.userId
          }));

          mockGetUserProfileFromDb.mockResolvedValue(mockProfile);
          mockGetDonationHistoryFromDb.mockResolvedValue(correctDonations);

          const event = createMockEvent(mockProfile.userId);
          const result = await handler(event);

          expect(result.statusCode).toBe(200);
          
          const body = JSON.parse(result.body);
          
          // Verify all donations belong to the user
          body.donations.forEach((donation: Donation) => {
            expect(donation.userId).toBe(mockProfile.userId);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
