// Job Context - Provides current job data to VoiceAssistant and other components

'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Job, WorkflowStep, WorkflowState } from './types';

interface JobContextType {
    currentJob: Job | null;
    setCurrentJob: (job: Job | null) => void;
    // Quick access to key job data for voice assistant
    getVoiceContext: () => {
        currentJobId?: string;
        currentStep?: string;
        currentState?: string;
        jobNotes?: string[];
        clientName?: string;
        siteAddress?: string;
        assignedTo?: string[];
        dueDate?: string;
        workOrderRef?: string;
    };
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
    const [currentJob, setCurrentJob] = useState<Job | null>(null);

    const getVoiceContext = useCallback(() => {
        if (!currentJob) {
            return {};
        }
        // Convert notes string to array if needed
        const notesArray = currentJob.notes
            ? currentJob.notes.split('\n').filter(n => n.trim())
            : [];

        return {
            currentJobId: currentJob.id,
            currentStep: currentJob.currentStep,
            currentState: currentJob.status,  // Job uses 'status' not 'currentState'
            jobNotes: notesArray,
            clientName: currentJob.clientName,
            siteAddress: currentJob.siteAddress,
            assignedTo: currentJob.assignedTo,
            dueDate: currentJob.dueDate?.toISOString().split('T')[0],
            workOrderRef: currentJob.workOrderRef,
        };
    }, [currentJob]);

    return (
        <JobContext.Provider value={{ currentJob, setCurrentJob, getVoiceContext }}>
            {children}
        </JobContext.Provider>
    );
}

export function useJobContext() {
    const context = useContext(JobContext);
    if (context === undefined) {
        throw new Error('useJobContext must be used within a JobProvider');
    }
    return context;
}

// Hook for voice assistant to get current job context
export function useVoiceContext() {
    const context = useContext(JobContext);
    if (!context) {
        return {
            currentJobId: undefined,
            currentStep: undefined,
            currentState: undefined,
            jobNotes: undefined,
            clientName: undefined,
            siteAddress: undefined,
            assignedTo: undefined,
            dueDate: undefined,
            workOrderRef: undefined,
        };
    }
    return context.getVoiceContext();
}
