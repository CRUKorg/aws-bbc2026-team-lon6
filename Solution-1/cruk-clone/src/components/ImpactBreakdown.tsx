import React from 'react';
import { ImpactItem } from '../services/api';
import './ImpactBreakdown.css';

interface ImpactBreakdownProps {
  items: ImpactItem[];
}

export const ImpactBreakdown: React.FC<ImpactBreakdownProps> = ({ items }) => {
  return (
    <div className="impact-breakdown">
      <h3>Your Impact</h3>
      <div className="impact-items">
        {items.map((item, index) => (
          <div key={index} className="impact-item">
            <div className="impact-icon">{item.icon}</div>
            <div className="impact-details">
              {item.amount && <span className="impact-amount">£{item.amount}</span>}
              {item.month && <span className="impact-month">{item.month}</span>}
              <h4 className="impact-title">{item.description}</h4>
              {item.quantity && (
                <p className="impact-description">
                  Provided supplies for {item.quantity} blood tests and tissue samples
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
