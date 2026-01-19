import React from 'react';
import { SmartText } from './SmartText';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-top">
        <div className="container">
          <nav className="header-nav">
            <SmartText id="nav-about" defaultText="About cancer" className="nav-link" />
            <SmartText id="nav-involved" defaultText="Get involved" className="nav-link" />
            <SmartText id="nav-funding" defaultText="Funding for researchers" className="nav-link" />
            <SmartText id="nav-about-us" defaultText="About us" className="nav-link" />
            <SmartText id="nav-shop" defaultText="Shop" className="nav-link" />
          </nav>
        </div>
      </div>
      <div className="header-main">
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <img 
                src="/images/logo.svg" 
                alt="Cancer Research UK"
                className="logo-image"
              />
            </div>
            <div className="header-actions">
              <button className="btn-search">Search</button>
              <button className="btn-donate">Donate</button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
