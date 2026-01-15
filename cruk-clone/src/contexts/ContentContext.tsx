import React, { createContext, useContext, useState, ReactNode } from 'react';

// API Configuration
const API_URL = 'https://y55nn7iac9.execute-api.us-west-2.amazonaws.com/prod/';

// Seeded users from the database
const SEEDED_USERS = [
  'mariarodriguez',
  'aisha_khan',
  'jamal_brown',
  'jing_wei',
  'nathan_clark',
  'oluwaseyi_ade',
  'emma_jones',
  'peter_ivanov',
  'sophia_patel',
  'abdul_rahman'
];

interface SuggestedLink {
  title: string;
  url: string;
  description: string;
}

interface DonationWidget {
  title: string;
  description: string;
  suggestedAmounts: number[];
  actionUrl: string;
}

interface ContentContextType {
  content: Record<string, string>;
  updateContent: (key: string, value: string) => void;
  generateAllContent: () => void;
  suggestedLinks: SuggestedLink[];
  donationWidget: DonationWidget | null;
  currentUser: string | null;
  isLoading: boolean;
  error: string | null;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within ContentProvider');
  }
  return context;
};

interface ContentProviderProps {
  children: ReactNode;
}

export const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const [content, setContent] = useState<Record<string, string>>({});
  const [suggestedLinks, setSuggestedLinks] = useState<SuggestedLink[]>([]);
  const [donationWidget, setDonationWidget] = useState<DonationWidget | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateContent = (key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const generateAllContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Randomly select a seeded user
      const randomUser = SEEDED_USERS[Math.floor(Math.random() * SEEDED_USERS.length)];
      setCurrentUser(randomUser);
      
      // Call the personalization agent API
      const response = await fetch(`${API_URL}agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: randomUser,
          input: {
            text: 'Show me personalized content and recommendations',
            timestamp: new Date().toISOString()
          },
          sessionId: `session-${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      
      // Update suggested links if available
      if (data.suggestedLinks && Array.isArray(data.suggestedLinks)) {
        setSuggestedLinks(data.suggestedLinks);
      }
      
      // Extract donation widget from call to action
      if (data.uiComponents && data.uiComponents.length > 0) {
        const ctaComponent = data.uiComponents.find((c: any) => c.type === 'call_to_action');
        if (ctaComponent && ctaComponent.data) {
          setDonationWidget({
            title: ctaComponent.data.title || 'Support Cancer Research',
            description: ctaComponent.data.description || 'Your donation helps fund vital cancer research',
            suggestedAmounts: ctaComponent.data.suggestedAmounts || [10, 25, 50, 100],
            actionUrl: ctaComponent.data.actionUrl || 'https://www.cancerresearchuk.org/donate'
          });
        }
      }
      
      // Update content with AI-generated text
      if (data.text) {
        setContent(prev => {
          const newContent: Record<string, string> = { ...prev };
          
          // Update banner content with personalized message
          newContent['banner-title'] = `Welcome ${randomUser}!`;
          newContent['banner-text'] = data.text;
          newContent['banner-button'] = 'Explore Your Recommendations';
          
          // Update other content sections
          if (data.uiComponents && data.uiComponents.length > 0) {
            const component = data.uiComponents[0];
            
            if (component.type === 'dashboard' && component.data) {
              newContent['events-title'] = `Personalized for ${component.data.userName || randomUser}`;
            }
            
            if (component.type === 'call_to_action' && component.data) {
              newContent['banner-title'] = component.data.title;
              newContent['banner-text'] = component.data.description;
            }
          }
          
          return newContent;
        });
      }
      
    } catch (err) {
      console.error('Error generating content:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
      
      // Fallback to mock generation
      setContent(prev => {
        const newContent: Record<string, string> = {};
        Object.keys(prev).forEach(key => {
          newContent[key] = `[AI Generated] ${prev[key]}`;
        });
        return newContent;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ContentContext.Provider value={{ 
      content, 
      updateContent, 
      generateAllContent,
      suggestedLinks,
      donationWidget,
      currentUser,
      isLoading,
      error
    }}>
      {children}
    </ContentContext.Provider>
  );
};
