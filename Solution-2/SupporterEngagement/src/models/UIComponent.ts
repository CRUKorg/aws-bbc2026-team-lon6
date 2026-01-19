/**
 * UI Component Data Models
 * Represents UI components and dashboard data structures
 */

export type UIComponentType = 
  | 'dashboard' 
  | 'search_results' 
  | 'call_to_action' 
  | 'info_card' 
  | 'donation_widget'
  | 'missing_data_prompt'
  | 'search_bar';

export interface LayoutConfig {
  width?: string;
  height?: string;
  position?: 'left' | 'right' | 'center';
  order?: number;
}

export interface UIComponent {
  type: UIComponentType;
  data: Record<string, any>;
  layout?: LayoutConfig;
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

export interface DashboardData {
  userName: string;
  totalDonations: number;
  currentCampaign?: CampaignProgress;
  impactBreakdown: ImpactItem[];
  recommendedPages: PageRecommendation[];
  featuredResearch: import('./ResearchPaper').ResearchPaper[];
}

export interface CallToActionData {
  type: 'donate' | 'volunteer' | 'fundraise' | 'campaign';
  title: string;
  description: string;
  suggestedAmounts?: number[];
  actionUrl: string;
}

export interface SearchResultsData {
  query: string;
  results: Array<{
    title: string;
    summary: string;
    url: string;
    relevanceScore: number;
  }>;
  totalResults: number;
}
