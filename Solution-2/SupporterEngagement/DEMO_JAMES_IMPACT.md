# Demo: James Impact Query - Automatic Personalization

## Overview

This demo showcases **automatic personalization of non-specific user input**. It demonstrates how the system intelligently personalizes responses without requiring clarifying questions.

## Scenario

**User:** James Wilson (Lapsed Supporter)  
**Question:** "What impact have I had on cancer?" (intentionally vague)

## What Makes This Special

Traditional chatbots would respond with:
- "Which cancer type are you asking about?"
- "What timeframe are you interested in?"
- "Are you asking about your donations or volunteering?"

**Our system automatically knows:**
- James donated £100 six months ago
- His loved one was affected by lung cancer
- He's interested in biomarkers and research
- He's interested in running and Race for Life

## Demo Flow

### Step 1: Dashboard (Context Setting)
James views his personalized dashboard showing his prior engagement.

### Step 2-Variant: Automatic Personalization
**James asks:** "What impact have I had on cancer?"

**System automatically:**
1. Detects intent: "personalization" (impact query)
2. Retrieves context from DynamoDB:
   - Donation: £100
   - Cancer type: Lung cancer
   - Interests: Biomarkers, research
3. Generates personalized response:
   - Acknowledges his specific £100 donation
   - Highlights **lung cancer** research impact
   - Includes biomarker research (his interest)
   - Shows general CRUK achievements
4. Maintains empathetic tone:
   - No guilt about being lapsed
   - Emphasizes positive impact
   - Invites continued engagement

### Step 3: Personalized Call to Action
System recommends:
- Race for Life events (running interest)
- Lung cancer research donations
- Multiple engagement options

## Running the Demo

```bash
# Ensure database is seeded
npm run seed

# Run the impact demo
npm run demo:ideal:james:impact
```

## Key Differentiator

| Traditional Chatbot | Our System |
|---------------------|------------|
| Asks clarifying questions | Automatically personalizes |
| Generic responses | Context-aware responses |
| User friction | Seamless experience |
| "Which cancer type?" | Already knows: lung cancer |

## Technical Implementation

### AWS Services Used
1. **DynamoDB** - User profile and donation history
2. **Amazon Bedrock** - Intent recognition
3. **ElastiCache Redis** - Fast context retrieval
4. **Lambda** - Personalization agent execution

### Personalization Logic
```typescript
// System retrieves user context
const profile = await getUserProfile(userId);
const donations = await getDonationHistory(userId);

// Automatically personalizes response
if (profile.cancerType === 'lung-cancer') {
  // Focus on lung cancer research impact
  response.include(lungCancerImpact);
}

if (profile.interests.includes('biomarkers')) {
  // Include biomarker research
  response.include(biomarkerResearch);
}
```

## Demo Output Highlights

```
💬 James asks: "What impact have I had on cancer?"

✨ PERSONALIZED RESPONSE:

James, your support is making a real difference! Here's the impact 
Cancer Research UK is achieving:

1. Lung Cancer Survival Improvements
   Your £100 donation contributes to lung cancer research that has 
   helped increase 10-year survival rates...

2. Biomarker Research Breakthroughs
   CRUK-funded research has identified new biomarkers for early 
   detection of lung cancer...

3. Cancer Survival Has Doubled
   Cancer survival in the UK has doubled over the past 40 years...
```

## Presentation Tips

1. **Emphasize the vagueness** of the question
2. **Highlight automatic personalization** - no clarifying questions needed
3. **Show the technical architecture** - how context flows from DynamoDB → Agent → Response
4. **Compare to traditional chatbots** - friction vs. seamless experience
5. **Demonstrate business value** - better user experience = higher engagement

## Related Demos

- `npm run demo:ideal:james` - Full James journey with information seeking
- `npm run demo:ideal` - Sarah's cycling journey
- `npm run demo:john` - Profile update flow

## Success Metrics

This demo showcases:
- ✅ Zero clarifying questions needed
- ✅ 100% personalized response (lung cancer focus)
- ✅ User interests incorporated (biomarkers)
- ✅ Empathetic tone maintained
- ✅ Seamless user experience
