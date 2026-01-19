import { ContentGenerationService } from '../lambda/shared/content-generation';
import { UserContext, UserProfile, UserPreferences, Donation } from '../lambda/shared/types';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';

// Mock the Bedrock client
jest.mock('@aws-sdk/client-bedrock-runtime');

// Mock the data-access module
jest.mock('../lambda/shared/data-access', () => ({
  searchResearchPapers: jest.fn()
}));

import { searchResearchPapers } from '../lambda/shared/data-access';

/**
 * Unit Tests for Content Generation Service
 * Tests core functionality of content generation methods
 */
describe('Content Generation Service', () => {
  let contentService: ContentGenerationService;
  let mockBedrockSend: jest.Mock;
  let mockSearchResearchPapers: jest.MockedFunction<typeof searchResearchPapers>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Bedrock client
    mockBedrockSend = jest.fn();
    (BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>).mockImplementation(() => ({
      send: mockBedrockSend,
    } as any));
    
    // Mock searchResearchPapers
    mockSearchResearchPapers = searchResearchPapers as jest.MockedFunction<typeof searchResearchPapers>;
    
    contentService = new ContentGenerationService('us-east-1', 'test-model');
  });

  // Helper to create test user context
  const createTestUserContext = (overrides?: Partial<UserContext>): UserContext => {
    const profile: UserProfile = {
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      age: 35,
      gender: 'Man',
      location: 'London',
      totalDonations: 250,
      donationCount: 5,
      firstDonationDate: new Date('2023-01-15'),
      lastDonationDate: new Date('2024-01-10'),
      hasAttendedEvents: true,
      hasFundraised: false,
      hasVolunteered: false,
      isResearcher: false,
      isJournalist: false,
      isPhilanthropist: false,
      personallyAffected: false,
      lovedOneAffected: true,
      cancerType: 'Breast Cancer',
      interests: ['Research', 'Fundraising'],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2024-01-10'),
      consentGiven: true,
      consentDate: new Date('2023-01-01')
    };

    const preferences: UserPreferences = {
      interests: ['Research', 'Fundraising'],
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
        preferredFrequency: 'monthly'
      }
    };

    return {
      userId: 'test-user-123',
      profile,
      engagementHistory: [],
      preferences,
      lastUpdated: new Date(),
      version: 1,
      ...overrides
    };
  };

  describe('generateMotivationalContent', () => {
    it('should generate motivational content with valid structure', async () => {
      const context = createTestUserContext();
      
      // Mock Bedrock response
      const mockResponse = {
        headline: 'Together, we\'re making progress',
        body: 'Your support is funding groundbreaking research that brings us closer to beating cancer.',
        achievements: [
          {
            title: 'Breakthrough Discovery',
            description: 'New treatment approach identified',
            date: '2024-01-15',
            impact: 'Could help thousands of patients'
          }
        ],
        personalizedMessage: 'Thank you for your continued support, John.'
      };

      mockBedrockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify(mockResponse) }]
        }))
      });

      const result = await contentService.generateMotivationalContent(context);

      expect(result).toBeDefined();
      expect(result.headline).toBe(mockResponse.headline);
      expect(result.body).toBe(mockResponse.body);
      expect(result.achievements).toHaveLength(1);
      expect(result.achievements[0].title).toBe('Breakthrough Discovery');
      expect(result.personalizedMessage).toBe(mockResponse.personalizedMessage);
    });

    it('should return fallback content when Bedrock fails', async () => {
      const context = createTestUserContext();
      
      // Mock Bedrock to throw error
      mockBedrockSend.mockRejectedValue(new Error('Bedrock error'));

      const result = await contentService.generateMotivationalContent(context);

      expect(result).toBeDefined();
      expect(result.headline).toBeDefined();
      expect(result.body).toBeDefined();
      expect(result.achievements).toBeDefined();
      expect(result.personalizedMessage).toBeDefined();
      expect(result.body).toContain('John'); // Should include user name
    });

    it('should handle user with personal cancer connection', async () => {
      const context = createTestUserContext({
        profile: {
          ...createTestUserContext().profile,
          personallyAffected: true,
          cancerType: 'Lung Cancer'
        }
      });
      
      mockBedrockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify({
            headline: 'Hope and Progress',
            body: 'We understand your journey.',
            achievements: [],
            personalizedMessage: 'Thank you.'
          }) }]
        }))
      });

      const result = await contentService.generateMotivationalContent(context);

      expect(result).toBeDefined();
      expect(mockBedrockSend).toHaveBeenCalled();
    });
  });

  describe('generateCallToAction', () => {
    it('should generate call to action with valid structure', async () => {
      const context = createTestUserContext();
      
      // Mock Bedrock response
      const mockResponse = {
        type: 'donate',
        title: 'Continue your impact',
        description: 'Your donations fund vital research.',
        suggestedAmounts: [25, 50, 100, 250],
        actionUrl: 'https://www.cancerresearchuk.org/donate'
      };

      mockBedrockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify(mockResponse) }]
        }))
      });

      const result = await contentService.generateCallToAction(context);

      expect(result).toBeDefined();
      expect(result.type).toBe('donate');
      expect(result.title).toBe(mockResponse.title);
      expect(result.description).toBe(mockResponse.description);
      expect(result.suggestedAmounts).toEqual(mockResponse.suggestedAmounts);
      expect(result.actionUrl).toBe(mockResponse.actionUrl);
    });

    it('should return fallback CTA when Bedrock fails', async () => {
      const context = createTestUserContext();
      
      // Mock Bedrock to throw error
      mockBedrockSend.mockRejectedValue(new Error('Bedrock error'));

      const result = await contentService.generateCallToAction(context);

      expect(result).toBeDefined();
      expect(result.type).toBe('donate');
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.suggestedAmounts).toBeDefined();
      expect(result.actionUrl).toBeDefined();
    });

    it('should suggest appropriate amounts based on donation history', async () => {
      const context = createTestUserContext({
        profile: {
          ...createTestUserContext().profile,
          totalDonations: 500,
          donationCount: 10
        }
      });
      
      mockBedrockSend.mockRejectedValue(new Error('Use fallback'));

      const result = await contentService.generateCallToAction(context);

      expect(result.suggestedAmounts).toBeDefined();
      expect(result.suggestedAmounts!.length).toBeGreaterThan(0);
      // Should suggest amounts based on average (500/10 = 50)
      expect(result.suggestedAmounts![0]).toBeGreaterThanOrEqual(10);
    });

    it('should handle different CTA types', async () => {
      const context = createTestUserContext();
      
      const mockResponse = {
        type: 'volunteer',
        title: 'Volunteer with us',
        description: 'Join our team of volunteers.',
        actionUrl: 'https://www.cancerresearchuk.org/volunteer'
      };

      mockBedrockSend.mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          content: [{ text: JSON.stringify(mockResponse) }]
        }))
      });

      const result = await contentService.generateCallToAction(context);

      expect(result.type).toBe('volunteer');
      expect(result.suggestedAmounts).toBeUndefined();
    });
  });

  describe('selectResearchPapers', () => {
    it('should select research papers based on user interests', async () => {
      const context = createTestUserContext();
      
      const mockPapers = [
        {
          paperId: 'paper-1',
          title: 'Breast Cancer Research',
          authors: ['Dr. Smith'],
          journal: 'Cancer Research',
          publicationDate: new Date('2024-01-01'),
          abstract: 'Important research',
          url: 'https://example.com/paper1',
          tags: ['Research', 'Breast Cancer'],
          cancerTypes: ['Breast Cancer'],
          researchArea: 'Treatment',
          citations: 100,
          isFeatured: true,
          fundedByCRUK: true
        },
        {
          paperId: 'paper-2',
          title: 'General Cancer Study',
          authors: ['Dr. Jones'],
          journal: 'Medical Journal',
          publicationDate: new Date('2024-02-01'),
          abstract: 'General study',
          url: 'https://example.com/paper2',
          tags: ['Research'],
          cancerTypes: [],
          researchArea: 'Prevention',
          citations: 50,
          isFeatured: false,
          fundedByCRUK: true
        }
      ];

      mockSearchResearchPapers.mockResolvedValue(mockPapers);

      const result = await contentService.selectResearchPapers(context, 5, 'research-papers-table');

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
      expect(mockSearchResearchPapers).toHaveBeenCalledWith(
        'research-papers-table',
        undefined,
        expect.arrayContaining(['Research', 'Fundraising', 'Breast Cancer']),
        ['Breast Cancer'],
        5
      );
      // Featured papers should be first
      expect(result[0].isFeatured).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const context = createTestUserContext();
      
      mockSearchResearchPapers.mockRejectedValue(new Error('Database error'));

      const result = await contentService.selectResearchPapers(context, 5, 'research-papers-table');

      expect(result).toEqual([]);
    });

    it('should sort papers by featured status and citations', async () => {
      const context = createTestUserContext();
      
      const mockPapers = [
        {
          paperId: 'paper-1',
          title: 'Paper 1',
          authors: [],
          journal: 'Journal',
          publicationDate: new Date(),
          abstract: 'Abstract',
          url: 'url',
          tags: [],
          cancerTypes: [],
          researchArea: 'Area',
          citations: 50,
          isFeatured: false,
          fundedByCRUK: true
        },
        {
          paperId: 'paper-2',
          title: 'Paper 2',
          authors: [],
          journal: 'Journal',
          publicationDate: new Date(),
          abstract: 'Abstract',
          url: 'url',
          tags: [],
          cancerTypes: [],
          researchArea: 'Area',
          citations: 100,
          isFeatured: true,
          fundedByCRUK: true
        }
      ];

      mockSearchResearchPapers.mockResolvedValue(mockPapers);

      const result = await contentService.selectResearchPapers(context, 5, 'research-papers-table');

      // Featured paper should be first
      expect(result[0].paperId).toBe('paper-2');
      expect(result[0].isFeatured).toBe(true);
    });
  });

  describe('formatImpactBreakdown', () => {
    it('should format impact breakdown from donations', async () => {
      const donations: Donation[] = [
        {
          donationId: 'don-1',
          userId: 'user-1',
          amount: 100,
          currency: 'GBP',
          donationType: 'Payment',
          paymentType: 'Card',
          paymentStatus: 'Completed',
          receivedDate: new Date('2024-01-01'),
          isGiftAided: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          donationId: 'don-2',
          userId: 'user-1',
          amount: 150,
          currency: 'GBP',
          donationType: 'Payment',
          paymentType: 'Card',
          paymentStatus: 'Completed',
          receivedDate: new Date('2024-02-01'),
          isGiftAided: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = await contentService.formatImpactBreakdown(donations);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure of impact items
      result.forEach(item => {
        expect(item).toHaveProperty('description');
        expect(item).toHaveProperty('quantity');
        expect(item).toHaveProperty('icon');
        expect(typeof item.description).toBe('string');
        expect(typeof item.quantity).toBe('number');
        expect(typeof item.icon).toBe('string');
      });
    });

    it('should handle small donations', async () => {
      const donations: Donation[] = [
        {
          donationId: 'don-1',
          userId: 'user-1',
          amount: 5,
          currency: 'GBP',
          donationType: 'Payment',
          paymentType: 'Card',
          paymentStatus: 'Completed',
          receivedDate: new Date(),
          isGiftAided: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = await contentService.formatImpactBreakdown(donations);

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      // Should have at least one generic impact item
      expect(result[0].description).toBeDefined();
    });

    it('should handle empty donations array', async () => {
      const result = await contentService.formatImpactBreakdown([]);

      expect(result).toEqual([]);
    });

    it('should calculate impact based on total amount', async () => {
      const donations: Donation[] = [
        {
          donationId: 'don-1',
          userId: 'user-1',
          amount: 500,
          currency: 'GBP',
          donationType: 'Payment',
          paymentType: 'Card',
          paymentStatus: 'Completed',
          receivedDate: new Date(),
          isGiftAided: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const result = await contentService.formatImpactBreakdown(donations);

      expect(result.length).toBeGreaterThan(0);
      // With £500, should have multiple impact items
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle errors gracefully', async () => {
      // Pass invalid data
      const result = await contentService.formatImpactBreakdown(null as any);

      expect(result).toEqual([]);
    });
  });
});
