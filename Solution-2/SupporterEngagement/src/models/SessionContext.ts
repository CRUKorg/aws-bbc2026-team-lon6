/**
 * Session Context Data Model
 * Represents an active user session with conversation history and state
 */

import { UserProfile } from './UserProfile';
import { UserContext } from './UserContext';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface FlowState {
  flowType: string;
  currentStep: string;
  completedSteps: string[];
  collectedData: Record<string, any>;
  canResume: boolean;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastActivityTime: Date;
  
  // Flow state
  currentFlow: 'personalization' | 'information_seeking' | 'idle';
  flowState: FlowState;
  
  // Conversation history
  messages: Message[];
  
  // Cached data
  cachedProfile?: UserProfile;
  cachedContext?: UserContext;
}
