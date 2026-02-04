import React, { useState } from 'react';
import { FileText, Upload, Plus, X } from 'lucide-react';
import { Button, Card, CardBody } from './ui';
import { JobUpload } from './job-upload';
import { ExtractedJobData } from '@/lib/document-processor';

interface JobCreationModalProps {
    onClose: () => void;
    onManualCreate: () => void;
    onUploadCreate: (data: ExtractedJobData, file?: File) => void;
}

export function JobCreationModal({ onClose, onManualCreate, onUploadCreate }: JobCreationModalProps) {
    const [mode, setMode] = useState<'selection' | 'upload'>('selection');

    if (mode === 'upload') {
        return (
            <JobUpload
                onJobCreated={onUploadCreate}
                onClose={onClose}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
                    <h3 className="text-xl font-semibold text-neutral-900">
                        Create New Job
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h4 className="text-lg font-medium text-neutral-900 mb-2">How would you like to start?</h4>
                        <p className="text-neutral-500 text-sm">Choose the best way to get your job into the system</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={onManualCreate}
                            className="group flex flex-col items-center p-6 rounded-xl border-2 border-neutral-200 hover:border-primary-600 hover:bg-primary-50/50 transition-all duration-200 text-center"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                                <FileText size={32} />
                            </div>
                            <h4 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary-700">Manual Entry</h4>
                            <p className="text-xs text-neutral-500 leading-relaxed">
                                Fill in the job details form manually from scratch
                            </p>
                        </button>

                        <button
                            onClick={() => setMode('upload')}
                            className="group flex flex-col items-center p-6 rounded-xl border-2 border-neutral-200 hover:border-purple-600 hover:bg-purple-50/50 transition-all duration-200 text-center"
                        >
                            <div className="relative w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                                <Upload size={32} />
                                <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    AI
                                </div>
                            </div>
                            <h4 className="font-semibold text-neutral-900 mb-1 group-hover:text-purple-700">Upload Document</h4>
                            <p className="text-xs text-neutral-500 leading-relaxed">
                                Auto-fill details from a PDF, Word doc, or image
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
