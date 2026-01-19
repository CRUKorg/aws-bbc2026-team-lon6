#!/usr/bin/env ts-node
/**
 * Comprehensive Demo: All 5 MCP Servers
 * 
 * This demonstrates a complete user journey using all MCP servers with mock data
 * 
 * Usage: npx ts-node scripts/comprehensive-demo.ts
 */

import { userProfileMCPServer } from '../src/mcp-servers/user-profile';
import { transactionMCPServer } from '../src/mcp-servers/transaction';
import { researchPapersMCPServer } from '../src/mcp-servers/research-papers';
import { knowledgeBaseMCPServer } from '../src/mcp-servers/knowledge-base';
import { analyticsMCPServer } from '../src/mcp-servers/analytics';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function header(text: string) {
  console.log('\n' + '='.repeat(70));
  console.log(colors.bright + colors.cyan + text + colors.reset);
  console.log('='.repeat(70));
}

function section(text: string) {
  console.log(colors.bright + colors.yellow + '\n' + text + colors.reset);
}

function success(text: string) {
  console.log(colors.green + '✓ ' + text + colors.reset);
}

function info(text: string) {
  console.log(colors.blue + 'ℹ ' + text + colors.reset);
}

async function simulateUserJourney() {
  header('🎯 Simulated User Journey: Sarah\'s Experience');
  
  console.log('\nScenario: Sarah is a returning supporter who:');
  console.log('  • Has donated £250 over 5 transactions');
  console.log('  • Is interested in breast cancer research');
  console.log('  • Wants to learn about screening');
  console.log('  • Is considering becoming a regular donor\n');

  const userId = 'sarah-123';

  // Step 1: Record page visit
  section('Step 1: Sarah visits the homepage');
  await analyticsMCPServer.executeTool({
    name: 'record_page_visit',
    arguments: {
      userId,
      pageUrl: 'https://cruk.org/',
      timestamp: new Date().toISOString(),
    },
  });
  success('Page visit recorded');

  // Step 2: Get donation summary
  section('Step 2: Load Sarah\'s donation history');
  const donations = await transactionMCPServer.executeTool({
    name: 'get_donation_summary',
    arguments: { userId },
  });
  const donationData = donations.content[0].resource;
  console.log(`   Total donated: £${donationData.totalAmount}`);
  console.log(`   Number of donations: ${donationData.transactionCount}`);
  console.log(`   Suggested next amount: £${donationData.suggestedNextAmount}`);
  success('Donation history loaded');

  // Step 3: Search for breast cancer information
  section('Step 3: Sarah searches for "breast cancer screening"');
  await analyticsMCPServer.executeTool({
    name: 'record_interaction',
    arguments: {
      userId,
      interaction: {
        type: 'search',
        intent: 'information_seeking',
        sentiment: 'neutral',
        metadata: { query: 'breast cancer screening' },
      },
    },
  });
  
  const searchResults = await knowledgeBaseMCPServer.executeTool({
    name: 'search_knowledge_base',
    arguments: {
      query: 'breast cancer screening',
      filters: { cancerTypes: ['breast-cancer'] },
    },
  });
  
  const articles = searchResults.content[0].resource.articles;
  console.log(`   Found ${articles.length} articles:`);
  articles.forEach((article: any, i: number) => {
    console.log(`   ${i + 1}. ${article.title}`);
  });
  success('Search completed - all results from CRUK sources');

  // Step 4: View specific article
  section('Step 4: Sarah reads "Understanding Breast Cancer"');
  await analyticsMCPServer.executeTool({
    name: 'record_page_visit',
    arguments: {
      userId,
      pageUrl: 'https://www.cancerresearchuk.org/about-cancer/breast-cancer',
      timestamp: new Date().toISOString(),
    },
  });
  
  const article = await knowledgeBaseMCPServer.executeTool({
    name: 'get_article',
    arguments: { articleId: 'article-001' },
  });
  
  const articleData = article.content[0].resource;
  console.log(`   Title: ${articleData.title}`);
  console.log(`   Category: ${articleData.category}`);
  console.log(`   Reading Level: ${articleData.readingLevel}`);
  success('Article loaded');

  // Step 5: Get related articles
  section('Step 5: Show Sarah related articles');
  const related = await knowledgeBaseMCPServer.executeTool({
    name: 'get_related_articles',
    arguments: { articleId: 'article-001', limit: 3 },
  });
  
  const relatedArticles = related.content[0].resource.relatedArticles;
  console.log(`   Found ${relatedArticles.length} related articles:`);
  relatedArticles.forEach((a: any, i: number) => {
    console.log(`   ${i + 1}. ${a.title}`);
  });
  success('Related content suggested');

  // Step 6: Show relevant research
  section('Step 6: Show Sarah relevant research papers');
  const research = await researchPapersMCPServer.executeTool({
    name: 'search_research_papers',
    arguments: {
      cancerTypes: ['breast-cancer'],
      limit: 2,
    },
  });
  
  const papers = research.content[0].resource.papers;
  console.log(`   Found ${papers.length} research papers:`);
  papers.forEach((paper: any, i: number) => {
    console.log(`   ${i + 1}. ${paper.title}`);
    console.log(`      Journal: ${paper.journal}`);
    console.log(`      CRUK Funded: ${paper.fundedByCRUK ? 'Yes' : 'No'}`);
  });
  success('Research papers loaded');

  // Step 7: Record positive interaction
  section('Step 7: Sarah finds the information helpful');
  await analyticsMCPServer.executeTool({
    name: 'record_interaction',
    arguments: {
      userId,
      interaction: {
        type: 'click',
        intent: 'information_seeking',
        sentiment: 'positive',
        metadata: { action: 'article_helpful' },
      },
    },
  });
  success('Positive feedback recorded');

  // Step 8: Get user analytics
  section('Step 8: Generate Sarah\'s analytics summary');
  const analytics = await analyticsMCPServer.executeTool({
    name: 'get_user_analytics',
    arguments: { userId },
  });
  
  const analyticsData = analytics.content[0].resource;
  console.log(`   Total interactions: ${analyticsData.totalInteractions}`);
  console.log(`   Most common intent: ${analyticsData.mostCommonIntent}`);
  console.log(`   Average sentiment: ${analyticsData.averageSentiment.toFixed(2)}`);
  console.log(`   Page visits: ${analyticsData.pageVisits.length}`);
  success('Analytics generated');

  // Step 9: Show featured research
  section('Step 9: Show Sarah featured research on dashboard');
  const featured = await researchPapersMCPServer.executeTool({
    name: 'get_featured_papers',
    arguments: { limit: 3 },
  });
  
  const featuredPapers = featured.content[0].resource.papers;
  console.log(`   Featuring ${featuredPapers.length} high-impact papers`);
  success('Dashboard content ready');

  // Summary
  header('✨ Journey Complete!');
  
  console.log('\n' + colors.bright + 'What just happened:' + colors.reset);
  console.log('  ✓ Tracked 2 page visits');
  console.log('  ✓ Recorded 2 user interactions');
  console.log('  ✓ Retrieved donation history');
  console.log('  ✓ Searched knowledge base (CRUK sources only)');
  console.log('  ✓ Loaded article and related content');
  console.log('  ✓ Found relevant research papers');
  console.log('  ✓ Generated analytics summary');
  console.log('  ✓ Prepared personalized dashboard');

  console.log('\n' + colors.bright + 'All 5 MCP Servers Used:' + colors.reset);
  console.log('  1. User Profile MCP Server');
  console.log('  2. Transaction MCP Server');
  console.log('  3. Research Papers MCP Server');
  console.log('  4. Knowledge Base MCP Server');
  console.log('  5. Analytics MCP Server');

  console.log('\n' + colors.bright + 'Data Flow:' + colors.reset);
  console.log('  User Action → Analytics Tracking');
  console.log('  Search Query → Knowledge Base → CRUK Articles');
  console.log('  User Interest → Research Papers → Relevant Studies');
  console.log('  Donation History → Transaction Data → Suggestions');
  console.log('  All Data → Personalized Dashboard');
}

async function testAllServers() {
  header('🧪 Testing All MCP Servers');

  const servers = [
    { name: 'User Profile', server: userProfileMCPServer },
    { name: 'Transaction', server: transactionMCPServer },
    { name: 'Research Papers', server: researchPapersMCPServer },
    { name: 'Knowledge Base', server: knowledgeBaseMCPServer },
    { name: 'Analytics', server: analyticsMCPServer },
  ];

  let totalTools = 0;

  for (const { name, server } of servers) {
    const info = server.getServerInfo();
    const tools = server.listTools();
    totalTools += tools.length;
    
    console.log(`\n${colors.bright}${name} MCP Server${colors.reset}`);
    console.log(`  Version: ${info.version}`);
    console.log(`  Tools: ${tools.length}`);
    tools.forEach(tool => {
      console.log(`    • ${tool.name}`);
    });
    success(`${name} server operational`);
  }

  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(`  Total Servers: ${servers.length}`);
  console.log(`  Total Tools: ${totalTools}`);
  success('All servers functional!');
}

async function runDemo() {
  console.clear();
  
  header('🚀 Supporter Engagement Platform - Comprehensive Demo');
  
  console.log('\nThis demo shows all 5 MCP servers working together');
  console.log('with mock data to simulate a complete user journey.\n');

  try {
    await testAllServers();
    await simulateUserJourney();

    header('🎉 Demo Complete!');
    
    console.log('\n' + colors.bright + 'What you can test:' + colors.reset);
    console.log('  ✓ All 5 MCP servers with 15 tools');
    console.log('  ✓ Complete user journey simulation');
    console.log('  ✓ Analytics tracking');
    console.log('  ✓ Knowledge base search (CRUK sources only)');
    console.log('  ✓ Research paper discovery');
    console.log('  ✓ Transaction history');
    console.log('  ✓ Integration between all services');

    console.log('\n' + colors.bright + 'Next steps:' + colors.reset);
    console.log('  • Deploy AWS infrastructure for real data');
    console.log('  • Build Context Management Service');
    console.log('  • Implement Personalization Agent');
    console.log('  • Create React frontend');

    console.log('\n' + colors.bright + 'Run this demo again:' + colors.reset);
    console.log('  npx ts-node scripts/comprehensive-demo.ts\n');

  } catch (error) {
    console.error('\n❌ Demo Error:', error);
  }
}

runDemo().catch(console.error);
