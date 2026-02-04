// Voice Assistant - Floating UI Component

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Loader2, X, Sparkles, Square } from 'lucide-react';
import { getVoiceAgent, VoiceIntent } from '@/lib/voice-agent';
import { useVoiceContext } from '@/lib/job-context';

interface VoiceAssistantProps {
    // Job context (optional - will use context provider if not provided)
    jobId?: string;
    currentStep?: string;
    currentState?: string;
    jobNotes?: string[];
    clientName?: string;
    siteAddress?: string;
    assignedTo?: string[];
    dueDate?: string;
    workOrderRef?: string;
    // Callbacks
    onNoteAdded?: (note: string, location?: { latitude: number; longitude: number }) => void;
    onStepComplete?: () => void;
    onPhotoRequest?: () => void;
    onAdvanceWorkflow?: () => void;
}

type AgentState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export function VoiceAssistant({
    jobId: propJobId,
    currentStep: propCurrentStep,
    currentState: propCurrentState,
    jobNotes: propJobNotes,
    clientName: propClientName,
    siteAddress: propSiteAddress,
    assignedTo: propAssignedTo,
    dueDate: propDueDate,
    workOrderRef: propWorkOrderRef,
    onNoteAdded,
    onStepComplete,
    onPhotoRequest,
    onAdvanceWorkflow,
}: VoiceAssistantProps) {
    const [state, setState] = useState<AgentState>('idle');
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [isSupported, setIsSupported] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get job context from provider (fallback if props not provided)
    const contextData = useVoiceContext();

    // Merge props with context (props take priority)
    const jobId = propJobId || contextData.currentJobId;
    const currentStep = propCurrentStep || contextData.currentStep;
    const currentState = propCurrentState || contextData.currentState;
    const jobNotes = propJobNotes || contextData.jobNotes;
    const clientName = propClientName || contextData.clientName;
    const siteAddress = propSiteAddress || contextData.siteAddress;
    const assignedTo = propAssignedTo || contextData.assignedTo;
    const dueDate = propDueDate || contextData.dueDate;
    const workOrderRef = propWorkOrderRef || contextData.workOrderRef;

    // Show indicator when connected to a job
    const hasJobContext = !!jobId;

    useEffect(() => {
        const agent = getVoiceAgent();
        setIsSupported(agent.isSupported());
    }, []);


    const handleVoiceCommand = useCallback(async () => {
        if (state !== 'idle') return;

        setError(null);
        setTranscript('');
        setResponse('');
        setIsExpanded(true);

        const agent = getVoiceAgent();
        agent.setCallbacks({
            onStateChange: setState,
            onTranscript: (text, isFinal) => {
                if (isFinal) setTranscript(text);
            },
        });

        try {
            // Pass full job context to the AI
            const result = await agent.processVoiceCommand({
                currentJobId: jobId,
                currentStep,
                currentState,
                jobNotes,
                clientName,
                siteAddress,
                assignedTo,
                dueDate,
                workOrderRef,
            });

            setTranscript(result.transcript);
            setResponse(result.response);

            // Execute action based on intent
            handleIntent(result.intent, result.transcript, result.location);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Voice recognition failed');
            setState('error');
            setTimeout(() => {
                setState('idle');
                setError(null);
            }, 3000);
        }
    }, [state, jobId, currentStep, currentState, jobNotes, clientName, siteAddress, assignedTo, dueDate, workOrderRef]);

    const handleIntent = (
        intent: VoiceIntent,
        transcript: string,
        location: { latitude: number; longitude: number } | null
    ) => {
        switch (intent.action) {
            case 'add_note':
                onNoteAdded?.(intent.content || transcript, location || undefined);
                break;
            case 'complete_step':
            case 'advance_workflow':
                onAdvanceWorkflow?.();
                onStepComplete?.();
                break;
            case 'take_photo':
                onPhotoRequest?.();
                break;
            case 'get_status':
            case 'read_notes':
            case 'who_assigned':
            case 'whats_left':
            case 'summarize':
            case 'ask_question':
                // These are all answered by AI response which is already spoken
                break;
            default:
                // Treat unknown as note if it has content
                if (transcript && transcript.length > 5) {
                    onNoteAdded?.(transcript, location || undefined);
                }
        }
    };

    const stopListening = () => {
        const agent = getVoiceAgent();
        agent.stopListening();
        setState('idle');
    };

    const handleStopSpeaking = () => {
        const agent = getVoiceAgent();
        agent.stopSpeaking();
        setState('idle');
    };

    const getButtonStyles = (): React.CSSProperties => {
        const base: React.CSSProperties = {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: state === 'idle' ? '64px' : '72px',
            height: state === 'idle' ? '64px' : '72px',
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.3s ease',
            zIndex: 9999,
        };

        switch (state) {
            case 'listening':
                return {
                    ...base,
                    backgroundColor: '#ef4444',
                    animation: 'pulse-voice 1.5s infinite',
                };
            case 'processing':
                return {
                    ...base,
                    backgroundColor: '#f59e0b',
                };
            case 'speaking':
                return {
                    ...base,
                    backgroundColor: '#22c55e',
                };
            case 'error':
                return {
                    ...base,
                    backgroundColor: '#ef4444',
                };
            default:
                return {
                    ...base,
                    backgroundColor: '#2563eb',
                };
        }
    };

    const getIcon = () => {
        switch (state) {
            case 'listening':
                return <MicOff size={28} color="white" />;
            case 'processing':
                return <Loader2 size={28} color="white" className="animate-spin" />;
            case 'speaking':
                return <Square size={24} color="white" fill="white" />;
            case 'error':
                return <X size={28} color="white" />;
            default:
                return <Mic size={28} color="white" />;
        }
    };

    const getStatusText = () => {
        switch (state) {
            case 'listening':
                return 'Listening... (tap to stop)';
            case 'processing':
                return 'AI is thinking...';
            case 'speaking':
                return 'AI Speaking...';
            case 'error':
                return error || 'Error occurred';
            default:
                return hasJobContext
                    ? `Ask about ${clientName || 'this job'}`
                    : 'Tap to speak';
        }
    };

    if (!isSupported) {
        return null; // Hide if not supported
    }

    return (
        <>
            {/* Expanded panel */}
            {isExpanded && (state !== 'idle' || transcript || response) && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '100px',
                        right: '24px',
                        width: '320px',
                        maxWidth: 'calc(100vw - 48px)',
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        padding: '20px',
                        zIndex: 9998,
                        animation: 'slideUp 0.3s ease',
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={() => {
                            setIsExpanded(false);
                            setTranscript('');
                            setResponse('');
                        }}
                        style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            color: '#9ca3af',
                        }}
                    >
                        <X size={18} />
                    </button>

                    {/* Status indicator */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '16px',
                        }}
                    >
                        <div
                            style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor:
                                    state === 'listening'
                                        ? '#ef4444'
                                        : state === 'processing'
                                            ? '#f59e0b'
                                            : state === 'speaking'
                                                ? '#22c55e'
                                                : '#9ca3af',
                                animation: state === 'listening' ? 'pulse 1s infinite' : 'none',
                            }}
                        />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>{getStatusText()}</span>
                    </div>

                    {/* Waveform animation when listening */}
                    {state === 'listening' && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                height: '40px',
                                marginBottom: '16px',
                            }}
                        >
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: '4px',
                                        backgroundColor: '#2563eb',
                                        borderRadius: '2px',
                                        animation: `waveform 0.8s ease-in-out infinite`,
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Transcript */}
                    {transcript && (
                        <div style={{ marginBottom: '12px' }}>
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#9ca3af',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                You said
                            </div>
                            <div
                                style={{
                                    fontSize: '15px',
                                    color: '#111827',
                                    fontWeight: 500,
                                }}
                            >
                                "{transcript}"
                            </div>
                        </div>
                    )}

                    {/* AI Response */}
                    {response && (
                        <div
                            style={{
                                backgroundColor: '#f0f9ff',
                                borderRadius: '12px',
                                padding: '12px',
                                borderLeft: '3px solid #2563eb',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#2563eb',
                                    marginBottom: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                Assistant
                            </div>
                            <div style={{ fontSize: '14px', color: '#1e40af' }}>{response}</div>
                        </div>
                    )}
                </div>
            )}

            {/* Main voice button */}
            <button
                onClick={() => {
                    if (state === 'listening') stopListening();
                    else if (state === 'speaking') handleStopSpeaking();
                    else handleVoiceCommand();
                }}
                style={getButtonStyles()}
                disabled={state === 'processing'}
                title={getStatusText()}
            >
                {getIcon()}

                {/* Job context indicator */}
                {hasJobContext && state === 'idle' && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            border: '2px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Sparkles size={12} color="white" />
                    </div>
                )}
            </button>

            {/* Global styles */}
            <style jsx global>{`
                @keyframes pulse-voice {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
                    }
                    50% {
                        transform: scale(1.1);
                        box-shadow: 0 4px 30px rgba(239, 68, 68, 0.6);
                    }
                }

                @keyframes waveform {
                    0%, 100% {
                        height: 8px;
                    }
                    50% {
                        height: 32px;
                    }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </>
    );
}
