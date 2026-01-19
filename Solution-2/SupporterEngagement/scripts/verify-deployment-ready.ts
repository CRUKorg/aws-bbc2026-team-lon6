/**
 * Deployment Readiness Verification Script
 * Checks that all prerequisites are met before deployment
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  required: boolean;
}

const checks: CheckResult[] = [];

function addCheck(name: string, passed: boolean, message: string, required: boolean = true) {
  checks.push({ name, passed, message, required });
}

function runCommand(command: string): string {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (error) {
    return '';
  }
}

console.log('🔍 Verifying Deployment Readiness\n');
console.log('='.repeat(50));

// Check 1: Node.js version
console.log('\n📦 Checking Node.js...');
const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
addCheck(
  'Node.js Version',
  nodeMajor >= 18,
  nodeMajor >= 18 ? `✓ Node.js ${nodeVersion}` : `✗ Node.js ${nodeVersion} (need 18+)`,
  true
);

// Check 2: AWS CLI
console.log('🔧 Checking AWS CLI...');
const awsVersion = runCommand('aws --version');
addCheck(
  'AWS CLI',
  awsVersion.length > 0,
  awsVersion.length > 0 ? `✓ ${awsVersion.split(' ')[0]}` : '✗ AWS CLI not found',
  true
);

// Check 3: AWS Credentials
console.log('🔐 Checking AWS Credentials...');
const awsAccount = runCommand('aws sts get-caller-identity --query Account --output text 2>/dev/null');
const awsRegion = runCommand('aws configure get region 2>/dev/null');
addCheck(
  'AWS Credentials',
  awsAccount.length > 0,
  awsAccount.length > 0 
    ? `✓ Account: ${awsAccount}, Region: ${awsRegion || 'not set'}` 
    : '✗ No AWS credentials configured',
  true
);

// Check 4: CDK CLI
console.log('🏗️  Checking AWS CDK...');
const cdkVersion = runCommand('cdk --version');
addCheck(
  'AWS CDK CLI',
  cdkVersion.length > 0,
  cdkVersion.length > 0 ? `✓ ${cdkVersion}` : '✗ CDK CLI not found (run: npm install -g aws-cdk)',
  true
);

// Check 5: cdk.context.json exists and has account
console.log('📝 Checking Configuration...');
const contextPath = path.join(__dirname, '..', 'cdk.context.json');
let contextValid = false;
let contextAccount = '';
let contextRegion = '';

if (fs.existsSync(contextPath)) {
  try {
    const context = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
    contextAccount = context.deployment?.account || '';
    contextRegion = context.deployment?.region || '';
    contextValid = contextAccount !== 'YOUR_AWS_ACCOUNT_ID' && contextAccount.length > 0;
  } catch (error) {
    contextValid = false;
  }
}

addCheck(
  'CDK Context Configuration',
  contextValid,
  contextValid 
    ? `✓ Account: ${contextAccount}, Region: ${contextRegion}` 
    : '✗ cdk.context.json not configured (update account ID)',
  true
);

// Check 6: Dependencies installed
console.log('📚 Checking Dependencies...');
const nodeModulesExists = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
addCheck(
  'Node Modules',
  nodeModulesExists,
  nodeModulesExists ? '✓ Dependencies installed' : '✗ Run: npm install',
  true
);

// Check 7: TypeScript compiled
console.log('🔨 Checking Build...');
const distExists = fs.existsSync(path.join(__dirname, '..', 'dist'));
addCheck(
  'TypeScript Build',
  distExists,
  distExists ? '✓ TypeScript compiled' : '⚠️  Run: npm run build',
  false
);

// Check 8: Bedrock access (optional)
console.log('🤖 Checking Bedrock Access...');
const bedrockModels = runCommand('aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?contains(modelId, \'claude\')].modelId" --output text 2>/dev/null');
addCheck(
  'Bedrock Access',
  bedrockModels.length > 0,
  bedrockModels.length > 0 ? '✓ Bedrock accessible' : '⚠️  Bedrock not accessible (may need to enable)',
  false
);

// Print results
console.log('\n' + '='.repeat(50));
console.log('\n📊 Results:\n');

let allRequired = true;
let allOptional = true;

checks.forEach(check => {
  const icon = check.passed ? '✅' : (check.required ? '❌' : '⚠️ ');
  console.log(`${icon} ${check.name}`);
  console.log(`   ${check.message}`);
  
  if (check.required && !check.passed) {
    allRequired = false;
  }
  if (!check.required && !check.passed) {
    allOptional = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allRequired) {
  console.log('\n✅ All required checks passed!');
  console.log('\n🚀 Ready to deploy:');
  console.log('   npm run build && cdk deploy');
  
  if (!allOptional) {
    console.log('\n⚠️  Some optional checks failed (deployment will still work)');
  }
  
  console.log('\n📖 See QUICK_DEPLOY.md for detailed instructions');
  process.exit(0);
} else {
  console.log('\n❌ Some required checks failed');
  console.log('\n🔧 Fix the issues above before deploying');
  console.log('\n📖 See QUICK_DEPLOY.md for help');
  process.exit(1);
}
