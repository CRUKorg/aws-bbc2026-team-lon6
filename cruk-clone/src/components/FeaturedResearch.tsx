import React from 'react';
import { ResearchPaper } from '../services/api';
import './FeaturedResearch.css';

interface FeaturedResearchProps {
  papers: ResearchPaper[];
}

export const FeaturedResearch: React.FC<FeaturedResearchProps> = ({ papers }) => {
  return (
    <div className="featured-research">
      <h3>Featured Research</h3>
      <div className="research-grid">
        {papers.map((paper) => (
          <a 
            key={paper.paperId} 
            href={paper.url} 
            className="research-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="research-content">
              <h4>{paper.title}</h4>
              <p className="research-authors">{paper.authors.join(', ')}</p>
              <p className="research-journal">{paper.journal}</p>
              <p className="research-abstract">
                {paper.abstract.length > 150 
                  ? `${paper.abstract.substring(0, 150)}...` 
                  : paper.abstract}
              </p>
              {paper.tags && paper.tags.length > 0 && (
                <div className="research-tags">
                  {paper.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="research-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
