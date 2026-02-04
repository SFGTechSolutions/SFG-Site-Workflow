// Workflow Engine - State Machine Utilities

import { WorkflowState, WorkflowStep, DecisionId, DECISIONS, WORKFLOW_STEPS } from './types';

/**
 * Maps each workflow state to its relevant decision point.
 * States without a decision are in a transitional or terminal state.
 */
export const STATE_TO_DECISION: Partial<Record<WorkflowState, DecisionId>> = {
    // Job Initiation
    INITIATED: 'D1',
    AWAITING_INFO: 'D1',

    // Inspection
    INSPECTION_IN_PROGRESS: 'D2',
    INSPECTION_INCOMPLETE: 'D2',

    // Assessment
    ASSET_PASSED: 'D3',
    ASSET_FAILED: 'D3',

    // Scheduling
    SCHEDULED: 'D4',
    SCHEDULING_ALTERNATE: 'D4',

    // Resourcing
    RESOURCING_PENDING: 'D5',
    RESOURCING_ADJUSTED: 'D5',
    RESOURCED: 'D5',

    // Mobilisation
    MOBILISING: 'D6',
    ARRIVAL_DELAYED: 'D6',

    // Site Access
    ON_SITE: 'D7',
    ACCESS_ISSUE: 'D7',

    // Work Execution
    ACCESS_GRANTED: 'D8',
    WORK_IN_PROGRESS: 'D8',
    WORK_STOPPED: 'D8',

    // Completion
    WORK_COMPLETED: 'D9',

    // Close Out
    DOCS_SUBMITTED: 'D10',
    DOCS_RETURNED: 'D10',

    // Review & Financials
    OFFICE_REVIEW: 'D11',
    INVOICE_ISSUED: 'D11',
    INVOICE_DISPUTED: 'D11',

    // Terminal - no decision
    // JOB_CLOSED: undefined,
    // DEFECT_FLAGGED: undefined (requires separate flow)
};

/**
 * Get the decision that can be made from the current state.
 */
export function getAvailableDecision(state: WorkflowState) {
    const decisionId = STATE_TO_DECISION[state];
    if (!decisionId) return null;
    return DECISIONS[decisionId];
}

/**
 * Get the workflow step for a given state.
 */
export function getStepForState(state: WorkflowState): WorkflowStep | null {
    const step = WORKFLOW_STEPS.find(s => s.states.includes(state));
    return step?.id || null;
}

/**
 * Check if a state is terminal (no further progression).
 */
export function isTerminalState(state: WorkflowState): boolean {
    return state === 'JOB_CLOSED' || state === 'DEFECT_FLAGGED';
}

/**
 * Check if a state is blocked (requires action to proceed).
 */
export function isBlockedState(state: WorkflowState): boolean {
    return [
        'AWAITING_INFO',
        'INSPECTION_INCOMPLETE',
        'ASSET_FAILED',
        'SCHEDULING_ALTERNATE',
        'RESOURCING_ADJUSTED',
        'ARRIVAL_DELAYED',
        'ACCESS_ISSUE',
        'WORK_STOPPED',
        'DOCS_RETURNED',
        'INVOICE_DISPUTED',
    ].includes(state);
}

/**
 * Get contextual labels for decision buttons based on current state.
 */
export function getDecisionLabels(state: WorkflowState): { yesLabel: string; noLabel: string } {
    switch (state) {
        case 'INITIATED':
        case 'AWAITING_INFO':
            return { yesLabel: 'Approved', noLabel: 'Request Info' };
        case 'INSPECTION_IN_PROGRESS':
        case 'INSPECTION_INCOMPLETE':
            return { yesLabel: 'Data Complete', noLabel: 'Incomplete' };
        case 'ASSET_PASSED':
        case 'ASSET_FAILED':
            return { yesLabel: 'Pass', noLabel: 'Fail - Flag Defects' };
        case 'SCHEDULED':
        case 'SCHEDULING_ALTERNATE':
            return { yesLabel: 'Confirm Schedule', noLabel: 'Reschedule' };
        case 'RESOURCING_PENDING':
        case 'RESOURCING_ADJUSTED':
        case 'RESOURCED':
            return { yesLabel: 'Resources Ready', noLabel: 'Adjust Resources' };
        case 'MOBILISING':
        case 'ARRIVAL_DELAYED':
            return { yesLabel: 'Arrived On Site', noLabel: 'Delayed' };
        case 'ON_SITE':
        case 'ACCESS_ISSUE':
            return { yesLabel: 'Access Granted', noLabel: 'Access Issue' };
        case 'ACCESS_GRANTED':
        case 'WORK_IN_PROGRESS':
        case 'WORK_STOPPED':
            return { yesLabel: 'Work OK', noLabel: 'Stop Work' };
        case 'WORK_COMPLETED':
            return { yesLabel: 'All Complete', noLabel: 'More Work Needed' };
        case 'DOCS_SUBMITTED':
        case 'DOCS_RETURNED':
            return { yesLabel: 'Docs Approved', noLabel: 'Return for Correction' };
        case 'OFFICE_REVIEW':
        case 'INVOICE_ISSUED':
        case 'INVOICE_DISPUTED':
            return { yesLabel: 'Invoice Approved', noLabel: 'Dispute' };
        default:
            return { yesLabel: 'Yes', noLabel: 'No' };
    }
}

/**
 * Get a human-readable action hint for the current state.
 */
export function getActionHint(state: WorkflowState): string | null {
    const decision = getAvailableDecision(state);
    if (!decision) return null;

    if (isBlockedState(state)) {
        return `This job is blocked. Action required: ${decision.noAction || 'Resolve the issue'}`;
    }

    return decision.yesAction || null;
}

/**
 * Calculate progress percentage through the workflow.
 */
export function getWorkflowProgress(state: WorkflowState): number {
    const stepOrder: WorkflowStep[] = [
        'job_initiation',
        'inspection',
        'assessment',
        'scheduling',
        'resourcing',
        'mobilisation',
        'site_access',
        'work_execution',
        'completion',
        'close_out',
        'review_financials',
    ];

    const currentStep = getStepForState(state);
    if (!currentStep) return 0;

    if (state === 'JOB_CLOSED') return 100;

    const index = stepOrder.indexOf(currentStep);
    return Math.round(((index + 1) / stepOrder.length) * 100);
}
