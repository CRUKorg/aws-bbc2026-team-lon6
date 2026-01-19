#!/usr/bin/env ts-node

/**
 * Reset Demo Data Script
 * Clears all demo data and re-seeds with fresh data
 * Use this to reset the system to pre-demo state
 */

import { DynamoDBClient, ScanCommand, BatchWriteItemCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { config } from '../src/utils/config';

const dynamoClient = new DynamoDBClient({ region: config.aws.region });

async function clearTable(tableName: string, keys: { partition: string; sort?: string }) {
  console.log(`🗑️  Clearing table: ${tableName}`);
  
  try {
    // Build projection expression based on table keys
    const projectionParts = [keys.partition];
    const expressionAttributeNames: Record<string, string> = {};
    
    if (keys.sort) {
      // Handle reserved keywords
      if (keys.sort === 'timestamp') {
        projectionParts.push('#ts');
        expressionAttributeNames['#ts'] = 'timestamp';
      } else {
        projectionParts.push(keys.sort);
      }
    }
    
    const scanCommand = new ScanCommand({
      TableName: tableName,
      ProjectionExpression: projectionParts.join(', '),
      ...(Object.keys(expressionAttributeNames).length > 0 && { ExpressionAttributeNames: expressionAttributeNames })
    });
    
    const scanResult = await dynamoClient.send(scanCommand);
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log(`   ✅ Table ${tableName} is already empty`);
      return;
    }

    // Delete items in batches of 25 (DynamoDB limit)
    const items = scanResult.Items;
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      const deleteRequests = batch.map(item => ({
        DeleteRequest: {
          Key: item
        }
      }));

      const batchCommand = new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: deleteRequests
        }
      });

      await dynamoClient.send(batchCommand);
      console.log(`   Deleted ${deleteRequests.length} items`);
    }

    console.log(`   ✅ Cleared ${items.length} items from ${tableName}`);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      console.log(`   ⚠️  Table ${tableName} does not exist`);
    } else {
      console.error(`   ❌ Error clearing ${tableName}:`, error.message);
    }
  }
}

async function resetDemoData() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 RESETTING DEMO DATA');
  console.log('='.repeat(70) + '\n');

  // Clear all tables with their respective key schemas
  await clearTable(config.dynamodb.userProfilesTable, { partition: 'userId' });
  await clearTable(config.dynamodb.contextTable, { partition: 'userId', sort: 'version' });
  await clearTable(config.dynamodb.engagementTable, { partition: 'userId', sort: 'timestamp' });
  await clearTable(config.dynamodb.analyticsTable, { partition: 'userId', sort: 'interactionId' });

  console.log('\n' + '='.repeat(70));
  console.log('✅ RESET COMPLETE');
  console.log('='.repeat(70) + '\n');
  console.log('💡 Run "npm run seed" to populate with fresh demo data\n');
}

// Run the reset
resetDemoData().catch(error => {
  console.error('❌ Reset failed:', error);
  process.exit(1);
});
