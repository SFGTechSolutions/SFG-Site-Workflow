// JobUpload Component - Create jobs from document uploads

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, Image, File, Loader2, Check, X, Sparkles, Edit, AlertCircle, FileJson, Workflow } from 'lucide-react';
import { processDocument, ExtractedJobData, getSupportedFileTypes, extractWorkflowSpec } from '@/lib/document-processor';
import { Button } from './ui';
import { WorkflowSpecification } from '@/lib/types';

interface JobUploadProps {
    onJobCreated: (data: ExtractedJobData, file?: File) => void;
    onClose: () => void;
}

export function JobUpload({ onJobCreated, onClose }: JobUploadProps) {
    const [mode, setMode] = useState<'job' | 'workflow'>('job');
    const [state, setState] = useState<'upload' | 'processing' | 'preview' | 'error'>('upload');

    // Job Data State
    const [extractedData, setExtractedData] = useState<ExtractedJobData | null>(null);
    const [editedData, setEditedData] = useState<ExtractedJobData | null>(null);

    // Workflow Data State
    const [workflowSpec, setWorkflowSpec] = useState<WorkflowSpecification | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (file: File) => {
        setFileName(file.name);
        setSelectedFile(file);
        setState('processing');
        setError(null);

        try {
            if (mode === 'job') {
                const data = await processDocument(file);
                setExtractedData(data);
                setEditedData(data);
            } else {
                const spec = await extractWorkflowSpec(file);
                if (!spec || spec.length === 0) {
                    throw new Error('No workflow steps could be extracted.');
                }
                setWorkflowSpec(spec);
            }
            setState('preview');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process document');
            setState('error');
        }
    }, [mode]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleFieldChange = (field: keyof ExtractedJobData, value: string) => {
        setEditedData(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleCreate = () => {
        if (mode === 'job' && editedData) {
            onJobCreated(editedData, selectedFile || undefined);
        } else if (mode === 'workflow' && workflowSpec) {
            // For now, just log it or maybe show a success toast. 
            // Ideally this would callback onWorkflowCreated(workflowSpec)
            console.log('Workflow Created:', workflowSpec);
            onClose();
        }
    };

    const getFileIcon = () => {
        if (fileName.endsWith('.pdf')) return <FileText size={48} className="text-red-500" />;
        if (fileName.endsWith('.docx')) return <File size={48} className="text-blue-500" />;
        if (fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <Image size={48} className="text-green-500" />;
        return <File size={48} className="text-neutral-400" />;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-2 text-primary-600">
                        {mode === 'job' ? <Sparkles size={20} /> : <Workflow size={20} />}
                        <h3 className="font-semibold text-neutral-900">
                            {mode === 'job' ? 'Create Job from Document' : 'Extract Workflow Specification'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 md:p-8">
                    {/* Mode Toggle (Only showing in Upload state) */}
                    {state === 'upload' && (
                        <div className="flex justify-center mb-8">
                            <div className="bg-neutral-100 p-1 rounded-lg inline-flex">
                                <button
                                    onClick={() => setMode('job')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'job' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-900'}`}
                                >
                                    Job Data
                                </button>
                                <button
                                    onClick={() => setMode('workflow')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'workflow' ? 'bg-white shadow-sm text-primary-600' : 'text-neutral-500 hover:text-neutral-900'}`}
                                >
                                    Workflow Spec
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Upload State */}
                    {state === 'upload' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onClick={() => fileInputRef.current?.click()}
                                className="group w-full max-w-xl border-2 border-dashed border-neutral-200 hover:border-primary-500 hover:bg-primary-50/30 rounded-2xl p-12 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
                            >
                                <div className="w-20 h-20 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-300">
                                    <Upload size={40} />
                                </div>
                                <h4 className="text-xl font-semibold text-neutral-900 mb-2">
                                    Drop your {mode === 'job' ? 'job document' : 'workflow spec'} here
                                </h4>
                                <p className="text-neutral-500 mb-8 max-w-sm">
                                    {mode === 'job'
                                        ? 'Upload a PDF, Word document, or image to automatically extract job details.'
                                        : 'Upload a PDF to extract structured workflow steps into JSON.'}
                                </p>

                                <div className="flex flex-wrap justify-center gap-3">
                                    {[
                                        { icon: FileText, label: 'PDF' },
                                        { icon: Image, label: 'Photo' },
                                        { icon: File, label: 'Word' },
                                    ].map((type) => (
                                        <div key={type.label} className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-medium text-neutral-600">
                                            <type.icon size={14} />
                                            {type.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={getSupportedFileTypes()}
                                onChange={handleInputChange}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Processing State */}
                    {state === 'processing' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                            <div className="mb-8 relative">
                                <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full animate-pulse" />
                                <div className="relative bg-white p-6 rounded-2xl shadow-lg border border-neutral-100">
                                    {getFileIcon()}
                                </div>
                            </div>

                            <h4 className="text-xl font-semibold text-neutral-900 mb-2">
                                Analyzing {mode === 'job' ? 'Document' : 'Specification'}
                            </h4>
                            <div className="flex items-center gap-2 text-primary-600 mb-2">
                                <Loader2 size={18} className="animate-spin" />
                                <span className="font-medium">Extracting {mode === 'job' ? 'job details' : 'workflow steps'}...</span>
                            </div>
                        </div>
                    )}

                    {/* Preview State - JOB DATA */}
                    {state === 'preview' && mode === 'job' && editedData && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Confidence Banner */}
                            <div className={`
                                flex items-center justify-between p-4 rounded-xl mb-6 border
                                ${extractedData!.confidence > 0.7
                                    ? 'bg-success-50 border-success-100 text-success-900'
                                    : 'bg-warning-50 border-warning-100 text-warning-900'}
                            `}>
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        p-2 rounded-full shrink-0
                                        ${extractedData!.confidence > 0.7 ? 'bg-success-100 text-success-600' : 'bg-warning-100 text-warning-600'}
                                    `}>
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">AI Extraction Complete</p>
                                        <p className="text-xs opacity-90">
                                            {extractedData!.confidence > 0.7
                                                ? 'High confidence in extraction results'
                                                : 'Please review the details carefully'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold leading-none">
                                        {Math.round(extractedData!.confidence * 100)}%
                                    </p>
                                    <p className="text-xs opacity-80 mt-1">Confidence</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <h5 className="font-medium text-neutral-900 border-b border-neutral-100 pb-2">Client Details</h5>
                                    <FormField
                                        label="Client Name"
                                        value={editedData.clientName || ''}
                                        onChange={(v) => handleFieldChange('clientName', v)}
                                    />
                                    <FormField
                                        label="Client Email"
                                        value={editedData.clientEmail || ''}
                                        onChange={(v) => handleFieldChange('clientEmail', v)}
                                        type="email"
                                    />
                                    <FormField
                                        label="Site Address"
                                        value={editedData.siteAddress || ''}
                                        onChange={(v) => handleFieldChange('siteAddress', v)}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h5 className="font-medium text-neutral-900 border-b border-neutral-100 pb-2">Job Information</h5>
                                    <FormField
                                        label="Work Order Ref"
                                        value={editedData.workOrderRef || ''}
                                        onChange={(v) => handleFieldChange('workOrderRef', v)}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            label="Scheduled Date"
                                            value={editedData.scheduledDate || ''}
                                            onChange={(v) => handleFieldChange('scheduledDate', v)}
                                            type="date"
                                        />
                                        <FormField
                                            label="Priority"
                                            value={editedData.priority || 'Medium'}
                                            onChange={(v) => handleFieldChange('priority', v)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            label="Job Value"
                                            value={editedData.jobValue || ''}
                                            onChange={(v) => handleFieldChange('jobValue', v)}
                                            placeholder="$0.00"
                                        />
                                        <div className="flex flex-col">
                                            <label className="text-xs font-medium text-neutral-600 mb-1.5">RAG Status</label>
                                            <div className={`
                                                flex-1 flex items-center justify-center rounded-lg border text-sm font-medium
                                                ${editedData.ragStatus === 'Red' ? 'bg-red-50 border-red-200 text-red-700' :
                                                    editedData.ragStatus === 'Amber' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                        'bg-green-50 border-green-200 text-green-700'}
                                            `}>
                                                {editedData.ragStatus || 'Green'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-4">
                                    <h5 className="font-medium text-neutral-900 border-b border-neutral-100 pb-2">Description & Notes</h5>
                                    <FormField
                                        label="Work Description"
                                        value={editedData.workDescription || ''}
                                        onChange={(v) => handleFieldChange('workDescription', v)}
                                        multiline
                                    />
                                    <FormField
                                        label="Notes"
                                        value={editedData.notes || ''}
                                        onChange={(v) => handleFieldChange('notes', v)}
                                        multiline
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview State - WORKFLOW SPEC */}
                    {state === 'preview' && mode === 'workflow' && workflowSpec && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="bg-success-50 border border-success-100 text-success-900 p-4 rounded-xl mb-6 flex items-center gap-3">
                                <FileJson className="text-success-600" size={20} />
                                <div>
                                    <p className="font-medium text-sm">Workflow Specification Extracted</p>
                                    <p className="text-xs opacity-90">{workflowSpec.length} steps identified</p>
                                </div>
                            </div>

                            <div className="bg-neutral-950 text-neutral-50 rounded-lg p-4 font-mono text-xs overflow-auto max-h-[400px]">
                                <pre>{JSON.stringify(workflowSpec, null, 2)}</pre>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {state === 'error' && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                            <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                                Processing Failed
                            </h4>
                            <p className="text-neutral-500 mb-8 max-w-sm">
                                {error || 'Something went wrong while processing your document. Please try again.'}
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => setState('upload')}
                            >
                                Try Again
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {state === 'preview' && (
                    <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex gap-4 shrink-0">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setState('upload');
                                setExtractedData(null);
                                setEditedData(null);
                                setWorkflowSpec(null);
                            }}
                            className="flex-1"
                        >
                            Start Over
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleCreate}
                            className="flex-[2]"
                            icon={<Check size={18} />}
                        >
                            {mode === 'job' ? 'Create Job' : 'Save Workflow'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Styled Form Field
function FormField({
    label,
    value,
    onChange,
    type = 'text',
    multiline = false,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    multiline?: boolean;
    placeholder?: string;
}) {
    return (
        <div className="group">
            <label className="block text-xs font-medium text-neutral-500 mb-1.5 group-focus-within:text-primary-600 transition-colors">
                {label}
            </label>
            {multiline ? (
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all placeholder-neutral-400 bg-neutral-50 focus:bg-white resize-none"
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all placeholder-neutral-400 bg-neutral-50 focus:bg-white"
                    placeholder={placeholder}
                />
            )}
        </div>
    );
}
