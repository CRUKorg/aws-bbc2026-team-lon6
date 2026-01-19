/**
 * Intent Detection Data Models
 * Represents user intent classification and entity extraction
 */

export type IntentType = 
  | 'personalization' 
  | 'information_seeking' 
  | 'action' 
  | 'unclear'
  | 'profile_update'
  | 'personal_disclosure'
  | 'support_inquiry'
  | 'dashboard';

export interface Entity {
  type: string;
  value: string;
  confidence: number;
}

export interface IntentResult {
  primaryIntent: IntentType;
  confidence: number;
  entities: Entity[];
  suggestedFlow: string;
}
