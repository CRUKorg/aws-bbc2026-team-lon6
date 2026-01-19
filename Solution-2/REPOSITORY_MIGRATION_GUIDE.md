# Repository Migration Guide

## Overview

This guide helps you:
1. **Preserve** the current hackathon project in your personal repository (MikeT94)
2. **Create** a new simplified project from the original repository

## Current Status

- **Current Repository**: `AmmarRahman/aws-bbc2026-team-lon6`
- **Branch**: `develop`
- **Status**: Many untracked files from hackathon development
- **Target Personal Repo**: `MikeT94/[new-repo-name]`

---

## Step 1: Preserve Current Project in Your Repository

### 1.1 Commit All Current Changes

First, let's commit all the hackathon work:

```bash
# Add all files (including untracked ones)
git add .

# Commit with a comprehensive message
git commit -m "🏆 Hackathon Final Submission - AWS Breaking Barriers 2026

- Complete Supporter Engagement Platform implementation
- AWS CDK infrastructure with 10+ services
- Personalization Agent with intent recognition
- MCP servers for modular architecture
- Property-based testing framework
- Comprehensive demo scripts and documentation
- Impact query personalization fixes
- All presentation materials and architecture diagrams

Stack: TypeScript, AWS CDK, DynamoDB, RDS, S3, Bedrock, Lambda, API Gateway"
```

### 1.2 Create Your Personal Repository

1. Go to GitHub and create a new repository under your account:
   - Repository name: `supporter-engagement-platform-hackathon` (or your preferred name)
   - Description: "AWS Breaking Barriers Hackathon 2026 - Supporter Engagement Platform"
   - Make it **Public** to showcase your work
   - Don't initialize with README (we'll push existing code)

### 1.3 Push to Your Repository

```bash
# Add your new repository as a remote
git remote add personal https://github.com/MikeT94/supporter-engagement-platform-hackathon.git

# Push the current branch to your repository
git push personal develop:main

# Optionally, push all branches
git push personal --all
```

### 1.4 Update Repository Documentation

Create a hackathon summary README:

```bash
# Create a comprehensive README for your personal repo
cat > HACKATHON_README.md << 'EOF'
# Supporter Engagement Platform - AWS Breaking Barriers Hackathon 2026

## 🏆 Hackathon Achievement

This project was developed during the AWS Breaking Barriers Hackathon 2026 for Cancer Research UK. It demonstrates advanced AWS cloud architecture, AI-powered personalization, and modern software engineering practices.

## 🎯 Problem Solved

Traditional charity engagement platforms provide generic experiences. Our solution delivers hyper-personalized supporter journeys using AI, leading to increased engagement and donations.

## 🏗️ Architecture

- **Frontend**: TypeScript with personalized UI components
- **Backend**: AWS Lambda with Node.js
- **AI/ML**: Amazon Bedrock for intent recognition and personalization
- **Data**: DynamoDB (user profiles), RDS (transactions), S3 (research papers)
- **Infrastructure**: AWS CDK for Infrastructure as Code
- **Testing**: Property-based testing with comprehensive test coverage

## 🚀 Key Features

1. **AI-Powered Intent Recognition**: Understands user queries and personalizes responses
2. **Dynamic Personalization**: Adapts content based on user profile, interests, and history
3. **Modular MCP Architecture**: Microservices pattern with Model Context Protocol
4. **Real-time Analytics**: Tracks engagement and optimizes user journeys
5. **Impact Visualization**: Shows personalized impact of user contributions

## 📊 Demo Scenarios

- **Sarah's Journey**: Cycling enthusiast → London to Brighton Cycle Ride
- **James's Impact**: Lapsed donor → Personalized impact visualization
- **John's Profile**: New supporter → Guided onboarding experience

## 🛠️ Technology Stack

- **Cloud**: AWS (10+ services)
- **Runtime**: Node.js, TypeScript
- **AI**: Amazon Bedrock (Claude)
- **Data**: DynamoDB, RDS PostgreSQL, S3
- **Infrastructure**: AWS CDK
- **Testing**: Jest, Property-based testing
- **Architecture**: MCP (Model Context Protocol)

## 📈 Results

- Increased engagement through personalization
- Reduced user friction with AI-powered intent recognition
- Scalable architecture supporting thousands of concurrent users
- Comprehensive testing ensuring reliability

## 🎥 Presentation Materials

- [Technical Architecture](./SupporterEngagement/TECHNICAL_ARCHITECTURE.md)
- [Demo Guide](./SupporterEngagement/DEMO_REAL_AWS.md)
- [Presentation Slides](./SupporterEngagement/PRESENTATION_SLIDES.md)
- [AWS Architecture Diagram](./SupporterEngagement/aws-architecture.drawio)

## 🚀 Quick Start

See [SETUP.md](./SupporterEngagement/SETUP.md) for deployment instructions.

---

**Developed by**: Mike T  
**Event**: AWS Breaking Barriers Hackathon 2026  
**Organization**: Cancer Research UK  
**Date**: January 2026
EOF

git add HACKATHON_README.md
git commit -m "Add hackathon summary documentation"
git push personal develop:main
```

---

## Step 2: Create New Simplified Project

### 2.1 Clone Original Repository

```bash
# Navigate to your projects directory
cd ..

# Clone the original repository for the new project
git clone https://github.com/AmmarRahman/aws-bbc2026-team-lon6.git supporter-engagement-simple

# Navigate to the new project
cd supporter-engagement-simple
```

### 2.2 Reset to Clean State

```bash
# Switch to main branch (or the original clean branch)
git checkout main

# Remove all hackathon-specific changes
git clean -fd
git reset --hard HEAD

# Check what's in the original state
ls -la
```

### 2.3 Create New Repository for Simplified Version

1. Create another new repository on GitHub:
   - Repository name: `supporter-engagement-simple` (or your preferred name)
   - Description: "Simplified Supporter Engagement Platform - Modern Stack"
   - Make it **Public**

### 2.4 Set Up New Remote and Push

```bash
# Remove old remote
git remote remove origin

# Add your new repository
git remote add origin https://github.com/MikeT94/supporter-engagement-simple.git

# Push clean state
git push -u origin main
```

---

## Step 3: Plan New Simplified Stack

### Current Complex Stack:
- AWS CDK (Infrastructure as Code)
- 10+ AWS services (DynamoDB, RDS, S3, Bedrock, Lambda, etc.)
- MCP servers architecture
- Complex deployment pipeline

### Suggested Simplified Stack Options:

#### Option A: Modern Web Stack
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Next.js API routes or Express.js
- **Database**: PostgreSQL (local/cloud) or SQLite
- **AI**: OpenAI API or Anthropic Claude API
- **Deployment**: Vercel or Railway
- **Testing**: Vitest + Testing Library

#### Option B: Full-Stack Framework
- **Framework**: T3 Stack (Next.js + tRPC + Prisma + TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js
- **AI**: OpenAI/Anthropic API
- **Deployment**: Vercel
- **Testing**: Vitest

#### Option C: Serverless Simple
- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL + Auth + API)
- **AI**: Direct API calls to LLM providers
- **Deployment**: Netlify/Vercel
- **Testing**: Vitest

### Recommended: Option B (T3 Stack)

**Benefits:**
- Type-safe end-to-end
- Excellent developer experience
- Built-in best practices
- Easy deployment
- Great documentation

---

## Next Steps

1. **Complete Step 1** to preserve your hackathon work
2. **Complete Step 2** to set up clean repository
3. **Choose your new stack** (I recommend T3 Stack)
4. **Create new spec** for simplified version using Kiro

Would you like me to help you execute any of these steps?