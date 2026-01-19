# Supporter Engagement Platform Architecture Diagrams

## 1. System Overview

```mermaid
graph LR
    Client[Web/Mobile Client] --> APIGW[API Gateway]
    Client --> WS[WebSocket API]
    APIGW --> Lambda[Lambda Functions]
    WS --> WSLambda[WebSocket Handlers]
    Lambda --> Bedrock[Amazon Bedrock]
    Lambda --> DDB[(DynamoDB Tables)]
    WSLambda --> DDB
```

## 2. Detailed Component Architecture

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Web[CRUK Clone Web App<br/>React + Amplify]
        Mobile[Mobile/External Apps]
    end

    subgraph API["API Gateway Layer"]
        REST[REST API<br/>- GET /profile<br/>- POST /agent<br/>- POST /search]
        WS[WebSocket API<br/>- $connect<br/>- $disconnect<br/>- $default]
    end

    subgraph Compute["Compute Layer - Lambda Functions"]
        L1[Get User Profile<br/>512MB, 30s]
        L2[Personalization Agent<br/>1024MB, 60s]
        L3[Search<br/>512MB, 30s]
        L4[WS Connect<br/>256MB, 10s]
        L5[WS Disconnect<br/>256MB, 10s]
        L6[WS Message<br/>1024MB, 60s]
    end

    subgraph AI["AI/ML Layer"]
        Bedrock[Amazon Bedrock<br/>Claude 3.5 Sonnet v2]
    end

    subgraph Data["Data Layer - DynamoDB"]
        T1[(Users Table<br/>PK: userId)]
        T2[(Donations Table<br/>PK: userId<br/>SK: donationId)]
        T3[(Context Table<br/>PK: userId<br/>SK: version)]
        T4[(Sessions Table<br/>PK: sessionId<br/>TTL: 1h)]
        T5[(Interactions Table<br/>PK: userId<br/>SK: timestamp)]
    end

    Web --> REST
    Web --> WS
    Mobile --> REST
    Mobile --> WS

    REST --> L1
    REST --> L2
    REST --> L3

    WS --> L4
    WS --> L5
    WS --> L6

    L1 --> T1
    L1 --> T2
    L1 --> T3

    L2 --> Bedrock
    L2 --> T1
    L2 --> T3
    L2 --> T5

    L3 --> T1
    L3 --> T3

    L4 --> T4
    L5 --> T4
    L6 --> T4
    L6 --> L2
```

## 3. Data Flow - User Profile Retrieval

```mermaid
sequenceDiagram
    participant Client
    participant APIGW as API Gateway
    participant Lambda as Get Profile Lambda
    participant Users as Users Table
    participant Donations as Donations Table
    participant Context as Context Table

    Client->>APIGW: GET /profile?userId=123
    APIGW->>APIGW: Validate Request
    APIGW->>Lambda: Invoke
    Lambda->>Users: Query user profile
    Users-->>Lambda: User data
    Lambda->>Donations: Query donations
    Donations-->>Lambda: Donation history
    Lambda->>Context: Query context
    Context-->>Lambda: User context
    Lambda->>Lambda: Aggregate data
    Lambda-->>APIGW: Response
    APIGW-->>Client: 200 OK + Profile
```

## 4. Data Flow - Personalized Content Generation

```mermaid
sequenceDiagram
    participant Client
    participant APIGW as API Gateway
    participant Lambda as Personalization Agent
    participant Context as Context Table
    participant Bedrock as Amazon Bedrock
    participant Interactions as Interactions Table

    Client->>APIGW: POST /agent<br/>{userId, input, sessionId}
    APIGW->>APIGW: Validate Request Body
    APIGW->>Lambda: Invoke
    Lambda->>Context: Get user context
    Context-->>Lambda: Context data
    Lambda->>Bedrock: Generate content<br/>(Claude 3.5 Sonnet)
    Bedrock-->>Lambda: AI response
    Lambda->>Interactions: Log interaction
    Lambda->>Context: Update context
    Lambda-->>APIGW: Response
    APIGW-->>Client: 200 OK + Content
```

## 5. Data Flow - Real-time Chat via WebSocket

```mermaid
sequenceDiagram
    participant Client
    participant WS as WebSocket API
    participant Connect as Connect Handler
    participant Message as Message Handler
    participant Agent as Personalization Agent
    participant Sessions as Sessions Table
    participant Bedrock as Amazon Bedrock

    Client->>WS: Connect (userId=123)
    WS->>Connect: $connect
    Connect->>Sessions: Store connection
    Sessions-->>Connect: Success
    Connect-->>WS: 200 OK
    WS-->>Client: Connected

    Client->>WS: Send message
    WS->>Message: $default route
    Message->>Sessions: Get session
    Sessions-->>Message: Session data
    Message->>Agent: Process message
    Agent->>Bedrock: Generate response
    Bedrock-->>Agent: AI response
    Agent-->>Message: Response
    Message->>WS: PostToConnection
    WS-->>Client: AI response

    Client->>WS: Disconnect
    WS->>Connect: $disconnect
    Connect->>Sessions: Delete connection
    Connect-->>WS: 200 OK
```

## 6. Security Architecture

```mermaid
graph TB
    subgraph Public["Public Internet"]
        Users[Users/Clients]
    end

    subgraph AWS["AWS Cloud"]
        subgraph Security["Security Layer"]
            IAM[IAM Roles & Policies]
            KMS[AWS Managed Encryption]
        end

        subgraph API["API Layer"]
            APIGW[API Gateway<br/>+ API Key<br/>+ Rate Limiting]
            WS[WebSocket API<br/>+ Rate Limiting]
        end

        subgraph Compute["Compute"]
            Lambda[Lambda Functions<br/>+ Execution Role]
        end

        subgraph AI["AI Services"]
            Bedrock[Bedrock<br/>+ Model Access Policy]
        end

        subgraph Data["Data"]
            DDB[(DynamoDB<br/>+ Encryption at Rest<br/>+ PITR)]
        end

        subgraph Monitoring["Monitoring"]
            CW[CloudWatch<br/>Logs & Metrics]
        end
    end

    Users --> APIGW
    Users --> WS
    APIGW --> Lambda
    WS --> Lambda
    Lambda --> Bedrock
    Lambda --> DDB
    IAM -.->|Authorize| Lambda
    IAM -.->|Authorize| Bedrock
    KMS -.->|Encrypt| DDB
    Lambda -.->|Log| CW
    APIGW -.->|Log| CW
```

## 7. Deployment Architecture

```mermaid
graph TB
    subgraph Dev["Development"]
        Code[TypeScript Code]
        Build[npm run build]
        Dist[Compiled JS in dist/]
    end

    subgraph IaC["Infrastructure as Code"]
        CDK[AWS CDK Stack<br/>TypeScript]
        CFN[CloudFormation Template]
    end

    subgraph AWS["AWS us-west-2"]
        Stack[SupporterEngagementStack]
        Resources[AWS Resources]
    end

    Code --> Build
    Build --> Dist
    CDK --> CFN
    Dist --> CDK
    CFN --> Stack
    Stack --> Resources
```

## Key Architecture Decisions

### 1. Serverless Architecture
- **Why:** Cost-effective, auto-scaling, pay-per-use
- **Components:** Lambda, API Gateway, DynamoDB

### 2. Amazon Bedrock for AI
- **Model:** Claude 3.5 Sonnet v2
- **Why:** State-of-the-art language understanding, no model management

### 3. DynamoDB for Data Storage
- **Why:** Serverless, low-latency, flexible schema
- **Tables:** Separate tables for different data types with appropriate keys

### 4. WebSocket for Real-time Communication
- **Why:** Bidirectional, low-latency chat experience
- **Implementation:** API Gateway WebSocket API + Lambda handlers

### 5. Local Lambda Build
- **Why:** Avoid Docker dependency, faster builds
- **Process:** TypeScript → JavaScript compilation → dist/ folder

### 6. API Gateway Request Validation
- **Why:** Reduce Lambda invocations, improve security
- **Features:** JSON schema validation, parameter validation

## Performance Characteristics

| Component | Latency | Throughput | Cost Model |
|-----------|---------|------------|------------|
| API Gateway | <10ms | 100 req/s (configurable) | Per request |
| Lambda (Get Profile) | 50-200ms | Auto-scaling | Per 100ms |
| Lambda (Agent) | 1-5s | Auto-scaling | Per 100ms |
| DynamoDB | <10ms | On-demand | Per request |
| Bedrock | 1-3s | Model-dependent | Per token |
| WebSocket | <50ms | 100 req/s (configurable) | Per message |

## Scalability

- **API Gateway:** Handles 10,000 requests/second by default
- **Lambda:** Concurrent executions scale automatically (default 1000)
- **DynamoDB:** On-demand capacity scales automatically
- **Bedrock:** Managed service with automatic scaling

## Monitoring & Observability

- **CloudWatch Logs:** All Lambda function logs
- **CloudWatch Metrics:** API Gateway, Lambda, DynamoDB metrics
- **X-Ray:** Distributed tracing (can be enabled)
- **API Gateway Access Logs:** Full request/response logging
