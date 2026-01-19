import { 
  getRecentTransactions, 
  getDonationSummary,
  searchResearchPapers,
  getFeaturedPapers,
  searchKnowledgeBase,
  recordInteraction,
  recordPageVisit
} from '../lambda/shared/data-access';
import { Donation, ResearchPaper, KnowledgeArticle, EngagementRecord } from '../lambda/shared/types';

// Mock the DynamoDB client
jest.mock('../lambda/shared/dynamodb-utils', () => ({
  docClient: {
    send: jest.fn()
  },
  convertDatesToObjects: jest.fn((item, fields) => item)
}));

import { docClient } from '../lambda/shared/dynamodb-utils';

describe('Data Access Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRecentTransactions', () => {
    it('should retrieve recent transactions for a user', async () => {
      const mockDonations: Partial<Donation>[] = [
        {
          donationId: 'don-1',
          userId: 'user-123',
          amount: 50,
          currency: 'GBP',
          donationType: 'Payment',
          paymentType: 'Credit Card',
          paymentStatus: 'Completed',
          receivedDate: new Date('2024-01-15'),
          isGiftAided: true,
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          donationId: 'don-2',
          userId: 'user-123',
          amount: 100,
          currency: 'GBP',
          donationType: 'Payment',
          paymentType: 'Direct Debit',
          paymentStatus: 'Completed',
          receivedDate: new Date('2024-01-10'),
          isGiftAided: true,
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-10')
        }
      ];

      (docClient.send as jest.Mock).mockResolvedValue({
        Items: mockDonations
      });

      const result = await getRecentTransactions('user-123', 'donations-table', 10);

      expect(result).toHaveLength(2);
      expect(result[0].donationId).toBe('don-1');
      expect(docClient.send).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no transactions found', async () => {
      (docClient.send as jest.Mock).mockResolvedValue({
        Items: []
      });

      const result = await getRecentTransactions('user-456', 'donations-table', 10);

      expect(result).toHaveLength(0);
    });
  });

  describe('getDonationSummary', () => {
    it('should calculate donation summary correctly', async () => {
      const mockDonations: Partial<Donation>[] = [
        {
          donationId: 'don-1',
          userId: 'user-123',
          amount: 50,
          receivedDate: new Date('2024-01-15'),
          directDebitFrequency: 'Single'
        },
        {
          donationId: 'don-2',
          userId: 'user-123',
          amount: 100,
          receivedDate: new Date('2024-01-10'),
          directDebitFrequency: 'Monthly'
        },
        {
          donationId: 'don-3',
          userId: 'user-123',
          amount: 25,
          receivedDate: new Date('2024-01-05'),
          directDebitFrequency: 'Single'
        }
      ];

      (docClient.send as jest.Mock).mockResolvedValue({
        Items: mockDonations
      });

      const result = await getDonationSummary('user-123', 'donations-table');

      expect(result.userId).toBe('user-123');
      expect(result.totalAmount).toBe(175);
      expect(result.transactionCount).toBe(3);
      expect(result.averageAmount).toBeCloseTo(58.33, 2);
      expect(result.recurringDonations).toBe(1);
      expect(result.lastDonationDate).toEqual(new Date('2024-01-15'));
      expect(result.suggestedNextAmount).toBeGreaterThanOrEqual(10);
    });

    it('should return default summary when no donations found', async () => {
      (docClient.send as jest.Mock).mockResolvedValue({
        Items: []
      });

      const result = await getDonationSummary('user-456', 'donations-table');

      expect(result.userId).toBe('user-456');
      expect(result.totalAmount).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.averageAmount).toBe(0);
      expect(result.recurringDonations).toBe(0);
      expect(result.lastDonationDate).toBeUndefined();
      expect(result.suggestedNextAmount).toBe(10);
    });
  });

  describe('searchResearchPapers', () => {
    it('should search research papers by query', async () => {
      const mockPapers: Partial<ResearchPaper>[] = [
        {
          paperId: 'paper-1',
          title: 'Cancer Research Breakthrough',
          abstract: 'A study on cancer treatment',
          authors: ['Dr. Smith'],
          journal: 'Nature',
          publicationDate: new Date('2024-01-01'),
          url: 'https://example.com/paper1',
          tags: ['cancer', 'treatment'],
          cancerTypes: ['breast'],
          researchArea: 'oncology',
          citations: 100,
          isFeatured: true,
          fundedByCRUK: true
        }
      ];

      (docClient.send as jest.Mock).mockResolvedValue({
        Items: mockPapers
      });

      const result = await searchResearchPapers('papers-table', 'cancer', undefined, undefined, 10);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toContain('Cancer');
    });
  });

  describe('getFeaturedPapers', () => {
    it('should retrieve featured papers', async () => {
      const mockPapers: Partial<ResearchPaper>[] = [
        {
          paperId: 'paper-1',
          title: 'Featured Paper',
          abstract: 'Important research',
          authors: ['Dr. Jones'],
          journal: 'Science',
          publicationDate: new Date('2024-01-01'),
          url: 'https://example.com/paper1',
          tags: ['featured'],
          cancerTypes: ['lung'],
          researchArea: 'oncology',
          citations: 200,
          isFeatured: true,
          fundedByCRUK: true
        }
      ];

      (docClient.send as jest.Mock).mockResolvedValue({
        Items: mockPapers
      });

      const result = await getFeaturedPapers('papers-table', 5);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].isFeatured).toBe(true);
    });
  });

  describe('searchKnowledgeBase', () => {
    it('should search knowledge base articles', async () => {
      const mockArticles: Partial<KnowledgeArticle>[] = [
        {
          articleId: 'article-1',
          title: 'Understanding Cancer',
          summary: 'A guide to cancer',
          content: 'Detailed information about cancer',
          url: 'https://cruk.org/article1',
          category: 'education',
          tags: ['cancer', 'education'],
          cancerTypes: ['general'],
          publishedDate: new Date('2024-01-01'),
          lastUpdated: new Date('2024-01-01'),
          author: 'CRUK Team',
          readingLevel: 'basic',
          availableLanguages: ['en']
        }
      ];

      (docClient.send as jest.Mock).mockResolvedValue({
        Items: mockArticles
      });

      const result = await searchKnowledgeBase('articles-table', 'cancer', undefined, undefined, undefined, 10);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toContain('Cancer');
    });
  });

  describe('recordInteraction', () => {
    it('should record a user interaction', async () => {
      (docClient.send as jest.Mock).mockResolvedValue({});

      const result = await recordInteraction(
        'user-123',
        'donation',
        'interactions-table',
        { donationAmount: 50 }
      );

      expect(result.userId).toBe('user-123');
      expect(result.type).toBe('donation');
      expect(result.donationAmount).toBe(50);
      expect(docClient.send).toHaveBeenCalledTimes(1);
    });
  });

  describe('recordPageVisit', () => {
    it('should record a page visit', async () => {
      (docClient.send as jest.Mock).mockResolvedValue({});

      const result = await recordPageVisit(
        'user-123',
        'https://cruk.org/donate',
        'interactions-table'
      );

      expect(result.userId).toBe('user-123');
      expect(result.metadata.pageUrl).toBe('https://cruk.org/donate');
      expect(docClient.send).toHaveBeenCalledTimes(1);
    });
  });
});
