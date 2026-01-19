// API Client for Supporter Engagement Platform
// Handles communication with Lambda functions via API Gateway

// Configuration - these would typically come from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';

// Mock authentication - in production this would use Cognito
let mockUserId = 'user-001'; // Default mock user

export const setMockUserId = (userId: string) => {
  mockUserId = userId;
};

export const getMockUserId = (): string => mockUserId;

// Types
export interface UserProfile {
  userId: string;
  email: string;
  name: string;
  age?: number;
  gender?: string;
  location?: string;
  totalDonations: number;
  donationCount: number;
  firstDonationDate?: string;
  lastDonationDate?: string;
  hasAttendedEvents: boolean;
  hasFundraised: boolean;
  hasVolunteered: boolean;
  personallyAffected: boolean;
  lovedOneAffected: boolean;
  cancerType?: string;
  interests: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DonationSummary {
  userId: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  recurringDonations: number;
  lastDonationDate?: string;
  suggestedNextAmount: number;
}

export interface ImpactItem {
  description: string;
  quantity: number;
  icon: string;
  month?: string;
  amount?: number;
}

export interface PageRecommendation {
  title: string;
  url: string;
  reason: string;
  thumbnail?: string;
  description?: string;
}

export interface ResearchPaper {
  paperId: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: string;
  abstract: string;
  url: string;
  tags: string[];
  cancerTypes: string[];
  isFeatured: boolean;
}

export interface CampaignProgress {
  campaignName: string;
  currentAmount: number;
  targetAmount: number;
  percentComplete: number;
}

export interface DashboardData {
  userName: string;
  totalDonations: number;
  donationCount: number;
  currentCampaign?: CampaignProgress;
  impactBreakdown: ImpactItem[];
  recommendedPages: PageRecommendation[];
  featuredResearch: ResearchPaper[];
}

export interface SearchResult {
  articleId: string;
  title: string;
  summary: string;
  url: string;
  category: string;
  tags: string[];
  cancerTypes: string[];
}

export interface AgentResponse {
  text: string;
  uiComponents?: any[];
  nextAction?: string;
  requiresUserInput: boolean;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// API Client Class
class ApiClient {
  private baseUrl: string;
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private wsMessageHandlers: ((message: any) => void)[] = [];

  constructor(baseUrl: string, wsUrl: string) {
    this.baseUrl = baseUrl;
    this.wsUrl = wsUrl;
  }

  // Helper method for making HTTP requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Get user profile
  async getUserProfile(userId?: string): Promise<UserProfile> {
    const id = userId || mockUserId;
    return this.request<UserProfile>(`/profile/${id}`);
  }

  // Get dashboard data (combines profile, donations, recommendations)
  async getDashboardData(userId?: string): Promise<DashboardData> {
    const id = userId || mockUserId;
    // In a real implementation, this might be a dedicated endpoint
    // For now, we'll construct it from the profile
    const profile = await this.getUserProfile(id);
    
    return {
      userName: profile.name,
      totalDonations: profile.totalDonations,
      donationCount: profile.donationCount,
      currentCampaign: undefined, // Would come from a separate endpoint
      impactBreakdown: [], // Would come from a separate endpoint
      recommendedPages: [], // Would come from a separate endpoint
      featuredResearch: [], // Would come from a separate endpoint
    };
  }

  // Search for cancer information
  async search(
    query: string,
    filters?: {
      category?: string;
      tags?: string[];
      cancerTypes?: string[];
    },
    limit?: number
  ): Promise<SearchResult[]> {
    return this.request<SearchResult[]>('/search', {
      method: 'POST',
      body: JSON.stringify({
        userId: mockUserId,
        query,
        filters,
        limit: limit || 10,
      }),
    });
  }

  // Send message to personalization agent
  async sendMessage(
    input: string,
    sessionId: string,
    metadata?: Record<string, any>
  ): Promise<AgentResponse> {
    return this.request<AgentResponse>('/agent', {
      method: 'POST',
      body: JSON.stringify({
        userId: mockUserId,
        input: {
          text: input,
          timestamp: new Date().toISOString(),
          metadata,
        },
        sessionId,
      }),
    });
  }

  // WebSocket connection for real-time chat
  connectWebSocket(userId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = userId || mockUserId;
      const wsUrl = `${this.wsUrl}?userId=${id}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.wsMessageHandlers.forEach(handler => handler(message));
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
      };
    });
  }

  // Send message via WebSocket
  sendWebSocketMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  // Register message handler for WebSocket
  onWebSocketMessage(handler: (message: any) => void): () => void {
    this.wsMessageHandlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.wsMessageHandlers.indexOf(handler);
      if (index > -1) {
        this.wsMessageHandlers.splice(index, 1);
      }
    };
  }

  // Disconnect WebSocket
  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Update user profile (for missing data)
  async updateUserProfile(
    updates: Partial<UserProfile>,
    userId?: string
  ): Promise<UserProfile> {
    const id = userId || mockUserId;
    return this.request<UserProfile>(`/profile/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient(API_BASE_URL, WS_URL);

export default apiClient;
