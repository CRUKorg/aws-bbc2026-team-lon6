/**
 * Unit Tests for User Profile MCP Server
 */

import { UserProfileMCPServer } from '../../../src/mcp-servers/user-profile/server';
import { dynamoDBClient } from '../../../src/mcp-servers/user-profile/dynamodb-client';

// Mock the DynamoDB client
jest.mock('../../../src/mcp-servers/user-profile/dynamodb-client', () => ({
  dynamoDBClient: {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    getEngagementHistory: jest.fn(),
  },
}));

describe('UserProfileMCPServer', () => {
  let server: UserProfileMCPServer;

  beforeEach(() => {
    server = new UserProfileMCPServer();
    jest.clearAllMocks();
  });

  describe('getServerInfo', () => {
    it('should return server information', () => {
      const info = server.getServerInfo();
      
      expect(info).toHaveProperty('name', 'user-profile');
      expect(info).toHaveProperty('version', '1.0.0');
      expect(info).toHaveProperty('description');
    });
  });

  describe('listTools', () => {
    it('should return list of available tools', () => {
      const tools = server.listTools();
      
      expect(tools).toHaveLength(3);
      expect(tools.map(t => t.name)).toEqual([
        'get_user_profile',
        'update_user_profile',
        'get_engagement_history',
      ]);
    });

    it('should include input schemas for all tools', () => {
      const tools = server.listTools();
      
      tools.forEach(tool => {
        expect(tool).toHaveProperty('inputSchema');
        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(tool.inputSchema).toHaveProperty('required');
      });
    });
  });

  describe('executeTool - get_user_profile', () => {
    it('should retrieve user profile successfully', async () => {
      const mockProfile = {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        totalDonations: 100,
      };

      (dynamoDBClient.getUserProfile as jest.Mock).mockResolvedValue(mockProfile);

      const result = await server.executeTool({
        name: 'get_user_profile',
        arguments: { userId: 'user123' },
      });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('resource');
      expect(result.content[0].resource).toEqual(mockProfile);
      expect(dynamoDBClient.getUserProfile).toHaveBeenCalledWith('user123');
    });

    it('should return error when user not found', async () => {
      (dynamoDBClient.getUserProfile as jest.Mock).mockResolvedValue(null);

      const result = await server.executeTool({
        name: 'get_user_profile',
        arguments: { userId: 'nonexistent' },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('not found');
    });

    it('should return error when userId is missing', async () => {
      const result = await server.executeTool({
        name: 'get_user_profile',
        arguments: {},
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing required parameter');
    });
  });

  describe('executeTool - update_user_profile', () => {
    it('should update user profile successfully', async () => {
      const existingProfile = {
        userId: 'user123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const updatedProfile = {
        ...existingProfile,
        name: 'Updated Name',
        updatedAt: new Date().toISOString(),
      };

      (dynamoDBClient.getUserProfile as jest.Mock).mockResolvedValue(existingProfile);
      (dynamoDBClient.updateUserProfile as jest.Mock).mockResolvedValue(updatedProfile);

      const result = await server.executeTool({
        name: 'update_user_profile',
        arguments: {
          userId: 'user123',
          updates: { name: 'Updated Name' },
        },
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].resource).toEqual(updatedProfile);
      expect(dynamoDBClient.updateUserProfile).toHaveBeenCalledWith(
        'user123',
        { name: 'Updated Name' }
      );
    });

    it('should return error when user does not exist', async () => {
      (dynamoDBClient.getUserProfile as jest.Mock).mockResolvedValue(null);

      const result = await server.executeTool({
        name: 'update_user_profile',
        arguments: {
          userId: 'nonexistent',
          updates: { name: 'New Name' },
        },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });

    it('should return error when parameters are missing', async () => {
      const result = await server.executeTool({
        name: 'update_user_profile',
        arguments: { userId: 'user123' },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing required parameters');
    });
  });

  describe('executeTool - get_engagement_history', () => {
    it('should retrieve engagement history successfully', async () => {
      const mockHistory = [
        {
          recordId: 'rec1',
          userId: 'user123',
          type: 'donation',
          timestamp: new Date().toISOString(),
          donationAmount: 50,
        },
        {
          recordId: 'rec2',
          userId: 'user123',
          type: 'event',
          timestamp: new Date().toISOString(),
          eventName: 'Race for Life',
        },
      ];

      (dynamoDBClient.getEngagementHistory as jest.Mock).mockResolvedValue(mockHistory);

      const result = await server.executeTool({
        name: 'get_engagement_history',
        arguments: { userId: 'user123' },
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].resource).toEqual({
        userId: 'user123',
        engagementHistory: mockHistory,
        count: 2,
      });
      expect(dynamoDBClient.getEngagementHistory).toHaveBeenCalledWith('user123', 50);
    });

    it('should respect custom limit parameter', async () => {
      (dynamoDBClient.getEngagementHistory as jest.Mock).mockResolvedValue([]);

      await server.executeTool({
        name: 'get_engagement_history',
        arguments: { userId: 'user123', limit: 10 },
      });

      expect(dynamoDBClient.getEngagementHistory).toHaveBeenCalledWith('user123', 10);
    });

    it('should return error when userId is missing', async () => {
      const result = await server.executeTool({
        name: 'get_engagement_history',
        arguments: {},
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Missing required parameter');
    });
  });

  describe('executeTool - unknown tool', () => {
    it('should return error for unknown tool', async () => {
      const result = await server.executeTool({
        name: 'unknown_tool',
        arguments: {},
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });
  });

  describe('error handling', () => {
    it('should handle DynamoDB errors gracefully', async () => {
      (dynamoDBClient.getUserProfile as jest.Mock).mockRejectedValue(
        new Error('DynamoDB connection failed')
      );

      const result = await server.executeTool({
        name: 'get_user_profile',
        arguments: { userId: 'user123' },
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error executing tool');
    });
  });
});
