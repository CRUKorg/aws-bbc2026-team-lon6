#!/usr/bin/env ts-node

/**
 * Quick Test Script to Verify All Fixes
 * Tests the critical fixes without running the full demo
 */

import { IntentRecognitionService } from '../src/services/intent-recognition/IntentRecognitionService';
import { dynamoDBClient } from '../src/mcp-servers/user-profile/dynamodb-client';
import { knowledgeBaseMCPServer } from '../src/mcp-servers/knowledge-base/server';

async function testFixes() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING CRITICAL FIXES');
  console.log('='.repeat(70) + '\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Intent Detection - Profile Update
  totalTests++;
  console.log('Test 1: Intent Detection - Profile Update');
  const intentService = new IntentRecognitionService();
  const profileUpdateIntent = await intentService.recognizeIntent('I want to update my profile');
  if (profileUpdateIntent.primaryIntent === 'profile_update') {
    console.log('✅ PASS: Profile update intent detected correctly\n');
    passedTests++;
  } else {
    console.log(`❌ FAIL: Expected 'profile_update', got '${profileUpdateIntent.primaryIntent}'\n`);
  }

  // Test 2: Intent Detection - Personal Disclosure
  totalTests++;
  console.log('Test 2: Intent Detection - Personal Disclosure');
  const disclosureIntent = await intentService.recognizeIntent('My mother was recently diagnosed with breast cancer');
  if (disclosureIntent.primaryIntent === 'personal_disclosure') {
    console.log('✅ PASS: Personal disclosure intent detected correctly');
    const cancerEntity = disclosureIntent.entities.find(e => e.type === 'cancer_type');
    const relationshipEntity = disclosureIntent.entities.find(e => e.type === 'relationship');
    if (cancerEntity && relationshipEntity) {
      console.log(`   Cancer type: ${cancerEntity.value}`);
      console.log(`   Relationship: ${relationshipEntity.value}\n`);
      passedTests++;
    } else {
      console.log('❌ FAIL: Missing cancer type or relationship entities\n');
    }
  } else {
    console.log(`❌ FAIL: Expected 'personal_disclosure', got '${disclosureIntent.primaryIntent}'\n`);
  }

  // Test 3: Intent Detection - Support Inquiry
  totalTests++;
  console.log('Test 3: Intent Detection - Support Inquiry');
  const supportIntent = await intentService.recognizeIntent('How can I support Cancer Research UK?');
  if (supportIntent.primaryIntent === 'support_inquiry') {
    console.log('✅ PASS: Support inquiry intent detected correctly\n');
    passedTests++;
  } else {
    console.log(`❌ FAIL: Expected 'support_inquiry', got '${supportIntent.primaryIntent}'\n`);
  }

  // Test 4: Intent Detection - Dashboard
  totalTests++;
  console.log('Test 4: Intent Detection - Dashboard');
  const dashboardIntent = await intentService.recognizeIntent('show my dashboard');
  if (dashboardIntent.primaryIntent === 'dashboard') {
    console.log('✅ PASS: Dashboard intent detected correctly\n');
    passedTests++;
  } else {
    console.log(`❌ FAIL: Expected 'dashboard', got '${dashboardIntent.primaryIntent}'\n`);
  }

  // Test 5: Knowledge Base - Support Articles
  totalTests++;
  console.log('Test 5: Knowledge Base - Support Articles');
  const searchResult = await knowledgeBaseMCPServer.executeTool({
    name: 'search_knowledge_base',
    arguments: { query: 'support Cancer Research UK' }
  });
  if (!searchResult.isError && searchResult.content[0]?.resource) {
    const data = searchResult.content[0].resource as any;
    if (data.articles && data.articles.length > 0) {
      console.log(`✅ PASS: Found ${data.articles.length} articles about supporting CRUK`);
      console.log(`   First article: "${data.articles[0].title}"\n`);
      passedTests++;
    } else {
      console.log('❌ FAIL: No articles found\n');
    }
  } else {
    console.log('❌ FAIL: Knowledge base search failed\n');
  }

  // Test 6: Knowledge Base - Breast Cancer Articles
  totalTests++;
  console.log('Test 6: Knowledge Base - Breast Cancer Articles');
  const breastCancerResult = await knowledgeBaseMCPServer.executeTool({
    name: 'search_knowledge_base',
    arguments: { 
      query: 'breast cancer',
      filters: { cancerTypes: ['breast-cancer'] }
    }
  });
  if (!breastCancerResult.isError && breastCancerResult.content[0]?.resource) {
    const data = breastCancerResult.content[0].resource as any;
    if (data.articles && data.articles.length > 0) {
      console.log(`✅ PASS: Found ${data.articles.length} breast cancer articles`);
      console.log(`   First article: "${data.articles[0].title}"\n`);
      passedTests++;
    } else {
      console.log('❌ FAIL: No breast cancer articles found\n');
    }
  } else {
    console.log('❌ FAIL: Breast cancer search failed\n');
  }

  // Summary
  console.log('='.repeat(70));
  console.log(`📊 TEST RESULTS: ${passedTests}/${totalTests} tests passed`);
  console.log('='.repeat(70) + '\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Demo is ready.\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed. Review fixes before demo.\n`);
    process.exit(1);
  }
}

// Run tests
testFixes().catch(error => {
  console.error('\n❌ Test execution failed:', error);
  process.exit(1);
});
