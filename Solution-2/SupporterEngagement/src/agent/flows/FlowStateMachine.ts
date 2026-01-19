/**
 * Flow State Machine
 * Manages personalization flow states and transitions
 */

import { UserContext, FlowState } from '../../models';
import { logger } from '../../utils/logger';

/**
 * Available flow states
 */
export enum FlowStateType {
  NEW_USER = 'new_user',
  BASIC_INFO = 'basic_info',
  MOTIVATION = 'motivation',
  CALL_TO_ACTION = 'call_to_action',
  DASHBOARD = 'dashboard',
  IDLE = 'idle',
  PAUSED = 'paused',
}

/**
 * State transition event
 */
export interface StateTransitionEvent {
  type: 'user_input' | 'profile_update' | 'pause' | 'resume' | 'complete';
  data?: any;
}

/**
 * State transition result
 */
export interface StateTransitionResult {
  success: boolean;
  newState: FlowStateType;
  message?: string;
  nextPrompt?: string;
  canTransition: boolean;
}

/**
 * State validator function
 */
export type StateValidator = (context: UserContext, flowState: FlowState) => boolean;

/**
 * State guard function
 */
export type StateGuard = (
  fromState: FlowStateType,
  toState: FlowStateType,
  context: UserContext
) => boolean;

/**
 * Flow State Machine
 * Manages the personalization flow through different states
 */
export class FlowStateMachine {
  private currentState: FlowStateType;
  private flowState: FlowState;
  private context: UserContext;
  private stateValidators: Map<FlowStateType, StateValidator>;
  private stateGuards: Map<string, StateGuard>;
  private pausedState?: FlowStateType;

  constructor(context: UserContext, initialState?: FlowStateType) {
    this.context = context;
    this.currentState = initialState || this.determineInitialState(context);
    this.flowState = {
      flowType: this.currentState,
      currentStep: 'start',
      completedSteps: [],
      collectedData: {},
      canResume: false,
    };
    this.stateValidators = new Map();
    this.stateGuards = new Map();
    
    this.initializeValidators();
    this.initializeGuards();
    
    logger.info('FlowStateMachine initialized', {
      initialState: this.currentState,
      userId: context.userId,
    });
  }

  /**
   * Get current state
   */
  getCurrentState(): FlowStateType {
    return this.currentState;
  }

  /**
   * Get flow state
   */
  getFlowState(): FlowState {
    return this.flowState;
  }

  /**
   * Update context
   */
  updateContext(context: UserContext): void {
    this.context = context;
  }

  /**
   * Transition to a new state
   */
  async transition(
    event: StateTransitionEvent,
    targetState?: FlowStateType
  ): Promise<StateTransitionResult> {
    logger.info('Attempting state transition', {
      currentState: this.currentState,
      targetState,
      eventType: event.type,
    });

    // Handle pause event
    if (event.type === 'pause') {
      return this.pauseFlow();
    }

    // Handle resume event
    if (event.type === 'resume') {
      return this.resumeFlow();
    }

    // Determine target state if not provided
    const nextState = targetState || this.determineNextState(event);

    // Validate transition
    if (!this.canTransition(this.currentState, nextState)) {
      logger.warn('State transition blocked by guard', {
        from: this.currentState,
        to: nextState,
      });
      return {
        success: false,
        newState: this.currentState,
        message: 'Transition not allowed',
        canTransition: false,
      };
    }

    // Validate target state
    if (!this.validateState(nextState)) {
      logger.warn('Target state validation failed', {
        state: nextState,
      });
      return {
        success: false,
        newState: this.currentState,
        message: 'Target state requirements not met',
        canTransition: false,
      };
    }

    // Perform transition
    const previousState = this.currentState;
    this.currentState = nextState;
    this.flowState.flowType = nextState;
    this.flowState.completedSteps.push(previousState);
    this.flowState.canResume = true;

    // Update current step based on new state
    this.flowState.currentStep = this.getInitialStepForState(nextState);

    logger.info('State transition successful', {
      from: previousState,
      to: nextState,
    });

    return {
      success: true,
      newState: nextState,
      nextPrompt: this.getPromptForState(nextState),
      canTransition: true,
    };
  }

  /**
   * Pause the current flow
   */
  pauseFlow(): StateTransitionResult {
    if (this.currentState === FlowStateType.PAUSED) {
      return {
        success: false,
        newState: this.currentState,
        message: 'Flow is already paused',
        canTransition: false,
      };
    }

    this.pausedState = this.currentState;
    this.currentState = FlowStateType.PAUSED;
    this.flowState.flowType = FlowStateType.PAUSED;
    this.flowState.canResume = true;

    logger.info('Flow paused', {
      pausedState: this.pausedState,
    });

    return {
      success: true,
      newState: FlowStateType.PAUSED,
      message: 'Flow paused. You can resume anytime.',
      canTransition: true,
    };
  }

  /**
   * Resume a paused flow
   */
  resumeFlow(): StateTransitionResult {
    if (this.currentState !== FlowStateType.PAUSED || !this.pausedState) {
      return {
        success: false,
        newState: this.currentState,
        message: 'No paused flow to resume',
        canTransition: false,
      };
    }

    const resumeState = this.pausedState;
    this.currentState = resumeState;
    this.flowState.flowType = resumeState;
    this.pausedState = undefined;

    logger.info('Flow resumed', {
      resumedState: resumeState,
    });

    return {
      success: true,
      newState: resumeState,
      message: 'Flow resumed',
      nextPrompt: this.getPromptForState(resumeState),
      canTransition: true,
    };
  }

  /**
   * Check if transition is allowed
   */
  private canTransition(from: FlowStateType, to: FlowStateType): boolean {
    const guardKey = `${from}->${to}`;
    const guard = this.stateGuards.get(guardKey);
    
    if (guard) {
      return guard(from, to, this.context);
    }

    // Default: allow transition
    return true;
  }

  /**
   * Validate state requirements
   */
  private validateState(state: FlowStateType): boolean {
    const validator = this.stateValidators.get(state);
    
    if (validator) {
      return validator(this.context, this.flowState);
    }

    // Default: state is valid
    return true;
  }

  /**
   * Determine initial state based on user context
   */
  private determineInitialState(context: UserContext): FlowStateType {
    const profile = context.profile;

    // If user has engagement history or donations, show dashboard
    if (context.engagementHistory.length > 0 || profile.donationCount > 0) {
      return FlowStateType.DASHBOARD;
    }

    // If user has basic information but no engagement, start basic info flow
    if (profile.name && profile.email) {
      return FlowStateType.BASIC_INFO;
    }

    // New user with no context
    return FlowStateType.NEW_USER;
  }

  /**
   * Determine next state based on event
   */
  private determineNextState(event: StateTransitionEvent): FlowStateType {
    switch (this.currentState) {
      case FlowStateType.NEW_USER:
        // After new user intro, move to basic info
        return FlowStateType.BASIC_INFO;

      case FlowStateType.BASIC_INFO:
        // After collecting basic info, move to motivation
        return FlowStateType.MOTIVATION;

      case FlowStateType.MOTIVATION:
        // After motivation, move to call to action
        return FlowStateType.CALL_TO_ACTION;

      case FlowStateType.CALL_TO_ACTION:
        // After CTA, move to dashboard
        return FlowStateType.DASHBOARD;

      case FlowStateType.DASHBOARD:
        // Dashboard is terminal state, stay there
        return FlowStateType.DASHBOARD;

      case FlowStateType.IDLE:
        // From idle, determine based on context
        return this.determineInitialState(this.context);

      default:
        return this.currentState;
    }
  }

  /**
   * Get initial step for a state
   */
  private getInitialStepForState(state: FlowStateType): string {
    switch (state) {
      case FlowStateType.NEW_USER:
        return 'welcome';
      case FlowStateType.BASIC_INFO:
        return 'collect_info';
      case FlowStateType.MOTIVATION:
        return 'show_achievements';
      case FlowStateType.CALL_TO_ACTION:
        return 'present_cta';
      case FlowStateType.DASHBOARD:
        return 'display_dashboard';
      default:
        return 'start';
    }
  }

  /**
   * Get prompt for a state
   */
  private getPromptForState(state: FlowStateType): string {
    const userName = this.context.profile.name || 'there';

    switch (state) {
      case FlowStateType.NEW_USER:
        return `Welcome to Cancer Research UK! Are you new to CRUK? What do you know about us? Have you supported us in any way before?`;

      case FlowStateType.BASIC_INFO:
        return `Thanks for sharing, ${userName}! To personalize your experience, could you tell me a bit more about yourself? What brings you to Cancer Research UK today?`;

      case FlowStateType.MOTIVATION:
        return `Let me share some of the incredible impact Cancer Research UK is making in the fight against cancer...`;

      case FlowStateType.CALL_TO_ACTION:
        return `${userName}, there are many ways you can support our mission. Would you like to explore donation options, volunteering opportunities, or fundraising events?`;

      case FlowStateType.DASHBOARD:
        return `Welcome back, ${userName}! Here's your personalized dashboard showing your impact and engagement with Cancer Research UK.`;

      case FlowStateType.PAUSED:
        return `Your personalization flow is paused. Let me know when you'd like to continue!`;

      default:
        return `How can I help you today?`;
    }
  }

  /**
   * Initialize state validators
   */
  private initializeValidators(): void {
    // NEW_USER state: no specific requirements
    this.stateValidators.set(FlowStateType.NEW_USER, () => true);

    // BASIC_INFO state: no specific requirements
    this.stateValidators.set(FlowStateType.BASIC_INFO, () => true);

    // MOTIVATION state: should have completed basic info step
    this.stateValidators.set(FlowStateType.MOTIVATION, (context, flowState) => {
      // Allow if basic_info was completed, or if user has profile data
      return flowState.completedSteps.includes(FlowStateType.BASIC_INFO) ||
             !!context.profile.name || 
             !!context.profile.email;
    });

    // CALL_TO_ACTION state: should have completed motivation
    this.stateValidators.set(FlowStateType.CALL_TO_ACTION, (context, flowState) => {
      return flowState.completedSteps.includes(FlowStateType.MOTIVATION) ||
             flowState.completedSteps.includes(FlowStateType.BASIC_INFO);
    });

    // DASHBOARD state: should have some engagement or profile data
    this.stateValidators.set(FlowStateType.DASHBOARD, (context) => {
      return context.engagementHistory.length > 0 ||
             context.profile.donationCount > 0 ||
             !!context.profile.name;
    });
  }

  /**
   * Initialize state guards
   */
  private initializeGuards(): void {
    // Prevent going back to NEW_USER from other states
    this.stateGuards.set(`${FlowStateType.BASIC_INFO}->${FlowStateType.NEW_USER}`, () => false);
    this.stateGuards.set(`${FlowStateType.MOTIVATION}->${FlowStateType.NEW_USER}`, () => false);
    this.stateGuards.set(`${FlowStateType.CALL_TO_ACTION}->${FlowStateType.NEW_USER}`, () => false);
    this.stateGuards.set(`${FlowStateType.DASHBOARD}->${FlowStateType.NEW_USER}`, () => false);

    // Allow pausing from any state except PAUSED
    Object.values(FlowStateType).forEach(state => {
      if (state !== FlowStateType.PAUSED) {
        this.stateGuards.set(`${state}->${FlowStateType.PAUSED}`, () => true);
      }
    });

    // Allow resuming from PAUSED to any state
    Object.values(FlowStateType).forEach(state => {
      if (state !== FlowStateType.PAUSED) {
        this.stateGuards.set(`${FlowStateType.PAUSED}->${state}`, () => true);
      }
    });
  }

  /**
   * Mark current step as complete
   */
  markStepComplete(step: string): void {
    if (!this.flowState.completedSteps.includes(step)) {
      this.flowState.completedSteps.push(step);
    }
    logger.debug('Step marked complete', { step, state: this.currentState });
  }

  /**
   * Store collected data
   */
  storeCollectedData(key: string, value: any): void {
    this.flowState.collectedData[key] = value;
    logger.debug('Data collected', { key, state: this.currentState });
  }

  /**
   * Get collected data
   */
  getCollectedData(key: string): any {
    return this.flowState.collectedData[key];
  }

  /**
   * Check if flow can be resumed
   */
  canResumeFlow(): boolean {
    return this.flowState.canResume;
  }

  /**
   * Reset flow to initial state
   */
  reset(): void {
    this.currentState = this.determineInitialState(this.context);
    this.flowState = {
      flowType: this.currentState,
      currentStep: 'start',
      completedSteps: [],
      collectedData: {},
      canResume: false,
    };
    this.pausedState = undefined;
    
    logger.info('Flow state machine reset', {
      newState: this.currentState,
      userId: this.context.userId,
    });
  }
}

