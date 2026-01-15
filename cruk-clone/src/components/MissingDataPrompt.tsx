import React, { useState, useEffect } from 'react';
import apiClient, { UserProfile } from '../services/api';
import { SearchBar } from './SearchBar';
import './MissingDataPrompt.css';

interface MissingDataPromptProps {
  userId?: string;
  onDataSubmitted?: () => void;
}

export const MissingDataPrompt: React.FC<MissingDataPromptProps> = ({ 
  userId, 
  onDataSubmitted 
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAge, setSelectedAge] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userProfile = await apiClient.getUserProfile(userId);
        setProfile(userProfile);
        
        // Check if age or gender is missing
        const missingData = !userProfile.age || !userProfile.gender;
        setShowPrompt(missingData);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;

    setSubmitting(true);

    try {
      const updates: Partial<UserProfile> = {};
      
      if (selectedAge && !profile.age) {
        // Convert age range to approximate age
        const ageMap: Record<string, number> = {
          '<50': 40,
          '50-64': 57,
          '65+': 70,
        };
        updates.age = ageMap[selectedAge] || undefined;
      }
      
      if (selectedGender && !profile.gender) {
        updates.gender = selectedGender;
      }

      await apiClient.updateUserProfile(updates, userId);
      
      setShowPrompt(false);
      
      if (onDataSubmitted) {
        onDataSubmitted();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Unable to update your information. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
  };

  if (loading || !showPrompt || !profile) {
    return null;
  }

  const missingAge = !profile.age;
  const missingGender = !profile.gender;

  return (
    <div className="missing-data-prompt">
      <div className="missing-data-content">
        <h3>Personalise your experience (optional)</h3>
        
        <form onSubmit={handleSubmit} className="missing-data-form">
          {missingAge && (
            <div className="form-group">
              <label>Age</label>
              <p className="form-description">What age range are you in?</p>
              <div className="button-group">
                <button
                  type="button"
                  className={`btn-option ${selectedAge === '<50' ? 'selected' : ''}`}
                  onClick={() => setSelectedAge('<50')}
                >
                  &lt;50
                </button>
                <button
                  type="button"
                  className={`btn-option ${selectedAge === '50-64' ? 'selected' : ''}`}
                  onClick={() => setSelectedAge('50-64')}
                >
                  50-64
                </button>
                <button
                  type="button"
                  className={`btn-option ${selectedAge === '65+' ? 'selected' : ''}`}
                  onClick={() => setSelectedAge('65+')}
                >
                  65+
                </button>
                <button
                  type="button"
                  className={`btn-option ${selectedAge === 'prefer-not' ? 'selected' : ''}`}
                  onClick={() => setSelectedAge('prefer-not')}
                >
                  Prefer not to say
                </button>
              </div>
            </div>
          )}

          {missingGender && (
            <div className="form-group">
              <label>Gender</label>
              <p className="form-description">Which gender do you identify as?</p>
              <div className="button-group">
                <button
                  type="button"
                  className={`btn-option ${selectedGender === 'Man' ? 'selected' : ''}`}
                  onClick={() => setSelectedGender('Man')}
                >
                  Man
                </button>
                <button
                  type="button"
                  className={`btn-option ${selectedGender === 'Woman' ? 'selected' : ''}`}
                  onClick={() => setSelectedGender('Woman')}
                >
                  Woman
                </button>
                <button
                  type="button"
                  className={`btn-option ${selectedGender === 'Non-binary' ? 'selected' : ''}`}
                  onClick={() => setSelectedGender('Non-binary')}
                >
                  Non-binary
                </button>
                <button
                  type="button"
                  className={`btn-option ${selectedGender === 'prefer-not' ? 'selected' : ''}`}
                  onClick={() => setSelectedGender('prefer-not')}
                >
                  Prefer not to say
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-submit"
            disabled={submitting || (!selectedAge && !selectedGender)}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>

          <p className="form-note">
            This will help us provide more relevant information
          </p>
        </form>

        <button 
          type="button" 
          className="btn-skip"
          onClick={handleSkip}
        >
          Skip for now
        </button>
      </div>

      <div className="missing-data-search">
        <SearchBar placeholder="what are you looking for today" />
      </div>

      <div className="related-section">
        <h4>Related</h4>
        <div className="related-links">
          <a href="/early-detection" className="related-link">
            <div className="related-image">
              <img src="/images/about-cancer.png" alt="Early Cancer Detection" />
            </div>
            <span>Early Cancer Detection</span>
          </a>
          <a href="/prevention" className="related-link">
            <div className="related-image">
              <img src="/images/screening-checker.jpg" alt="Cancer Prevention Tips" />
            </div>
            <span>Cancer Prevention Tips</span>
          </a>
          <a href="/support" className="related-link">
            <div className="related-image">
              <img src="/images/cancer-chat.png" alt="Finding Cancer Support Near You" />
            </div>
            <span>Finding Cancer Support Near You</span>
          </a>
        </div>
        <button className="btn-see-all">See all</button>
      </div>
    </div>
  );
};
