import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class SupporterEngagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    
    // User Profiles Table
    const userProfilesTable = new dynamodb.Table(this, 'UserProfilesTable', {
      tableName: 'SupporterEngagement-Users',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // Donations Table
    const donationsTable = new dynamodb.Table(this, 'DonationsTable', {
      tableName: 'SupporterEngagement-Donations',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'donationId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // User Context Table (for session management)
    const userContextTable = new dynamodb.Table(this, 'UserContextTable', {
      tableName: 'SupporterEngagement-Context',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'version',
        type: dynamodb.AttributeType.NUMBER
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // Session Table
    const sessionTable = new dynamodb.Table(this, 'SessionTable', {
      tableName: 'SupporterEngagement-Sessions',
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // Interaction History Table
    const interactionTable = new dynamodb.Table(this, 'InteractionTable', {
      tableName: 'SupporterEngagement-Interactions',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
      encryption: dynamodb.TableEncryption.AWS_MANAGED
    });

    // Environment variables for Lambda functions
    const lambdaEnvironment = {
      USER_TABLE_NAME: userProfilesTable.tableName,
      DONATION_TABLE_NAME: donationsTable.tableName,
      CONTEXT_TABLE_NAME: userContextTable.tableName,
      SESSION_TABLE_NAME: sessionTable.tableName,
      INTERACTION_TABLE_NAME: interactionTable.tableName,
      BEDROCK_REGION: this.region,
      BEDROCK_MODEL_ID: 'anthropic.claude-3-5-sonnet-20240620-v1:0'
    };

    // IAM Role for Lambda functions with Bedrock access
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });

    // Grant Bedrock access
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      resources: [`arn:aws:bedrock:${this.region}::foundation-model/*`]
    }));

    // Grant AWS Marketplace permissions for Claude 4.5
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'aws-marketplace:ViewSubscriptions',
        'aws-marketplace:Subscribe'
      ],
      resources: ['*']
    }));

    // Grant DynamoDB access
    userProfilesTable.grantReadWriteData(lambdaRole);
    donationsTable.grantReadWriteData(lambdaRole);
    userContextTable.grantReadWriteData(lambdaRole);
    sessionTable.grantReadWriteData(lambdaRole);
    interactionTable.grantReadWriteData(lambdaRole);

    // Lambda Layer for shared dependencies (will be created later)
    // const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
    //   code: lambda.Code.fromAsset('lambda-layers/shared'),
    //   compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
    //   description: 'Shared dependencies for Supporter Engagement Platform'
    // });

    // Placeholder Lambda functions (will be implemented in subsequent tasks)
    
    // User Profile Lambda
    // Note: Build the Lambda locally before deploying with: npm run build
    const getUserProfileLambda = new lambda.Function(this, 'GetUserProfileFunction', {
      functionName: 'SupporterEngagement-GetUserProfile',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'get-user-profile/index.handler',
      code: lambda.Code.fromAsset('lambda/get-user-profile/dist'),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // Personalization Agent Lambda
    const personalizationAgentLambda = new lambda.Function(this, 'PersonalizationAgentFunction', {
      functionName: 'SupporterEngagement-PersonalizationAgent',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'personalization-agent/index.handler',
      code: lambda.Code.fromAsset('lambda/personalization-agent/dist'),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024
    });

    // Search Lambda
    const searchLambda = new lambda.Function(this, 'SearchFunction', {
      functionName: 'SupporterEngagement-Search',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'search/index.handler',
      code: lambda.Code.fromAsset('lambda/search/dist'),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 512
    });

    // API Gateway REST API with CORS and request validation
    const api = new apigateway.RestApi(this, 'SupporterEngagementApi', {
      restApiName: 'Supporter Engagement API',
      description: 'API for Supporter Engagement Platform',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 100, // requests per second
        throttlingBurstLimit: 200, // burst capacity
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token'
        ],
        allowCredentials: true
      },
      cloudWatchRole: true
    });

    // Request validator for body and parameters
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: api,
      requestValidatorName: 'request-validator',
      validateRequestBody: true,
      validateRequestParameters: true
    });

    // API Key for rate limiting (optional - can be used for additional security)
    const apiKey = new apigateway.ApiKey(this, 'ApiKey', {
      apiKeyName: 'SupporterEngagementApiKey',
      description: 'API Key for Supporter Engagement Platform'
    });

    // Usage plan for rate limiting
    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: 'Standard',
      description: 'Standard usage plan with rate limiting',
      throttle: {
        rateLimit: 100, // requests per second
        burstLimit: 200 // burst capacity
      },
      quota: {
        limit: 10000, // requests per day
        period: apigateway.Period.DAY
      }
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage
    });

    // Common Lambda integration options
    const lambdaIntegrationOptions: apigateway.LambdaIntegrationOptions = {
      proxy: true,
      allowTestInvoke: true,
      timeout: cdk.Duration.seconds(29) // API Gateway max is 29 seconds
    };

    // Profile Resource - GET /profile
    const profileResource = api.root.addResource('profile');
    
    // GET /profile?userId={userId}
    profileResource.addMethod('GET', 
      new apigateway.LambdaIntegration(getUserProfileLambda, lambdaIntegrationOptions),
      {
        requestValidator,
        requestParameters: {
          'method.request.querystring.userId': true // userId is required
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          },
          {
            statusCode: '400',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          }
        ]
      }
    );

    // GET /profile/{userId}
    const profileByIdResource = profileResource.addResource('{userId}');
    profileByIdResource.addMethod('GET',
      new apigateway.LambdaIntegration(getUserProfileLambda, lambdaIntegrationOptions),
      {
        requestValidator,
        requestParameters: {
          'method.request.path.userId': true
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          },
          {
            statusCode: '404',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          }
        ]
      }
    );

    // Personalization Agent Resource - POST /agent
    const agentResource = api.root.addResource('agent');
    agentResource.addMethod('POST',
      new apigateway.LambdaIntegration(personalizationAgentLambda, lambdaIntegrationOptions),
      {
        requestValidator,
        requestModels: {
          'application/json': new apigateway.Model(this, 'AgentRequestModel', {
            restApi: api,
            contentType: 'application/json',
            modelName: 'AgentRequest',
            schema: {
              type: apigateway.JsonSchemaType.OBJECT,
              required: ['userId', 'input', 'sessionId'],
              properties: {
                userId: {
                  type: apigateway.JsonSchemaType.STRING,
                  minLength: 1
                },
                input: {
                  type: apigateway.JsonSchemaType.OBJECT,
                  required: ['text', 'timestamp'],
                  properties: {
                    text: {
                      type: apigateway.JsonSchemaType.STRING,
                      minLength: 1
                    },
                    timestamp: {
                      type: apigateway.JsonSchemaType.STRING,
                      format: 'date-time'
                    },
                    metadata: {
                      type: apigateway.JsonSchemaType.OBJECT
                    }
                  }
                },
                sessionId: {
                  type: apigateway.JsonSchemaType.STRING,
                  minLength: 1
                }
              }
            }
          })
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          },
          {
            statusCode: '400',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          }
        ]
      }
    );

    // Search Resource - POST /search
    const searchResource = api.root.addResource('search');
    searchResource.addMethod('POST',
      new apigateway.LambdaIntegration(searchLambda, lambdaIntegrationOptions),
      {
        requestValidator,
        requestModels: {
          'application/json': new apigateway.Model(this, 'SearchRequestModel', {
            restApi: api,
            contentType: 'application/json',
            modelName: 'SearchRequest',
            schema: {
              type: apigateway.JsonSchemaType.OBJECT,
              required: ['userId', 'query'],
              properties: {
                userId: {
                  type: apigateway.JsonSchemaType.STRING,
                  minLength: 1
                },
                query: {
                  type: apigateway.JsonSchemaType.STRING,
                  minLength: 1
                },
                filters: {
                  type: apigateway.JsonSchemaType.OBJECT,
                  properties: {
                    category: {
                      type: apigateway.JsonSchemaType.STRING
                    },
                    tags: {
                      type: apigateway.JsonSchemaType.ARRAY,
                      items: {
                        type: apigateway.JsonSchemaType.STRING
                      }
                    },
                    cancerTypes: {
                      type: apigateway.JsonSchemaType.ARRAY,
                      items: {
                        type: apigateway.JsonSchemaType.STRING
                      }
                    }
                  }
                },
                limit: {
                  type: apigateway.JsonSchemaType.INTEGER,
                  minimum: 1,
                  maximum: 50
                }
              }
            }
          })
        },
        methodResponses: [
          {
            statusCode: '200',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          },
          {
            statusCode: '400',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          },
          {
            statusCode: '500',
            responseParameters: {
              'method.response.header.Access-Control-Allow-Origin': true
            }
          }
        ]
      }
    );

    // ========================================
    // WebSocket API for Real-Time Chat
    // ========================================

    // WebSocket Connection Handler
    const wsConnectLambda = new lambda.Function(this, 'WebSocketConnectFunction', {
      functionName: 'SupporterEngagement-WS-Connect',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);
        
        exports.handler = async (event) => {
          console.log('WebSocket Connect:', JSON.stringify(event, null, 2));
          
          const connectionId = event.requestContext.connectionId;
          const userId = event.queryStringParameters?.userId || 'anonymous';
          
          try {
            // Store connection in DynamoDB
            await docClient.send(new PutCommand({
              TableName: process.env.SESSION_TABLE_NAME,
              Item: {
                sessionId: connectionId,
                userId: userId,
                connectionId: connectionId,
                connectedAt: new Date().toISOString(),
                ttl: Math.floor(Date.now() / 1000) + 3600 // 1 hour TTL
              }
            }));
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Connected', connectionId })
            };
          } catch (error) {
            console.error('Error storing connection:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ message: 'Failed to connect', error: error.message })
            };
          }
        };
      `),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256
    });

    // WebSocket Disconnect Handler
    const wsDisconnectLambda = new lambda.Function(this, 'WebSocketDisconnectFunction', {
      functionName: 'SupporterEngagement-WS-Disconnect',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
        
        const client = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(client);
        
        exports.handler = async (event) => {
          console.log('WebSocket Disconnect:', JSON.stringify(event, null, 2));
          
          const connectionId = event.requestContext.connectionId;
          
          try {
            // Remove connection from DynamoDB
            await docClient.send(new DeleteCommand({
              TableName: process.env.SESSION_TABLE_NAME,
              Key: {
                sessionId: connectionId
              }
            }));
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Disconnected' })
            };
          } catch (error) {
            console.error('Error removing connection:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ message: 'Failed to disconnect', error: error.message })
            };
          }
        };
      `),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256
    });

    // WebSocket Message Handler (routes to Personalization Agent)
    const wsMessageLambda = new lambda.Function(this, 'WebSocketMessageFunction', {
      functionName: 'SupporterEngagement-WS-Message',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
        const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
        const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');
        
        const dynamoClient = new DynamoDBClient({});
        const docClient = DynamoDBDocumentClient.from(dynamoClient);
        
        exports.handler = async (event) => {
          console.log('WebSocket Message:', JSON.stringify(event, null, 2));
          
          const connectionId = event.requestContext.connectionId;
          const domainName = event.requestContext.domainName;
          const stage = event.requestContext.stage;
          
          // Create API Gateway Management API client for sending messages back
          const apiGwClient = new ApiGatewayManagementApiClient({
            endpoint: \`https://\${domainName}/\${stage}\`
          });
          
          try {
            // Parse message
            const body = JSON.parse(event.body || '{}');
            const { userId, input, sessionId } = body;
            
            if (!userId || !input || !sessionId) {
              throw new Error('Missing required fields: userId, input, sessionId');
            }
            
            // TODO: Call Personalization Agent Lambda
            // For now, echo back a simple response
            const response = {
              text: \`Received your message: "\${input.text}". Personalization Agent integration coming soon!\`,
              timestamp: new Date().toISOString(),
              requiresUserInput: true
            };
            
            // Send response back to client
            await apiGwClient.send(new PostToConnectionCommand({
              ConnectionId: connectionId,
              Data: JSON.stringify(response)
            }));
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Message processed' })
            };
          } catch (error) {
            console.error('Error processing message:', error);
            
            // Try to send error back to client
            try {
              await apiGwClient.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: JSON.stringify({
                  error: true,
                  message: error.message || 'Failed to process message'
                })
              }));
            } catch (sendError) {
              console.error('Error sending error message:', sendError);
            }
            
            return {
              statusCode: 500,
              body: JSON.stringify({ message: 'Failed to process message', error: error.message })
            };
          }
        };
      `),
      environment: lambdaEnvironment,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(60),
      memorySize: 1024
    });

    // Grant WebSocket Lambda permission to post to connections
    wsMessageLambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['execute-api:ManageConnections'],
      resources: ['*'] // Will be scoped to WebSocket API after creation
    }));

    // Create WebSocket API
    const webSocketApi = new apigatewayv2.CfnApi(this, 'WebSocketApi', {
      name: 'SupporterEngagement-WebSocket',
      protocolType: 'WEBSOCKET',
      routeSelectionExpression: '$request.body.action',
      description: 'WebSocket API for real-time chat with Personalization Agent'
    });

    // Create integrations
    const connectIntegration = new apigatewayv2.CfnIntegration(this, 'ConnectIntegration', {
      apiId: webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${wsConnectLambda.functionArn}/invocations`,
      credentialsArn: lambdaRole.roleArn
    });

    const disconnectIntegration = new apigatewayv2.CfnIntegration(this, 'DisconnectIntegration', {
      apiId: webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${wsDisconnectLambda.functionArn}/invocations`,
      credentialsArn: lambdaRole.roleArn
    });

    const messageIntegration = new apigatewayv2.CfnIntegration(this, 'MessageIntegration', {
      apiId: webSocketApi.ref,
      integrationType: 'AWS_PROXY',
      integrationUri: `arn:aws:apigateway:${this.region}:lambda:path/2015-03-31/functions/${wsMessageLambda.functionArn}/invocations`,
      credentialsArn: lambdaRole.roleArn
    });

    // Create routes
    const connectRoute = new apigatewayv2.CfnRoute(this, 'ConnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$connect',
      authorizationType: 'NONE',
      target: `integrations/${connectIntegration.ref}`
    });

    const disconnectRoute = new apigatewayv2.CfnRoute(this, 'DisconnectRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$disconnect',
      authorizationType: 'NONE',
      target: `integrations/${disconnectIntegration.ref}`
    });

    const defaultRoute = new apigatewayv2.CfnRoute(this, 'DefaultRoute', {
      apiId: webSocketApi.ref,
      routeKey: '$default',
      authorizationType: 'NONE',
      target: `integrations/${messageIntegration.ref}`
    });

    // Create deployment
    const deployment = new apigatewayv2.CfnDeployment(this, 'WebSocketDeployment', {
      apiId: webSocketApi.ref
    });
    deployment.addDependency(connectRoute);
    deployment.addDependency(disconnectRoute);
    deployment.addDependency(defaultRoute);

    // Create stage
    const wsStage = new apigatewayv2.CfnStage(this, 'WebSocketStage', {
      apiId: webSocketApi.ref,
      stageName: 'prod',
      deploymentId: deployment.ref,
      defaultRouteSettings: {
        throttlingRateLimit: 100,
        throttlingBurstLimit: 200
      }
    });

    // Grant Lambda invoke permissions
    wsConnectLambda.addPermission('WebSocketConnectPermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*`
    });

    wsDisconnectLambda.addPermission('WebSocketDisconnectPermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*`
    });

    wsMessageLambda.addPermission('WebSocketMessagePermission', {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${webSocketApi.ref}/*`
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL'
    });

    new cdk.CfnOutput(this, 'WebSocketUrl', {
      value: `wss://${webSocketApi.ref}.execute-api.${this.region}.amazonaws.com/prod`,
      description: 'WebSocket API URL'
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Key ID'
    });

    new cdk.CfnOutput(this, 'UserTableName', {
      value: userProfilesTable.tableName,
      description: 'User Profiles Table Name'
    });

    new cdk.CfnOutput(this, 'DonationTableName', {
      value: donationsTable.tableName,
      description: 'Donations Table Name'
    });

    new cdk.CfnOutput(this, 'ContextTableName', {
      value: userContextTable.tableName,
      description: 'User Context Table Name'
    });
  }
}
