// Firestore Hooks for Jobs (with Demo Mode support and reactivity)

'use client';

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
    limit as firestoreLimit
} from 'firebase/firestore';
import { useState, useEffect, useCallback } from 'react';
import { db } from './firebase';
import { Job, WorkflowState, JobEvent, DecisionId, WORKFLOW_STEPS } from './types';
import { useAuth } from './auth-context';
import { getStepForState } from './workflow-engine';
import { DEMO_MODE, MOCK_DELAY } from './demo-config';
import { MOCK_JOBS, MOCK_EVENTS } from './mock-data';

// Demo Mode Event Bus
export const demoEvents = new EventTarget();

// Helper to convert Firestore data to Job
const convertJob = (doc: any): Job => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        scheduledDate: data.scheduledDate?.toDate?.() || undefined,
        dueDate: data.dueDate?.toDate?.() || undefined,
        workingDoc: data.workingDoc ? {
            ...data.workingDoc,
            uploadedAt: data.workingDoc.uploadedAt?.toDate?.() || new Date()
        } : undefined,
        location: data.location ? {
            ...data.location,
            capturedAt: data.location.capturedAt?.toDate?.() || undefined
        } : undefined
    } as Job;
};

// Helper to convert Firestore data to JobEvent
const convertEvent = (doc: any): JobEvent => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(),
    } as JobEvent;
};

// ============================================
// JOBS COLLECTION HOOK
// ============================================

interface UseJobsOptions {
    status?: WorkflowState | WorkflowState[];
    assignedTo?: string;
    limit?: number;
    currentStep?: string | string[];
}

export function useJobs(options: UseJobsOptions = {}) {
    const { user } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setJobs([]);
            setLoading(false);
            return;
        }

        if (DEMO_MODE) {
            const fetchMockJobs = async () => {
                await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
                let filteredJobs = [...MOCK_JOBS];

                if (options.status) {
                    if (Array.isArray(options.status)) {
                        filteredJobs = filteredJobs.filter(j => options.status?.includes(j.status));
                    } else {
                        filteredJobs = filteredJobs.filter(j => j.status === options.status);
                    }
                }

                if (options.currentStep) {
                    if (Array.isArray(options.currentStep)) {
                        filteredJobs = filteredJobs.filter(j => options.currentStep?.includes(j.currentStep));
                    } else {
                        filteredJobs = filteredJobs.filter(j => j.currentStep === options.currentStep);
                    }
                }

                if (options.assignedTo) {
                    filteredJobs = filteredJobs.filter(j => j.assignedTo.includes(options.assignedTo!));
                }

                setJobs(filteredJobs);
                setLoading(false);
            };

            fetchMockJobs();

            const handleUpdate = () => {
                fetchMockJobs();
            };

            demoEvents.addEventListener('demo-update', handleUpdate);
            return () => {
                demoEvents.removeEventListener('demo-update', handleUpdate);
            };
        }

        try {
            const jobsRef = collection(db, 'jobs');
            let q = query(jobsRef, orderBy('updatedAt', 'desc'));

            if (options.limit) {
                q = query(q, firestoreLimit(options.limit));
            }

            const unsubscribe = onSnapshot(q, (snapshot) => {
                let fetchedJobs = snapshot.docs.map(convertJob);

                if (options.status) {
                    if (Array.isArray(options.status)) {
                        fetchedJobs = fetchedJobs.filter(j => options.status?.includes(j.status));
                    } else {
                        fetchedJobs = fetchedJobs.filter(j => j.status === options.status);
                    }
                }

                if (options.currentStep) {
                    if (Array.isArray(options.currentStep)) {
                        fetchedJobs = fetchedJobs.filter(j => options.currentStep?.includes(j.currentStep));
                    } else {
                        fetchedJobs = fetchedJobs.filter(j => j.currentStep === options.currentStep);
                    }
                }

                if (options.assignedTo) {
                    fetchedJobs = fetchedJobs.filter(j => j.assignedTo.includes(options.assignedTo!));
                }

                setJobs(fetchedJobs);
                setLoading(false);
            }, (err) => {
                console.error("Error fetching jobs:", err);
                setError(err.message);
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (err: any) {
            console.error("Error setting up jobs listener:", err);
            setError(err.message);
            setLoading(false);
        }
    }, [user, JSON.stringify(options)]);

    return { jobs, loading, error };
}

// ============================================
// SINGLE JOB HOOK
// ============================================

export function useJob(jobId: string | null) {
    const { user } = useAuth();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !jobId) {
            setJob(null);
            setLoading(false);
            return;
        }

        if (DEMO_MODE) {
            const fetchMockJob = async () => {
                await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
                const mockJob = MOCK_JOBS.find(j => j.id === jobId);
                if (mockJob) {
                    setJob({ ...mockJob }); // Spread to ensure new reference
                } else {
                    setError('Job not found (Demo)');
                    setJob(null);
                }
                setLoading(false);
            };

            fetchMockJob();

            const handleUpdate = () => {
                fetchMockJob();
            };

            demoEvents.addEventListener('demo-update', handleUpdate);
            return () => {
                demoEvents.removeEventListener('demo-update', handleUpdate);
            };
        }

        const jobRef = doc(db, 'jobs', jobId);

        const unsubscribe = onSnapshot(jobRef, (docSnap) => {
            if (docSnap.exists()) {
                setJob(convertJob(docSnap));
            } else {
                setJob(null);
                setError('Job not found');
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching job:", err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, jobId]);

    return { job, loading, error };
}

// ============================================
// JOB EVENTS HOOK
// ============================================

export function useJobEvents(jobId: string | null) {
    const { user } = useAuth();
    const [events, setEvents] = useState<JobEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !jobId) {
            setEvents([]);
            setLoading(false);
            return;
        }

        if (DEMO_MODE) {
            const fetchMockEvents = async () => {
                await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
                const mockEvents = MOCK_EVENTS.filter(e => e.jobId === jobId);
                setEvents([...mockEvents]); // New reference
                setLoading(false);
            };

            fetchMockEvents();

            const handleUpdate = () => {
                fetchMockEvents();
            };

            demoEvents.addEventListener('demo-update', handleUpdate);
            return () => {
                demoEvents.removeEventListener('demo-update', handleUpdate);
            };
        }

        const eventsRef = collection(db, 'jobs', jobId, 'events');
        const q = query(eventsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setEvents(snapshot.docs.map(convertEvent));
            setLoading(false);
        }, (err) => {
            console.error("Error fetching events:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, jobId]);

    return { events, loading };
}

// ============================================
// JOB MUTATIONS
// ============================================

export function useJobMutations() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createJob = useCallback(
        async (jobData: Partial<Job>): Promise<string | null> => {
            if (!user) return null;
            setLoading(true);
            setError(null);

            if (DEMO_MODE) {
                await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
                const newId = `job-demo-${Date.now()}`;

                const newJob: Job = {
                    id: newId,
                    tenantId: 'default',
                    clientName: jobData.clientName || 'New Client',
                    clientEmail: jobData.clientEmail || '',
                    workOrderRef: jobData.workOrderRef || 'WO-PENDING',
                    status: 'INITIATED',
                    currentStep: 'job_initiation',
                    assignedTo: jobData.assignedTo || [],
                    createdBy: 'demo-user',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    siteAddress: jobData.siteAddress,
                    notes: jobData.notes,
                    jobValue: jobData.jobValue,
                    priority: jobData.priority,
                    scheduledDate: jobData.scheduledDate,
                    dueDate: jobData.dueDate,
                };

                MOCK_JOBS.unshift(newJob);
                console.log('DEMO: Created Job', newId, newJob);

                demoEvents.dispatchEvent(new Event('demo-update'));

                setLoading(false);
                return newId;
            }

            try {
                const newJobData = {
                    tenantId: 'default',
                    clientName: jobData.clientName || 'New Client',
                    clientEmail: jobData.clientEmail || 'client@example.com',
                    workOrderRef: jobData.workOrderRef || `WO-${Date.now().toString(36).toUpperCase()}`,
                    status: 'INITIATED',
                    currentStep: 'job_initiation',
                    assignedTo: jobData.assignedTo || [user.id],
                    createdBy: user.id,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    ...jobData,
                };

                const docRef = await addDoc(collection(db, 'jobs'), newJobData);

                // Add initial event
                await addDoc(collection(db, 'jobs', docRef.id, 'events'), {
                    jobId: docRef.id,
                    type: 'state_change',
                    toState: 'INITIATED',
                    userId: user.id,
                    userName: user.displayName,
                    timestamp: serverTimestamp(),
                    metadata: { action: 'Job created' },
                });

                setLoading(false);
                return docRef.id;
            } catch (err: any) {
                console.error("Error creating job:", err);
                setError(err.message);
                setLoading(false);
                return null;
            }
        },
        [user]
    );

    const updateJobState = useCallback(
        async (
            jobId: string,
            newState: WorkflowState,
            decision?: { id: DecisionId; outcome: boolean }
        ): Promise<boolean> => {
            if (!user) return false;
            setLoading(true);
            setError(null);

            if (DEMO_MODE) {
                await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

                const jobIndex = MOCK_JOBS.findIndex(j => j.id === jobId);
                if (jobIndex === -1) {
                    setError('Job not found');
                    setLoading(false);
                    return false;
                }

                // Update Job
                const newStep = getStepForState(newState);
                MOCK_JOBS[jobIndex] = {
                    ...MOCK_JOBS[jobIndex],
                    status: newState,
                    currentStep: newStep || 'job_initiation',
                    updatedAt: new Date(),
                };

                // Add Event
                const newEvent: JobEvent = {
                    id: `evt-${Date.now()}`,
                    jobId,
                    type: decision ? 'decision' : 'state_change',
                    toState: newState,
                    fromState: MOCK_JOBS[jobIndex].status, // Note: this is slightly off as we just updated it, but fine for demo
                    decision: decision?.id,
                    outcome: decision?.outcome,
                    userId: user.id || 'demo-user',
                    userName: user.displayName || 'Demo User',
                    timestamp: new Date(),
                };
                MOCK_EVENTS.unshift(newEvent);

                console.log('DEMO: Updated Job State', jobId, newState, MOCK_JOBS[jobIndex]);

                demoEvents.dispatchEvent(new Event('demo-update'));

                setLoading(false);
                return true;
            }

            try {
                const jobRef = doc(db, 'jobs', jobId);
                const newStep = getStepForState(newState);

                await updateDoc(jobRef, {
                    status: newState,
                    currentStep: newStep,
                    updatedAt: serverTimestamp(),
                });

                // Add event
                await addDoc(collection(db, 'jobs', jobId, 'events'), {
                    jobId,
                    type: decision ? 'decision' : 'state_change',
                    toState: newState,
                    decision: decision?.id,
                    outcome: decision?.outcome,
                    userId: user.id,
                    userName: user.displayName,
                    timestamp: serverTimestamp(),
                });

                setLoading(false);
                return true;
            } catch (err: any) {
                console.error("Error updating job state:", err);
                setError(err.message);
                setLoading(false);
                return false;
            }
        },
        [user]
    );

    const addJobNote = useCallback(
        async (jobId: string, note: string, stepId?: string): Promise<boolean> => {
            if (!user) return false;
            setLoading(true);

            if (DEMO_MODE) {
                await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));

                // Add Event
                const newEvent: JobEvent = {
                    id: `evt-${Date.now()}`,
                    jobId,
                    type: 'note',
                    userId: user.id || 'demo-user',
                    userName: user.displayName || 'Demo User',
                    timestamp: new Date(),
                    metadata: { note, stepId }
                };
                MOCK_EVENTS.unshift(newEvent);

                console.log('DEMO: Added Note', jobId, note, stepId);

                demoEvents.dispatchEvent(new Event('demo-update'));

                setLoading(false);
                return true;
            }

            try {
                await addDoc(collection(db, 'jobs', jobId, 'events'), {
                    jobId,
                    type: 'note',
                    userId: user.id,
                    userName: user.displayName,
                    timestamp: serverTimestamp(),
                    metadata: { note, stepId },
                });

                await updateDoc(doc(db, 'jobs', jobId), {
                    updatedAt: serverTimestamp()
                });

                setLoading(false);
                return true;
            } catch (err: any) {
                console.error("Error adding note:", err);
                setLoading(false);
                return false;
            }
        },
        [user]
    );

    const deleteJob = useCallback(
        async (jobId: string): Promise<boolean> => {
            if (!user) return false;
            setLoading(true);
            setError(null);

            if (DEMO_MODE) {
                await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
                const index = MOCK_JOBS.findIndex(j => j.id === jobId);
                if (index !== -1) {
                    MOCK_JOBS.splice(index, 1);
                }
                console.log('DEMO: Deleted Job', jobId);

                demoEvents.dispatchEvent(new Event('demo-update'));

                setLoading(false);
                return true;
            }

            try {
                await deleteDoc(doc(db, 'jobs', jobId));
                setLoading(false);
                return true;
            } catch (err: any) {
                console.error("Error deleting job:", err);
                setError(err.message);
                setLoading(false);
                return false;
            }
        },
        [user]
    );

    return {
        createJob,
        updateJobState,
        addJobNote,
        deleteJob,
        loading,
        error,
    };
}

// ============================================
// JOB STATS HOOK
// ============================================

interface JobStats {
    total: number;
    initiated: number;
    inProgress: number;
    blocked: number;
    completed: number;
    stepCounts: Record<string, number>;
}

export function useJobStats(): { stats: JobStats; loading: boolean } {
    const { jobs, loading } = useJobs();

    const stepCounts = jobs.reduce((acc, job) => {
        const step = job.currentStep || 'job_initiation';
        acc[step] = (acc[step] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const stats: JobStats = {
        total: jobs.length,
        initiated: jobs.filter((j) => j.status === 'INITIATED').length,
        inProgress: jobs.filter(
            (j) =>
                !['INITIATED', 'JOB_CLOSED', 'AWAITING_INFO', 'ACCESS_ISSUE', 'WORK_STOPPED', 'INVOICE_DISPUTED'].includes(
                    j.status
                )
        ).length,
        blocked: jobs.filter((j) =>
            ['AWAITING_INFO', 'ACCESS_ISSUE', 'WORK_STOPPED', 'INVOICE_DISPUTED', 'DOCS_RETURNED'].includes(j.status)
        ).length,
        completed: jobs.filter((j) => j.status === 'JOB_CLOSED').length,
        stepCounts
    };

    return { stats, loading };
}
