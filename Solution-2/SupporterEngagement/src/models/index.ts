/**
 * Data Models Index
 * Central export point for all data models and types
 */

// User Profile
export {
  UserProfile,
  CommunicationPreferences,
} from './UserProfile';

// Session Context
export {
  SessionContext,
  Message,
  FlowState,
} from './SessionContext';

// User Context
export {
  UserContext,
  UserPreferences,
  ContextVersion,
} from './UserContext';

// Engagement
export {
  EngagementRecord,
  EngagementType,
} from './EngagementRecord';

// Transactions
export {
  Transaction,
  TransactionType,
  TransactionStatus,
  DonationSummary,
  TransactionValidation,
} from './Transaction';

// Research Papers
export {
  ResearchPaper,
} from './ResearchPaper';

// Knowledge Articles
export {
  KnowledgeArticle,
  ReadingLevel,
  SearchFilters,
} from './KnowledgeArticle';

// UI Components
export {
  UIComponent,
  UIComponentType,
  LayoutConfig,
  CampaignProgress,
  ImpactItem,
  PageRecommendation,
  DashboardData,
  CallToActionData,
  SearchResultsData,
} from './UIComponent';

// Intent Detection
export {
  IntentResult,
  IntentType,
  Entity,
} from './Intent';

// Content Generation
export {
  MotivationalContent,
  CallToAction,
  ImpactBreakdown,
  Achievement,
} from './Content';

// Analytics
export {
  Interaction,
  UserAnalytics,
  PageVisit,
} from './Analytics';
