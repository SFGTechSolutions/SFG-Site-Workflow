// Reusable Job List Page Component

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Briefcase,
    Plus,
    Search,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useJobs, useJobMutations } from '@/lib/hooks';
import {
    Card,
    CardHeader,
    CardBody,
    Button,
    EmptyState,
    TableSkeleton,
    JobRow,
} from '@/components/ui';
import { WorkflowState } from '@/lib/types';
import { JobCreationModal } from '@/components/job-creation-modal';
import { ExtractedJobData } from '@/lib/document-processor';

interface JobListPageProps {
    title: string;
    status?: WorkflowState | WorkflowState[];
    currentStep?: string | string[];
    emptyMessage?: string;
}

export function JobListPage({ title, status, currentStep, emptyMessage }: JobListPageProps) {
    const { user, loading: authLoading } = useAuth();
    const { jobs, loading: jobsLoading } = useJobs({ status, currentStep });
    const { createJob } = useJobMutations();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const handleCreateJob = async () => {
        const jobId = await createJob({
            clientName: 'New Client',
            clientEmail: 'client@example.com',
            workOrderRef: `WO-${Date.now().toString(36).toUpperCase()}`,
            assignedTo: user ? [user.id] : [],
        });

        if (jobId) {
            router.push(`/jobs/${jobId}`);
        }
    };

    const handleDocumentUpload = async (extractedData: ExtractedJobData, file?: File) => {
        const jobId = await createJob({
            clientName: extractedData.clientName || 'New Client',
            clientEmail: extractedData.clientEmail || 'client@example.com',
            workOrderRef: extractedData.workOrderRef || `WO-${Date.now().toString(36).toUpperCase()}`,
            assignedTo: user ? [user.id] : [],
            siteAddress: extractedData.siteAddress,
            notes: [extractedData.workDescription, extractedData.notes].filter(Boolean).join('\n'),
            dueDate: extractedData.dueDate ? new Date(extractedData.dueDate) : undefined,
            scheduledDate: extractedData.scheduledDate ? new Date(extractedData.scheduledDate) : undefined,
            jobValue: extractedData.jobValue,
            priority: extractedData.priority,
            ragStatus: extractedData.ragStatus,
            workingDoc: file ? {
                name: file.name,
                url: URL.createObjectURL(file),
                uploadedAt: new Date()
            } : undefined
        });

        setShowCreateModal(false);
        if (jobId) {
            router.push(`/jobs/${jobId}`);
        }
    };

    const handleJobClick = (jobId: string) => {
        router.push(`/jobs/${jobId}`);
    };

    const filteredJobs = jobs.filter(
        (job) =>
            job.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.workOrderRef.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="loading-spinner w-10 h-10" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
            </div>

            <Card>
                <CardHeader
                    action={
                        (user.role === 'admin' || user.role === 'office') && (
                            <Button
                                icon={<Plus size={16} />}
                                onClick={() => setShowCreateModal(true)}
                            // loading={createLoading}
                            >
                                New Job
                            </Button>
                        )
                    }
                >
                    <div className="flex items-center gap-4">
                        <div className="relative min-w-[300px]">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                            />
                            <input
                                type="text"
                                className="form-input pl-10"
                                placeholder="Search jobs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>

                <CardBody className="p-0">
                    {jobsLoading ? (
                        <div className="p-4">
                            <TableSkeleton rows={5} />
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <EmptyState
                            icon={<Briefcase size={48} />}
                            title="No jobs found"
                            description={
                                searchQuery
                                    ? 'No jobs match your search.'
                                    : emptyMessage || `No jobs currently in ${title} stage.`
                            }
                        />
                    ) : (
                        <div className="table-container border-0 rounded-none">
                            <table className="table table-clickable">
                                <thead>
                                    <tr>
                                        <th>Work Order</th>
                                        <th>Client</th>
                                        <th className="hidden sm:table-cell">Status</th>
                                        <th className="hidden md:table-cell">Current Step</th>
                                        <th className="hidden lg:table-cell">Scheduled</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredJobs.map((job) => (
                                        <JobRow
                                            key={job.id}
                                            id={job.id}
                                            workOrderRef={job.workOrderRef}
                                            clientName={job.clientName}
                                            status={job.status}
                                            currentStep={job.currentStep}
                                            scheduledDate={job.scheduledDate}
                                            onClick={() => handleJobClick(job.id)}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Job Creation Modal */}
            {showCreateModal && (
                <JobCreationModal
                    onClose={() => setShowCreateModal(false)}
                    onManualCreate={handleCreateJob}
                    onUploadCreate={handleDocumentUpload}
                />
            )}
        </div>
    );
}
