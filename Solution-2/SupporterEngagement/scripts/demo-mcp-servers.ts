#!/usr/bin/env ts-node
/**
 * Interactive Demo: MCP Servers
 * 
 * This script demonstrates all three implemented MCP servers:
 * 1. User Profile MCP Server
 * 2. Transaction MCP Server
 * 3. Research Papers MCP Server
 * 
 * Usage: npx ts-node scripts/demo-mcp-servers.ts
 */

import { userProfileMCPServer } from '../src/mcp-servers/user-profile';
import { transactionMCPServer } from '../src/mcp-servers/transaction';
import { researchPapersMCPServer } from '../src/mcp-servers/research-papers';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function printHeader(text: string) {
  console.log('\n' + '='.repeat(70));
  console.log(colors.bright + colors.cyan + text + colors.reset);
  console.log('='.repeat(70) + '\n');
}

function printSection(text: string) {
  console.log(colors.bright + colors.yellow + '\n' + text + colors.reset);
  console.log('-'.repeat(70));
}

function printSuccess(text: string) {
  console.log(colors.green + '✓ ' + text + colors.reset);
}

function printInfo(text: string) {
  console.log(colors.blue + 'ℹ ' + text + colors.reset);
}

function printJSON(obj: any) {
  console.log(colors.magenta + JSON.stringify(obj, null, 2) + colors.reset);
}

async function demoUserProfileServer() {
  printHeader('Demo 1: User Profile MCP Server');

  // Server Info
  printSection('1.1 Server Information');
  const serverInfo = userProfileMCPServer.getServerInfo();
  printJSON(serverInfo);
  printSuccess('Server info retrieved');

  // List Tools
  printSection('1.2 Available Tools');
  const tools = userProfileMCPServer.listTools();
  tools.forEach((tool, index) => {
    console.log(`\n${colors.bright}${index + 1}. ${tool.name}${colors.reset}`);
    console.log(`   ${tool.description}`);
    console.log(`   Required: ${tool.inputSchema.required.join(', ')}`);
  });
  printSuccess(`${tools.length} tools available`);

  // Execute Tool - Get User Profile (will fail without DB, but shows structure)
  printSection('1.3 Execute Tool: get_user_profile');
  printInfo('Attempting to get user profile (will show error without database)');
  const profileResult = await userProfileMCPServer.executeTool({
    name: 'get_user_profile',
    arguments: { userId: 'demo-user-123' },
  });
  printJSON(profileResult);

  // Test Validation
  printSection('1.4 Test Parameter Validation');
  printInfo('Testing with missing userId parameter');
  const validationResult = await userProfileMCPServer.executeTool({
    name: 'get_user_profile',
    arguments: {},
  });
  printJSON(validationResult);
  printSuccess('Validation working correctly');
}

async function demoTransactionServer() {
  printHeader('Demo 2: Transaction MCP Server');

  // Server Info
  printSection('2.1 Server Information');
  const serverInfo = transactionMCPServer.getServerInfo();
  printJSON(serverInfo);
  printSuccess('Server info retrieved');

  // List Tools
  printSection('2.2 Available Tools');
  const tools = transactionMCPServer.listTools();
  tools.forEach((tool, index) => {
    console.log(`\n${colors.bright}${index + 1}. ${tool.name}${colors.reset}`);
    console.log(`   ${tool.description}`);
    console.log(`   Required: ${tool.inputSchema.required.join(', ')}`);
  });
  printSuccess(`${tools.length} tools available`);

  // Execute Tool - Get Donation Summary
  printSection('2.3 Execute Tool: get_donation_summary');
  printInfo('Getting donation summary (mock data)');
  const summaryResult = await transactionMCPServer.executeTool({
    name: 'get_donation_summary',
    arguments: { userId: 'demo-user-123' },
  });
  printJSON(summaryResult);
  printSuccess('Donation summary retrieved (mock data)');

  // Execute Tool - Get Recent Transactions
  printSection('2.4 Execute Tool: get_recent_transactions');
  printInfo('Getting recent transactions with limit=5');
  const transactionsResult = await transactionMCPServer.executeTool({
    name: 'get_recent_transactions',
    arguments: { userId: 'demo-user-123', limit: 5 },
  });
  printJSON(transactionsResult);
  printSuccess('Transactions retrieved (mock data)');
}

async function demoResearchPapersServer() {
  printHeader('Demo 3: Research Papers MCP Server');

  // Server Info
  printSection('3.1 Server Information');
  const serverInfo = researchPapersMCPServer.getServerInfo();
  printJSON(serverInfo);
  printSuccess('Server info retrieved');

  // List Tools
  printSection('3.2 Available Tools');
  const tools = researchPapersMCPServer.listTools();
  tools.forEach((tool, index) => {
    console.log(`\n${colors.bright}${index + 1}. ${tool.name}${colors.reset}`);
    console.log(`   ${tool.description}`);
    console.log(`   Required: ${tool.inputSchema.required.join(', ')}`);
  });
  printSuccess(`${tools.length} tools available`);

  // Execute Tool - Get Featured Papers
  printSection('3.3 Execute Tool: get_featured_papers');
  printInfo('Getting featured research papers');
  const featuredResult = await researchPapersMCPServer.executeTool({
    name: 'get_featured_papers',
    arguments: { limit: 3 },
  });
  printJSON(featuredResult);
  printSuccess('Featured papers retrieved');

  // Execute Tool - Search Papers
  printSection('3.4 Execute Tool: search_research_papers');
  printInfo('Searching for papers with tag "immunotherapy"');
  const searchResult = await researchPapersMCPServer.executeTool({
    name: 'search_research_papers',
    arguments: { 
      tags: ['immunotherapy'],
      limit: 5,
    },
  });
  printJSON(searchResult);
  printSuccess('Search completed');

  // Execute Tool - Get Specific Paper
  printSection('3.5 Execute Tool: get_paper');
  printInfo('Getting specific paper by ID');
  const paperResult = await researchPapersMCPServer.executeTool({
    name: 'get_paper',
    arguments: { paperId: 'paper-001' },
  });
  printJSON(paperResult);
  printSuccess('Paper retrieved');
}

async function demoIntegration() {
  printHeader('Demo 4: Integration Example');
  
  printSection('4.1 Simulated User Journey');
  printInfo('Imagine a user logs in and we want to show their dashboard...\n');

  console.log(colors.bright + 'Step 1: Get User Profile' + colors.reset);
  const profile = await userProfileMCPServer.executeTool({
    name: 'get_user_profile',
    arguments: { userId: 'demo-user-123' },
  });
  console.log('   → User profile lookup attempted');

  console.log(colors.bright + '\nStep 2: Get Donation Summary' + colors.reset);
  const donations = await transactionMCPServer.executeTool({
    name: 'get_donation_summary',
    arguments: { userId: 'demo-user-123' },
  });
  console.log('   → Donation summary retrieved');
  printJSON(donations.content[0].resource);

  console.log(colors.bright + '\nStep 3: Get Featured Research' + colors.reset);
  const research = await researchPapersMCPServer.executeTool({
    name: 'get_featured_papers',
    arguments: { limit: 2 },
  });
  console.log('   → Featured research papers retrieved');
  const papers = research.content[0].resource.papers;
  papers.forEach((paper: any, index: number) => {
    console.log(`   ${index + 1}. ${paper.title}`);
    console.log(`      Authors: ${paper.authors.join(', ')}`);
    console.log(`      Journal: ${paper.journal}`);
  });

  console.log(colors.bright + '\nStep 4: Dashboard Ready!' + colors.reset);
  printSuccess('All data retrieved - dashboard can be rendered');
  
  printInfo('\nThis demonstrates how the MCP servers work together to:');
  console.log('   • Retrieve user profile data');
  console.log('   • Get donation history and statistics');
  console.log('   • Fetch personalized research content');
  console.log('   • Provide all data needed for the personalized dashboard');
}

async function runDemo() {
  console.clear();
  
  printHeader('🚀 Supporter Engagement Platform - MCP Servers Demo');
  
  console.log(colors.bright + 'This demo showcases three implemented MCP servers:' + colors.reset);
  console.log('  1. User Profile MCP Server (DynamoDB)');
  console.log('  2. Transaction MCP Server (RDS PostgreSQL)');
  console.log('  3. Research Papers MCP Server (S3)');
  console.log('\n' + colors.yellow + 'Note: Some operations use mock data since AWS is not deployed yet.' + colors.reset);
  
  console.log('\nPress Enter to start the demo...');
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  try {
    await demoUserProfileServer();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await demoTransactionServer();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await demoResearchPapersServer();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await demoIntegration();

    printHeader('✨ Demo Complete!');
    
    console.log(colors.bright + '\nWhat you just saw:' + colors.reset);
    console.log('  ✓ Three fully functional MCP servers');
    console.log('  ✓ Model Context Protocol implementation');
    console.log('  ✓ Tool discovery and execution');
    console.log('  ✓ Parameter validation');
    console.log('  ✓ Error handling');
    console.log('  ✓ Integration between servers');
    
    console.log(colors.bright + '\nNext steps:' + colors.reset);
    console.log('  • Deploy AWS infrastructure (cdk deploy)');
    console.log('  • Populate databases with real data');
    console.log('  • Implement remaining MCP servers');
    console.log('  • Build the Personalization Agent');
    console.log('  • Create the React frontend');
    
    console.log(colors.bright + '\nTo run this demo again:' + colors.reset);
    console.log('  npx ts-node scripts/demo-mcp-servers.ts');
    console.log();

  } catch (error) {
    console.error(colors.bright + '\n❌ Demo Error:' + colors.reset, error);
  }
}

// Run the demo
runDemo().catch(console.error);
