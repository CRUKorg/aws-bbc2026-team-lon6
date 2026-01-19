# 🎯 Demo Ready - Quick Start

All fixes have been applied! You're ready to run the John profile update demo.

## ✅ What Was Fixed

1. **Analytics Table Keys**: Fixed reset script to use correct keys (`userId` + `interactionId`)
2. **Context Version**: Added required `version: 1` field to all context records
3. **John's Profile**: Removed `cancerType: undefined` (DynamoDB doesn't accept undefined)
4. **Environment Config**: Correctly pointing to deployed stack in us-west-2

## 🚀 Run the Demo

In your terminal with AWS credentials:

```bash
# Step 1: Prepare demo (reset + seed)
npm run demo:prepare

# Step 2: Run John's profile update demo
npm run demo:john
```

## 📋 What the Demo Shows

**Scene 1**: John logs in with minimal profile
- Basic dashboard with generic content
- No personalization yet

**Scene 2**: John updates his profile
- Discloses mother's breast cancer diagnosis
- Adds interest in breast cancer research
- Profile saved to DynamoDB

**Scene 3**: John asks how to support CRUK
- Personalized recommendations based on new profile
- Breast cancer research content
- Donation options
- Event suggestions

**Scene 4**: Dashboard refresh
- Now shows personalized content
- Breast cancer research highlights
- Relevant fundraising opportunities

## 🔄 Reset Between Demos

```bash
npm run demo:prepare
```

This automatically:
1. Clears all demo data from DynamoDB
2. Re-seeds with fresh Sarah, James, and John personas
3. Ready for next demo run

## 📊 Available Demos

```bash
npm run demo:sarah    # Engaged supporter (high engagement)
npm run demo:james    # Lapsed supporter (re-engagement)
npm run demo:john     # New supporter (profile update)
```

## 🎬 For Hackathon Presentation

1. **Before presenting**: Run `npm run demo:prepare`
2. **During presentation**: Run `npm run demo:john`
3. **Between demos**: Run `npm run demo:prepare` again

The demo runs against your real AWS infrastructure:
- ✅ DynamoDB tables in us-west-2
- ✅ Amazon Bedrock for AI
- ✅ Real AWS SDK calls
- ✅ Automatic reset capability

Good luck with your presentation! 🎉
