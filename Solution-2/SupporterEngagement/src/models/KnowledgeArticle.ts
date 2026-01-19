/**
 * Knowledge Article Data Model
 * Represents CRUK knowledge base articles
 */

export type ReadingLevel = 'basic' | 'intermediate' | 'advanced';

export interface KnowledgeArticle {
  articleId: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  
  // Categorization
  category: string;
  tags: string[];
  cancerTypes: string[];
  
  // Metadata
  publishedDate: Date;
  lastUpdated: Date;
  author: string;
  
  // Accessibility
  readingLevel: ReadingLevel;
  availableLanguages: string[];
}

export interface SearchFilters {
  category?: string;
  tags?: string[];
  cancerTypes?: string[];
  readingLevel?: ReadingLevel;
  language?: string;
}
