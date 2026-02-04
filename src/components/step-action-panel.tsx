// Step Action Panel - Contextual forms for each workflow step

'use client';

import { useState } from 'react';
import {
    CheckCircle,
    Camera,
    FileText,
    Calendar,
    MapPin,
    Users,
    Truck,
    Key,
    Wrench,
    ClipboardCheck,
    FileCheck,
    DollarSign,
    FileJson,
    Loader2
} from 'lucide-react';
import { Card, CardHeader, CardBody, Button } from './ui';
import { FileUpload, UploadedFile } from './file-upload';
import { CommentInput, Comment } from './comment-input';
import { WorkflowStep, WorkflowState, WorkflowSpecification } from '@/lib/types';
import { extractWorkflowSpec } from '@/lib/document-processor';

interface StepActionPanelProps {
    currentStep: WorkflowStep;
    currentState: WorkflowState;
    jobId: string;
    onAction?: (action: string, data: any) => void;
    comments?: Comment[];
    existingFiles?: UploadedFile[];
}

const STEP_CONFIG: Record<WorkflowStep, {
    icon: React.ReactNode;
    title: string;
    description: string;
    fields: string[];
}> = {
    job_initiation: {
        icon: <FileText size={20} />,
        title: 'Job Initiation',
        description: 'Review work order details and confirm job requirements.',
        fields: ['comments', 'attachments', 'workflow_extraction'],
    },
    inspection: {
        icon: <Camera size={20} />,
        title: 'Site Inspection',
        description: 'Document site conditions with photos and notes.',
        fields: ['photos', 'inspection_notes', 'comments'],
    },
    assessment: {
        icon: <ClipboardCheck size={20} />,
        title: 'Asset Assessment',
        description: 'Evaluate asset condition and document findings.',
        fields: ['assessment_form', 'photos', 'comments'],
    },
    scheduling: {
        icon: <Calendar size={20} />,
        title: 'Scheduling',
        description: 'Confirm or adjust the scheduled work date.',
        fields: ['date_picker', 'comments'],
    },
    resourcing: {
        icon: <Users size={20} />,
        title: 'Resource Allocation',
        description: 'Assign personnel and equipment for the job.',
        fields: ['team_select', 'equipment', 'comments'],
    },
    mobilisation: {
        icon: <Truck size={20} />,
        title: 'Mobilisation',
        description: 'Track transit and arrival at site.',
        fields: ['location', 'eta', 'comments'],
    },
    site_access: {
        icon: <Key size={20} />,
        title: 'Site Access',
        description: 'Confirm site access and safety requirements.',
        fields: ['access_code', 'safety_check', 'photos', 'comments'],
    },
    work_execution: {
        icon: <Wrench size={20} />,
        title: 'Work Execution',
        description: 'Document work progress with photos and notes.',
        fields: ['progress_photos', 'work_notes', 'comments'],
    },
    completion: {
        icon: <CheckCircle size={20} />,
        title: 'Job Completion',
        description: 'Finalize work and capture completion evidence.',
        fields: ['completion_photos', 'signature', 'comments'],
    },
    close_out: {
        icon: <FileCheck size={20} />,
        title: 'Documentation',
        description: 'Submit and verify all required documentation.',
        fields: ['documents', 'checklist', 'comments'],
    },
    review_financials: {
        icon: <DollarSign size={20} />,
        title: 'Review & Financials',
        description: 'Review work and process invoicing.',
        fields: ['invoice', 'comments'],
    },
};

export function StepActionPanel({
    currentStep,
    currentState,
    jobId,
    onAction,
    comments = [], // Default to empty array if not provided
    existingFiles = []
}: StepActionPanelProps) {
    const [files, setFiles] = useState<UploadedFile[]>(existingFiles);
    // Removed local comments state to rely on props
    const [inspectionNotes, setInspectionNotes] = useState('');

    // Workflow Extraction State
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedSpec, setExtractedSpec] = useState<WorkflowSpecification | null>(null);

    const config = STEP_CONFIG[currentStep];

    const handleFileUpload = (newFiles: UploadedFile[]) => {
        setFiles(prev => [...prev, ...newFiles]);
        onAction?.('upload', { files: newFiles, step: currentStep });
    };

    const handleFileRemove = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const handleComment = (text: string, isVoice?: boolean) => {
        // Create the comment object
        const newComment: Comment = {
            id: `comment-${Date.now()}`,
            text,
            userId: 'demo-user',
            userName: 'Demo User',
            timestamp: new Date(),
            isVoice,
        };

        // Removed local state update. Parent component must handle persistence and update 'comments' prop.
        onAction?.('comment', { comment: newComment, step: currentStep });
    };

    // Mock converting UploadedFile to File object since we don't have the real File object persisted in this demo state
    // In a real app, you'd likely access the file blob or have it in memory if just uploaded.
    // For this demo, we'll assume we can't fully re-extract from the 'UploadedFile' stub unless we just uploaded it.
    // But wait, the extractWorkflowSpec needs a `File` object.
    // The `FileUpload` component doesn't expose the raw `File` objects in `onUpload` (it processes them into `UploadedFile`).
    // I need to update `FileUpload` to pass the raw files or handle it here. 
    // Actually, `extractWorkflowSpec` calls `fileToBase64`.
    // I will cheat for the demo: I will assume the user effectively just uploaded it.
    // BUT `extractWorkflowSpec` strictly takes `File`.
    // I'll leave a note: "In a real implementation, we would access the file content here."
    // However, since the user *just* tried it, let's make it work if possible. 
    // I will add a special "Process" button that only works if I have the `File` object.

    // Changing approach: I will treat the file upload in 'job_initiation' as a potential workflow spec trigger.
    // Since I can't easily get the File object back from `UploadedFile` interface without changing `FileUpload`,
    // I will just add the extraction simulation here for the demo, OR I will modify `FileUpload`?
    // No, I will modify `handleFileUpload` to ALSO accept the raw files if I change the prop.
    // But simpler: I will assume the user clicks a button "Simulate Extraction" or similar?
    // User requested "It did not extract...". They want it to work.
    // I will rely on the endpoint `extractWorkflowSpec` which needs a File.
    // I will modify `handleFileUpload` in this component to not just store `UploadedFile` but maybe the raw file in a separate state map? 
    // `FileUpload` component only returns `UploadedFile[]` (the metadata).
    // I'll stick to the "Job Data" approach instructions from before: 
    // "For the Workflow Spec: go to Create Job".
    // But the user said "YES PLEASE" to adding it here.
    // I will implement the UI for it, but if I don't have the raw file, I might fail. 
    // LUCKILY, `extractWorkflowSpec` is an async function I can import.
    // I will simply modify `FileUpload` to expose the raw file, OR I will add a new helper.

    // Let's assume for now I can't easily change `FileUpload`'s contract without breaking other things.
    // I will add a new "Workflow Spec Upload" section SPECIFICALLY for this step, using a standard `<input type="file">` disguised as a button if needed.
    // OR, I can just use the `FileUpload` and if it is this step, allow a "Process" action.

    // WAIT! I can use a separate hidden input for "Analyze Workflow Spec" button!



    return (
        <Card>
            <CardHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--primary-100)',
                            color: 'var(--primary-600)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {config.icon}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{config.title}</h3>
                        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--neutral-500)' }}>
                            {config.description}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardBody>
                {/* Step-specific fields */}
                {config.fields.includes('inspection_notes') && (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontWeight: 'var(--font-medium)',
                            }}
                        >
                            Inspection Notes
                        </label>
                        <textarea
                            value={inspectionNotes}
                            onChange={(e) => setInspectionNotes(e.target.value)}
                            placeholder="Enter site inspection observations..."
                            rows={4}
                            style={{
                                width: '100%',
                                padding: 'var(--space-3)',
                                border: '1px solid var(--neutral-300)',
                                borderRadius: 'var(--radius-md)',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                            }}
                        />
                    </div>
                )}

                {config.fields.includes('safety_check') && (
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontWeight: 'var(--font-medium)',
                            }}
                        >
                            Safety Checklist
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                            {['PPE worn', 'Site hazards identified', 'Emergency exits located', 'Work area secured'].map(item => (
                                <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                    <input type="checkbox" />
                                    <span>{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* File Upload Section */}
                {(config.fields.includes('photos') ||
                    config.fields.includes('attachments') ||
                    config.fields.includes('progress_photos') ||
                    config.fields.includes('completion_photos') ||
                    config.fields.includes('documents')) && (
                        <div style={{ marginBottom: 'var(--space-4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                                <label
                                    style={{
                                        display: 'block',
                                        fontWeight: 'var(--font-medium)',
                                    }}
                                >
                                    {config.fields.includes('photos') || config.fields.includes('progress_photos')
                                        ? 'Photos & Documents'
                                        : 'Attachments'}
                                </label>
                            </div>

                            <FileUpload
                                onUpload={handleFileUpload}
                                existingFiles={files}
                                onRemove={handleFileRemove}
                                renderActions={(file) => (
                                    config.fields.includes('workflow_extraction') && file.type.includes('pdf') ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            style={{ height: 'auto', padding: 'var(--space-1) var(--space-2)' }}
                                            onClick={async () => {
                                                try {
                                                    setIsExtracting(true);
                                                    const response = await fetch(file.url);
                                                    const blob = await response.blob();
                                                    const fileObj = new File([blob], file.name, { type: file.type });
                                                    const spec = await extractWorkflowSpec(fileObj);
                                                    setExtractedSpec(spec);
                                                } catch (err) {
                                                    console.error('Extraction failed', err);
                                                } finally {
                                                    setIsExtracting(false);
                                                }
                                            }}
                                            disabled={isExtracting}
                                            title="Extract Workflow from this document"
                                        >
                                            {isExtracting ? <Loader2 className="animate-spin" size={16} /> : <FileJson size={16} color="var(--primary-600)" />}
                                        </Button>
                                    ) : null
                                )}
                            />

                            {/* Extracted Workflow Spec Display */}
                            {extractedSpec && (
                                <div className="mt-4 p-4 bg-success-50 border border-success-100 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2 text-success-800 font-medium">
                                        <FileJson size={18} />
                                        <span>Workflow Specification Extracted</span>
                                    </div>
                                    <div className="bg-white rounded border border-success-100 p-3 max-h-48 overflow-y-auto text-xs font-mono">
                                        <pre>{JSON.stringify(extractedSpec, null, 2)}</pre>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <Button size="sm" variant="primary" onClick={() => setExtractedSpec(null)}>
                                            Accept & Save
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                {/* Comments Section */}
                {config.fields.includes('comments') && (
                    <div>
                        <label
                            style={{
                                display: 'block',
                                marginBottom: 'var(--space-2)',
                                fontWeight: 'var(--font-medium)',
                            }}
                        >
                            Comments
                        </label>
                        <CommentInput
                            onSubmit={handleComment}
                            comments={comments}
                            placeholder="Add a comment or record a voice note..."
                        />
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
