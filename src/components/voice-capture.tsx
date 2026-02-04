// Voice Capture - Combined Photo + Voice Component

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Mic, X, Check, RotateCcw, Upload } from 'lucide-react';
import { getVoiceAgent } from '@/lib/voice-agent';
import { Button, Card, CardHeader, CardBody } from './ui';

interface VoiceCaptureProps {
    jobId: string;
    onCapture: (data: {
        imageData?: string;
        transcript: string;
        location?: { latitude: number; longitude: number };
        timestamp: Date;
    }) => void;
    onClose: () => void;
}

export function VoiceCapture({ jobId, onCapture, onClose }: VoiceCaptureProps) {
    const [step, setStep] = useState<'camera' | 'voice' | 'review'>('camera');
    const [imageData, setImageData] = useState<string | null>(null);
    const [transcript, setTranscript] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Start camera
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Back camera for site photos
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError('Camera access denied. Please allow camera permissions.');
        }
    }, []);

    // Stop camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Capture photo
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0);
            const data = canvas.toDataURL('image/jpeg', 0.8);
            setImageData(data);
            stopCamera();
            setStep('voice');
        }
    }, [stopCamera]);

    // Skip photo and go directly to voice
    const skipPhoto = useCallback(() => {
        stopCamera();
        setStep('voice');
    }, [stopCamera]);

    // Record voice description
    const startVoiceCapture = useCallback(async () => {
        setIsRecording(true);
        setError(null);

        const agent = getVoiceAgent();
        agent.setCallbacks({
            onStateChange: (state) => {
                if (state === 'idle') {
                    setIsRecording(false);
                }
            },
            onTranscript: (text) => {
                setTranscript(text);
            },
        });

        try {
            const result = await agent.processVoiceCommand({
                currentJobId: jobId,
                currentStep: 'Photo capture',
            });
            setTranscript(result.transcript);
            setStep('review');
        } catch (err) {
            setError('Voice capture failed. Please try again.');
            setIsRecording(false);
        }
    }, [jobId]);

    // Retake photo
    const retakePhoto = useCallback(() => {
        setImageData(null);
        setTranscript('');
        setStep('camera');
        startCamera();
    }, [startCamera]);

    // Submit capture
    const handleSubmit = useCallback(async () => {
        // Get location
        let location: { latitude: number; longitude: number } | undefined;
        if (navigator.geolocation) {
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 5000,
                    });
                });
                location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
            } catch {
                // Location not available
            }
        }

        onCapture({
            imageData: imageData || undefined,
            transcript,
            location,
            timestamp: new Date(),
        });
        onClose();
    }, [imageData, transcript, onCapture, onClose]);

    // Initialize camera on mount
    React.useEffect(() => {
        if (step === 'camera') {
            startCamera();
        }
        return () => {
            stopCamera();
        };
    }, [step, startCamera, stopCamera]);

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-4)',
                    color: 'white',
                }}
            >
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                    {step === 'camera' && '📸 Take Photo'}
                    {step === 'voice' && '🎙️ Describe It'}
                    {step === 'review' && '✅ Review'}
                </h2>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: 'var(--space-2)',
                    }}
                >
                    <X size={24} />
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div
                    style={{
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        padding: 'var(--space-3)',
                        margin: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                    }}
                >
                    {error}
                </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 'var(--space-4)' }}>
                {/* Camera Step */}
                {step === 'camera' && (
                    <>
                        <div
                            style={{
                                flex: 1,
                                backgroundColor: '#1a1a1a',
                                borderRadius: 'var(--radius-lg)',
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                            />
                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 'var(--space-4)',
                                padding: 'var(--space-6)',
                            }}
                        >
                            <button
                                onClick={skipPhoto}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: '2px solid white',
                                    color: 'white',
                                    padding: 'var(--space-3) var(--space-6)',
                                    borderRadius: 'var(--radius-full)',
                                    cursor: 'pointer',
                                    fontSize: 'var(--text-sm)',
                                }}
                            >
                                Skip Photo
                            </button>
                            <button
                                onClick={capturePhoto}
                                style={{
                                    width: '72px',
                                    height: '72px',
                                    borderRadius: '50%',
                                    backgroundColor: 'white',
                                    border: '4px solid #2563eb',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Camera size={32} color="#2563eb" />
                            </button>
                        </div>
                    </>
                )}

                {/* Voice Step */}
                {step === 'voice' && (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 'var(--space-6)',
                        }}
                    >
                        {imageData && (
                            <img
                                src={imageData}
                                alt="Captured"
                                style={{
                                    width: '200px',
                                    height: '150px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-lg)',
                                    border: '2px solid white',
                                }}
                            />
                        )}
                        <p style={{ color: 'white', fontSize: 'var(--text-lg)', textAlign: 'center' }}>
                            {isRecording ? 'Listening...' : 'Tap the microphone to describe'}
                        </p>
                        <button
                            onClick={startVoiceCapture}
                            disabled={isRecording}
                            style={{
                                width: '96px',
                                height: '96px',
                                borderRadius: '50%',
                                backgroundColor: isRecording ? '#ef4444' : '#2563eb',
                                border: 'none',
                                cursor: isRecording ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: isRecording ? 'pulse-voice 1.5s infinite' : 'none',
                            }}
                        >
                            <Mic size={40} color="white" />
                        </button>
                        {transcript && (
                            <div
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    padding: 'var(--space-4)',
                                    borderRadius: 'var(--radius-lg)',
                                    color: 'white',
                                    maxWidth: '300px',
                                    textAlign: 'center',
                                }}
                            >
                                "{transcript}"
                            </div>
                        )}
                    </div>
                )}

                {/* Review Step */}
                {step === 'review' && (
                    <div
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-4)',
                        }}
                    >
                        {imageData && (
                            <img
                                src={imageData}
                                alt="Captured"
                                style={{
                                    width: '100%',
                                    maxHeight: '300px',
                                    objectFit: 'contain',
                                    borderRadius: 'var(--radius-lg)',
                                }}
                            />
                        )}
                        <Card>
                            <CardBody>
                                <div style={{ marginBottom: 'var(--space-2)' }}>
                                    <strong>Description:</strong>
                                </div>
                                <p>{transcript || 'No description provided'}</p>
                            </CardBody>
                        </Card>
                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--space-3)',
                                marginTop: 'auto',
                            }}
                        >
                            <Button variant="secondary" onClick={retakePhoto} style={{ flex: 1 }}>
                                <RotateCcw size={16} />
                                Retake
                            </Button>
                            <Button variant="primary" onClick={handleSubmit} style={{ flex: 2 }}>
                                <Check size={16} />
                                Save to Job
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
