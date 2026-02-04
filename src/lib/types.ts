// Workflow Agent - Type Definitions

// ============================================
// USER & AUTH TYPES
// ============================================

export type UserRole = 'admin' | 'office' | 'field' | 'finance';

export interface User {
    id: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: UserRole;
    tenantId: string;
    createdAt: Date;
    lastLogin: Date;
}

// ============================================
// JOB TYPES
// ============================================

export interface Job {
    id: string;
    tenantId: string;
    clientName: string;
    clientEmail: string;
    workOrderRef: string;
    status: WorkflowState;
    currentStep: WorkflowStep;
    assignedTo: string[];
    scheduledDate?: Date;
    dueDate?: Date;
    siteAddress?: string;
    notes?: string;
    jobValue?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    ragStatus?: 'Red' | 'Amber' | 'Green';
    workingDoc?: {
        name: string;
        url?: string;
        uploadedAt: Date;
    };
    // GPS Location & Tracking
    location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        capturedAt?: Date;
    };
    geofence?: {
        latitude: number;
        longitude: number;
        radiusMeters: number;
    };
    // Voice Notes
    voiceNotes?: {
        id: string;
        transcript: string;
        audioUrl?: string;
        imageUrl?: string;
        location?: { latitude: number; longitude: number };
        timestamp: Date;
        aiSummary?: string;
        stepId?: string;
        stepName?: string;
    }[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

// ============================================
// WORKFLOW STATE MACHINE
// ============================================

export type WorkflowState =
    | 'INITIATED'
    | 'AWAITING_INFO'
    | 'SCHEDULED'
    | 'INSPECTION_IN_PROGRESS'
    | 'INSPECTION_INCOMPLETE'
    | 'ASSET_PASSED'
    | 'ASSET_FAILED'
    | 'DEFECT_FLAGGED'
    | 'SCHEDULING_ALTERNATE'
    | 'RESOURCING_PENDING'
    | 'RESOURCING_ADJUSTED'
    | 'RESOURCED'
    | 'MOBILISING'
    | 'ARRIVAL_DELAYED'
    | 'ON_SITE'
    | 'ACCESS_GRANTED'
    | 'ACCESS_ISSUE'
    | 'WORK_IN_PROGRESS'
    | 'WORK_STOPPED'
    | 'WORK_COMPLETED'
    | 'DOCS_SUBMITTED'
    | 'DOCS_RETURNED'
    | 'OFFICE_REVIEW'
    | 'INVOICE_ISSUED'
    | 'INVOICE_DISPUTED'
    | 'JOB_CLOSED';

export type WorkflowStep =
    | 'job_initiation'
    | 'inspection'
    | 'assessment'
    | 'scheduling'
    | 'resourcing'
    | 'mobilisation'
    | 'site_access'
    | 'work_execution'
    | 'completion'
    | 'close_out'
    | 'review_financials';

export type DecisionId =
    | 'D1' // Work order complete & approved?
    | 'D2' // Inspection data complete?
    | 'D3' // Asset passes inspection?
    | 'D4' // Can job be scheduled as requested?
    | 'D5' // Required resources available?
    | 'D6' // Team arrived on site as planned?
    | 'D7' // Site access & induction completed?
    | 'D8' // Work proceeding safely and as scoped?
    | 'D9' // All work completed?
    | 'D10' // Documentation complete & accurate?
    | 'D11'; // Invoice approved?

export interface Decision {
    id: DecisionId;
    question: string;
    yesState: WorkflowState;
    noState: WorkflowState;
    yesAction?: string;
    noAction?: string;
}

export interface WorkflowInstance {
    currentState: WorkflowState;
    previousState?: WorkflowState;
    startedAt: Date;
    decisions: Record<DecisionId, boolean>;
}

// ============================================
// WORKFLOW STEPS CONFIGURATION
// ============================================

export interface StepConfig {
    id: WorkflowStep;
    label: string;
    swimlane: 'office' | 'field';
    states: WorkflowState[];
    decisionId?: DecisionId;
}

export const WORKFLOW_STEPS: StepConfig[] = [
    {
        id: 'job_initiation',
        label: 'Job Initiation',
        swimlane: 'office',
        states: ['INITIATED', 'AWAITING_INFO'],
        decisionId: 'D1',
    },
    {
        id: 'inspection',
        label: 'Inspection',
        swimlane: 'field',
        states: ['INSPECTION_IN_PROGRESS', 'INSPECTION_INCOMPLETE'],
        decisionId: 'D2',
    },
    {
        id: 'assessment',
        label: 'Assessment',
        swimlane: 'field',
        states: ['ASSET_PASSED', 'ASSET_FAILED', 'DEFECT_FLAGGED'],
        decisionId: 'D3',
    },
    {
        id: 'scheduling',
        label: 'Scheduling',
        swimlane: 'office',
        states: ['SCHEDULED', 'SCHEDULING_ALTERNATE'],
        decisionId: 'D4',
    },
    {
        id: 'resourcing',
        label: 'Resourcing',
        swimlane: 'office',
        states: ['RESOURCING_PENDING', 'RESOURCING_ADJUSTED', 'RESOURCED'],
        decisionId: 'D5',
    },
    {
        id: 'mobilisation',
        label: 'Mobilisation',
        swimlane: 'field',
        states: ['MOBILISING', 'ARRIVAL_DELAYED', 'ON_SITE'],
        decisionId: 'D6',
    },
    {
        id: 'site_access',
        label: 'Site Access',
        swimlane: 'field',
        states: ['ACCESS_GRANTED', 'ACCESS_ISSUE'],
        decisionId: 'D7',
    },
    {
        id: 'work_execution',
        label: 'Work Execution',
        swimlane: 'field',
        states: ['WORK_IN_PROGRESS', 'WORK_STOPPED'],
        decisionId: 'D8',
    },
    {
        id: 'completion',
        label: 'Completion',
        swimlane: 'field',
        states: ['WORK_COMPLETED'],
        decisionId: 'D9',
    },
    {
        id: 'close_out',
        label: 'Close Out',
        swimlane: 'field',
        states: ['DOCS_SUBMITTED', 'DOCS_RETURNED'],
        decisionId: 'D10',
    },
    {
        id: 'review_financials',
        label: 'Review & Financials',
        swimlane: 'office',
        states: ['OFFICE_REVIEW', 'INVOICE_ISSUED', 'INVOICE_DISPUTED', 'JOB_CLOSED'],
        decisionId: 'D11',
    },
];

export const DECISIONS: Record<DecisionId, Decision> = {
    D1: {
        id: 'D1',
        question: 'Is the work order complete and approved?',
        yesState: 'INSPECTION_IN_PROGRESS',  // Fixed: Go to inspection, not scheduling
        noState: 'AWAITING_INFO',
        yesAction: 'Proceed to site inspection',
        noAction: 'Request missing information from client',
    },
    D2: {
        id: 'D2',
        question: 'Is inspection data complete?',
        yesState: 'ASSET_PASSED',  // Go to assessment
        noState: 'INSPECTION_INCOMPLETE',
        yesAction: 'Proceed to asset assessment',
        noAction: 'Capture missing data',
    },
    D3: {
        id: 'D3',
        question: 'Does the asset pass inspection?',
        yesState: 'SCHEDULED',  // Go to scheduling step
        noState: 'DEFECT_FLAGGED',
        yesAction: 'Proceed to scheduling',
        noAction: 'Document defects and flag for repair',
    },
    D4: {
        id: 'D4',
        question: 'Can the job be scheduled as requested?',
        yesState: 'RESOURCING_PENDING',  // Fixed: Go to resourcing, not loop back
        noState: 'SCHEDULING_ALTERNATE',
        yesAction: 'Confirm schedule and proceed to resourcing',
        noAction: 'Propose alternate dates/resources',
    },
    D5: {
        id: 'D5',
        question: 'Are required personnel and resources available?',
        yesState: 'MOBILISING',  // Fixed: Go to mobilisation
        noState: 'RESOURCING_ADJUSTED',
        yesAction: 'Confirm allocation and begin mobilisation',
        noAction: 'Adjust resourcing or reschedule',
    },
    D6: {
        id: 'D6',
        question: 'Has the team arrived on site as planned?',
        yesState: 'ON_SITE',
        noState: 'ARRIVAL_DELAYED',
        yesAction: 'Sign in to client site',
        noAction: 'Record delay and notify office',
    },
    D7: {
        id: 'D7',
        question: 'Is site access and induction completed?',
        yesState: 'WORK_IN_PROGRESS',  // Fixed: Go directly to work execution
        noState: 'ACCESS_ISSUE',
        yesAction: 'Commence work',
        noAction: 'Contact office/client to resolve access',
    },
    D8: {
        id: 'D8',
        question: 'Is work proceeding safely and as scoped?',
        yesState: 'WORK_COMPLETED',  // Fixed: Progress to completion
        noState: 'WORK_STOPPED',
        yesAction: 'Work is complete, sign out of site',
        noAction: 'Stop work and escalate',
    },
    D9: {
        id: 'D9',
        question: 'Is all work completed and signed off?',
        yesState: 'DOCS_SUBMITTED',  // Fixed: Progress to close_out step
        noState: 'WORK_IN_PROGRESS',
        yesAction: 'Submit documentation for review',
        noAction: 'Complete outstanding tasks',
    },
    D10: {
        id: 'D10',
        question: 'Is documentation complete and accurate?',
        yesState: 'OFFICE_REVIEW',
        noState: 'DOCS_RETURNED',
        yesAction: 'Finalize job file',
        noAction: 'Return to field team for correction',
    },
    D11: {
        id: 'D11',
        question: 'Is invoice approved?',
        yesState: 'JOB_CLOSED',
        noState: 'INVOICE_DISPUTED',
        yesAction: 'Close job',
        noAction: 'Resolve discrepancies',
    },
};

// ============================================
// STATUS DISPLAY
// ============================================

export type StatusType = 'draft' | 'in-progress' | 'blocked' | 'completed' | 'overdue' | 'pending';

export function getStatusType(state: WorkflowState): StatusType {
    switch (state) {
        case 'JOB_CLOSED':
            return 'completed';
        case 'AWAITING_INFO':
        case 'ACCESS_ISSUE':
        case 'WORK_STOPPED':
        case 'INVOICE_DISPUTED':
        case 'DOCS_RETURNED':
            return 'blocked';
        case 'INITIATED':
            return 'draft';
        case 'ARRIVAL_DELAYED':
        case 'SCHEDULING_ALTERNATE':
        case 'RESOURCING_ADJUSTED':
            return 'pending';
        default:
            return 'in-progress';
    }
}

export function getStateLabel(state: WorkflowState): string {
    const labels: Record<WorkflowState, string> = {
        INITIATED: 'Initiated',
        AWAITING_INFO: 'Awaiting Info',
        SCHEDULED: 'Scheduled',
        INSPECTION_IN_PROGRESS: 'Inspecting',
        INSPECTION_INCOMPLETE: 'Incomplete',
        ASSET_PASSED: 'Passed',
        ASSET_FAILED: 'Failed',
        DEFECT_FLAGGED: 'Defects Found',
        SCHEDULING_ALTERNATE: 'Rescheduling',
        RESOURCING_PENDING: 'Resourcing',
        RESOURCING_ADJUSTED: 'Adjusting Resources',
        RESOURCED: 'Resourced',
        MOBILISING: 'Mobilising',
        ARRIVAL_DELAYED: 'Delayed',
        ON_SITE: 'On Site',
        ACCESS_GRANTED: 'Access Granted',
        ACCESS_ISSUE: 'Access Issue',
        WORK_IN_PROGRESS: 'In Progress',
        WORK_STOPPED: 'Stopped',
        WORK_COMPLETED: 'Completed',
        DOCS_SUBMITTED: 'Docs Submitted',
        DOCS_RETURNED: 'Docs Returned',
        OFFICE_REVIEW: 'Under Review',
        INVOICE_ISSUED: 'Invoice Issued',
        INVOICE_DISPUTED: 'Invoice Disputed',
        JOB_CLOSED: 'Closed',
    };
    return labels[state] || state;
}

// ============================================
// EVENTS & AUDIT
// ============================================

export type EventType = 'state_change' | 'decision' | 'upload' | 'note' | 'email' | 'validation';

export interface JobEvent {
    id: string;
    jobId: string;
    type: EventType;
    fromState?: WorkflowState;
    toState?: WorkflowState;
    decision?: DecisionId;
    outcome?: boolean;
    userId: string;
    userName?: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
    aiValidation?: AIValidationResult;
}

// ============================================
// INSPECTION TYPES
// ============================================

export interface Inspection {
    id: string;
    jobId: string;
    assetId: string;
    type: string;
    status: 'passed' | 'failed' | 'pending';
    notes?: string;
    findings: Finding[];
    defects: Defect[];
    attachmentRefs: string[];
    capturedBy: string;
    capturedAt: Date;
    aiSummary?: string;
}

export interface Finding {
    id: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    attachmentRefs?: string[];
}

export interface Defect {
    id: string;
    description: string;
    severity: 'minor' | 'major' | 'critical';
    location?: string;
    recommendedAction?: string;
    attachmentRefs?: string[];
    flaggedForRepair: boolean;
}

// ============================================
// ATTACHMENTS
// ============================================

export type AttachmentType = 'photo' | 'document' | 'signature';

export interface Attachment {
    id: string;
    jobId: string;
    type: AttachmentType;
    storagePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedBy: string;
    uploadedAt: Date;
    metadata?: Record<string, unknown>;
    downloadUrl?: string;
}

// ============================================
// REPORTS
// ============================================

export type ReportType = 'inspection' | 'defect' | 'completion' | 'invoice' | 'critical_controls' | 'best_practices';

export interface Report {
    id: string;
    jobId: string;
    type: ReportType;
    storagePath: string;
    fileName: string;
    generatedBy: string;
    generatedAt: Date;
    downloadUrl?: string;
    metadata?: Record<string, unknown>;
}

// ============================================
// EMAIL
// ============================================

export type EmailStatus = 'queued' | 'sent' | 'failed';

export type EmailTemplate =
    | 'missing_info'
    | 'scheduling_confirmation'
    | 'defect_notice'
    | 'completion_pack'
    | 'invoice_issued';

export interface EmailMessage {
    id: string;
    jobId: string;
    templateId: EmailTemplate;
    to: string[];
    subject: string;
    body: string;
    status: EmailStatus;
    sentAt?: Date;
    error?: string;
    createdAt: Date;
}

// ============================================
// AI VALIDATION
// ============================================

export interface AIValidationResult {
    isComplete: boolean;
    missingFields: string[];
    warnings: string[];
    confidence: 'high' | 'medium' | 'low';
    sources: string[];
}

export interface AISummary {
    summary: string;
    keyFindings: string[];
    defectsSummary?: string;
    recommendations: string[];
    sources: string[];
}

export interface EmailDraft {
    subject: string;
    body: string;
    tone: 'formal' | 'friendly-professional';
}

// ============================================
// WORKFLOW SPECIFICATION
// ============================================

export interface WorkflowAction {
    step_name: string;
    phase: string;
    user_action: string;
    system_action: string;
    guard_conditions: string[];
    outputs: string[];
    audit_event: string;
    next_state: string;
}

export type WorkflowSpecification = WorkflowAction[];
