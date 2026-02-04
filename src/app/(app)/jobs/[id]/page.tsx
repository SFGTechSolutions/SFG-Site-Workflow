// Job Detail Page

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Edit,
    MoreHorizontal,
    MessageSquare,
    FileText,
    History,
    Sparkles,
    Check,
    AlertTriangle,
    MapPin,
    Mic,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useJob, useJobEvents, useJobMutations } from '@/lib/hooks';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    StatusPill,
    WorkflowStepper,
    Timeline,
    DecisionModal,
    AICard,
} from '@/components/ui';
import { StepActionPanel } from '@/components/step-action-panel';
import { FileUpload, UploadedFile } from '@/components/file-upload';
import { GPSLocation } from '@/components/gps-location';
import { VoiceNotesHistory } from '@/components/voice-notes-history';
import { VoiceRecorder } from '@/components/voice-recorder';
import {
    WORKFLOW_STEPS,
    DecisionId,
    getStateLabel,
    getStatusType,
    JobEvent,
} from '@/lib/types';
import {
    getAvailableDecision,
    getDecisionLabels,
    isTerminalState,
    isBlockedState,
    getWorkflowProgress,
} from '@/lib/workflow-engine';
import { useJobContext } from '@/lib/job-context';

export default function JobDetailPage() {
    const { user, loading: authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const jobId = params.id as string;

    const { job, loading: jobLoading, error: jobError } = useJob(jobId);
    const { events, loading: eventsLoading } = useJobEvents(jobId);
    const { updateJobState, addJobNote, loading: updateLoading } = useJobMutations();
    const { setCurrentJob } = useJobContext();

    const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'location' | 'voice' | 'attachments' | 'audit'>(
        'overview'
    );
    const [decisionModal, setDecisionModal] = useState<{
        isOpen: boolean;
        decision: DecisionId | null;
    }>({
        isOpen: false,
        decision: null,
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    // Set current job in context so VoiceAssistant can access it
    useEffect(() => {
        if (job) {
            setCurrentJob(job);
        }
        return () => setCurrentJob(null); // Clear when leaving page
    }, [job, setCurrentJob]);

    const currentStep = job ? WORKFLOW_STEPS.find((s) => s.id === job.currentStep) : null;
    const currentDecision = job ? getAvailableDecision(job.status) : null;
    const decisionLabels = job ? getDecisionLabels(job.status) : { yesLabel: 'Yes', noLabel: 'No' };
    const isTerminal = job ? isTerminalState(job.status) : false;
    const isBlocked = job ? isBlockedState(job.status) : false;
    const progress = job ? getWorkflowProgress(job.status) : 0;

    const handleDecision = async (outcome: boolean) => {
        if (!job || !currentDecision) return;

        const newState = outcome ? currentDecision.yesState : currentDecision.noState;
        await updateJobState(job.id, newState, {
            id: currentDecision.id,
            outcome,
        });

        setDecisionModal({ isOpen: false, decision: null });
    };

    // Calculate comments from events for StepActionPanel
    // Filter to only include notes for the current step (or those without stepId for backward compatibility if needed, but strict is safer for "each step" requirement)
    const stepComments = events
        .filter(e => e.type === 'note' && (!e.metadata?.stepId || e.metadata.stepId === job?.currentStep))
        .map(e => ({
            id: e.id,
            text: (e.metadata?.note as string) || '',
            userId: e.userId,
            userName: e.userName || 'User',
            timestamp: e.timestamp,
            isVoice: (e.metadata?.note as string)?.startsWith('[Voice recording'),
        }));

    const handleStepAction = async (action: string, data: any) => {
        console.log('Step action:', action, data);
        if (action === 'comment') {
            // Pass the step ID from data.step (provided by StepActionPanel) to associate the note with this specific step
            await addJobNote(jobId, data.comment.text, data.step);
        }
    };

    const formatDate = (date?: Date) => {
        if (!date) return '—';
        return new Intl.DateTimeFormat('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const mapEventsToTimeline = (events: JobEvent[]) => {
        return events.map((event) => {
            let title = 'Event';
            let description = '';
            let type: 'default' | 'success' | 'warning' | 'error' = 'default';

            switch (event.type) {
                case 'state_change':
                    title = event.toState ? `Status: ${getStateLabel(event.toState)}` : 'Status changed';
                    if (event.fromState) {
                        description = `Changed from ${getStateLabel(event.fromState)}`;
                    }
                    if (event.toState === 'JOB_CLOSED') {
                        type = 'success';
                    } else if (
                        event.toState &&
                        ['AWAITING_INFO', 'ACCESS_ISSUE', 'WORK_STOPPED', 'INVOICE_DISPUTED'].includes(
                            event.toState
                        )
                    ) {
                        type = 'warning';
                    }
                    break;
                case 'decision':
                    title = `Decision: ${event.decision}`;
                    description = `Outcome: ${event.outcome ? 'Yes' : 'No'}`;
                    type = event.outcome ? 'success' : 'warning';
                    break;
                case 'note':
                    title = 'Note added';
                    description = (event.metadata?.note as string) || '';
                    if (event.metadata?.stepId) {
                        // We could format this nicely, e.g., "Note added in Site Inspection"
                        // But for now, standard note is fine.
                    }
                    break;
                case 'upload':
                    title = 'File uploaded';
                    description = (event.metadata?.fileName as string) || '';
                    break;
                case 'email':
                    title = 'Email sent';
                    description = (event.metadata?.subject as string) || '';
                    break;
                case 'validation':
                    title = 'AI Validation';
                    type = event.aiValidation?.isComplete ? 'success' : 'warning';
                    break;
            }

            return {
                id: event.id,
                title,
                description,
                timestamp: event.timestamp,
                type,
                user: event.userName,
            };
        });
    };

    if (authLoading || jobLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user || !job) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-2xl font-bold text-neutral-900">Job Not Found</h1>
                <Card>
                    <CardBody>
                        <p className="text-neutral-600">The job you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
                        <Button onClick={() => router.push('/dashboard')} className="mt-4">
                            Back to Dashboard
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-1">
                            {job.workOrderRef}
                        </h1>
                        <p className="text-neutral-500 m-0">{job.clientName}</p>
                    </div>
                    <StatusPill status={job.status} />
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" icon={<Edit size={16} />}>
                        Edit
                    </Button>
                    <Button variant="ghost" className="btn-icon">
                        <MoreHorizontal size={20} />
                    </Button>
                </div>
            </div>

            {/* Workflow Stepper */}
            <Card className="mb-6">
                <CardBody>
                    <WorkflowStepper currentStep={job.currentStep} currentState={job.status} />
                </CardBody>
            </Card>

            {/* Progress Bar */}
            {!isTerminal && (
                <div className="mb-4">
                    <div className="flex justify-between mb-1">
                        <span className="text-sm text-neutral-600">Workflow Progress</span>
                        <span className="text-sm font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${isBlocked ? 'bg-warning-500' : 'bg-primary-500'}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Next Action Panel */}
            {currentDecision && !isTerminal && (
                <Card className="mb-6">
                    <CardBody>
                        <AICard
                            title={isBlocked ? 'Action Required - Job Blocked' : 'Next Action Required'}
                            type={isBlocked ? 'warning' : 'info'}
                            icon={isBlocked ? <AlertTriangle size={16} /> : <Sparkles size={16} />}
                        >
                            <p className="mb-4 font-medium text-neutral-900">
                                {currentDecision.question}
                            </p>
                            <div className="flex gap-3 flex-wrap">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleDecision(true)}
                                    // loading={updateLoading}
                                    icon={<Check size={16} />}
                                >
                                    {decisionLabels.yesLabel}
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleDecision(false)}
                                    // loading={updateLoading}
                                    icon={<AlertTriangle size={16} />}
                                >
                                    {decisionLabels.noLabel}
                                </Button>
                            </div>
                            {currentDecision.yesAction && (
                                <p className="mt-3 text-sm text-neutral-500">
                                    <strong>If Yes:</strong> {currentDecision.yesAction}
                                </p>
                            )}
                        </AICard>
                    </CardBody>
                </Card>
            )}

            {/* Terminal State Banner */}
            {isTerminal && (
                <Card className="mb-6 bg-success-50">
                    <CardBody>
                        <div className="flex items-center gap-3">
                            <Check size={24} className="text-success-600" />
                            <div>
                                <p className="font-semibold text-success-800">
                                    Job Completed
                                </p>
                                <p className="text-sm text-success-600">
                                    This job has been closed and all workflow steps are complete.
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-4 border-b border-neutral-200 pb-2 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview', icon: FileText },
                    { id: 'actions', label: 'Step Actions', icon: MessageSquare },
                    { id: 'location', label: 'Location', icon: MapPin },
                    { id: 'voice', label: 'Voice Notes', icon: Mic },
                    { id: 'attachments', label: 'Attachments', icon: FileText },
                    { id: 'audit', label: 'Audit Trail', icon: History },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <Card>
                <CardBody>
                    {activeTab === 'overview' && (
                        <div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="text-sm text-neutral-500 block mb-1">
                                        Client
                                    </label>
                                    <p className="font-medium text-neutral-900">
                                        {job.clientName}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-500 block mb-1">
                                        Email
                                    </label>
                                    <p className="font-medium text-neutral-900">
                                        {job.clientEmail}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-500 block mb-1">
                                        Current Step
                                    </label>
                                    <p className="font-medium text-neutral-900">
                                        {currentStep?.label || job.currentStep}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-500 block mb-1">
                                        Scheduled Date
                                    </label>
                                    <p className="font-medium text-neutral-900">
                                        {formatDate(job.scheduledDate)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-500 block mb-1">
                                        Created
                                    </label>
                                    <p className="font-medium text-neutral-900">
                                        {formatDate(job.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-neutral-500 block mb-1">
                                        Site Address
                                    </label>
                                    <p className="font-medium text-neutral-900">
                                        {job.siteAddress || '—'}
                                    </p>
                                </div>
                            </div>

                            {job.notes && (
                                <div className="mt-6">
                                    <label className="text-sm text-neutral-500 block mb-2">
                                        Notes
                                    </label>
                                    <p className="p-4 bg-neutral-50 rounded-lg text-neutral-700">
                                        {job.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div>
                            {eventsLoading ? (
                                <div className="flex justify-center p-8">
                                    <div className="w-8 h-8 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin" />
                                </div>
                            ) : events.length === 0 ? (
                                <p className="text-center text-neutral-500">No events yet</p>
                            ) : (
                                <Timeline events={mapEventsToTimeline(events)} />
                            )}
                        </div>
                    )}

                    {activeTab === 'actions' && currentStep && (
                        <StepActionPanel
                            currentStep={job.currentStep}
                            currentState={job.status}
                            jobId={job.id}
                            onAction={handleStepAction}
                            comments={stepComments}
                        />
                    )}

                    {activeTab === 'location' && (
                        <GPSLocation
                            location={job.location}
                            geofence={job.geofence}
                            siteAddress={job.siteAddress}
                            onLocationCapture={(location) => {
                                console.log('Location captured:', location);
                                // In production, save to job via mutation
                            }}
                            onGeofenceSet={(geofence) => {
                                console.log('Geofence set:', geofence);
                                // In production, save to job via mutation
                            }}
                        />
                    )}

                    {activeTab === 'voice' && (
                        <div>
                            {/* Voice Recorder */}
                            <VoiceRecorder
                                stepId={job.currentStep}
                                stepName={currentStep?.label}
                                onNoteRecorded={(note) => {
                                    console.log('Voice note recorded:', note);
                                    // In production, save via mutation and refresh
                                    // For demo, we'd add to job.voiceNotes
                                }}
                            />

                            {/* Voice Notes History */}
                            <VoiceNotesHistory
                                notes={job.voiceNotes?.map(note => ({
                                    ...note,
                                    timestamp: new Date(note.timestamp),
                                })) || []}
                                onDelete={(noteId) => {
                                    console.log('Delete voice note:', noteId);
                                    // In production, delete via mutation
                                }}
                            />
                        </div>
                    )}

                    {activeTab === 'attachments' && (
                        <div>
                            <FileUpload
                                onUpload={(files) => {
                                    console.log('Files uploaded:', files);
                                }}
                                existingFiles={[]}
                                onRemove={(fileId) => {
                                    console.log('Remove file:', fileId);
                                }}
                            />
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Decision Modal */}
            {currentDecision && (
                <DecisionModal
                    isOpen={decisionModal.isOpen}
                    question={currentDecision.question}
                    yesLabel="Yes"
                    noLabel="No"
                    onYes={() => handleDecision(true)}
                    onNo={() => handleDecision(false)}
                    onClose={() => setDecisionModal({ isOpen: false, decision: null })}
                    loading={updateLoading}
                />
            )}
        </div>
    );
}
