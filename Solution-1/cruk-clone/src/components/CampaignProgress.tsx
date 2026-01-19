import React from 'react';
import { CampaignProgress as CampaignProgressType } from '../services/api';
import './CampaignProgress.css';

interface CampaignProgressProps {
  campaign: CampaignProgressType;
}

export const CampaignProgress: React.FC<CampaignProgressProps> = ({ campaign }) => {
  return (
    <div className="campaign-progress">
      <h3>Funding Life-Saving Research</h3>
      <div className="progress-info">
        <span className="progress-amount">£{campaign.currentAmount} today</span>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${Math.min(campaign.percentComplete, 100)}%` }}
          ></div>
        </div>
        <span className="progress-target">Target: £{campaign.targetAmount}</span>
      </div>
    </div>
  );
};
