# Implementation Plan: Supporter Engagement Platform

## Overview

This implementation plan breaks down the Supporter Engagement Platform into discrete, incremental coding tasks. The platform will be built using TypeScript, AWS Lambda, Amazon Bedrock (Claude 3.5 Sonnet), and the existing React website (cruk-clone). The implementation uses the existing CDK project in the SupporterEngagement folder and a mock users table for data storage. Each task builds on previous work, with property-based tests integrated throughout to validate correctness properties early.

## Tasks

- [x] 1. Set up data layer and core infrastructure
  - Load mock data from Data folder CSV files (user_details.csv, donations.csv, interests.csv, supporter_interest_tags.csv)
  - Create DynamoDB tables and seed with CSV data
  - Define core TypeScript interfaces based on service schemas (person-schema, donation-schema, fundraising-page-schema)
  - Set up testing framework (Jest and fast-check) in existing CDK project
  - Configure environment variables for Bedrock access
  - Update existing CDK stack in SupporterEngagement folder to include new Lambda functions
  - _Requirements: 1.1, 1.5, 13.1, 13.2_

- [-] 2. Implement user profile retrieval from Data folder
  - [x] 2.1 Create Lambda function to retrieve user profiles
    - Implement getUserProfile function that queries DynamoDB (seeded from user_details.csv)
    - Return user attributes including donation history (from donations.csv), interests (from interests.csv)
    - Handle cases for new users, returning users, and users with basic info
    - Map data to person-schema structure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Write property test for profile retrieval
    - **Property 1: Profile Retrieval**
    - **Validates: Requirements 1.1, 1.5**

  - [ ]* 2.3 Write unit tests for user profile retrieval
    - Test profile retrieval with valid/invalid user IDs from CSV data
    - Test handling of missing profile data
    - Test error handling for database failures
    - _Requirements: 1.1, 1.5_

- [x] 3. Implement Context Management Service
  - [x] 3.1 Create context storage in DynamoDB
    - Design DynamoDB table schema for user context
    - Implement context versioning with timestamps
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 3.2 Implement Context Management Service
    - Write getContext, updateContext, mergeContext methods
    - Add context versioning and history tracking
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 3.3 Write property test for context versioning and retrieval
    - **Property 2: Context Versioning and Retrieval**
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 3.4 Write property test for session context round-trip
    - **Property 3: Session Context Round-Trip**
    - **Validates: Requirements 8.5**

  - [ ]* 3.5 Write unit tests for Context Management Service
    - Test context merging logic
    - Test concurrent context updates
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 4. Checkpoint - Ensure profile retrieval and context management tests pass (only the implemented ones in the task list)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Intent Detection Service
  - [x] 5.1 Create Intent Detection Service with Bedrock integration
    - Integrate Amazon Bedrock with Claude 4.5 Sonnet
    - Implement detectIntent method with prompt engineering
    - Extract entities from user input
    - Return intent classification (personalization, information_seeking, action, unclear)
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Write property test for intent detection universality
    - **Property 4: Intent Detection Universality**
    - **Validates: Requirements 4.1, 4.2**

  - [ ]* 5.3 Write unit tests for Intent Detection Service
    - Test classification for clear personalization queries
    - Test classification for information seeking queries
    - Test handling of ambiguous inputs
    - Test entity extraction accuracy
    - _Requirements: 4.1, 4.2_

- [x] 6. Implement data access functions for CSV data
  - [x] 6.1 Implement transaction data retrieval
    - Create function to get recent transactions from donations.csv data
    - Create function to get donation summary (total, count, average)
    - Map to donation-schema structure
    - _Requirements: 2.1, 2.2_

  - [x] 6.2 Implement research papers retrieval
    - Create function to search research papers (mock data or from Data folder if available)
    - Create function to get featured papers
    - _Requirements: 2.5, 6.3_

  - [x] 6.3 Implement knowledge base search
    - Create function to search CRUK articles (mock data or external API)
    - Implement search with filters
    - _Requirements: 5.1, 5.6, 11.2, 11.5_

  - [x] 6.4 Implement interaction tracking
    - Create function to record user interactions in DynamoDB
    - Create function to record page visits
    - _Requirements: 4.5, 5.5, 11.4_

  - [ ]* 6.5 Write property test for CRUK source exclusivity
    - **Property 5: CRUK Source Exclusivity**
    - **Validates: Requirements 5.1, 5.6, 11.2, 11.5**

  - [ ]* 6.6 Write unit tests for data access functions
    - Test each function with valid inputs from CSV data
    - Test error handling for database failures
    - _Requirements: 2.1, 2.2, 2.5, 5.1, 5.6, 6.3_

- [x] 7. Checkpoint - Ensure intent detection and data access tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement Content Generation Service
  - [x] 8.1 Create Content Generation Service
    - Implement generateMotivationalContent method using Bedrock
    - Implement generateCallToAction method
    - Implement selectResearchPapers method
    - Implement formatImpactBreakdown method
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 8.2 Write property test for motivational content personalization
    - **Property 6: Motivational Content Personalization**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 8.3 Write property test for call to action personalization
    - **Property 7: Call to Action Personalization**
    - **Validates: Requirements 7.1, 7.2, 7.4**

  - [ ]* 8.4 Write property test for regular giving CTA
    - **Property 8: Regular Giving CTA for Capable Supporters**
    - **Validates: Requirements 7.3**

  - [ ]* 8.5 Write unit tests for Content Generation Service
    - Test motivational content with different user contexts
    - Test CTA generation for various supporter types
    - Test research paper selection logic
    - Test impact breakdown formatting
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [-] 9. Implement Personalization Agent core logic
  - [x] 9.1 Create Personalization Agent orchestrator
    - Implement processInput method with flow routing
    - Implement initializeSession and resumeSession methods
    - Implement endSession with context persistence
    - Coordinate calls to Intent Detection, Context Management, and Content Generation
    - Manage conversation state machine
    - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_

  - [ ]* 9.2 Write property test for flow selection based on profile state
    - **Property 9: Flow Selection Based on Profile State**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [ ]* 9.3 Write property test for flow transition protocol
    - **Property 10: Flow Transition Protocol**
    - **Validates: Requirements 4.3, 4.4**

  - [ ]* 9.4 Write property test for interaction recording completeness
    - **Property 11: Interaction Recording Completeness**
    - **Validates: Requirements 4.5, 5.5**

  - [ ]* 9.5 Write unit tests for Personalization Agent
    - Test session initialization for new vs returning users
    - Test flow routing based on intent
    - Test conversation state transitions
    - Test error handling and recovery
    - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_

- [x] 10. Implement personalization flows
  - [x] 10.1 Implement new user personalization flow
    - Create flow for collecting user context from new users
    - Implement input summarization and confirmation using Bedrock
    - Save personalization data with timestamps
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 10.2 Write property test for personalization input round-trip
    - **Property 12: Personalization Input Round-Trip**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 8.1**

  - [x] 10.3 Implement dashboard generation for returning supporters
    - Generate dashboard with user name, total donations, campaign progress
    - Include impact breakdown and recommended pages
    - Include featured research papers
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 10.4 Write property test for dashboard completeness
    - **Property 13: Dashboard Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.3**

  - [ ]* 10.5 Write unit tests for personalization flows
    - Test new user flow with various inputs
    - Test dashboard generation with different user profiles
    - Test simplified flow for users with basic info
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 11. Checkpoint - Ensure personalization flows and agent tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 12. Implement information seeking flow
  - [x] 12.1 Create information seeking flow handler
    - Implement query processing and knowledge base search
    - Return relevant CRUK articles and links
    - Implement validation and feedback collection
    - Implement flow resumption logic
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 12.2 Write property test for information seeking feedback loop
    - **Property 14: Information Seeking Feedback Loop**
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [ ]* 12.3 Write unit tests for information seeking flow
    - Test query processing with various cancer-related queries
    - Test result filtering to CRUK sources only
    - Test feedback collection
    - Test flow resumption after information provision
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 13. Implement search functionality
  - [ ] 13.1 Create search handler with knowledge base integration
    - Implement free text search processing
    - Return relevant CRUK pages and articles
    - Record search queries in user context
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 13.2 Write property test for search bar ubiquity
    - **Property 15: Search Bar Ubiquity**
    - **Validates: Requirements 11.1**

  - [ ]* 13.3 Write property test for search results completeness
    - **Property 16: Search Results Completeness**
    - **Validates: Requirements 11.3, 11.4**

  - [ ]* 13.4 Write unit tests for search functionality
    - Test search with various queries
    - Test result ranking and relevance
    - Test search query recording
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 14. Implement missing data handling
  - [ ] 14.1 Create missing data detection and prompting logic
    - Detect missing profile fields (age, gender)
    - Generate appropriate questions for missing data
    - Ensure search bar is always available
    - Do not block feature access for missing data
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 14.2 Write property test for missing data graceful handling
    - **Property 17: Missing Data Graceful Handling**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**

  - [ ]* 14.3 Write unit tests for missing data handling
    - Test detection of various missing fields
    - Test question generation
    - Test that features remain accessible
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 15. Checkpoint - Ensure information seeking and search tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement security and compliance features
  - [ ] 16.1 Implement consent verification system
    - Check consent before processing special category data
    - Implement consent tracking and storage
    - _Requirements: 12.1_

  - [ ]* 16.2 Write property test for consent verification
    - **Property 18: Consent Verification for Sensitive Data**
    - **Validates: Requirements 12.1**

  - [ ] 16.3 Implement data encryption
    - Configure encryption at rest (DynamoDB)
    - Configure TLS for all API communications
    - _Requirements: 12.2_

  - [ ]* 16.4 Write property test for data encryption universality
    - **Property 19: Data Encryption Universality**
    - **Validates: Requirements 12.2**

  - [ ] 16.5 Implement data access rights endpoints
    - Create API endpoints for users to view their data
    - Create API endpoints for users to modify their data
    - Create API endpoints for users to delete their data
    - _Requirements: 12.4_

  - [ ]* 16.6 Write property test for data access rights
    - **Property 20: Data Access Rights**
    - **Validates: Requirements 12.4**

  - [ ] 16.7 Implement audit logging
    - Log all data access operations with timestamps
    - Log all data modification operations
    - Store audit logs securely
    - _Requirements: 12.5_

  - [ ]* 16.8 Write property test for audit logging completeness
    - **Property 21: Audit Logging Completeness**
    - **Validates: Requirements 12.5**

  - [ ]* 16.9 Write unit tests for security features
    - Test consent verification logic
    - Test encryption configuration
    - Test data access rights endpoints
    - Test audit log creation
    - _Requirements: 12.1, 12.2, 12.4, 12.5_

- [ ] 17. Implement performance optimization
  - [ ] 17.1 Implement caching strategy
    - Implement cache-aside pattern for user profiles
    - Implement cache warming for frequently accessed data
    - _Requirements: 13.3_

  - [ ]* 17.2 Write property test for cache effectiveness
    - **Property 22: Cache Effectiveness**
    - **Validates: Requirements 13.3**

  - [ ] 17.3 Optimize Bedrock calls
    - Implement prompt caching for repeated patterns
    - Implement streaming responses
    - Select appropriate models based on query complexity
    - _Requirements: 13.2_

  - [ ]* 17.4 Write property test for response time performance
    - **Property 23: Response Time Performance**
    - **Validates: Requirements 13.1**

  - [ ]* 17.5 Write property test for load performance maintenance
    - **Property 24: Load Performance Maintenance**
    - **Validates: Requirements 13.5**

  - [ ]* 17.6 Write unit tests for performance features
    - Test cache hit/miss scenarios
    - Test TTL expiration
    - Test Bedrock prompt optimization
    - _Requirements: 13.1, 13.2, 13.3, 13.5_

- [ ] 18. Checkpoint - Ensure security and performance tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Integrate with existing React frontend (cruk-clone)
  - [ ] 19.1 Add personalization container to existing website
    - Modify cruk-clone App.tsx to include personalization container
    - Create dashboard component with user name, donations, impact
    - Create campaign progress component
    - Create recommended pages component
    - Create featured research component
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 19.2 Add search bar to existing website
    - Add search input with prompt "what are you looking for today"
    - Display search results with links
    - Ensure search bar is present on all pages
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 19.3 Add missing data prompt component
    - Display questions for missing profile data
    - Create forms for age and gender input
    - Ensure non-blocking UX
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 19.4 Add conversational interface
    - Create chat-like interface for personalization flow
    - Display agent responses and user inputs
    - Handle information seeking flow
    - Display calls to action
    - _Requirements: 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3_

  - [ ] 19.5 Create API client for backend communication
    - Set up API client to call Lambda functions via API Gateway
    - Handle authentication state (mocked)
    - _Requirements: 1.1_

  - [ ]* 19.6 Write unit tests for React components
    - Test component rendering with various props
    - Test user interactions (clicks, form submissions)
    - Test API integration
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 7.1, 9.1, 10.1, 11.1_

- [x] 20. Implement API Gateway and Lambda integration
  - [x] 20.1 Create API Gateway REST endpoints in CDK stack
    - Define endpoints for profile, search, personalization
    - Configure CORS and request validation
    - Set up rate limiting
    - _Requirements: 1.1, 1.2, 11.1_

  - [x] 20.2 Create API Gateway WebSocket for real-time chat
    - Set up WebSocket API for conversational interface
    - Implement connection, message, and disconnection handlers
    - _Requirements: 4.1, 4.2, 5.1_

  - [x] 20.3 Wire Lambda functions to API Gateway in CDK
    - Implement Lambda for profile endpoints
    - Implement Lambda for search endpoints
    - Implement Lambda for personalization agent
    - Wire Lambda functions to API Gateway
    - _Requirements: 1.1, 1.2, 4.1, 11.1_

  - [x] 20.4 Write integration tests for API endpoints
    - Test end-to-end profile retrieval
    - Test profile updates
    - Test search functionality
    - Test personalization flow
    - _Requirements: 1.1, 1.2, 4.1, 11.1_

- [ ] 21. Implement error handling and monitoring
  - [ ] 21.1 Implement error handling middleware
    - Create error response formatter
    - Implement graceful degradation logic
    - Implement retry logic with exponential backoff
    - _Requirements: 8.5_

  - [ ] 21.2 Set up CloudWatch logging and monitoring
    - Configure Lambda function logging
    - Set up CloudWatch dashboards
    - Configure alarms for error rates and latency
    - _Requirements: 12.5, 13.1, 13.5_

  - [ ]* 21.3 Write unit tests for error handling
    - Test error response formatting
    - Test retry logic
    - Test fallback mechanisms
    - _Requirements: 8.5_

- [ ] 22. Final checkpoint and integration testing
  - [ ] 22.1 Run full test suite
    - Run all unit tests
    - Run all property tests (100 iterations each)
    - Run all integration tests
    - Verify 80% code coverage
    - _Requirements: All_

  - [ ] 22.2 Perform end-to-end testing
    - Test complete new user flow
    - Test complete returning user flow
    - Test information seeking flow
    - Test search functionality
    - Test error scenarios
    - _Requirements: All_

  - [ ] 22.3 Perform performance testing
    - Verify response time requirements (<2 seconds)
    - Test concurrent user handling
    - _Requirements: 13.1, 13.3, 13.5_

  - [ ] 22.4 Perform security testing
    - Verify encryption configuration
    - Verify GDPR compliance features
    - _Requirements: 12.1, 12.2, 12.4, 12.5_

  - [ ] 22.5 Deploy to AWS using CDK
    - Deploy infrastructure with AWS CDK from SupporterEngagement folder
    - Run smoke tests
    - Verify all services are operational
    - _Requirements: All_

- [ ] 23. Final checkpoint - Ensure all tests pass and system is ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100 iterations each
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end flows and component interactions
- The implementation uses TypeScript throughout for type safety
- Uses existing CDK project in SupporterEngagement folder
- Uses existing React website in cruk-clone folder
- Uses Data folder CSV files (user_details.csv, donations.csv, interests.csv, supporter_interest_tags.csv)
- Uses Data/Service Schemas for data model definitions (person-schema, donation-schema, fundraising-page-schema)
- Authentication is mocked (no Cognito integration needed)
- AWS services are configured for low-cost, low-latency operation
- Security and compliance are integrated throughout, not added at the end
