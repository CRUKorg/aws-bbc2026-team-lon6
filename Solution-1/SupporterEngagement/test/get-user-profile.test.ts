import { handler } from '../lambda/get-user-profile/index';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as dynamodbUtils from '../lambda/shared/dynamodb-utils';
import { UserProfile, Donation, ProfileType } from '../lambda/shared/types';

// Mock the DynamoDB utilities
jest.mock('../lambda/shared/dynamodb-utils');

describe('getUserProfile Lambda Handler', () => {
  const mockGetUserProfileFromDb = dynamodbUtils.getUserProfileFromDb as jest.MockedFunction<typeof dynamodbUtils.getUserProfileFromDb>;
  const mockGetDonationHistoryFromDb = dynamodbUtils.getDonationHistoryFromDb as jest.MockedFunction<typeof dynamodbUtils.getDonationHistoryFromDb>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockEvent = (userId?: string): APIGatewayProxyEvent => ({
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/profile',
    pathParameters: null,
    queryStringParameters: userId ? { userId } : null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {} as any,
    resource: ''
  });

  const createMockProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
    userId: 'testuser',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    age: 30,
    gender: 'Man',
    location: 'London',
    totalDonations: 100,
    donationCount: 3,
    firstDonationDate: new Date('2023-01-01'),
    lastDonationDate: new Date('2024-01-01'),
    hasAttendedEvents: true,
    hasFundraised: false,
    hasVolunteered: false,
    isResearcher: false,
    isJournalist: false,
    isPhilanthropist: false,
    personallyAffected: false,
    lovedOneAffected: true,
    cancerType: 'Breast Cancer',
    interests: ['Race for Life', 'Breast Cancer'],
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2024-01-01'),
    consentGiven: true,
    consentDate: new Date('2022-01-01'),
    ...overrides
  });

  const createMockDonation = (overrides?: Partial<Donation>): Donation => ({
    donationId: 'donation1',
    userId: 'testuser',
    amount: 50,
    currency: 'GBP',
    donationType: 'Payment',
    paymentType: 'Credit Card',
    paymentStatus: 'Completed',
    receivedDate: new Date('2024-01-01'),
    paymentDate: new Date('2024-01-01'),
    isGiftAided: true,
    giftAidAmount: 12.5,
    directDebitFrequency: 'Single',
    motivation: 'Support cancer research',
    appealName: 'General Fund',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  });

  describe('Success Cases', () => {
    it('should return profile for returning user with donations', async () => {
      const mockProfile = createMockProfile();
      const mockDonations = [createMockDonation(), createMockDonation({ donationId: 'donation2', amount: 30 })];

      mockGetUserProfileFromDb.mockResolvedValue(mockProfile);
      mockGetDonationHistoryFromDb.mockResolvedValue(mockDonations);

      const event = createMockEvent('testuser');
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.profile.userId).toBe('testuser');
      expect(body.donations).toHaveLength(2);
      expect(body.profileType).toBe(ProfileType.RETURNING_USER);
      expect(body.hasEngagementContext).toBe(true);
    });

    it('should return profile for new user with no donations', async () => {
      const mockProfile = createMockProfile({
        donationCount: 0,
        totalDonations: 0,
        interests: [],
        hasAttendedEvents: false
      });
      const mockDonations: Donation[] = [];

      mockGetUserProfileFromDb.mockResolvedValue(mockProfile);
      mockGetDonationHistoryFromDb.mockResolvedValue(mockDonations);

      const event = createMockEvent('newuser');
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.profileType).toBe(ProfileType.NEW_USER);
      expect(body.hasEngagementContext).toBe(false);
    });

    it('should return profile for user with basic info only', async () => {
      const mockProfile = createMockProfile({
        donationCount: 0,
        totalDonations: 0,
        interests: ['Cancer Awareness'],
        hasAttendedEvents: false
      });
      const mockDonations: Donation[] = [];

      mockGetUserProfileFromDb.mockResolvedValue(mockProfile);
      mockGetDonationHistoryFromDb.mockResolvedValue(mockDonations);

      const event = createMockEvent('basicuser');
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.profileType).toBe(ProfileType.BASIC_INFO);
      expect(body.hasEngagementContext).toBe(false);
    });
  });

  describe('Error Cases', () => {
    it('should return 400 when userId is missing', async () => {
      const event = createMockEvent();
      const result = await handler(event);

      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('MISSING_USER_ID');
      expect(body.error.retryable).toBe(false);
    });

    it('should return 404 when user is not found', async () => {
      mockGetUserProfileFromDb.mockResolvedValue(null);

      const event = createMockEvent('nonexistent');
      const result = await handler(event);

      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('USER_NOT_FOUND');
      expect(body.error.retryable).toBe(false);
    });

    it('should return 500 when database error occurs', async () => {
      mockGetUserProfileFromDb.mockRejectedValue(new Error('Database connection failed'));

      const event = createMockEvent('testuser');
      const result = await handler(event);

      expect(result.statusCode).toBe(500);
      const body = JSON.parse(result.body);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.retryable).toBe(true);
    });
  });

  describe('Profile Type Classification', () => {
    it('should classify user with events as returning user', async () => {
      const mockProfile = createMockProfile({
        donationCount: 0,
        totalDonations: 0,
        hasAttendedEvents: true
      });
      const mockDonations: Donation[] = [];

      mockGetUserProfileFromDb.mockResolvedValue(mockProfile);
      mockGetDonationHistoryFromDb.mockResolvedValue(mockDonations);

      const event = createMockEvent('eventuser');
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.profileType).toBe(ProfileType.RETURNING_USER);
    });

    it('should classify user with fundraising as returning user', async () => {
      const mockProfile = createMockProfile({
        donationCount: 0,
        totalDonations: 0,
        hasFundraised: true,
        hasAttendedEvents: false
      });
      const mockDonations: Donation[] = [];

      mockGetUserProfileFromDb.mockResolvedValue(mockProfile);
      mockGetDonationHistoryFromDb.mockResolvedValue(mockDonations);

      const event = createMockEvent('fundraiser');
      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.profileType).toBe(ProfileType.RETURNING_USER);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in success response', async () => {
      const mockProfile = createMockProfile();
      const mockDonations = [createMockDonation()];

      mockGetUserProfileFromDb.mockResolvedValue(mockProfile);
      mockGetDonationHistoryFromDb.mockResolvedValue(mockDonations);

      const event = createMockEvent('testuser');
      const result = await handler(event);

      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('should include CORS headers in error response', async () => {
      const event = createMockEvent();
      const result = await handler(event);

      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin', '*');
      expect(result.headers).toHaveProperty('Content-Type', 'application/json');
    });
  });
});
