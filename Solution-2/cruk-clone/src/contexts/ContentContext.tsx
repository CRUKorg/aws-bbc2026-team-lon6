import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ContentContextType {
  content: Record<string, string>;
  updateContent: (key: string, value: string) => void;
  generateAllContent: () => void;
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

  const updateContent = (key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const generateAllContent = () => {
    // Mock AI generation - replace all content with "AI Generated" prefix
    setContent(prev => {
      const newContent: Record<string, string> = {};
      Object.keys(prev).forEach(key => {
        newContent[key] = `[AI Generated] ${prev[key]}`;
      });
      return newContent;
    });
  };

  return (
    <ContentContext.Provider value={{ content, updateContent, generateAllContent }}>
      {children}
    </ContentContext.Provider>
  );
};
