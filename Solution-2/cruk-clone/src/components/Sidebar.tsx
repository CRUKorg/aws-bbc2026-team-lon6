import React from 'react';
import { useContent } from '../contexts/ContentContext';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const { content, generateAllContent } = useContent();

  const handleGenerate = () => {
    generateAllContent();
  };

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">AI Content Generator</h2>
        <p className="sidebar-description">
          Click "Generate Content" to simulate AI-powered text replacement across all SmartText components.
        </p>
      </div>
      
      <div className="sidebar-actions">
        <button className="btn-generate" onClick={handleGenerate}>
          Generate Content
        </button>
        <button className="btn-reset" onClick={handleReset}>
          Reset to Original
        </button>
      </div>

      <div className="content-preview">
        <h3>Active Content ({Object.keys(content).length} items)</h3>
        {Object.entries(content).slice(0, 5).map(([key, value]) => (
          <div key={key} className="content-item">
            <span className="content-item-id">{key}</span>
            <span className="content-item-text">
              {value.length > 50 ? `${value.substring(0, 50)}...` : value}
            </span>
          </div>
        ))}
        {Object.keys(content).length > 5 && (
          <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            ...and {Object.keys(content).length - 5} more
          </p>
        )}
      </div>
    </div>
  );
};
