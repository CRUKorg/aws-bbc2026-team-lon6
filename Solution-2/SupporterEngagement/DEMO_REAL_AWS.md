# Real AWS Demo Guide

This guide explains how to run demos using **REAL AWS services** with automatic reset capability.

## Overview

The demo system now:
- ✅ Calls real AWS services (DynamoDB, RDS, Bedrock)
- ✅ Seeds realistic data for two personas
- ✅ Automatically resets to clean state after demos
- ✅ No mock data fallbacks

## Demo Personas

### Sarah Johnson (sarah-engaged-001)
- **Profile**: Engaged supporter
- **Donations**: £600 total (£50/month × 12 months)
- **Interests**: Breast cancer research, immunotherapy, early detection
- **Engagement**: High - regular donations, event attendance, content views
- **Last Activity**: Recent (within last month)

### James Wilson (james-lapsed-001)
- **Profile**: Lapsed supporter
- **Donations**: £100 one-time (6 months ago)
- **Interests**: Lung cancer research, biomarkers
- **Engagement**: Low - single donation, no recent activity
- **Last Activity**: 6 months ago

### John Davies (john-new-supporter-001)
- **Profile**: New supporter
- **Donations**: None yet
- **Interests**: None initially (updated during demo)
- **Engagement**: New - minimal profile, ready for personalization
- **Demo Focus**: Profile updates and preference disclosure

## Quick Start

### Prerequisites
1. AWS credentials configured in your terminal
2. Stack deployed: `npm run deploy`
3. All dependencies installed: `npm install`

### Run Complete Demo Cycle

```bash
npm run demo:live
```

This will:
1. Clear all databases
2. Seed demo data
3. Run Sarah's demo (engaged supporter)
4. Run James's demo (lapsed supporter)
5. Reset databases to clean state

### Manual Demo Steps

#### 1. Prepare Demo Data
```bash
npm run demo:prepare
```
This clears databases and seeds fresh data.

#### 2. Run Individual Demos
```bash
# Sarah's demo (engaged supporter)
npm run demo:sarah

# James's demo (lapsed supporter)
npm run demo:james

# John's demo (profile update)
npm run demo:john

# Both Sarah and James in sequence
npm run demo:all
```

#### 3. Reset After Demo
```bash
npm run reset
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run reset` | Clear all DynamoDB tables |
| `npm run seed` | Populate tables with demo data |
| `npm run demo:prepare` | Reset + Seed (prepare for demo) |
| `npm run demo:sarah` | Run Sarah's demo (engaged supporter) |
| `npm run demo:james` | Run James's demo (lapsed supporter) |
| `npm run demo:john` | Run John's demo (profile update) |
| `npm run demo:all` | Run Sarah and James demos in sequence |
| `npm run demo:live` | Full cycle: reset → seed → demos → reset |

## What Gets Seeded

### User Profiles Table
- Sarah Johnson with complete profile
- James Wilson with complete profile

### Engagement History Table
- Sarah: 12 monthly donations (£50 each)
- Sarah: Content views, searches, event attendance
- James: 1 one-time donation (£100)

### Analytics Table
- Sarah: Multiple interactions (search, content, donation)
- James: Single donation interaction

### Context Table
- Sarah: Active session with conversation history
- James: Dormant session (6 months old)

## Demo Flow

### Sarah's Demo (3-4 minutes)
1. **Dashboard View**: Shows personalized impact metrics
   - Total donations: £600
   - Research funded: 2.5 days
   - Breakthrough studies: 3
2. **Intelligent Search**: Breast cancer treatment progress
   - Results prioritized by her interests
   - Shows research she's funding
3. **Progressive Data Collection**: Non-intrusive preference gathering

### James's Demo (3-4 minutes)
1. **Re-engagement Dashboard**: Welcome back message
   - Shows impact of original £100 donation
   - No guilt-tripping for being away
2. **Impact Story**: What happened with his donation
   - Research outcomes from his funding
   - Published papers and breakthroughs
3. **Contextual Donation Prompt**: Intelligent suggestion
   - Suggested amount: £50 (based on history)
   - Clear reason: Continue the research he started

## AWS Services Used

### DynamoDB
- **Tables**: User Profiles, Engagement, Analytics, Context
- **Operations**: PutItem, GetItem, Query, Scan
- **Cost**: Minimal (on-demand pricing)

### Amazon Bedrock
- **Model**: Claude 3 Sonnet
- **Operations**: InvokeModel for AI responses
- **Cost**: ~$0.003 per 1K input tokens, ~$0.015 per 1K output tokens

### RDS PostgreSQL
- **Database**: Transaction history (future use)
- **Operations**: Currently not used in demos
- **Cost**: Minimal (db.t3.micro instance)

## Troubleshooting

### Error: "Cannot find table"
**Solution**: Ensure stack is deployed
```bash
npm run deploy
```

### Error: "Access Denied"
**Solution**: Check AWS credentials
```bash
aws sts get-caller-identity
```

### Error: "No data returned"
**Solution**: Seed the databases
```bash
npm run seed
```

### Demo runs but shows errors
**Solution**: Reset and re-seed
```bash
npm run demo:prepare
```

## Cost Estimates

For a typical demo session:

| Service | Usage | Cost |
|---------|-------|------|
| DynamoDB | ~50 reads/writes | < $0.01 |
| Bedrock | ~10K tokens | ~$0.10 |
| RDS | Idle | ~$0.02/hour |
| **Total per demo** | | **~$0.13** |

With your AWS budget, you can run hundreds of demos without concern.

## Best Practices

### Before Hackathon Presentation
1. Run `npm run demo:prepare` 5 minutes before
2. Test both demos once to ensure everything works
3. Keep terminal window ready with `npm run demo:sarah`

### During Presentation
1. Run Sarah's demo first (engaged supporter - positive story)
2. Explain the AI personalization happening in real-time
3. Run James's demo second (re-engagement - shows versatility)
4. Highlight the AWS services being called

### After Presentation
1. Run `npm run reset` to clean up
2. Keep stack deployed for Q&A demos
3. Can re-run demos instantly with `npm run demo:prepare`

## Demo Script Highlights

### Key Points to Mention
1. **Real AWS Integration**: "This is calling real AWS services right now"
2. **AI Personalization**: "Bedrock is analyzing Sarah's history in real-time"
3. **MCP Architecture**: "5 specialized servers working together"
4. **Scalability**: "Same infrastructure handles 1 user or 1 million"

### Technical Highlights
- DynamoDB for sub-10ms profile lookups
- Bedrock Claude 3 for intelligent responses
- MCP servers for modular AI capabilities
- Event-driven architecture for real-time updates

## Next Steps

After successful demos:
1. Add more personas (researcher, journalist, philanthropist)
2. Integrate RDS transaction history
3. Add S3 research paper retrieval
4. Implement real Bedrock knowledge base queries

## Support

If you encounter issues:
1. Check AWS credentials: `aws sts get-caller-identity`
2. Verify stack status: `aws cloudformation describe-stacks --stack-name MichaelSupporterEngagement`
3. Check DynamoDB tables: `aws dynamodb list-tables`
4. Review logs in CloudWatch

---

**Ready to demo?** Run `npm run demo:live` and show the power of AI-driven supporter engagement! 🚀
