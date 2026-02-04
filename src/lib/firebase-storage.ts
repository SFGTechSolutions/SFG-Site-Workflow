// Firebase Storage Utilities

import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { app } from './firebase';

export interface StoredFile {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    path: string;
    uploadedAt: Date;
    uploadedBy?: string;
}

// Check if Firebase is configured
const isFirebaseConfigured = (): boolean => {
    try {
        const storage = getStorage(app);
        return !!storage;
    } catch {
        return false;
    }
};

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
    file: File,
    jobId: string,
    stepId: string,
    onProgress?: (progress: number) => void
): Promise<StoredFile | null> {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured - using mock upload');
        // Return mock file for demo
        return {
            id: `mock-${Date.now()}`,
            name: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
            path: `jobs/${jobId}/${stepId}/${file.name}`,
            uploadedAt: new Date(),
        };
    }

    const storage = getStorage(app);
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `jobs/${jobId}/${stepId}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, path);

    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
            customMetadata: {
                jobId,
                stepId,
                originalName: file.name,
            },
        });

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(progress);
            },
            (error) => {
                console.error('Upload error:', error);
                reject(error);
            },
            async () => {
                try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({
                        id: `file-${timestamp}`,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url,
                        path,
                        uploadedAt: new Date(),
                    });
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

/**
 * Get all files for a job
 */
export async function getJobFiles(jobId: string): Promise<StoredFile[]> {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured - returning empty list');
        return [];
    }

    const storage = getStorage(app);
    const jobRef = ref(storage, `jobs/${jobId}`);
    const files: StoredFile[] = [];

    try {
        const result = await listAll(jobRef);

        for (const prefix of result.prefixes) {
            const stepFiles = await listAll(prefix);
            for (const itemRef of stepFiles.items) {
                const url = await getDownloadURL(itemRef);
                const name = itemRef.name.split('_').slice(1).join('_');
                files.push({
                    id: itemRef.fullPath,
                    name,
                    type: 'application/octet-stream',
                    size: 0,
                    url,
                    path: itemRef.fullPath,
                    uploadedAt: new Date(),
                });
            }
        }
    } catch (error) {
        console.error('Error listing files:', error);
    }

    return files;
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(path: string): Promise<boolean> {
    if (!isFirebaseConfigured()) {
        console.warn('Firebase not configured - mock delete');
        return true;
    }

    const storage = getStorage(app);
    const fileRef = ref(storage, path);

    try {
        await deleteObject(fileRef);
        return true;
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
    files: File[],
    jobId: string,
    stepId: string,
    onProgress?: (fileIndex: number, progress: number) => void
): Promise<StoredFile[]> {
    const results: StoredFile[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFile(file, jobId, stepId, (progress) => {
            onProgress?.(i, progress);
        });
        if (result) {
            results.push(result);
        }
    }

    return results;
}
