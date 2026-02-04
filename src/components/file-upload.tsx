// File Upload Component with Drag & Drop

'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';
import { Button } from './ui';

export interface UploadedFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: Date;
}

interface FileUploadProps {
    onUpload: (files: UploadedFile[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSize?: number; // in MB
    existingFiles?: UploadedFile[];
    onRemove?: (fileId: string) => void;
}

export function FileUpload({
    onUpload,
    accept = 'image/*,.pdf,.doc,.docx',
    multiple = true,
    maxSize = 10,
    existingFiles = [],
    onRemove,
    renderActions,
}: FileUploadProps & { renderActions?: (file: UploadedFile) => React.ReactNode }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const processFiles = async (fileList: FileList) => {
        setError(null);
        setUploading(true);

        const files = Array.from(fileList);
        const validFiles: UploadedFile[] = [];

        for (const file of files) {
            // Check file size
            if (file.size > maxSize * 1024 * 1024) {
                setError(`File "${file.name}" exceeds ${maxSize}MB limit`);
                continue;
            }

            // Create preview URL for images
            const url = file.type.startsWith('image/')
                ? URL.createObjectURL(file)
                : '';

            validFiles.push({
                id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                size: file.size,
                url,
                uploadedAt: new Date(),
            });
        }

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (validFiles.length > 0) {
            onUpload(validFiles);
        }

        setUploading(false);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return <Image size={20} />;
        if (type.includes('pdf')) return <FileText size={20} />;
        return <File size={20} />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div>
            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                    border: `2px dashed ${isDragging ? 'var(--primary-500)' : 'var(--neutral-300)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-8)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragging ? 'var(--primary-50)' : 'var(--neutral-50)',
                    transition: 'all 0.2s ease',
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
                <Upload
                    size={32}
                    style={{
                        color: isDragging ? 'var(--primary-500)' : 'var(--neutral-400)',
                        marginBottom: 'var(--space-2)',
                    }}
                />
                <p style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-1)' }}>
                    {uploading ? 'Uploading...' : 'Drag & drop files here or click to browse'}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--neutral-400)' }}>
                    Max {maxSize}MB per file • Images, PDFs, Documents
                </p>
            </div>

            {/* Error */}
            {error && (
                <p style={{ color: 'var(--error-500)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)' }}>
                    {error}
                </p>
            )}

            {/* File List */}
            {existingFiles.length > 0 && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
                        Uploaded Files ({existingFiles.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {existingFiles.map(file => (
                            <div
                                key={file.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-3)',
                                    backgroundColor: 'var(--neutral-100)',
                                    borderRadius: 'var(--radius-md)',
                                }}
                            >
                                {file.type.startsWith('image/') && file.url ? (
                                    <img
                                        src={file.url}
                                        alt={file.name}
                                        style={{
                                            width: 40,
                                            height: 40,
                                            objectFit: 'cover',
                                            borderRadius: 'var(--radius-sm)',
                                        }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            width: 40,
                                            height: 40,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: 'var(--neutral-200)',
                                            borderRadius: 'var(--radius-sm)',
                                            color: 'var(--neutral-600)',
                                        }}
                                    >
                                        {getFileIcon(file.type)}
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{
                                        fontWeight: 'var(--font-medium)',
                                        fontSize: 'var(--text-sm)',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {file.name}
                                    </p>
                                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--neutral-500)' }}>
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                                {renderActions && renderActions(file)}
                                {onRemove && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemove(file.id);
                                        }}
                                        style={{
                                            padding: 'var(--space-1)',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            color: 'var(--neutral-500)',
                                        }}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
