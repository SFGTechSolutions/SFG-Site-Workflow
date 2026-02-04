// New Job Wizard - Multi-step job creation with client entry

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Building2,
    User,
    MapPin,
    FileText,
    Calendar,
    Users,
} from 'lucide-react';
import { Card, CardBody, Button } from './ui';
import { useJobMutations } from '@/lib/hooks';

interface ClientData {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
}

interface JobData {
    workOrderRef: string;
    siteAddress: string;
    scheduledDate: string;
    workScope: string;
    notes: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
}

const STEPS = [
    { id: 'client', label: 'Client Details', icon: Building2 },
    { id: 'site', label: 'Site Information', icon: MapPin },
    { id: 'work', label: 'Work Details', icon: FileText },
    { id: 'schedule', label: 'Schedule & Assign', icon: Calendar },
    { id: 'review', label: 'Review & Create', icon: Check },
];

interface NewJobWizardProps {
    onClose: () => void;
    onComplete?: (jobId: string) => void;
}

export function NewJobWizard({ onClose, onComplete }: NewJobWizardProps) {
    const router = useRouter();
    const { createJob, loading } = useJobMutations();
    const [currentStep, setCurrentStep] = useState(0);
    const [client, setClient] = useState<ClientData>({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
    });
    const [job, setJob] = useState<JobData>({
        workOrderRef: '',
        siteAddress: '',
        scheduledDate: '',
        workScope: '',
        notes: '',
        priority: 'normal',
    });

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        const jobId = await createJob({
            clientName: client.companyName,
            clientEmail: client.email,
            workOrderRef: job.workOrderRef || `WO-${Date.now().toString(36).toUpperCase()}`,
            siteAddress: job.siteAddress || client.address,
            scheduledDate: job.scheduledDate ? new Date(job.scheduledDate) : undefined,
            notes: job.notes,
        });

        if (jobId) {
            onComplete?.(jobId);
            router.push(`/jobs/${jobId}`);
        }
    };

    const isStepComplete = (stepIndex: number) => {
        switch (stepIndex) {
            case 0:
                return client.companyName && client.email;
            case 1:
                return job.siteAddress || client.address;
            case 2:
                return job.workScope;
            case 3:
                return true; // Schedule is optional
            case 4:
                return true;
            default:
                return false;
        }
    };

    const canProceed = isStepComplete(currentStep);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: 'var(--space-4)',
            }}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: 'var(--radius-xl)',
                    width: '100%',
                    maxWidth: 700,
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: 'var(--space-6)',
                        borderBottom: '1px solid var(--neutral-200)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                            Create New Job
                        </h2>
                        <Button variant="ghost" onClick={onClose}>
                            ✕
                        </Button>
                    </div>

                    {/* Progress Steps */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 'var(--space-2)',
                            marginTop: 'var(--space-4)',
                        }}
                    >
                        {STEPS.map((step, index) => (
                            <div
                                key={step.id}
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'var(--space-1)',
                                }}
                            >
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor:
                                            index < currentStep
                                                ? 'var(--success-500)'
                                                : index === currentStep
                                                    ? 'var(--primary-500)'
                                                    : 'var(--neutral-200)',
                                        color: index <= currentStep ? 'white' : 'var(--neutral-500)',
                                    }}
                                >
                                    {index < currentStep ? <Check size={16} /> : <step.icon size={16} />}
                                </div>
                                <span
                                    style={{
                                        fontSize: 'var(--text-xs)',
                                        color: index === currentStep ? 'var(--primary-600)' : 'var(--neutral-500)',
                                        textAlign: 'center',
                                    }}
                                >
                                    {step.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        padding: 'var(--space-6)',
                    }}
                >
                    {/* Step 1: Client Details */}
                    {currentStep === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            {/* Client File Upload */}
                            <div
                                style={{
                                    border: '2px dashed var(--primary-300)',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--space-4)',
                                    textAlign: 'center',
                                    backgroundColor: 'var(--primary-50)',
                                    cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="file"
                                    accept=".csv,.json,.xlsx"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            try {
                                                const content = event.target?.result as string;

                                                if (file.name.endsWith('.json')) {
                                                    const data = JSON.parse(content);
                                                    // Handle array or single object
                                                    const clientData = Array.isArray(data) ? data[0] : data;
                                                    setClient({
                                                        companyName: clientData.companyName || clientData.company || clientData.name || '',
                                                        contactName: clientData.contactName || clientData.contact || '',
                                                        email: clientData.email || clientData.Email || '',
                                                        phone: clientData.phone || clientData.Phone || '',
                                                        address: clientData.address || clientData.Address || '',
                                                    });
                                                } else if (file.name.endsWith('.csv')) {
                                                    const lines = content.split('\n');
                                                    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
                                                    if (lines.length > 1) {
                                                        const values = lines[1].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                                                        const record: Record<string, string> = {};
                                                        headers.forEach((h, i) => { record[h] = values[i] || ''; });
                                                        setClient({
                                                            companyName: record.companyname || record.company || record.name || '',
                                                            contactName: record.contactname || record.contact || '',
                                                            email: record.email || '',
                                                            phone: record.phone || '',
                                                            address: record.address || '',
                                                        });
                                                    }
                                                }
                                            } catch (err) {
                                                console.error('Error parsing file:', err);
                                            }
                                        };
                                        reader.readAsText(file);
                                    }}
                                    style={{ display: 'none' }}
                                    id="client-upload"
                                />
                                <label htmlFor="client-upload" style={{ cursor: 'pointer' }}>
                                    <div style={{ marginBottom: 'var(--space-2)' }}>
                                        <span style={{ fontSize: 'var(--text-2xl)' }}>📁</span>
                                    </div>
                                    <p style={{ margin: 0, fontWeight: 'var(--font-medium)', color: 'var(--primary-700)' }}>
                                        Upload Client Data
                                    </p>
                                    <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--neutral-500)' }}>
                                        CSV, JSON, or Excel file to auto-populate fields
                                    </p>
                                </label>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--neutral-200)' }} />
                                <span style={{ color: 'var(--neutral-400)', fontSize: 'var(--text-sm)' }}>or enter manually</span>
                                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--neutral-200)' }} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                    Company Name *
                                </label>
                                <input
                                    type="text"
                                    value={client.companyName}
                                    onChange={(e) => setClient({ ...client, companyName: e.target.value })}
                                    placeholder="Enter company name"
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--neutral-300)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                    Contact Name
                                </label>
                                <input
                                    type="text"
                                    value={client.contactName}
                                    onChange={(e) => setClient({ ...client, contactName: e.target.value })}
                                    placeholder="Primary contact person"
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--neutral-300)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                        Email *
                                    </label>
                                    <input
                                        type="email"
                                        value={client.email}
                                        onChange={(e) => setClient({ ...client, email: e.target.value })}
                                        placeholder="email@company.com"
                                        style={{
                                            width: '100%',
                                            padding: 'var(--space-3)',
                                            border: '1px solid var(--neutral-300)',
                                            borderRadius: 'var(--radius-md)',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={client.phone}
                                        onChange={(e) => setClient({ ...client, phone: e.target.value })}
                                        placeholder="+61 4XX XXX XXX"
                                        style={{
                                            width: '100%',
                                            padding: 'var(--space-3)',
                                            border: '1px solid var(--neutral-300)',
                                            borderRadius: 'var(--radius-md)',
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                    Business Address
                                </label>
                                <input
                                    type="text"
                                    value={client.address}
                                    onChange={(e) => setClient({ ...client, address: e.target.value })}
                                    placeholder="Street address, City, State, Postcode"
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--neutral-300)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Site Information */}
                    {currentStep === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div
                                style={{
                                    padding: 'var(--space-3)',
                                    backgroundColor: 'var(--primary-50)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--space-2)',
                                }}
                            >
                                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--primary-700)' }}>
                                    <strong>Tip:</strong> If the work site is different from the client address, enter it below.
                                </p>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                    Site Address *
                                </label>
                                <input
                                    type="text"
                                    value={job.siteAddress}
                                    onChange={(e) => setJob({ ...job, siteAddress: e.target.value })}
                                    placeholder={client.address || "Enter work site address"}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--neutral-300)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                            </div>
                            <div>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setJob({ ...job, siteAddress: client.address })}
                                    disabled={!client.address}
                                >
                                    Use Client Address
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Work Details */}
                    {currentStep === 2 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                    Work Order Reference
                                </label>
                                <input
                                    type="text"
                                    value={job.workOrderRef}
                                    onChange={(e) => setJob({ ...job, workOrderRef: e.target.value })}
                                    placeholder="Auto-generated if left blank"
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--neutral-300)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                    Work Scope / Description *
                                </label>
                                <textarea
                                    value={job.workScope}
                                    onChange={(e) => setJob({ ...job, workScope: e.target.value })}
                                    placeholder="Describe the work to be performed..."
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--neutral-300)',
                                        borderRadius: 'var(--radius-md)',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                    Priority
                                </label>
                                <select
                                    value={job.priority}
                                    onChange={(e) => setJob({ ...job, priority: e.target.value as JobData['priority'] })}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--neutral-300)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                >
                                    <option value="low">Low</option>
                                    <option value="normal">Normal</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Schedule & Assign */}
                    {currentStep === 3 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                    Scheduled Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={job.scheduledDate}
                                    onChange={(e) => setJob({ ...job, scheduledDate: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--neutral-300)',
                                        borderRadius: 'var(--radius-md)',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--space-1)', fontWeight: 'var(--font-medium)' }}>
                                    Additional Notes
                                </label>
                                <textarea
                                    value={job.notes}
                                    onChange={(e) => setJob({ ...job, notes: e.target.value })}
                                    placeholder="Any special instructions or notes..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: 'var(--space-3)',
                                        border: '1px solid var(--neutral-300)',
                                        borderRadius: 'var(--radius-md)',
                                        resize: 'vertical',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 4 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                            <h3 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>Review Job Details</h3>

                            <Card>
                                <CardBody>
                                    <h4 style={{ margin: '0 0 var(--space-3) 0', color: 'var(--neutral-600)' }}>Client</h4>
                                    <p style={{ margin: '0 0 var(--space-1) 0', fontWeight: 'var(--font-medium)' }}>
                                        {client.companyName}
                                    </p>
                                    <p style={{ margin: 0, color: 'var(--neutral-500)', fontSize: 'var(--text-sm)' }}>
                                        {client.contactName && `${client.contactName} • `}{client.email}
                                    </p>
                                </CardBody>
                            </Card>

                            <Card>
                                <CardBody>
                                    <h4 style={{ margin: '0 0 var(--space-3) 0', color: 'var(--neutral-600)' }}>Work Details</h4>
                                    <p style={{ margin: '0 0 var(--space-2) 0' }}>
                                        <strong>Site:</strong> {job.siteAddress || client.address || '—'}
                                    </p>
                                    <p style={{ margin: '0 0 var(--space-2) 0' }}>
                                        <strong>Scope:</strong> {job.workScope || '—'}
                                    </p>
                                    <p style={{ margin: '0 0 var(--space-2) 0' }}>
                                        <strong>Priority:</strong> {job.priority}
                                    </p>
                                    {job.scheduledDate && (
                                        <p style={{ margin: 0 }}>
                                            <strong>Scheduled:</strong> {new Date(job.scheduledDate).toLocaleString()}
                                        </p>
                                    )}
                                </CardBody>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: 'var(--space-4) var(--space-6)',
                        borderTop: '1px solid var(--neutral-200)',
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <Button
                        variant="secondary"
                        onClick={currentStep === 0 ? onClose : handleBack}
                        icon={currentStep > 0 ? <ArrowLeft size={16} /> : undefined}
                    >
                        {currentStep === 0 ? 'Cancel' : 'Back'}
                    </Button>

                    {currentStep < STEPS.length - 1 ? (
                        <Button
                            variant="primary"
                            onClick={handleNext}
                            disabled={!canProceed}
                            icon={<ArrowRight size={16} />}
                        >
                            Continue
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            loading={loading}
                            icon={<Check size={16} />}
                        >
                            Create Job
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
