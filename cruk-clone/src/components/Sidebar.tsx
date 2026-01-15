import React, { useState } from 'react';
import { useContent } from '../contexts/ContentContext';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { generateAllContent, suggestedLinks, donationWidget, currentUser, isLoading, error } = useContent();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleGenerate = () => {
    generateAllContent();
  };

  const handleReset = () => {
    window.location.reload();
  };

  const handleDonate = () => {
    if (donationWidget) {
      window.open(donationWidget.actionUrl, '_blank');
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">AI Personalization</h2>
        <p className="sidebar-description">
          Click "Generate Content" to get personalized recommendations from our AI agent.
        </p>
      </div>
      
      <div className="sidebar-actions">
        <button 
          className="btn-generate" 
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Generate Content'}
        </button>
        <button className="btn-reset" onClick={handleReset}>
          Reset to Original
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '10px', 
          background: '#fee', 
          border: '1px solid #fcc',
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px',
          color: '#c00'
        }}>
          Error: {error}
        </div>
      )}

      {currentUser && (
        <div style={{ 
          padding: '10px', 
          background: '#e8f5e9', 
          border: '1px solid #4caf50',
          borderRadius: '4px',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          <strong>Current User:</strong> {currentUser}
        </div>
      )}

      {donationWidget && (
        <div className="donation-widget">
          <h3>{donationWidget.title}</h3>
          <p className="donation-description">{donationWidget.description}</p>
          
          <div className="donation-amounts">
            {donationWidget.suggestedAmounts.map((amount) => (
              <button
                key={amount}
                className={`amount-button ${selectedAmount === amount ? 'selected' : ''}`}
                onClick={() => setSelectedAmount(amount)}
              >
                £{amount}
              </button>
            ))}
          </div>
          
          <button 
            className="btn-donate" 
            onClick={handleDonate}
            disabled={!selectedAmount}
          >
            {selectedAmount ? `Donate £${selectedAmount}` : 'Select Amount'}
          </button>
        </div>
      )}

      {suggestedLinks.length > 0 && (
        <div className="suggested-links">
          <h3>Suggested Links</h3>
          {suggestedLinks.map((link, index) => (
            <div key={index} className="suggested-link-item">
              <a 
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="suggested-link-title"
              >
                {link.title}
              </a>
              <p className="suggested-link-description">{link.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
