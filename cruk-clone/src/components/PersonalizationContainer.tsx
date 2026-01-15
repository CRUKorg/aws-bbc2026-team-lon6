import React, { useEffect, useState } from 'react';
import apiClient, { DashboardData } from '../services/api';
import { CampaignProgress } from './CampaignProgress';
import { DonationWidget } from './DonationWidget';
import { ImpactBreakdown } from './ImpactBreakdown';
import { RecommendedPages } from './RecommendedPages';
import { FeaturedResearch } from './FeaturedResearch';
import './PersonalizationContainer.css';

interface PersonalizationContainerProps {
  userId?: string;
}

export const PersonalizationContainer: React.FC<PersonalizationContainerProps> = ({ userId }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getDashboardData(userId);
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Unable to load your personalized dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  if (loading) {
    return (
      <div className="personalization-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your personalized experience...</p>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="personalization-container error">
        <p>{error || 'Unable to load dashboard'}</p>
      </div>
    );
  }

  return (
    <div className="personalization-container">
      <div className="dashboard-header">
        <div className="user-avatar">
          <img 
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dashboardData.userName)}&background=E40087&color=fff`} 
            alt={dashboardData.userName}
          />
        </div>
        <div className="user-greeting">
          <h2>Hi, {dashboardData.userName}!</h2>
          <p className="donation-total">£{dashboardData.totalDonations} donated in total</p>
        </div>
      </div>

      {dashboardData.currentCampaign && (
        <CampaignProgress campaign={dashboardData.currentCampaign} />
      )}

      <DonationWidget 
        totalDonations={dashboardData.totalDonations}
        donationCount={dashboardData.donationCount}
      />

      {dashboardData.impactBreakdown && dashboardData.impactBreakdown.length > 0 && (
        <ImpactBreakdown items={dashboardData.impactBreakdown} />
      )}

      {dashboardData.recommendedPages && dashboardData.recommendedPages.length > 0 && (
        <RecommendedPages pages={dashboardData.recommendedPages} />
      )}

      {dashboardData.featuredResearch && dashboardData.featuredResearch.length > 0 && (
        <FeaturedResearch papers={dashboardData.featuredResearch} />
      )}
    </div>
  );
};
