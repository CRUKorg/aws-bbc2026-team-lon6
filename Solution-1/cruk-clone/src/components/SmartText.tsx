import React, { useEffect, createElement } from 'react';
import { useContent } from '../contexts/ContentContext';

interface SmartTextProps {
  id: string;
  defaultText: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
}

export const SmartText: React.FC<SmartTextProps> = ({ 
  id, 
  defaultText, 
  as = 'span',
  className 
}) => {
  const { content, updateContent } = useContent();

  useEffect(() => {
    if (!content[id]) {
      updateContent(id, defaultText);
    }
  }, [id, defaultText, content, updateContent]);

  return createElement(as, { className }, content[id] || defaultText);
};
