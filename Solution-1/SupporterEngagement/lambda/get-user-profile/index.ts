import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserProfileFromDb, getDonationHistoryFromDb } from '../shared/dynamodb-utils';
import { UserProfile, Donation, ProfileType, ErrorResponse } from '../shared/types';

// Environment variables
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'SupporterEngagement-Users';
const DONATION_TABLE_NAME = process.env.DONATION_TABLE_NAME || 'SupporterEngagement-Donations';

/**
 * Response structure for getUserProfile
 */
interface GetUserProfileResponse {
  profile: UserProfile;
  donations: Donation[];
  profileType: ProfileType;
  hasEngagementContext: boolean;
}

/**
 * Determine profile type based on user data
 * Handles cases for new users, returning users, and users with basic info
 */
function determineProfileType(profile: UserProfile, donations: Donation[]): ProfileType {
  // New user: no donations, no interests, minimal data
  if (donations.length === 0 && profile.interests.length === 0 && profile.donationCount === 0) {
    return ProfileType.NEW_USER;
  }
  
  // Returning user: has donations or significant engagement history
  if (donations.length > 0 || profile.donationCount > 0 || profile.hasAttendedEvents || profile.hasFundraised) {
    return ProfileType.RETURNING_USER;
  }
  
  // Basic info: has some data but no engagement
  return ProfileType.BASIC_INFO;
}

/**
 * Lambda handler for GET /profile
 * Implements getUserProfile function that queries DynamoDB (seeded from user_details.csv)
 * Returns user attributes including donation history (from donations.csv), interests (from interests.csv)
 * Handles cases for new users, returning users, and users with basic info
 * Maps data to person-schema structure
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract userId from query parameters or path parameters
    const userId = event.queryStringParameters?.userId || event.pathParameters?.userId;
    
    if (!userId) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'MISSING_USER_ID',
          message: 'userId is required',
          userMessage: 'User ID is required to retrieve profile',
          retryable: false
        }
      };
      
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(errorResponse)
      };
    }
    
    // Retrieve user profile from DynamoDB (seeded from user_details.csv)
    const profile = await getUserProfileFromDb(userId, USER_TABLE_NAME);
    
    if (!profile) {
      const errorResponse: ErrorResponse = {
        error: {
          code: 'USER_NOT_FOUND',
          message: `User with ID ${userId} not found`,
          userMessage: 'User profile not found',
          retryable: false
        }
      };
      
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(errorResponse)
      };
    }
    
    // Retrieve donation history from DynamoDB (seeded from donations.csv)
    const donations = await getDonationHistoryFromDb(userId, DONATION_TABLE_NAME);
    
    // Determine profile type (new user, basic info, or returning user)
    const profileType = determineProfileType(profile, donations);
    const hasEngagementContext = profileType === ProfileType.RETURNING_USER;
    
    // Build response with user attributes including donation history and interests
    const response: GetUserProfileResponse = {
      profile,
      donations,
      profileType,
      hasEngagementContext
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error in getUserProfile handler:', error);
    
    const errorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        userMessage: 'An error occurred while retrieving your profile. Please try again later.',
        retryable: true
      }
    };
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(errorResponse)
    };
  }
};
