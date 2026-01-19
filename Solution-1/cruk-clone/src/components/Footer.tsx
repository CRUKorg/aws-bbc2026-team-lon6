import React from 'react';
import { SmartText } from './SmartText';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <SmartText id="footer-about-title" defaultText="About cancer" as="h3" />
            <ul className="footer-links">
              <li><SmartText id="footer-link-1" defaultText="Cancer types" className="footer-link" /></li>
              <li><SmartText id="footer-link-2" defaultText="Symptoms" className="footer-link" /></li>
              <li><SmartText id="footer-link-3" defaultText="Diagnosis" className="footer-link" /></li>
              <li><SmartText id="footer-link-4" defaultText="Treatment" className="footer-link" /></li>
            </ul>
          </div>
          <div className="footer-section">
            <SmartText id="footer-involved-title" defaultText="Get involved" as="h3" />
            <ul className="footer-links">
              <li><SmartText id="footer-link-5" defaultText="Donate" className="footer-link" /></li>
              <li><SmartText id="footer-link-6" defaultText="Fundraise" className="footer-link" /></li>
              <li><SmartText id="footer-link-7" defaultText="Volunteer" className="footer-link" /></li>
              <li><SmartText id="footer-link-8" defaultText="Campaign" className="footer-link" /></li>
            </ul>
          </div>
          <div className="footer-section">
            <SmartText id="footer-research-title" defaultText="Our research" as="h3" />
            <ul className="footer-links">
              <li><SmartText id="footer-link-9" defaultText="Research areas" className="footer-link" /></li>
              <li><SmartText id="footer-link-10" defaultText="Clinical trials" className="footer-link" /></li>
              <li><SmartText id="footer-link-11" defaultText="Our scientists" className="footer-link" /></li>
            </ul>
          </div>
          <div className="footer-section">
            <SmartText id="footer-about-us-title" defaultText="About us" as="h3" />
            <ul className="footer-links">
              <li><SmartText id="footer-link-12" defaultText="Who we are" className="footer-link" /></li>
              <li><SmartText id="footer-link-13" defaultText="Contact us" className="footer-link" /></li>
              <li><SmartText id="footer-link-14" defaultText="Press office" className="footer-link" /></li>
            </ul>
          </div>
        </div>
        <div className="footer-social">
          <a href="https://www.facebook.com/cancerresearchuk" className="social-icon" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
            <img src="/images/facebook.svg" alt="Facebook" />
          </a>
          <a href="https://twitter.com/CR_UK" className="social-icon" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
            <img src="/images/twitter.svg" alt="Twitter" />
          </a>
          <a href="https://www.instagram.com/cr_uk" className="social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
            <img src="/images/instagram.svg" alt="Instagram" />
          </a>
          <a href="https://www.youtube.com/user/cancerresearchuk" className="social-icon" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
            <img src="/images/youtube.svg" alt="YouTube" />
          </a>
        </div>
        <div className="footer-bottom">
          <SmartText 
            id="footer-copyright" 
            defaultText="© Cancer Research UK. Registered charity in England and Wales (1089464)" 
            as="p" 
          />
        </div>
      </div>
    </footer>
  );
};
