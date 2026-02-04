// All Jobs Page

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Briefcase,
    Plus,
    Search,
    Filter,
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
import { JobCreationModal } from '@/components/job-creation-modal';
import { ExtractedJobData } from '@/lib/document-processor';

export default function JobsPage() {
    const { user, loading: authLoading } = useAuth();
    const { jobs, loading: jobsLoading } = useJobs();
    const { createJob, deleteJob, loading: mutationLoading } = useJobMutations();
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

    const handleDeleteJob = async (e: React.MouseEvent, jobId: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this job?')) {
            await deleteJob(jobId);
        }
    };

    const handleJobClick = (jobId: string) => {
        router.push(`/jobs/${jobId}`);
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

    const filteredJobs = jobs.filter(
        (job) =>
            job.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.workOrderRef.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-neutral-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-neutral-900">All Jobs</h1>
            </div>

            <Card>
                <CardHeader
                    action={
                        (user.role === 'admin' || user.role === 'office') && (
                            <div className="flex gap-2">
                                <Button
                                    icon={<Plus size={16} />}
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    New Job
                                </Button>
                            </div>
                        )
                    }
                >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <div className="relative flex-1">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                            />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                                placeholder="Search jobs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button variant="ghost" icon={<Filter size={18} />}>
                            Filter
                        </Button>
                    </div>
                </CardHeader>

                <CardBody className="p-0">
                    {jobsLoading ? (
                        <div className="p-4">
                            <TableSkeleton rows={10} />
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <EmptyState
                            icon={<Briefcase size={48} />}
                            title="No jobs found"
                            description={
                                searchQuery
                                    ? 'No jobs match your search.'
                                    : 'Get started by creating your first job.'
                            }
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-neutral-50 border-b border-neutral-200">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Work Order</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Client</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Status</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Current Step</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Scheduled</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-neutral-100">
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
                                            onDelete={(e) => handleDeleteJob(e, job.id)}
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
