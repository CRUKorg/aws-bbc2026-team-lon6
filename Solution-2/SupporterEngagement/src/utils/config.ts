import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment-specific .env file
const env = process.env.NODE_ENV || 'development';
const envPath = path.resolve(__dirname, `../../.env.${env}`);
dotenv.config({ path: envPath });

export interface Config {
  aws: {
    region: string;
    accountId: string;
  };
  dynamodb: {
    userProfilesTable: string;
    contextTable: string;
    engagementTable: string;
    analyticsTable: string;
  };
  rds: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  s3: {
    researchPapersBucket: string;
    contentBucket: string;
  };
  cognito: {
    userPoolId: string;
    clientId: string;
  };
  bedrock: {
    modelId: string;
    region: string;
  };
  api: {
    gatewayUrl: string;
    websocketUrl: string;
  };
  cache: {
    ttl: {
      userProfile: number;
      researchPapers: number;
      knowledgeArticles: number;
    };
  };
  performance: {
    maxResponseTimeMs: number;
    maxRetryAttempts: number;
    circuitBreakerThreshold: number;
  };
  logging: {
    level: string;
    enableXRayTracing: boolean;
  };
}

export const config: Config = {
  aws: {
    region: process.env.AWS_REGION || 'eu-west-2',
    accountId: process.env.AWS_ACCOUNT_ID || '',
  },
  dynamodb: {
    userProfilesTable: process.env.DYNAMODB_USER_PROFILES_TABLE || 'michael-supporter-engagement-user-profiles',
    contextTable: process.env.DYNAMODB_CONTEXT_TABLE || 'michael-supporter-engagement-context',
    engagementTable: process.env.DYNAMODB_ENGAGEMENT_TABLE || 'michael-supporter-engagement-engagement',
    analyticsTable: process.env.DYNAMODB_ANALYTICS_TABLE || 'michael-supporter-engagement-analytics',
  },
  rds: {
    host: process.env.RDS_HOST || 'localhost',
    port: parseInt(process.env.RDS_PORT || '5432', 10),
    database: process.env.RDS_DATABASE || 'supporter_engagement',
    username: process.env.RDS_USERNAME || 'admin',
    password: process.env.RDS_PASSWORD || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  s3: {
    researchPapersBucket: process.env.S3_RESEARCH_PAPERS_BUCKET || 'michael-supporter-engagement-research-papers',
    contentBucket: process.env.S3_CONTENT_BUCKET || 'michael-supporter-engagement-content',
  },
  cognito: {
    userPoolId: process.env.COGNITO_USER_POOL_ID || '',
    clientId: process.env.COGNITO_CLIENT_ID || '',
  },
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0',
    region: process.env.BEDROCK_REGION || 'us-east-1',
  },
  api: {
    gatewayUrl: process.env.API_GATEWAY_URL || 'http://localhost:3000',
    websocketUrl: process.env.WEBSOCKET_API_URL || 'ws://localhost:3001',
  },
  cache: {
    ttl: {
      userProfile: parseInt(process.env.CACHE_TTL_USER_PROFILE || '300', 10),
      researchPapers: parseInt(process.env.CACHE_TTL_RESEARCH_PAPERS || '3600', 10),
      knowledgeArticles: parseInt(process.env.CACHE_TTL_KNOWLEDGE_ARTICLES || '3600', 10),
    },
  },
  performance: {
    maxResponseTimeMs: parseInt(process.env.MAX_RESPONSE_TIME_MS || '2000', 10),
    maxRetryAttempts: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    circuitBreakerThreshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableXRayTracing: process.env.ENABLE_XRAY_TRACING === 'true',
  },
};
