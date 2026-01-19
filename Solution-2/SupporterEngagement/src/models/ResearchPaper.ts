/**
 * Research Paper Data Model
 * Represents CRUK-funded research papers
 */

export interface ResearchPaper {
  paperId: string;
  title: string;
  authors: string[];
  journal: string;
  publicationDate: Date;
  abstract: string;
  url: string;
  
  // Categorization
  tags: string[];
  cancerTypes: string[];
  researchArea: string;
  
  // Impact metrics
  citations: number;
  impactFactor?: number;
  isFeatured: boolean;
  
  // CRUK specific
  fundedByCRUK: boolean;
  fundingAmount?: number;
}
