import React from 'react';
import { SmartText } from './SmartText';
import './HeroCard.css';

interface HeroCardProps {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  imageUrl?: string;
  imagePlaceholder?: string;
}

export const HeroCard: React.FC<HeroCardProps> = ({ 
  id, 
  title, 
  description, 
  buttonText,
  imageUrl,
  imagePlaceholder 
}) => {
  return (
    <div className="hero-card">
      <div className="hero-card-image">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="card-image" />
        ) : (
          <span className="image-placeholder">{imagePlaceholder}</span>
        )}
      </div>
      <div className="hero-card-content">
        <SmartText 
          id={`${id}-title`} 
          defaultText={title} 
          as="h2" 
          className="hero-card-title" 
        />
        <SmartText 
          id={`${id}-description`} 
          defaultText={description} 
          as="p" 
          className="hero-card-description" 
        />
        <button className="hero-card-button">
          <SmartText id={`${id}-button`} defaultText={buttonText} />
        </button>
      </div>
    </div>
  );
};
