// Voice Recorder - Record and transcribe voice notes

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, Check, X, MapPin } from 'lucide-react';
import { Button } from './ui';

interface VoiceRecorderProps {
    onNoteRecorded: (note: {
        transcript: string;
        audioUrl?: string;
        location?: { latitude: number; longitude: number };
        timestamp: Date;
    }) => void;
    stepId?: string;
    stepName?: string;
}

export function VoiceRecorder({ onNoteRecorded, stepId, stepName }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [capturedLocation, setCapturedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const captureLocation = useCallback((): Promise<{ latitude: number; longitude: number } | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    setCapturedLocation(loc);
                    resolve(loc);
                },
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 5000 }
            );
        });
    }, []);

    const startRecording = useCallback(async () => {
        // Check for speech recognition support
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        setError(null);
        setTranscript('');
        setIsRecording(true);

        // Capture location in background
        captureLocation();

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-AU';

        let finalTranscript = '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript + ' ';
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            setTranscript(finalTranscript + interimTranscript);
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setError('Microphone access denied. Please allow microphone permissions.');
            } else if (event.error === 'no-speech') {
                setError('No speech detected. Please try again.');
            } else {
                setError(`Error: ${event.error}`);
            }
            setIsRecording(false);
        };

        recognition.onend = () => {
            setIsRecording(false);
            if (finalTranscript.trim()) {
                setTranscript(finalTranscript.trim());
            }
        };

        try {
            recognition.start();
        } catch (err) {
            console.error('Failed to start recognition:', err);
            setError('Failed to start recording. Please try again.');
            setIsRecording(false);
        }
    }, [captureLocation]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
    }, []);

    const saveNote = useCallback(() => {
        if (!transcript.trim()) return;

        setIsTranscribing(true);

        // Simulate a small delay for saving
        setTimeout(() => {
            onNoteRecorded({
                transcript: transcript.trim(),
                location: capturedLocation || undefined,
                timestamp: new Date(),
            });

            setTranscript('');
            setCapturedLocation(null);
            setIsTranscribing(false);
        }, 500);
    }, [transcript, capturedLocation, onNoteRecorded]);

    const cancelNote = useCallback(() => {
        setTranscript('');
        setCapturedLocation(null);
        setError(null);
    }, []);

    return (
        <div
            style={{
                padding: 'var(--space-6)',
                backgroundColor: 'var(--neutral-50)',
                borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-4)',
            }}
        >
            {/* Recording button */}
            {!transcript && !isRecording && (
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={startRecording}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary-600)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                            transition: 'all 0.2s ease',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <Mic size={32} color="white" />
                    </button>
                    <p style={{ marginTop: 'var(--space-3)', color: 'var(--neutral-600)', fontSize: 'var(--text-sm)' }}>
                        Tap to record a voice note
                    </p>
                    {stepName && (
                        <p style={{ color: 'var(--neutral-400)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                            For step: {stepName}
                        </p>
                    )}
                </div>
            )}

            {/* Recording in progress */}
            {isRecording && (
                <div style={{ textAlign: 'center' }}>
                    <button
                        onClick={stopRecording}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--error-500)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'pulse 1.5s infinite',
                        }}
                    >
                        <MicOff size={32} color="white" />
                    </button>
                    <p style={{ marginTop: 'var(--space-3)', color: 'var(--error-600)', fontWeight: 'var(--font-medium)' }}>
                        Recording... Tap to stop
                    </p>

                    {/* Live transcript */}
                    {transcript && (
                        <div
                            style={{
                                marginTop: 'var(--space-4)',
                                padding: 'var(--space-4)',
                                backgroundColor: 'white',
                                borderRadius: 'var(--radius-md)',
                                textAlign: 'left',
                                border: '1px solid var(--neutral-200)',
                            }}
                        >
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--neutral-500)', marginBottom: 'var(--space-1)' }}>
                                Live transcript:
                            </p>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--neutral-800)' }}>
                                "{transcript}"
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Review transcript */}
            {!isRecording && transcript && (
                <div>
                    <div
                        style={{
                            padding: 'var(--space-4)',
                            backgroundColor: 'white',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--neutral-200)',
                            marginBottom: 'var(--space-4)',
                        }}
                    >
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--neutral-500)', marginBottom: 'var(--space-2)' }}>
                            Your voice note:
                        </p>
                        <p style={{ fontSize: 'var(--text-base)', color: 'var(--neutral-900)' }}>
                            "{transcript}"
                        </p>

                        {capturedLocation && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
                                <MapPin size={14} style={{ color: 'var(--primary-500)' }} />
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--primary-600)' }}>
                                    Location captured
                                </span>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                        <Button
                            variant="secondary"
                            onClick={cancelNote}
                            icon={<X size={16} />}
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={saveNote}
                            loading={isTranscribing}
                            icon={<Check size={16} />}
                        >
                            Save Note
                        </Button>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div
                    style={{
                        marginTop: 'var(--space-4)',
                        padding: 'var(--space-3)',
                        backgroundColor: 'var(--error-50)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--error-700)',
                        fontSize: 'var(--text-sm)',
                        textAlign: 'center',
                    }}
                >
                    {error}
                </div>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
                    }
                    50% {
                        transform: scale(1.05);
                        box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
                    }
                }
            `}</style>
        </div>
    );
}
