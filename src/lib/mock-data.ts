import { Job, JobEvent, WorkflowState, Report } from './types';

const NOW = new Date();
const ONE_DAY = 24 * 60 * 60 * 1000;

export const MOCK_JOBS: Job[] = [
    {
        id: 'job-demo-screenshot-1',
        tenantId: 'default',
        workOrderRef: 'WO-000132',
        clientName: 'Ironclad Mining Services',
        clientEmail: 'client@example.com',
        siteAddress: 'Mt Isa QLD',
        status: 'INITIATED',
        currentStep: 'job_initiation',
        assignedTo: [],
        createdBy: 'demo-user',
        createdAt: new Date('2026-02-03T07:53:00'),
        scheduledDate: new Date('2026-02-18T10:00:00'),
        updatedAt: new Date(),
        priority: 'High',
        jobValue: '$40,250.00',

        notes: 'Shutdown support - conveyor access, working at heights permit control, and rescue readiness. Working at heights, risk classification high.',
        location: {
            latitude: -20.7256,
            longitude: 139.4927,
            capturedAt: new Date()
        }
    },
    {
        id: 'job-101',
        tenantId: 'default',
        workOrderRef: 'WO-2024-001',
        clientName: 'Acme Constructions',
        clientEmail: 'site.manager@acme.com',
        siteAddress: '123 Construction Way, CBD',
        status: 'WORK_IN_PROGRESS',
        currentStep: 'work_execution',
        assignedTo: ['demo-user-001'],
        createdBy: 'admin',
        createdAt: new Date(NOW.getTime() - 2 * ONE_DAY),
        updatedAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
        scheduledDate: new Date(NOW.getTime() + ONE_DAY),
        location: {
            latitude: -33.8688,
            longitude: 151.2093,
            capturedAt: new Date()
        },
        notes: "Site access is via the rear lane. Key code is 4729.",
        priority: 'High'
    },
    {
        id: 'job-102',
        tenantId: 'default',
        workOrderRef: 'WO-2024-002',
        clientName: 'BuildRight Corp',
        clientEmail: 'pm@buildright.com',
        siteAddress: '45 West St, North Sydney',
        status: 'INITIATED',
        currentStep: 'job_initiation',
        assignedTo: ['demo-user-001'],
        createdBy: 'admin',
        createdAt: new Date(NOW.getTime() - 1 * ONE_DAY),
        updatedAt: new Date(NOW.getTime() - 1 * ONE_DAY),
        scheduledDate: new Date(NOW.getTime() + 3 * ONE_DAY),
        priority: 'Medium'
    },
    {
        id: 'job-103',
        tenantId: 'default',
        workOrderRef: 'WO-2024-003',
        clientName: 'Metro Developments',
        clientEmail: 'info@metrodev.com',
        siteAddress: '88 Park Rd, Parramatta',
        status: 'AWAITING_INFO',
        currentStep: 'inspection',
        assignedTo: ['demo-user-001'],
        createdBy: 'office',
        createdAt: new Date(NOW.getTime() - 5 * ONE_DAY),
        updatedAt: new Date(NOW.getTime() - 12 * 60 * 60 * 1000),
        notes: "Waiting for safety documentation from client.",
        priority: 'High'
    },
    {
        id: 'job-104',
        tenantId: 'default',
        workOrderRef: 'WO-2024-004',
        clientName: 'Residential Fix',
        clientEmail: 'resifix@example.com',
        siteAddress: '12 Home Ave, Mosman',
        status: 'JOB_CLOSED',
        currentStep: 'completion',
        assignedTo: ['demo-user-001'],
        createdBy: 'admin',
        createdAt: new Date(NOW.getTime() - 10 * ONE_DAY),
        updatedAt: new Date(NOW.getTime() - 2 * ONE_DAY),
        scheduledDate: new Date(NOW.getTime() - 3 * ONE_DAY),
        priority: 'Low'
    }
];

export const MOCK_EVENTS: JobEvent[] = [
    {
        id: 'evt-1',
        jobId: 'job-101',
        type: 'state_change',
        fromState: 'INITIATED',
        toState: 'WORK_IN_PROGRESS',
        timestamp: new Date(NOW.getTime() - 1 * ONE_DAY),
        userId: 'demo-user-001',
        userName: 'Demo User',
        metadata: { action: 'Started job' }
    },
    {
        id: 'evt-2',
        jobId: 'job-101',
        type: 'note',
        timestamp: new Date(NOW.getTime() - 4 * 60 * 60 * 1000),
        userId: 'demo-user-001',
        userName: 'Demo User',
        metadata: { note: 'Arrived at site, induction complete.' }
    }
];

export const MOCK_REPORTS: Report[] = [
    {
        id: 'rpt-cc-001',
        jobId: 'job-demo-screenshot-1',
        type: 'critical_controls',
        storagePath: '/reports/cc-001.pdf',
        fileName: 'Critical_Controls_Assessment.pdf',
        generatedBy: 'demo-user',
        generatedAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
        metadata: {
            title: 'Working at Heights - Critical Control Verification',
            controls: [
                { id: 'CC1', label: 'Fall Archaest Harness Inspected', status: 'verified', verifiedBy: 'John Doe' },
                { id: 'CC2', label: 'Anchor Point Rated & Tagged', status: 'verified', verifiedBy: 'John Doe' },
                { id: 'CC3', label: 'Exclusion Zone Established', status: 'verified', verifiedBy: 'Jane Smith' },
                { id: 'CC4', label: 'Rescue Plan Communicated', status: 'pending', verifiedBy: null }
            ],
            complianceScore: 75
        }
    },
    {
        id: 'rpt-bp-001',
        jobId: 'job-demo-screenshot-1',
        type: 'best_practices',
        storagePath: '/reports/bp-001.pdf',
        fileName: 'Site_Best_Practices_Review.pdf',
        generatedBy: 'system-ai',
        generatedAt: new Date(NOW.getTime() - 1 * 60 * 60 * 1000),
        metadata: {
            title: 'AI Site Optimization Suggestions',
            suggestions: [
                { category: 'Safety', text: 'Consider implementing tool lanyards for all tools over 0.5kg when working on the gantry.' },
                { category: 'Efficiency', text: 'Pre-staging materials at the base level could reduce transit time by 15%.' },
                { category: 'Environment', text: 'Ensure spill kits are deployed near the generator before refueling.' }
            ],
            aiConfidence: 'high'
        }
    },
    {
        id: 'rpt-insp-001',
        jobId: 'job-101',
        type: 'inspection',
        storagePath: '/reports/insp-001.pdf',
        fileName: 'Initial_Site_Inspection.pdf',
        generatedBy: 'demo-user-001',
        generatedAt: new Date(NOW.getTime() - 24 * 60 * 60 * 1000),
        metadata: {
            assetCount: 5,
            passRate: 100
        }
    }
];
