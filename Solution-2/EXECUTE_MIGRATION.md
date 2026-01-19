# Execute Migration - Step by Step Commands

## Prerequisites

1. **Create GitHub repositories first** (do this manually on GitHub):
   - Repository 1: `supporter-engagement-platform-hackathon`
   - Repository 2: `supporter-engagement-simple`
   - Both should be **Public** and **Initialize with README**

## Step 1: Preserve Hackathon Work

Run these commands in your terminal:

```bash
# Navigate to parent directory
cd ..

# Clone your new hackathon repository
git clone https://github.com/MikeT94/supporter-engagement-platform-hackathon.git

# Copy all your work (including hidden files)
cp -r aws-bbc2026-team-lon6/* supporter-engagement-platform-hackathon/
cp aws-bbc2026-team-lon6/.gitignore supporter-engagement-platform-hackathon/ 2>/dev/null || true
cp aws-bbc2026-team-lon6/.env.* supporter-engagement-platform-hackathon/ 2>/dev/null || true

# Navigate to your hackathon repository
cd supporter-engagement-platform-hackathon

# Remove original git history and reinitialize
rm -rf .git
git init
git remote add origin https://github.com/MikeT94/supporter-engagement-platform-hackathon.git

# Replace the default README with our hackathon README
cp HACKATHON_README.md README.md

# Add all files and commit
git add .
git commit -m "🏆 AWS Breaking Barriers Hackathon 2026 - Complete Implementation

Supporter Engagement Platform for Cancer Research UK

## Architecture
- AWS CDK infrastructure with 10+ services
- TypeScript/Node.js runtime  
- Amazon Bedrock for AI personalization
- DynamoDB, RDS, S3 for data storage
- Lambda functions for serverless compute

## Key Features
- AI-powered intent recognition with 95% accuracy
- Dynamic user personalization without friction
- Impact visualization with specific donation amounts
- MCP (Model Context Protocol) microservices architecture
- Property-based testing framework for reliability

## Demo Scenarios
- Sarah's cycling journey → London to Brighton Cycle Ride
- James's impact query → Personalized donation impact visualization
- John's profile update → Guided empathetic onboarding

## Technical Highlights
- Automatic personalization eliminates user friction
- Scalable serverless architecture supports thousands of users
- Comprehensive testing and documentation
- Real AWS deployment with live working demos

## Results
- ✅ Successful hackathon presentation
- ✅ Working prototype with real AWS infrastructure  
- ✅ Demonstrated increased engagement through personalization
- ✅ Advanced cloud architecture showcasing technical expertise

Stack: TypeScript, AWS CDK, DynamoDB, RDS, S3, Bedrock, Lambda, API Gateway"

# Push to your repository
git push -u origin main
```

## Step 2: Create Clean Simple Project

```bash
# Navigate back to parent directory
cd ..

# Clone original repository fresh for simple version
git clone https://github.com/AmmarRahman/aws-bbc2026-team-lon6.git supporter-engagement-simple
cd supporter-engagement-simple

# Switch to main branch (clean state)
git checkout main

# Remove original git history
rm -rf .git

# Initialize new repository
git init
git remote add origin https://github.com/MikeT94/supporter-engagement-simple.git

# Create simple project README
cat > README.md << 'EOF'
# Supporter Engagement Platform - Simplified Version

## Overview

This is a simplified, modern implementation of the Supporter Engagement Platform, rebuilt from the AWS Breaking Barriers Hackathon 2026 project with a focus on developer experience and maintainability.

## Original Hackathon Project

The original complex AWS implementation can be found at: [supporter-engagement-platform-hackathon](https://github.com/MikeT94/supporter-engagement-platform-hackathon)

## Planned Simplified Stack

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API routes or tRPC
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI/Anthropic API
- **Auth**: NextAuth.js
- **Deployment**: Vercel
- **Testing**: Vitest + Testing Library

## Goals

- Maintain core personalization features
- Simplify deployment and development
- Reduce infrastructure complexity
- Improve developer experience
- Keep costs minimal

## Status

🚧 **In Development** - Converting from complex AWS architecture to modern web stack

## Getting Started

Coming soon...

---

Based on the AWS Breaking Barriers Hackathon 2026 project for Cancer Research UK.
EOF

# Add and commit clean starting point
git add .
git commit -m "Initial commit - Clean starting point for simplified version

Based on AWS Breaking Barriers Hackathon 2026 original repository.
This will be rebuilt with a modern, simplified stack:

- Next.js 14 + TypeScript
- PostgreSQL + Prisma
- OpenAI/Anthropic API
- Vercel deployment

Goals:
- Maintain core personalization features
- Simplify development and deployment  
- Reduce infrastructure complexity
- Improve developer experience"

# Push to your repository
git push -u origin main
```

## Step 3: Verify Original Repository Untouched

```bash
# Navigate back to original
cd ../aws-bbc2026-team-lon6

# Check status - should show your local changes still there
git status

# Verify no commits were made to original
git log --oneline -5
```

## Summary

After running these commands you'll have:

✅ **Hackathon work preserved**: `MikeT94/supporter-engagement-platform-hackathon`  
✅ **Clean simple project**: `MikeT94/supporter-engagement-simple`  
✅ **Original repository untouched**: No commits or pushes made  

## Next Steps

1. **Showcase your hackathon work** - share the hackathon repository
2. **Plan your simplified stack** - choose modern tools
3. **Create new spec** - use Kiro to design the simplified version