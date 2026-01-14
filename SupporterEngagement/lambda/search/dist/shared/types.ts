// Core TypeScript interfaces based on service schemas
// Copied from lib/types/index.ts to avoid TypeScript rootDir issues

// Profile Type Enum
export enum ProfileType {
  NEW_USER = 'NEW_USER',
  BASIC_INFO = 'BASIC_INFO',
  RETURNING_USER = 'RETURNING_USER'
}

// User Profile (based on person-schema)
export interface UserProfile {
  userId: string;
  email?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  location?: string;
  
  // Address information
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  town?: string;
  county?: string;
  postCode?: string;
  country?: string;
  
  // Engagement attributes
  totalDonations: number;
  donationCount: number;
  firstDonationDate?: Date;
  lastDonationDate?: Date;
  
  // Activity flags
  hasAttendedEvents: boolean;
  hasFundraised: boolean;
  hasVolunteered: boolean;
  isResearcher: boolean;
  isJournalist: boolean;
  isPhilanthropist: boolean;
  
  // Personal context
  personallyAffected: boolean;
  lovedOneAffected: boolean;
  cancerType?: string;
  
  // Preferences
  communicationPreferences?: CommunicationPreferences;
  interests: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  consentGiven: boolean;
  consentDate?: Date;
  
  // Flags
  doNotContact?: boolean;
  isDeceased?: boolean;
  isAnonymous?: boolean;
  isHighValueSupporter?: boolean;
}

export interface CommunicationPreferences {
  email: boolean;
  sms: boolean;
  phone: boolean;
  preferredFrequency: 'weekly' | 'monthly' | 'quarterly';
}

// Donation (based on donation-schema)
export interface Donation {
  donationId: string;
  userId: string;
  amount: number;
  currency: string;
  donationType: 'Expense' | 'Legacy Income' | 'Payment' | 'Refund' | 'Reversal' | 'Tax Reclaim';
  paymentType: string;
  paymentStatus: 'Cancelled' | 'Completed' | 'Failed' | 'Pending' | 'Query' | 'Authorised';
  receivedDate: Date;
  paymentDate?: Date;
  
  // Gift Aid
  isGiftAided: boolean;
  giftAidAmount?: number;
  
  // Direct Debit
  directDebitFrequency?: string;
  directDebitStartDate?: Date;
  
  // Campaign/Event association
  campaignId?: string;
  eventCode?: string;
  fundraisingPageId?: string;
  productCode?: string;
  
  // Financial details
  paymentGross?: number;
  paymentNet?: number;
  paymentVAT?: number;
  paymentCommission?: number;
  
  // Metadata
  donorMessage?: string;
  motivation?: string;
  inMemoryName?: string;
  appealName?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// Session Context
export interface SessionContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivityTime: Date;
  
  // Flow state
  currentFlow: 'personalization' | 'information_seeking' | 'idle';
  flowState: FlowState;
  
  // Conversation history
  messages: Message[];
  
  // Cached data
  cachedProfile?: UserProfile;
  cachedContext?: UserContext;
}

export interface FlowState {
  flowType: string;
  currentStep: string;
  completedSteps: string[];
  collectedData: Record<string, any>;
  canResume: boolean;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// User Context
export interface UserContext {
  userId: string;
  profile: UserProfile;
  engagementHistory: EngagementRecord[];
  preferences: UserPreferences;
  currentFlow?: FlowState;
  lastUpdated: Date;
  version: number;
}

export interface UserPreferences {
  interests: string[];
  communicationPreferences: CommunicationPreferences;
  preferredLanguage?: string;
}

export interface EngagementRecord {
  recordId: string;
  userId: string;
  type: 'donation' | 'event' | 'volunteer' | 'fundraise' | 'campaign';
  timestamp: Date;
  
  // Type-specific data
  donationAmount?: number;
  eventName?: string;
  campaignName?: string;
  
  // Impact
  impactDescription?: string;
  
  metadata: Record<string, any>;
}

// Agent Response
export interface AgentResponse {
  text: string;
  uiComponents?: UIComponent[];
  nextAction?: string;
  requiresUserInput: boolean;
}

export interface UIComponent {
  type: 'dashboard' | 'search_results' | 'call_to_action' | 'info_card' | 'donation_widget';
  data: Record<string, any>;
  layout?: LayoutConfig;
}

export interface LayoutConfig {
  width?: string;
  height?: string;
  position?: string;
}

// User Input
export interface UserInput {
  text: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Intent Detection
export interface IntentResult {
  primaryIntent: 'personalization' | 'information_seeking' | 'action' | 'unclear';
  confidence: number;
  entities: Entity[];
  suggestedFlow: string;
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
}

// Error Response
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    userMessage: string;
    suggestedAction?: string;
    retryable: boolean;
  };
  fallbackData?: any;
}

// Context Version
export interface ContextVersion {
  version: number;
  context: UserContext;
  timestamp: Date;
  source: string;
}

// Dashboard Data
export interface DashboardData {
  userName: string;
  totalDonations: number;
  currentCampaign?: CampaignProgress;
  impactBreakdown: ImpactItem[];
  recommendedPages: PageRecommendation[];
  featuredResearch: ResearchPaper[];
}

export interface CampaignProgress {
  campaignName: string;
  currentAmount: number;
  targetAmount: number;
  percentComplete: number;
}

export interface ImpactItem {
  description: string;
  quantity: number;
  icon: string;
}

export interface PageRecommendation {
  title: string;
  url: string;
  reason: string;
  thumbnail?: string;
}

// Fundraising Page (based on fundraising-page-schema)
export interface FundraisingPage {
  fundraisingPageId: string;
  fundraisingActivityId: string;
  userId: string;
  
  // Page details
  pageTitle?: string;
  pageDescription?: string;
  pageUrl?: string;
  pageStatus: 'Open' | 'Closed';
  pageType: string;
  
  // Dates
  pageCreatedDate: Date;
  pageExpiryDate?: Date;
  pageCloseDate?: Date;
  lastModifiedDate?: Date;
  
  // Targets and amounts
  targetAmount?: number;
  pledgeAmount?: number;
  sponsorshipTarget?: number;
  
  // Event association
  eventId?: string;
  eventName?: string;
  eventCode?: string;
  eventCategory?: string;
  eventRegisteredDate?: Date;
  eventExpiryDate?: Date;
  
  // Team information
  teamName?: string;
  teamUrl?: string;
  fundraisingPageTeamId?: string;
  fundraisingPageTeamMemberRole?: string;
  
  // In Memoriam
  isInMemoriam: boolean;
  inMemoryName?: string;
  inMemoriamId?: string;
  inMemoriamFirstName?: string;
  inMemoriamLastName?: string;
  inMemoriamRelationship?: string;
  
  // Metadata
  motivation?: string;
  appealName?: string;
  productCode?: string;
  followUp: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

// Donation Summary
export interface DonationSummary {
  userId: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  recurringDonations: number;
  lastDonationDate?: Date;
  suggestedNextAmount: number;
}

// Knowledge Article
export interface KnowledgeArticle {
  articleId: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  
  // Categorization
  category: string;
  tags: string[];
  cancerTypes: string[];
  
  // Metadata
  publishedDate: Date;
  lastUpdated: Date;
  author: string;
  
  // Accessibility
  readingLevel: 'basic' | 'intermediate' | 'advanced';
  availableLanguages: string[];
}

// Research Paper
export interface ResearchPaper {
  paperId: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: Date;
  abstract: string;
  url: string;
  
  // Categorization
  tags: string[];
  cancerTypes: string[];
  researchArea: string;
  
  // Impact metrics
  citations: number;
  impactFactor?: number;
  isFeatured: boolean;
  
  // CRUK specific
  fundedByCRUK: boolean;
  fundingAmount?: number;
}

// Motivational Content
export interface MotivationalContent {
  headline: string;
  body: string;
  achievements: Achievement[];
  personalizedMessage: string;
}

export interface Achievement {
  title: string;
  description: string;
  date: Date;
  impact: string;
}

// Call to Action
export interface CallToAction {
  type: 'donate' | 'volunteer' | 'fundraise' | 'campaign';
  title: string;
  description: string;
  suggestedAmounts?: number[];
  actionUrl: string;
}
