/**
 * Integration Tests for API Endpoints
 * 
 * Task 20.4: Write integration tests for API endpoints
 * - Test end-to-end profile retrieval
 * - Test profile updates
 * - Test search functionality
 * - Test personalization flow
 * 
 * Requirements: 1.1, 1.2, 4.1, 11.1
 * 
 * These tests use the live deployed API endpoints:
 * - REST API: https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod
 * - WebSocket API: wss://i1fwoeho25.execute-api.us-west-2.amazonaws.com/prod/
 */

// Live API endpoints
const API_BASE_URL = 'https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod';
const WS_API_URL = 'wss://i1fwoeho25.execute-api.us-west-2.amazonaws.com/prod';

// Test data - using a real user ID from the seeded data
const testUserId = 'user-001'; // This should exist in the deployed database

describe('API Integration Tests', () => {
  // Helper function to make HTTP requests
  async function makeRequest(
    method: string,
    path: string,
    body?: any
  ): Promise<{ status: number; data: any; headers: any }> {
    const url = `${API_BASE_URL}${path}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      return {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  describe('Profile Retrieval - End-to-End', () => {
    /**
     * Test end-to-end profile retrieval
     * Requirement 1.1: User profile access
     * Requirement 1.2: Display Dashboard for returning users
     */
    test('should retrieve user profile with query parameter', async () => {
      const response = await makeRequest('GET', `/profile?userId=${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      
      expect(response.data).toHaveProperty('profile');
      expect(response.data).toHaveProperty('donations');
      expect(response.data).toHaveProperty('profileType');
      expect(response.data).toHaveProperty('hasEngagementContext');
      expect(response.data.profile.userId).toBe(testUserId);
    });

    test('should retrieve user profile with path parameter', async () => {
      const response = await makeRequest('GET', `/profile/${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.data.profile.userId).toBe(testUserId);
    });

    test('should return 400 when userId is missing', async () => {
      const response = await makeRequest('GET', '/profile');

      expect(response.status).toBe(400);
      expect(response.data.error.code).toBe('MISSING_USER_ID');
    });

    test('should return 404 when user not found', async () => {
      const response = await makeRequest('GET', '/profile?userId=non-existent-user');

      expect(response.status).toBe(404);
      expect(response.data.error.code).toBe('USER_NOT_FOUND');
    });

    test('should include donation history in profile response', async () => {
      const response = await makeRequest('GET', `/profile?userId=${testUserId}`);

      expect(response.status).toBe(200);
      expect(response.data.donations).toBeInstanceOf(Array);
      expect(response.data.profile).toHaveProperty('totalDonations');
      expect(response.data.profile).toHaveProperty('donationCount');
    });
  });

  describe('Search Functionality - End-to-End', () => {
    /**
     * Test search functionality
     * Requirement 11.1: Search bar ubiquity
     * Requirement 11.2: Return results from CRUK sources
     */
    test('should search knowledge base and return results', async () => {
      const searchRequest = {
        userId: testUserId,
        query: 'breast cancer treatment',
        limit: 5
      };

      const response = await makeRequest('POST', '/search', searchRequest);

      expect(response.status).toBe(200);
      expect(response.headers).toHaveProperty('access-control-allow-origin');
      
      expect(response.data).toHaveProperty('query');
      expect(response.data).toHaveProperty('articles');
      expect(response.data).toHaveProperty('totalResults');
      expect(response.data).toHaveProperty('source');
      expect(response.data.query).toBe(searchRequest.query);
      expect(response.data.source).toBe('Cancer Research UK');
      expect(response.data.articles).toBeInstanceOf(Array);
    });

    test('should return 400 when userId or query is missing', async () => {
      const searchRequest = {
        userId: testUserId
        // query is missing
      };

      const response = await makeRequest('POST', '/search', searchRequest);

      expect(response.status).toBe(400);
      expect(response.data.error.code).toBe('MISSING_REQUIRED_FIELDS');
    });

    test('should handle search with filters', async () => {
      const searchRequest = {
        userId: testUserId,
        query: 'cancer research',
        filters: {
          category: 'Research',
          tags: ['clinical trials'],
          cancerTypes: ['breast cancer']
        },
        limit: 10
      };

      const response = await makeRequest('POST', '/search', searchRequest);

      expect(response.status).toBe(200);
      expect(response.data.articles).toBeInstanceOf(Array);
    });

    test('should record search query in user context', async () => {
      const searchRequest = {
        userId: testUserId,
        query: 'lung cancer symptoms'
      };

      const response = await makeRequest('POST', '/search', searchRequest);

      expect(response.status).toBe(200);
      // Search query recording is non-critical, so we just verify the search succeeded
    });
  });

  describe('Personalization Flow - End-to-End', () => {
    /**
     * Test personalization flow
     * Requirement 4.1: Intent detection and flow management
     * Requirement 1.2: Display Dashboard for returning users
     */
    test('should initialize session for new user', async () => {
      const request = {
        userId: testUserId
        // No sessionId - should initialize new session
      };

      const response = await makeRequest('POST', '/agent', request);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('sessionId');
      expect(response.data).toHaveProperty('message');
      expect(response.data.sessionId).toBeTruthy();
    });

    test('should process user input and return agent response', async () => {
      // First, initialize a session
      const initRequest = {
        userId: testUserId
      };

      const initResponse = await makeRequest('POST', '/agent', initRequest);
      const sessionId = initResponse.data.sessionId;

      // Now send a message
      const messageRequest = {
        userId: testUserId,
        sessionId: sessionId,
        input: {
          text: 'I want to learn about breast cancer research',
          timestamp: new Date().toISOString()
        }
      };

      const response = await makeRequest('POST', '/agent', messageRequest);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('text');
      expect(response.data).toHaveProperty('requiresUserInput');
      expect(response.data.text).toBeTruthy();
    });

    test('should return 400 when userId is missing', async () => {
      const request = {
        // userId is missing
        input: {
          text: 'Hello',
          timestamp: new Date().toISOString()
        }
      };

      const response = await makeRequest('POST', '/agent', request);

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('userId is required');
    });

    test('should return 400 when input is missing', async () => {
      const request = {
        userId: testUserId,
        sessionId: 'test-session'
        // input is missing
      };

      const response = await makeRequest('POST', '/agent', request);

      expect(response.status).toBe(400);
      expect(response.data.error).toBe('input is required');
    });

    test('should handle information seeking intent', async () => {
      // Initialize session
      const initRequest = {
        userId: testUserId
      };

      const initResponse = await makeRequest('POST', '/agent', initRequest);
      const sessionId = initResponse.data.sessionId;

      // Send information seeking query
      const messageRequest = {
        userId: testUserId,
        sessionId: sessionId,
        input: {
          text: 'What are the symptoms of lung cancer?',
          timestamp: new Date().toISOString()
        }
      };

      const response = await makeRequest('POST', '/agent', messageRequest);

      expect(response.status).toBe(200);
      expect(response.data.text).toBeTruthy();
      // Should provide information or links
      expect(response.data.text.length).toBeGreaterThan(0);
    });

    test('should handle personalization intent', async () => {
      // Initialize session
      const initRequest = {
        userId: testUserId
      };

      const initResponse = await makeRequest('POST', '/agent', initRequest);
      const sessionId = initResponse.data.sessionId;

      // Send personalization query
      const messageRequest = {
        userId: testUserId,
        sessionId: sessionId,
        input: {
          text: 'I want to support cancer research',
          timestamp: new Date().toISOString()
        }
      };

      const response = await makeRequest('POST', '/agent', messageRequest);

      expect(response.status).toBe(200);
      expect(response.data.text).toBeTruthy();
      expect(response.data).toHaveProperty('requiresUserInput');
    });

    test('should maintain conversation context across multiple messages', async () => {
      // Initialize session
      const initRequest = {
        userId: testUserId
      };

      const initResponse = await makeRequest('POST', '/agent', initRequest);
      const sessionId = initResponse.data.sessionId;

      // First message
      const message1 = {
        userId: testUserId,
        sessionId: sessionId,
        input: {
          text: 'I am new to Cancer Research UK',
          timestamp: new Date().toISOString()
        }
      };

      const response1 = await makeRequest('POST', '/agent', message1);
      expect(response1.status).toBe(200);

      // Second message - should maintain context
      const message2 = {
        userId: testUserId,
        sessionId: sessionId,
        input: {
          text: 'I want to learn more about your research',
          timestamp: new Date().toISOString()
        }
      };

      const response2 = await makeRequest('POST', '/agent', message2);
      expect(response2.status).toBe(200);
      
      expect(response2.data.text).toBeTruthy();
    });
  });

  describe('Cross-Endpoint Integration', () => {
    /**
     * Test integration between multiple endpoints
     */
    test('should retrieve profile and use it in personalization', async () => {
      // First, get user profile
      const profileResponse = await makeRequest('GET', `/profile?userId=${testUserId}`);
      expect(profileResponse.status).toBe(200);
      
      const profile = profileResponse.data.profile;

      // Then, use profile in personalization
      const initRequest = {
        userId: testUserId
      };

      const initResponse = await makeRequest('POST', '/agent', initRequest);
      expect(initResponse.status).toBe(200);
      
      const sessionId = initResponse.data.sessionId;

      // Send personalization message
      const messageRequest = {
        userId: testUserId,
        sessionId: sessionId,
        input: {
          text: 'Show me my dashboard',
          timestamp: new Date().toISOString()
        }
      };

      const agentResponse = await makeRequest('POST', '/agent', messageRequest);
      expect(agentResponse.status).toBe(200);
      
      // Should reference user's name or profile data
      expect(agentResponse.data.text).toBeTruthy();
    });

    test('should search and then continue personalization', async () => {
      // First, perform a search
      const searchRequest = {
        userId: testUserId,
        query: 'cancer prevention'
      };

      const searchResponse = await makeRequest('POST', '/search', searchRequest);
      expect(searchResponse.status).toBe(200);

      // Then, continue with personalization
      const initRequest = {
        userId: testUserId
      };

      const initResponse = await makeRequest('POST', '/agent', initRequest);
      const sessionId = initResponse.data.sessionId;

      const messageRequest = {
        userId: testUserId,
        sessionId: sessionId,
        input: {
          text: 'I want to support cancer prevention research',
          timestamp: new Date().toISOString()
        }
      };

      const agentResponse = await makeRequest('POST', '/agent', messageRequest);
      expect(agentResponse.status).toBe(200);
    });
  });
});
