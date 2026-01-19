/**
 * Dashboard Generator
 * Generates personalized dashboard data by aggregating information from MCP servers
 */

import { userProfileMCPServer } from '../../mcp-servers/user-profile/server';
import { transactionMCPServer } from '../../mcp-servers/transaction/server';
import { researchPapersMCPServer } from '../../mcp-servers/research-papers/server';
import { 
  UserContext, 
  DashboardData, 
  CampaignProgress, 
  ImpactItem, 
  PageRecommendation,
  ResearchPaper,
  UIComponent,
} from '../../models';
import { logger } from '../../utils/logger';

/**
 * Dashboard generation result
 */
export interface DashboardResult {
  success: boolean;
  dashboard?: DashboardData;
  uiComponents: UIComponent[];
  message?: string;
  hasMissingData: boolean;
  missingFields: string[];
}

/**
 * Dashboard Generator
 * Aggregates data from multiple MCP servers to create personalized dashboard
 */
export class DashboardGenerator {
  /**
   * Generate complete dashboard for a user
   */
  async generateDashboard(context: UserContext): Promise<DashboardResult> {
    logger.info('Generating dashboard', {
      userId: context.userId,
      userName: context.profile.name,
    });

    try {
      const userName = context.profile.name || 'there';
      const uiComponents: UIComponent[] = [];

      // Check for missing data
      const { hasMissingData, missingFields } = this.checkMissingData(context);

      // Get donation summary from Transaction MCP Server
      const donationSummary = await this.getDonationSummary(context.userId);

      // Get active campaign if exists
      const campaignProgress = await this.getCampaignProgress(context.userId);

      // Calculate impact breakdown
      const impactBreakdown = this.calculateImpactBreakdown(
        donationSummary?.totalAmount || 0
      );

      // Get page recommendations
      const pageRecommendations = await this.getPageRecommendations(context);

      // Get featured research papers
      const featuredResearch = await this.getFeaturedResearch(context);

      // Build dashboard data
      const dashboardData: DashboardData = {
        userName,
        totalDonations: donationSummary?.totalAmount || 0,
        currentCampaign: campaignProgress,
        impactBreakdown,
        recommendedPages: pageRecommendations,
        featuredResearch,
      };

      // Create main dashboard UI component
      uiComponents.push({
        type: 'dashboard',
        data: dashboardData,
      });

      // Add donation widget if user has donation history
      if (donationSummary && donationSummary.totalAmount > 0) {
        uiComponents.push({
          type: 'donation_widget',
          data: {
            totalDonations: donationSummary.totalAmount,
            donationCount: donationSummary.transactionCount,
            suggestedAmounts: this.calculateSuggestedAmounts(donationSummary.suggestedNextAmount),
            lastDonationDate: donationSummary.lastDonationDate,
          },
        });
      }

      logger.info('Dashboard generated successfully', {
        userId: context.userId,
        componentsCount: uiComponents.length,
        hasMissingData,
      });

      return {
        success: true,
        dashboard: dashboardData,
        uiComponents,
        hasMissingData,
        missingFields,
      };
    } catch (error) {
      logger.error('Error generating dashboard', error as Error, {
        userId: context.userId,
      });

      return {
        success: false,
        uiComponents: [],
        message: 'Unable to generate dashboard at this time',
        hasMissingData: false,
        missingFields: [],
      };
    }
  }

  /**
   * Get donation summary from Transaction MCP Server
   */
  private async getDonationSummary(userId: string): Promise<any | null> {
    try {
      const result = await transactionMCPServer.executeTool({
        name: 'get_donation_summary',
        arguments: { userId },
      });

      if (result.isError || !result.content[0]?.resource) {
        logger.warn('No donation summary available', { userId });
        return null;
      }

      return result.content[0].resource;
    } catch (error) {
      logger.error('Error getting donation summary', error as Error, { userId });
      return null;
    }
  }

  /**
   * Get active campaign progress
   */
  private async getCampaignProgress(userId: string): Promise<CampaignProgress | undefined> {
    try {
      // Get engagement history to check for active campaigns
      const result = await userProfileMCPServer.executeTool({
        name: 'get_engagement_history',
        arguments: { userId, limit: 50 },
      });

      if (result.isError || !result.content[0]?.resource) {
        return undefined;
      }

      const historyData = result.content[0].resource as any;
      const engagementHistory = historyData.engagementHistory || [];

      // Find active fundraising campaign
      const activeCampaign = engagementHistory.find(
        (record: any) => record.type === 'fundraise' && record.metadata?.active === true
      );

      if (!activeCampaign) {
        return undefined;
      }

      const currentAmount = activeCampaign.metadata?.currentAmount || 0;
      const targetAmount = activeCampaign.metadata?.targetAmount || 1000;

      return {
        campaignName: activeCampaign.campaignName || 'My Fundraising Campaign',
        currentAmount,
        targetAmount,
        percentComplete: Math.min((currentAmount / targetAmount) * 100, 100),
      };
    } catch (error) {
      logger.error('Error getting campaign progress', error as Error, { userId });
      return undefined;
    }
  }

  /**
   * Calculate impact breakdown based on donation amount
   * Implements Requirement 2.3 and 10.4
   */
  private calculateImpactBreakdown(totalDonations: number): ImpactItem[] {
    const impactItems: ImpactItem[] = [];

    // Calculate impact based on donation tiers
    // These are example calculations - real values would come from CRUK data

    if (totalDonations >= 25) {
      const researchHours = Math.floor(totalDonations / 25);
      impactItems.push({
        description: 'Hours of vital cancer research funded',
        quantity: researchHours,
        icon: 'microscope',
      });
    }

    if (totalDonations >= 50) {
      const screenings = Math.floor(totalDonations / 50);
      impactItems.push({
        description: 'Cancer screening tests supported',
        quantity: screenings,
        icon: 'health',
      });
    }

    if (totalDonations >= 100) {
      const supportSessions = Math.floor(totalDonations / 100);
      impactItems.push({
        description: 'Support sessions for cancer patients',
        quantity: supportSessions,
        icon: 'support',
      });
    }

    if (totalDonations >= 500) {
      impactItems.push({
        description: 'Contributed to breakthrough research',
        quantity: 1,
        icon: 'star',
      });
    }

    // Default message if no donations yet
    if (impactItems.length === 0) {
      impactItems.push({
        description: 'Your first donation will help fund vital cancer research',
        quantity: 0,
        icon: 'heart',
      });
    }

    return impactItems;
  }

  /**
   * Get page recommendations based on user activity
   * Implements Requirement 2.4 and 10.5
   */
  private async getPageRecommendations(context: UserContext): Promise<PageRecommendation[]> {
    const recommendations: PageRecommendation[] = [];

    // Analyze user interests and engagement history
    const interests = context.profile.interests || [];
    const hasResearchInterest = interests.includes('research');
    const hasSupportInterest = interests.includes('support');
    const hasFundraised = context.profile.hasFundraised;
    const hasVolunteered = context.profile.hasVolunteered;

    // Recommend based on interests
    if (hasResearchInterest) {
      recommendations.push({
        title: 'Latest Research Breakthroughs',
        url: 'https://www.cancerresearchuk.org/about-us/cancer-news',
        reason: 'Based on your interest in research',
        thumbnail: 'research-icon',
      });
    }

    if (hasSupportInterest || context.profile.personallyAffected || context.profile.lovedOneAffected) {
      recommendations.push({
        title: 'Support Services',
        url: 'https://www.cancerresearchuk.org/about-cancer/coping',
        reason: 'Support resources for you and your loved ones',
        thumbnail: 'support-icon',
      });
    }

    // Recommend fundraising if not done yet
    if (!hasFundraised) {
      recommendations.push({
        title: 'Start Your Fundraising Journey',
        url: 'https://www.cancerresearchuk.org/get-involved/find-an-event',
        reason: 'Make an even bigger impact',
        thumbnail: 'fundraise-icon',
      });
    }

    // Recommend volunteering if not done yet
    if (!hasVolunteered) {
      recommendations.push({
        title: 'Volunteer Opportunities',
        url: 'https://www.cancerresearchuk.org/get-involved/volunteer',
        reason: 'Give your time to beat cancer',
        thumbnail: 'volunteer-icon',
      });
    }

    // Default recommendations if none specific
    if (recommendations.length === 0) {
      recommendations.push(
        {
          title: 'About Cancer',
          url: 'https://www.cancerresearchuk.org/about-cancer',
          reason: 'Learn about cancer types and treatments',
          thumbnail: 'info-icon',
        },
        {
          title: 'Ways to Give',
          url: 'https://www.cancerresearchuk.org/get-involved/donate',
          reason: 'Explore different ways to support',
          thumbnail: 'donate-icon',
        }
      );
    }

    return recommendations.slice(0, 4); // Limit to 4 recommendations
  }

  /**
   * Get featured research papers relevant to user
   * Implements Requirement 2.5
   */
  private async getFeaturedResearch(context: UserContext): Promise<ResearchPaper[]> {
    try {
      // Get featured papers from Research Papers MCP Server
      const result = await researchPapersMCPServer.executeTool({
        name: 'get_featured_papers',
        arguments: { limit: 3 },
      });

      if (result.isError || !result.content[0]?.resource) {
        logger.warn('No featured research available');
        return [];
      }

      const researchData = result.content[0].resource as any;
      return researchData.papers || [];
    } catch (error) {
      logger.error('Error getting featured research', error as Error);
      return [];
    }
  }

  /**
   * Calculate suggested donation amounts
   * Implements Requirement 10.3
   */
  private calculateSuggestedAmounts(suggestedAmount: number = 25): number[] {
    // Provide 3 options: half, suggested, double
    return [
      Math.round(suggestedAmount * 0.5),
      suggestedAmount,
      Math.round(suggestedAmount * 2),
    ];
  }

  /**
   * Check for missing data in user profile
   * Implements Requirement 11.1
   */
  private checkMissingData(context: UserContext): { 
    hasMissingData: boolean; 
    missingFields: string[] 
  } {
    const missingFields: string[] = [];
    const profile = context.profile;

    // Check essential fields
    if (!profile.name) {
      missingFields.push('name');
    }

    if (!profile.email) {
      missingFields.push('email');
    }

    // Check optional but useful fields
    if (!profile.age) {
      missingFields.push('age');
    }

    if (!profile.gender) {
      missingFields.push('gender');
    }

    if (!profile.location) {
      missingFields.push('location');
    }

    // Check if user has provided any context about their relationship with cancer
    if (!profile.personallyAffected && !profile.lovedOneAffected) {
      missingFields.push('cancer_relationship');
    }

    return {
      hasMissingData: missingFields.length > 0,
      missingFields,
    };
  }

  /**
   * Generate dashboard message based on user context
   */
  generateDashboardMessage(context: UserContext, dashboardData: DashboardData): string {
    const userName = context.profile.name || 'there';
    const totalDonations = dashboardData.totalDonations;

    if (totalDonations === 0) {
      return `Welcome, ${userName}! Thank you for your interest in Cancer Research UK. ` +
             `Explore how you can make a difference in the fight against cancer.`;
    }

    if (totalDonations < 100) {
      return `Welcome back, ${userName}! Thank you for your support. ` +
             `You've donated £${totalDonations.toFixed(2)} to help beat cancer. ` +
             `Every contribution makes a real difference.`;
    }

    if (totalDonations < 500) {
      return `Welcome back, ${userName}! Your generosity is making a real impact. ` +
             `You've donated £${totalDonations.toFixed(2)} to fund vital cancer research. ` +
             `Thank you for being part of our mission.`;
    }

    return `Welcome back, ${userName}! You're an incredible supporter of Cancer Research UK. ` +
           `Your donations of £${totalDonations.toFixed(2)} are helping us make groundbreaking discoveries. ` +
           `Together, we will beat cancer.`;
  }
}

