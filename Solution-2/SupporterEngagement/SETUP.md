# Supporter Engagement Platform - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v20.x or later)
   - Download from: https://nodejs.org/
   - Or install via Homebrew: `brew install node`

2. **AWS CLI** (v2)
   - Download from: https://aws.amazon.com/cli/
   - Or install via Homebrew: `brew install awscli`

3. **AWS CDK CLI**
   ```bash
   npm install -g aws-cdk
   ```

4. **PostgreSQL** (for local development)
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```

5. **Redis** (for local development)
   ```bash
   brew install redis
   brew services start redis
   ```

## Installation Steps

### 1. Install Dependencies

```bash
cd SupporterEngagement
npm install
```

### 2. Configure Environment

Copy the development environment file:
```bash
cp .env.development .env
```

Update the `.env` file with your local configuration.

### 3. Build the Project

```bash
npm run build
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run only property-based tests
npm run test:property
```

## AWS Deployment

### 1. Configure AWS Credentials

```bash
aws configure
```

### 2. Bootstrap CDK (first time only)

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### 3. Deploy Infrastructure

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy to AWS
cdk deploy
```

### 4. View Outputs

After deployment, CDK will output important values:
- Cognito User Pool ID
- API Gateway Endpoint
- S3 Bucket Names
- RDS Endpoint
- Redis Endpoint

Update your `.env` file with these values.

## Project Structure

```
SupporterEngagement/
├── bin/                          # CDK app entry point
├── lib/                          # CDK stack definitions
├── src/
│   ├── models/                   # TypeScript interfaces and data models
│   ├── services/                 # Core services
│   │   ├── context-management/   # User context management
│   │   ├── intent-detection/     # Intent classification
│   │   ├── content-generation/   # Content generation
│   │   └── caching/              # Caching layer
│   ├── mcp-servers/              # MCP server implementations
│   │   ├── user-profile/         # User profile data access
│   │   ├── transaction/          # Transaction data access
│   │   ├── research-papers/      # Research papers access
│   │   ├── knowledge-base/       # Knowledge base access
│   │   └── analytics/            # Analytics tracking
│   ├── agent/                    # AI agent orchestration
│   │   ├── flows/                # Personalization flows
│   │   ├── dashboard/            # Dashboard generation
│   │   ├── search/               # Search functionality
│   │   └── missing-data/         # Missing data handling
│   ├── lambda/                   # Lambda function handlers
│   └── utils/                    # Utility functions
│       ├── error-handling/       # Error handling
│       ├── security/             # Security utilities
│       └── performance/          # Performance monitoring
├── test/                         # Test files
├── .env.example                  # Environment template
├── .env.development              # Development config
└── package.json                  # Dependencies
```

## Development Workflow

### 1. Local Development

For local development without AWS:
- Use local PostgreSQL for transaction data
- Use local Redis for caching
- Mock AWS services (DynamoDB, S3, Bedrock)

### 2. Testing

```bash
# Run unit tests
npm test

# Run property-based tests
npm run test:property

# Watch mode
npm run watch
```

### 3. Building

```bash
# Compile TypeScript
npm run build

# Watch for changes
npm run watch
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `AWS_REGION`: AWS region for deployment
- `BEDROCK_MODEL_ID`: Claude model ID for AI
- `DYNAMODB_*_TABLE`: DynamoDB table names
- `REDIS_HOST`: Redis cache endpoint
- `RDS_HOST`: PostgreSQL database endpoint

## Next Steps

1. Install Node.js and dependencies
2. Set up local PostgreSQL and Redis
3. Configure environment variables
4. Run tests to verify setup
5. Begin implementing data models (Task 2)

## Troubleshooting

### Node.js not found
Install Node.js from https://nodejs.org/ or via Homebrew:
```bash
brew install node
```

### AWS credentials not configured
Run `aws configure` and provide your AWS access key and secret key.

### CDK bootstrap failed
Ensure you have the correct AWS permissions and account ID.

### Tests failing
Ensure all dependencies are installed: `npm install`

## Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [fast-check Documentation](https://fast-check.dev/)
