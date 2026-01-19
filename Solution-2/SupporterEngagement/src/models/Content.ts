/**
 * Content Generation Data Models
 * Represents generated content for personalization
 */

export interface Achievement {
  title: string;
  description: string;
  date: Date;
  impactMetric?: string;
}

export interface MotivationalContent {
  headline: string;
  body: string;
  achievements: Achievement[];
  personalizedMessage: string;
}

export interface CallToAction {
  type: 'donate' | 'volunteer' | 'fundraise' | 'campaign';
  title: string;
  description: string;
  suggestedAmounts?: number[];
  actionUrl: string;
}

export interface ImpactBreakdown {
  totalImpact: string;
  items: Array<{
    category: string;
    description: string;
    quantity: number;
    unit: string;
  }>;
}
