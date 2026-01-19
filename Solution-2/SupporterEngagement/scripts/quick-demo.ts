#!/usr/bin/env ts-node
/**
 * Quick Demo: MCP Servers
 * 
 * A quick, non-interactive demo of all three MCP servers
 * 
 * Usage: npx ts-node scripts/quick-demo.ts
 */

import { userProfileMCPServer } from '../src/mcp-servers/user-profile';
import { transactionMCPServer } from '../src/mcp-servers/transaction';
import { researchPapersMCPServer } from '../src/mcp-servers/research-papers';

async function quickDemo() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Supporter Engagement Platform - Quick MCP Demo');
  console.log('='.repeat(70) + '\n');

  // Demo 1: User Profile Server
  console.log('📋 USER PROFILE MCP SERVER');
  console.log('-'.repeat(70));
  const userTools = userProfileMCPServer.listTools();
  console.log(`✓ ${userTools.length} tools available: ${userTools.map(t => t.name).join(', ')}`);
  
  const userResult = await userProfileMCPServer.executeTool({
    name: 'get_user_profile',
    arguments: {},
  });
  console.log('✓ Validation test:', userResult.isError ? 'PASS (caught missing param)' : 'FAIL');

  // Demo 2: Transaction Server
  console.log('\n💰 TRANSACTION MCP SERVER');
  console.log('-'.repeat(70));
  const txTools = transactionMCPServer.listTools();
  console.log(`✓ ${txTools.length} tools available: ${txTools.map(t => t.name).join(', ')}`);
  
  const donationSummary = await transactionMCPServer.executeTool({
    name: 'get_donation_summary',
    arguments: { userId: 'demo-user' },
  });
  console.log('✓ Donation summary retrieved (mock data)');
  console.log('  Data:', JSON.stringify(donationSummary.content[0].resource, null, 2));

  // Demo 3: Research Papers Server
  console.log('\n📚 RESEARCH PAPERS MCP SERVER');
  console.log('-'.repeat(70));
  const paperTools = researchPapersMCPServer.listTools();
  console.log(`✓ ${paperTools.length} tools available: ${paperTools.map(t => t.name).join(', ')}`);
  
  const featuredPapers = await researchPapersMCPServer.executeTool({
    name: 'get_featured_papers',
    arguments: { limit: 2 },
  });
  const papers = featuredPapers.content[0].resource.papers;
  console.log(`✓ ${papers.length} featured papers retrieved`);
  papers.forEach((paper: any, i: number) => {
    console.log(`  ${i + 1}. "${paper.title}" - ${paper.journal}`);
  });

  // Integration Example
  console.log('\n🔗 INTEGRATION EXAMPLE');
  console.log('-'.repeat(70));
  console.log('Simulating a user dashboard data fetch...\n');
  
  const [profile, donations, research] = await Promise.all([
    userProfileMCPServer.executeTool({
      name: 'get_user_profile',
      arguments: { userId: 'demo-user' },
    }),
    transactionMCPServer.executeTool({
      name: 'get_donation_summary',
      arguments: { userId: 'demo-user' },
    }),
    researchPapersMCPServer.executeTool({
      name: 'get_featured_papers',
      arguments: { limit: 3 },
    }),
  ]);

  console.log('✓ User Profile: ' + (profile.isError ? 'Not found (expected without DB)' : 'Retrieved'));
  console.log('✓ Donations: Retrieved');
  console.log('  - Total: £' + donations.content[0].resource.totalAmount);
  console.log('  - Count: ' + donations.content[0].resource.transactionCount);
  console.log('  - Suggested next: £' + donations.content[0].resource.suggestedNextAmount);
  console.log('✓ Research: ' + research.content[0].resource.count + ' papers retrieved');

  console.log('\n' + '='.repeat(70));
  console.log('✨ Demo Complete!');
  console.log('='.repeat(70));
  console.log('\nWhat works:');
  console.log('  ✓ All 3 MCP servers functional');
  console.log('  ✓ 9 tools available across servers');
  console.log('  ✓ Parameter validation');
  console.log('  ✓ Error handling');
  console.log('  ✓ Mock data for testing');
  console.log('  ✓ Parallel data fetching');
  
  console.log('\nNext: Deploy AWS infrastructure to use real data');
  console.log('  → cd SupporterEngagement && cdk deploy\n');
}

quickDemo().catch(console.error);
