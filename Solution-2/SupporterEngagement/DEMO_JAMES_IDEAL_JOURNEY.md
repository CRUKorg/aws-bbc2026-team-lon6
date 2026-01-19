# James's Ideal Journey Demo - Ready

## Overview
Created a complete ideal journey demo for James Wilson, a lapsed supporter with running interests.

## Changes Made

### 1. Updated James's Profile (seed-databases.ts)
Added running and Race for Life interests to James's profile:
- **Previous interests**: lung-cancer-research, biomarkers
- **New interests**: lung-cancer-research, biomarkers, running, race-for-life

### 2. Enhanced PersonalizationAgent
Added support for running/Race for Life as a separate activity from cycling:

**New Features:**
- `hasRunningInterest` detection (separate from cycling)
- Race for Life CTA shown first for running enthusiasts
- Personalized messaging: "Walk, jog, or run to raise funds and honor loved ones"
- Updated `buildSupportOptions()` to include Race for Life option

**CTA Priority Order:**
1. **Race for Life** (if running interest)
2. **Cycling Events** (if cycling interest)
3. **Cancer-specific donation** (if loved one affected)
4. **Regular giving** (with smart messaging for existing donors)

### 3. Created New Demo Script
**File**: `scripts/demo-ideal-journey-james.ts`

**Journey Steps:**
1. **Dashboard** - Lapsed supporter re-engagement (no guilt-tripping)
2. **Motivation** - Impact of original £100 donation on lung cancer research
3. **Information Seeking** - Search for lung cancer biomarkers
4. **Call to Action** - Race for Life featured prominently

### 4. Added NPM Script
```bash
npm run demo:ideal:james
```

## Key Personalization for James

### Profile Attributes
- **Name**: James Wilson
- **Location**: Manchester, UK
- **Donation History**: £100 one-time (6 months ago)
- **Interests**: Lung cancer research, biomarkers, running, Race for Life
- **Loved One**: Affected by lung cancer
- **Status**: Lapsed supporter

### Expected CTAs (in order)
1. **Fundraise Through Race for Life** ⭐ (running interest)
   - "Walk, jog, or run to raise funds and honor loved ones"
   - Location-specific: Manchester, UK
   
2. **Fund Lung Cancer Research** (loved one affected)
   - Direct donation to lung cancer research
   - One-time or monthly options
   
3. **Become a Regular Giver** (not currently regular)
   - Monthly giving starting from £5/month
   
4. **Volunteer** (additional engagement)
   - Retail shops, community events

## Running the Demo

### Prerequisites
```bash
# Ensure stack is deployed
npm run deploy

# Seed database with updated James profile
npm run seed
```

### Run James's Ideal Journey
```bash
cd SupporterEngagement
npm run demo:ideal:james
```

### Compare with Sarah's Journey
```bash
# Sarah (cycling interest)
npm run demo:ideal

# James (running interest)
npm run demo:ideal:james
```

## Key Differences: Sarah vs James

| Aspect | Sarah | James |
|--------|-------|-------|
| **Activity Interest** | Cycling | Running |
| **Featured Event** | London to Brighton Cycle Ride 2026 | Race for Life |
| **Cancer Type** | Breast cancer | Lung cancer |
| **Donation Status** | Regular giver (£50/month) | Lapsed (£100 one-time) |
| **Location** | London | Manchester |
| **Engagement Level** | High | Lapsed |

## Technical Implementation

### Interest Detection Logic
```typescript
// Running/Race for Life detection
const hasRunningInterest = profile?.interests?.some((interest: string) => 
  interest.toLowerCase().includes('running') || 
  interest.toLowerCase().includes('race-for-life')
) || false;

// Cycling detection (separate)
const hasCyclingInterest = profile?.interests?.some((interest: string) => 
  interest.toLowerCase().includes('cycling')
) || false;
```

### CTA Generation
```typescript
// PRIORITY 1A: Running/Race for Life
if (hasRunningInterest && profile?.location) {
  responseText += `**${ctaNumber}. Fundraise Through Race for Life**\n`;
  responseText += `Since you're interested in running, you might love Race for Life events in ${profile.location}! `;
  responseText += `You can walk, jog, or run to raise funds and honor loved ones affected by cancer. `;
  responseText += `We'll support you every step of the way.\n\n`;
  ctaNumber++;
}

// PRIORITY 1B: Cycling
if (hasCyclingInterest && profile?.location) {
  responseText += `**${ctaNumber}. Fundraise Through Cycling Events**\n`;
  responseText += `Since you're interested in cycling, you might love the London to Brighton Cycle Ride 2026! `;
  // ...
}
```

## Demo Output Preview

### Step 1: Dashboard
- Welcome back message (no guilt for 6-month absence)
- Shows £100 donation history
- Highlights lung cancer research interest

### Step 2: Motivation
- 3-5 impact statements
- Prioritizes lung cancer research achievements
- Shows how his £100 made a difference

### Step 3: Information Seeking
- Search for lung cancer biomarkers
- Returns relevant articles/links
- No AI-generated summaries (per requirements)

### Step 4: Call to Action
- **Race for Life** featured first (running interest)
- Lung cancer research donation option
- Regular giving opportunity
- Volunteer options

## Success Criteria
✅ James's profile includes running and Race for Life interests  
✅ Race for Life CTA appears first (before cycling)  
✅ Separate from cycling activities (no conflation)  
✅ Location-specific messaging (Manchester)  
✅ Lapsed supporter re-engagement (no guilt-tripping)  
✅ Lung cancer research personalization  
✅ Complete 4-step journey implemented  
✅ NPM script configured  
✅ TypeScript compilation successful  

## Next Steps
1. Run `npm run seed` to update James's profile in DynamoDB
2. Run `npm run demo:ideal:james` to see the complete journey
3. Compare with Sarah's journey to see different personalizations
4. Use for hackathon presentation to show diverse supporter personas

## Files Modified
- `scripts/seed-databases.ts` - Added running/race-for-life to James's interests
- `src/agent/PersonalizationAgent.ts` - Added running/Race for Life support
- `scripts/demo-ideal-journey-james.ts` - New demo script
- `package.json` - Added `demo:ideal:james` script

## Notes
- Race for Life and cycling are now completely separate activities
- Each has its own detection logic and CTA messaging
- Running interest triggers Race for Life (not cycling events)
- Cycling interest triggers London to Brighton Cycle Ride 2026
- Both can appear for users with both interests (Sarah has both)
