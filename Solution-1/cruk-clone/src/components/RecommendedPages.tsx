import React from 'react';
import { PageRecommendation } from '../services/api';
import './RecommendedPages.css';

interface RecommendedPagesProps {
  pages: PageRecommendation[];
}

export const RecommendedPages: React.FC<RecommendedPagesProps> = ({ pages }) => {
  return (
    <div className="recommended-pages">
      <h3>Recommended for you:</h3>
      <div className="pages-grid">
        {pages.map((page, index) => (
          <a 
            key={index} 
            href={page.url} 
            className="page-card"
            target="_blank"
            rel="noopener noreferrer"
          >
            {page.thumbnail && (
              <div className="page-thumbnail">
                <img src={page.thumbnail} alt={page.title} />
              </div>
            )}
            <div className="page-content">
              <h4>{page.title}</h4>
              {page.description && <p>{page.description}</p>}
              {page.reason && <span className="page-reason">{page.reason}</span>}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
