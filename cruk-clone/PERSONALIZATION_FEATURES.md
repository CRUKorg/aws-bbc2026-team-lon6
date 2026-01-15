# Personalization Features Implementation

This document describes the new personalization features added to the CRUK website clone as part of Task 19.

## Overview

The following components have been integrated into the existing React frontend:

1. **API Client** - Backend communication layer
2. **Personalization Container** - Dashboard with user profile and donations
3. **Search Bar** - Universal search functionality
4. **Missing Data Prompt** - Optional profile completion
5. **Conversational Interface** - Real-time chat with AI agent

## Components

### 1. API Client (`src/services/api.ts`)

Handles all communication with the backend Lambda functions via API Gateway.

**Features:**
- REST API calls for profile, search, and agent interactions
- WebSocket support for real-time chat
- Mock authentication (userId: 'user-001')
- TypeScript interfaces for all data types

**Configuration:**
```typescript
// Set via environment variables
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
```

### 2. Personalization Container

A comprehensive dashboard showing:
- User greeting with avatar
- Total donations
- Campaign progress (if active)
- Donation widget with suggested amounts
- Impact breakdown
- Recommended pages
- Featured research papers

**Sub-components:**
- `CampaignProgress.tsx` - Progress bar for active campaigns
- `DonationWidget.tsx` - Quick donation interface
- `ImpactBreakdown.tsx` - Visual impact of donations
- `RecommendedPages.tsx` - Personalized page recommendations
- `FeaturedResearch.tsx` - Relevant research papers

**Usage:**
```tsx
<PersonalizationContainer userId="user-001" />
```

### 3. Search Bar

Universal search component that appears on all pages.

**Features:**
- Real-time search with debouncing
- Dropdown results with article previews
- Category and tag filtering
- Click-outside to close
- Responsive design

**Usage:**
```tsx
<SearchBar 
  placeholder="what are you looking for today"
  onSearch={(query) => console.log(query)}
/>
```

### 4. Missing Data Prompt

Non-blocking prompt for users with incomplete profiles.

**Features:**
- Age range selection (<50, 50-64, 65+)
- Gender selection (Man, Woman, Non-binary, Prefer not to say)
- Integrated search bar
- Related content suggestions
- Skip option (non-blocking)

**Usage:**
```tsx
<MissingDataPrompt 
  userId="user-001"
  onDataSubmitted={() => console.log('Data updated')}
/>
```

### 5. Conversational Interface

Real-time chat interface for personalization and information seeking.

**Features:**
- WebSocket connection for real-time messaging
- Fallback to REST API if WebSocket unavailable
- Quick action buttons
- Typing indicators
- Message history
- Connection status indicator
- Floating chat button

**Usage:**
```tsx
<ConversationalInterface 
  userId="user-001"
  sessionId="session-123"
  onClose={() => setShowChat(false)}
/>
```

## Integration in App.tsx

The main App component now includes:

1. **Search Bar** - Sticky at top of page
2. **Personalization Container** - Shows for authenticated users
3. **Missing Data Prompt** - Shows for users with incomplete profiles
4. **Floating Chat Button** - Fixed position, opens chat modal
5. **Chat Modal** - Overlay with conversational interface

**Authentication:**
```tsx
const [isAuthenticated] = useState(true); // Mock - set to true to show features
```

## Styling

All components follow CRUK brand guidelines:

**Colors:**
- Primary Purple: `#2E008B`
- Primary Pink: `#E40087`
- Teal: `#00B8A9`
- Light backgrounds: `#F5F5F5`, `#FFF0F7`

**Typography:**
- Font family: Arial, Helvetica, sans-serif
- Headings: Bold, purple
- Body: Regular, dark gray

**Responsive:**
- Mobile-first approach
- Breakpoint at 768px
- Touch-friendly buttons (min 44px)

## Mock Data

The implementation uses mock data for development:

**Mock User ID:** `user-001`

**Mock Profile Data:**
```typescript
{
  userId: 'user-001',
  name: 'Sarah',
  totalDonations: 187,
  donationCount: 9,
  // ... other fields
}
```

## Backend Integration

To connect to the actual backend:

1. Deploy the CDK stack from `SupporterEngagement/`
2. Get the API Gateway URL from CDK outputs
3. Set environment variables:
   ```bash
   REACT_APP_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
   REACT_APP_WS_URL=wss://your-ws-id.execute-api.region.amazonaws.com/prod
   ```
4. Update mock authentication to use real Cognito

## Running the Application

```bash
cd cruk-clone
npm install
npm start
```

The app will open at `http://localhost:3000`

## Features Demonstrated

Based on the provided screenshots, the implementation includes:

1. **Personalized Dashboard** (Screenshot 1)
   - User greeting with avatar
   - Total donations display
   - Campaign progress bar
   - Donation buttons
   - Impact breakdown with icons
   - Recommended content

2. **Missing Data Form** (Screenshot 2)
   - Age range selection
   - Gender selection
   - Submit button
   - Related content below

3. **Sign Up Prompt** (Screenshot 3)
   - Benefits list
   - Sign up CTA
   - Login link

4. **Extended Dashboard** (Screenshot 4)
   - Journey tracking
   - Donation stats cards
   - Impact details
   - Quick actions sidebar
   - Research updates

## Next Steps

To complete the integration:

1. Connect to deployed backend APIs
2. Implement real authentication with Cognito
3. Add error boundaries for production
4. Implement analytics tracking
5. Add loading states and error handling
6. Write unit tests for components
7. Perform accessibility audit
8. Add E2E tests with Cypress/Playwright

## Requirements Validated

This implementation addresses the following requirements:

- **Req 1.1**: User profile access ✓
- **Req 2.1-2.5**: Dashboard display ✓
- **Req 3.1-3.5**: Personalization flow ✓
- **Req 4.1-4.5**: Intent detection and flow management ✓
- **Req 5.1-5.6**: Information seeking ✓
- **Req 7.1-7.4**: Call to action generation ✓
- **Req 9.1-9.5**: Frontend personalization container ✓
- **Req 10.1-10.4**: Missing data handling ✓
- **Req 11.1-11.5**: Search functionality ✓

## Notes

- All components are TypeScript with full type safety
- CSS follows BEM-like naming conventions
- Components are modular and reusable
- Responsive design works on mobile, tablet, and desktop
- Accessibility considerations included (ARIA labels, keyboard navigation)
