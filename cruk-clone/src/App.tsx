import React from 'react';
import { ContentProvider } from './contexts/ContentContext';
import { Header } from './components/Header';
import { HeroCard } from './components/HeroCard';
import { Footer } from './components/Footer';
import { Sidebar } from './components/Sidebar';
import { SmartText } from './components/SmartText';
import './App.css';

function App() {
  return (
    <ContentProvider>
      <div className="app">
        <Header />
        
        <main>
          <section className="hero-section">
            <div className="container">
              <div className="hero-grid">
                <HeroCard
                  id="screening-checker"
                  title="Stand Up To Cancer screening checker"
                  description="Easily find out if you're eligible for any NHS and PHA cancer screening programmes. Launched by Stand Up To Cancer, this nationwide screening checker also gives helpful advice on screening processes."
                  buttonText="Check if you're eligible"
                  imageUrl="/images/screening-checker.jpg"
                />
                <HeroCard
                  id="about-cancer"
                  title="About Cancer"
                  description="If you've been diagnosed with cancer, or know someone who has, we provide practical information on everything from symptoms and screening, to coping after treatment."
                  buttonText="Get information about cancer"
                  imageUrl="/images/about-cancer.png"
                />
                <HeroCard
                  id="cancer-chat"
                  title="Cancer Chat"
                  description="It's a worrying time for many people and we want to be there for you whenever - and wherever - you need us. Cancer Chat is our fully moderated forum where you can talk to others affected by cancer, share experiences, and get support."
                  buttonText="Visit the Cancer Chat forum"
                  imageUrl="/images/cancer-chat.png"
                />
              </div>
            </div>
          </section>

          <section className="banner">
            <div className="container">
              <SmartText 
                id="banner-title" 
                defaultText="Get involved and make a difference" 
                as="h2" 
                className="banner-title" 
              />
              <SmartText 
                id="banner-text" 
                defaultText="Cancer is relentless. But so are we. Whether you fundraise, pledge to leave a gift in your will or donate. Every part supports life-saving research. Play your part and together we will beat cancer." 
                as="p" 
                className="banner-text" 
              />
              <button className="banner-button">
                <SmartText id="banner-button" defaultText="Get involved now" />
              </button>
            </div>
          </section>

          <section className="hero-section">
            <div className="container">
              <SmartText 
                id="events-title" 
                defaultText="Upcoming Events" 
                as="h2" 
                className="section-title" 
              />
              <div className="hero-grid">
                <HeroCard
                  id="big-hike"
                  title="Take on a Big Hike in 2026"
                  description="Choose a 10k, half marathon or full marathon at one of seven stunning locations across the UK. Enjoy a fully supported walk along scenic routes and beautiful countryside views."
                  buttonText="Sign up"
                  imageUrl="/images/big-hike.png"
                />
                <HeroCard
                  id="race-for-life"
                  title="Race for Life 2026 - 30% off entry"
                  description="Enter Cancer Research UK's Race for Life and raise money for life-saving cancer research. Go All In against cancer in 2026. Use code RFL26NY and join us at your local event."
                  buttonText="Sign up now"
                  imageUrl="/images/race-for-life.png"
                />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
      <Sidebar />
    </ContentProvider>
  );
}

export default App;
