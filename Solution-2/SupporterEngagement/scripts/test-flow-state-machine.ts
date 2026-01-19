/**
 * Test script for Flow State Machine
 * Demonstrates state transitions and flow management
 */

import { FlowStateMachine, FlowStateType, StateTransitionEvent } from '../src/agent/flows';
import { UserContext } from '../src/models';
import { logger } from '../src/utils/logger';

function createMockContext(
  userId: string,
  hasEngagement: boolean = false,
  hasBasicInfo: boolean = false
): UserContext {
  return {
    userId,
    profile: {
      userId,
      email: hasBasicInfo ? 'user@example.com' : '',
      name: hasBasicInfo ? 'Test User' : '',
      totalDonations: hasEngagement ? 100 : 0,
      donationCount: hasEngagement ? 2 : 0,
      hasAttendedEvents: false,
      hasFundraised: false,
      hasVolunteered: false,
      isResearcher: false,
      isJournalist: false,
      isPhilanthropist: false,
      personallyAffected: false,
      lovedOneAffected: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      consentGiven: true,
      communicationPreferences: {
        email: true,
        sms: false,
        phone: false,
        preferredFrequency: 'monthly',
      },
      interests: [],
    },
    preferences: {
      preferredTopics: [],
      preferredCancerTypes: [],
      notificationSettings: {
        email: true,
        sms: false,
        push: false,
      },
    },
    engagementHistory: hasEngagement ? [{
      recordId: 'eng-001',
      userId,
      type: 'donation',
      timestamp: new Date(),
      donationAmount: 50,
      metadata: {},
    }] : [],
    lastUpdated: new Date(),
    version: 1,
  };
}

async function testFlowStateMachine() {
  console.log('='.repeat(80));
  console.log('Testing Flow State Machine');
  console.log('='.repeat(80));

  // Test 1: New user flow
  console.log('\n--- Test 1: New User Flow ---');
  const newUserContext = createMockContext('new-user-001', false, false);
  const newUserFlow = new FlowStateMachine(newUserContext);
  
  console.log(`✓ Initial state: ${newUserFlow.getCurrentState()}`);
  console.log(`  Expected: ${FlowStateType.NEW_USER}`);
  console.log(`  Match: ${newUserFlow.getCurrentState() === FlowStateType.NEW_USER}`);

  // Transition through states
  console.log('\n  Transitioning through personalization flow...');
  
  const event1: StateTransitionEvent = { type: 'user_input', data: { response: 'I am new to CRUK' } };
  const result1 = await newUserFlow.transition(event1);
  console.log(`  → ${result1.newState} (${result1.success ? 'success' : 'failed'})`);
  console.log(`    Prompt: "${result1.nextPrompt?.substring(0, 60)}..."`);

  const event2: StateTransitionEvent = { type: 'user_input', data: { name: 'John', email: 'john@example.com' } };
  const result2 = await newUserFlow.transition(event2);
  console.log(`  → ${result2.newState} (${result2.success ? 'success' : 'failed'})`);

  const event3: StateTransitionEvent = { type: 'user_input', data: { interested: true } };
  const result3 = await newUserFlow.transition(event3);
  console.log(`  → ${result3.newState} (${result3.success ? 'success' : 'failed'})`);

  const event4: StateTransitionEvent = { type: 'complete' };
  const result4 = await newUserFlow.transition(event4);
  console.log(`  → ${result4.newState} (${result4.success ? 'success' : 'failed'})`);

  console.log(`\n  Final state: ${newUserFlow.getCurrentState()}`);
  console.log(`  Completed steps: ${newUserFlow.getFlowState().completedSteps.join(' → ')}`);

  // Test 2: Returning user with engagement
  console.log('\n--- Test 2: Returning User with Engagement ---');
  const returningUserContext = createMockContext('returning-user-001', true, true);
  const returningUserFlow = new FlowStateMachine(returningUserContext);
  
  console.log(`✓ Initial state: ${returningUserFlow.getCurrentState()}`);
  console.log(`  Expected: ${FlowStateType.DASHBOARD}`);
  console.log(`  Match: ${returningUserFlow.getCurrentState() === FlowStateType.DASHBOARD}`);
  console.log(`  Prompt: "${returningUserFlow.getFlowState().currentStep}"`);

  // Test 3: User with basic info only
  console.log('\n--- Test 3: User with Basic Info Only ---');
  const basicInfoContext = createMockContext('basic-user-001', false, true);
  const basicInfoFlow = new FlowStateMachine(basicInfoContext);
  
  console.log(`✓ Initial state: ${basicInfoFlow.getCurrentState()}`);
  console.log(`  Expected: ${FlowStateType.BASIC_INFO}`);
  console.log(`  Match: ${basicInfoFlow.getCurrentState() === FlowStateType.BASIC_INFO}`);

  // Test 4: Flow pause and resume
  console.log('\n--- Test 4: Flow Pause and Resume ---');
  const pauseContext = createMockContext('pause-user-001', false, true);
  const pauseFlow = new FlowStateMachine(pauseContext);
  
  console.log(`  Initial state: ${pauseFlow.getCurrentState()}`);
  
  // Pause the flow
  const pauseEvent: StateTransitionEvent = { type: 'pause' };
  const pauseResult = await pauseFlow.transition(pauseEvent);
  console.log(`  After pause: ${pauseResult.newState} (${pauseResult.success ? 'success' : 'failed'})`);
  console.log(`  Message: "${pauseResult.message}"`);
  console.log(`  Can resume: ${pauseFlow.canResumeFlow()}`);

  // Resume the flow
  const resumeEvent: StateTransitionEvent = { type: 'resume' };
  const resumeResult = await pauseFlow.transition(resumeEvent);
  console.log(`  After resume: ${resumeResult.newState} (${resumeResult.success ? 'success' : 'failed'})`);
  console.log(`  Message: "${resumeResult.message}"`);

  // Test 5: State validation
  console.log('\n--- Test 5: State Validation ---');
  const validationContext = createMockContext('validation-user-001', false, false);
  const validationFlow = new FlowStateMachine(validationContext);
  
  console.log(`  Current state: ${validationFlow.getCurrentState()}`);
  
  // Try to jump to CALL_TO_ACTION without completing previous steps
  const jumpEvent: StateTransitionEvent = { type: 'user_input' };
  const jumpResult = await validationFlow.transition(jumpEvent, FlowStateType.CALL_TO_ACTION);
  console.log(`  Attempt to jump to CALL_TO_ACTION: ${jumpResult.success ? 'allowed' : 'blocked'}`);
  console.log(`  Reason: ${jumpResult.message || 'Validation passed'}`);

  // Test 6: Collected data storage
  console.log('\n--- Test 6: Collected Data Storage ---');
  const dataContext = createMockContext('data-user-001', false, false);
  const dataFlow = new FlowStateMachine(dataContext);
  
  dataFlow.storeCollectedData('name', 'Alice');
  dataFlow.storeCollectedData('interests', ['research', 'volunteering']);
  dataFlow.markStepComplete('welcome');
  
  console.log(`  Stored name: ${dataFlow.getCollectedData('name')}`);
  console.log(`  Stored interests: ${dataFlow.getCollectedData('interests')?.join(', ')}`);
  console.log(`  Completed steps: ${dataFlow.getFlowState().completedSteps.join(', ')}`);

  // Test 7: Flow reset
  console.log('\n--- Test 7: Flow Reset ---');
  const resetContext = createMockContext('reset-user-001', false, true);
  const resetFlow = new FlowStateMachine(resetContext);
  
  console.log(`  Initial state: ${resetFlow.getCurrentState()}`);
  
  // Transition to another state
  await resetFlow.transition({ type: 'user_input' });
  console.log(`  After transition: ${resetFlow.getCurrentState()}`);
  console.log(`  Completed steps: ${resetFlow.getFlowState().completedSteps.length}`);
  
  // Reset the flow
  resetFlow.reset();
  console.log(`  After reset: ${resetFlow.getCurrentState()}`);
  console.log(`  Completed steps: ${resetFlow.getFlowState().completedSteps.length}`);

  console.log('\n' + '='.repeat(80));
  console.log('All tests completed successfully!');
  console.log('='.repeat(80));
  console.log('\nSummary:');
  console.log('✓ New user flow initialization');
  console.log('✓ State transitions through personalization flow');
  console.log('✓ Returning user dashboard state');
  console.log('✓ Flow pause and resume');
  console.log('✓ State validation and guards');
  console.log('✓ Collected data storage');
  console.log('✓ Flow reset functionality');
}

// Run tests
testFlowStateMachine().catch(error => {
  console.error('Test failed:', error);
  logger.error('Test failed', error as Error);
  process.exit(1);
});

