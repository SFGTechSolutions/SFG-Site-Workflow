// AI Chat Assistant - Full conversation window with image analysis

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    Mic, MicOff, Send, X, Camera, Image as ImageIcon,
    Sparkles, Loader2, ChevronDown, Paperclip, RotateCcw
} from 'lucide-react';
import { useVoiceContext } from '@/lib/job-context';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    image?: string;
    timestamp: Date;
}

interface AIChatAssistantProps {
    onNoteAdded?: (note: string) => void;
    onAdvanceWorkflow?: () => void;
}

export function AIChatAssistant({ onNoteAdded, onAdvanceWorkflow }: AIChatAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isSafetyMode, setIsSafetyMode] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
    const [analysisPreference, setAnalysisPreference] = useState<'ask' | 'concise' | 'summary' | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // ElevenLabs Text-to-Speech
    const speakText = useCallback(async (text: string) => {
        // Clean text of markdown characters (asterisks, hashes, etc) for natural speech
        const cleanText = text.replace(/[*#_`~-]/g, '').trim();

        const apiKey = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY;
        if (!apiKey) {
            console.warn('ElevenLabs API key missing, falling back to browser TTS');
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                window.speechSynthesis.speak(utterance);
            }
            return;
        }

        try {
            // Stop any existing audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }

            setIsSpeaking(true);
            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                },
                body: JSON.stringify({
                    text: cleanText,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            });

            if (!response.ok) throw new Error('ElevenLabs API request failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;

            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(url);
            };

            await audio.play();
        } catch (error) {
            console.error('TTS Error:', error);
            setIsSpeaking(false);
        }
    }, []);

    const stopSpeaking = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    };

    const contextData = useVoiceContext();
    const hasJobContext = !!contextData.currentJobId;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize camera stream when modal opens
    useEffect(() => {
        let currentStream: MediaStream | null = null;
        let isMounted = true;

        async function setupCamera() {
            if (showCamera && videoRef.current) {
                // Stop any existing stream first
                if (videoRef.current.srcObject) {
                    const stream = videoRef.current.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                    videoRef.current.srcObject = null;
                }

                try {
                    // Try exact constraint first for reliable switching
                    try {
                        currentStream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: { exact: cameraFacingMode } }
                        });
                    } catch (err) {
                        // Fallback to loose constraint
                        currentStream = await navigator.mediaDevices.getUserMedia({
                            video: { facingMode: cameraFacingMode }
                        });
                    }

                    if (isMounted && videoRef.current) {
                        videoRef.current.srcObject = currentStream;
                    } else if (currentStream) {
                        currentStream.getTracks().forEach(track => track.stop());
                    }
                } catch (err) {
                    console.error("Camera access error:", err);
                    try {
                        if (isMounted) {
                            currentStream = await navigator.mediaDevices.getUserMedia({ video: true });
                            if (videoRef.current) videoRef.current.srcObject = currentStream;
                        }
                    } catch (finalErr) { };
                }
            }
        }

        setupCamera();

        return () => {
            isMounted = false;
            // Cleanup stream
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [showCamera, cameraFacingMode]);

    const toggleCamera = () => {
        setCameraFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const base64 = canvas.toDataURL('image/jpeg');
                setSelectedImage(base64);
                setShowCamera(false);
                setIsSafetyMode(true);
                setAnalysisPreference('ask');
            }
        }
    };

    const handleAnalysisChoice = (type: 'concise' | 'summary') => {
        setAnalysisPreference(type);
        const promptText = type === 'concise'
            ? 'Identify key safety hazards (Concise List)'
            : 'Detailed safety hazard summary and risk assessment';
        sendMessage(promptText, selectedImage || undefined);
        setAnalysisPreference(null);
    };

    // Add welcome message when opening with job context
    useEffect(() => {
        if (isOpen && messages.length === 0 && hasJobContext) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `Hi! I'm your AI assistant for the ${contextData.clientName || 'current'} job. Ask me anything about the job status, notes, team, or upload an image for analysis.`,
                timestamp: new Date(),
            }]);
        }
    }, [isOpen, hasJobContext, contextData.clientName, messages.length]);

    const analyzeImage = async (imageBase64: string, prompt: string): Promise<string> => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return 'Image analysis requires a Gemini API key.';
        }

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    text: prompt || (isSafetyMode
                                        ? `You are an experienced site safety officer walking the site with a colleague. Analyze this image and explain the safety situation in a natural, conversational way.
                                        
                                        Start with the most critical issues you see, then mention what looks good. Speak in full sentences as if you were talking to someone right next to you.
                                        
                                        Cover things like PPE, fall risks, electrical hazards, and trip hazards, but don't just list them. Explain WHY they are issues and what needs to be done.
                                        
                                        Keep it helpful, authoritative, but friendly.`
                                        : 'Analyze this image and describe what you see. If it appears to be work-related (maintenance, construction, equipment), provide relevant observations.')
                                },
                                {
                                    inline_data: {
                                        mime_type: 'image/jpeg',
                                        data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                                    },
                                },
                            ],
                        }],
                    }),
                }
            );

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not analyze image.';
        } catch (error) {
            console.error('Image analysis error:', error);
            return 'Failed to analyze image. Please try again.';
        }
    };

    const sendMessage = async (text: string, image?: string) => {
        if (!text.trim() && !image) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text || 'Analyze this image',
            image,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSelectedImage(null);
        setIsLoading(true);

        try {
            let response: string;

            if (image) {
                // Image analysis
                response = await analyzeImage(image, text);
            } else {
                // Text chat with job context
                response = await getChatResponse(text);
            }

            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Speak the response aloud
            speakText(response);

            // Check for actionable intents
            const lowerText = text.toLowerCase();
            if (lowerText.includes('add note') || lowerText.includes('save note')) {
                const noteContent = text.replace(/add note|save note/gi, '').trim();
                if (noteContent && onNoteAdded) {
                    onNoteAdded(noteContent);
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const getChatResponse = async (text: string): Promise<string> => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
            return 'AI responses require a Gemini API key to be configured.';
        }

        const jobContext = hasJobContext ? `
=== CURRENT JOB CONTEXT ===
- Job ID: ${contextData.currentJobId}
- Work Order Ref: ${contextData.workOrderRef || 'N/A'}
- Client: ${contextData.clientName || 'Unknown'}
- Site Address: ${contextData.siteAddress || 'Not specified'}
- Current Step: ${contextData.currentStep || 'Unknown'}
- Current Status: ${contextData.currentState || 'Unknown'}
- Assigned Team: ${contextData.assignedTo?.join(', ') || 'Unassigned'}
- Due Date: ${contextData.dueDate || 'Not set'}
- Recent Notes: ${contextData.jobNotes?.slice(-5).join(' | ') || 'None'}
===========================
` : 'No job is currently selected.';

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are a helpful AI assistant for field contractors doing maintenance work.
${jobContext}

User question: ${text}

Respond naturally and helpfully. Use the job data above to answer questions about the job.
Keep responses concise but informative. If asked about images, let them know they can upload one.`,
                            }],
                        }],
                    }),
                }
            );

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not generate a response.';
        } catch (error) {
            console.error('API error:', error);
            return 'Failed to get response. Please check your connection.';
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setSelectedImage(base64);
        };
        reader.readAsDataURL(file);
    };

    const startVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };

        recognition.start();
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(37, 99, 235, 0.4)',
                    zIndex: 9999,
                }}
            >
                <Sparkles size={28} color="white" />
                {hasJobContext && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            border: '2px solid white',
                        }}
                    />
                )}
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '380px',
                maxWidth: 'calc(100vw - 48px)',
                height: '550px',
                maxHeight: 'calc(100vh - 100px)',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 9999,
            }}
        >
            {/* Camera Modal Overlay */}
            {showCamera && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'black',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '30px',
                        display: 'flex',
                        gap: '20px',
                        alignItems: 'center',
                    }}>
                        <button
                            onClick={() => setShowCamera(false)}
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                border: 'none',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={24} />
                        </button>
                        <button
                            onClick={capturePhoto}
                            style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                border: '4px solid rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid black' }} />
                        </button>
                        <button
                            onClick={toggleCamera}
                            style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.3)',
                                border: 'none',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            title="Flip Camera"
                        >
                            <RotateCcw size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Analysis Preference Overlay */}
            {analysisPreference === 'ask' && selectedImage && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    zIndex: 10001,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                    gap: '24px'
                }}>
                    <h3 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Safety Analysis Type</h3>

                    <img
                        src={selectedImage}
                        alt="To Analyze"
                        style={{
                            maxHeight: '40vh',
                            maxWidth: '100%',
                            borderRadius: '12px',
                            border: '2px solid rgba(255,255,255,0.2)'
                        }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '300px' }}>
                        <button
                            onClick={() => handleAnalysisChoice('concise')}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Sparkles size={20} />
                            Concise List
                        </button>

                        <button
                            onClick={() => handleAnalysisChoice('summary')}
                            style={{
                                padding: '16px',
                                borderRadius: '12px',
                                backgroundColor: '#7c3aed',
                                color: 'white',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Paperclip size={20} />
                            Detailed Summary
                        </button>

                        <button
                            onClick={() => {
                                setAnalysisPreference(null);
                                setSelectedImage(null);
                            }}
                            style={{
                                padding: '12px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                border: 'none',
                                marginTop: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div
                style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Sparkles size={24} />
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '15px' }}>AI Assistant</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>
                            {isSpeaking ? '🔊 Speaking...' : hasJobContext ? `${contextData.clientName}` : 'General help'}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {isSpeaking && (
                        <button
                            onClick={stopSpeaking}
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            title="Stop speaking"
                        >
                            <MicOff size={16} color="white" />
                        </button>
                    )}
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <X size={18} color="white" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                        }}
                    >
                        {msg.image && (
                            <img
                                src={msg.image}
                                alt="Uploaded"
                                style={{
                                    width: '100%',
                                    maxWidth: '200px',
                                    borderRadius: '12px',
                                    marginBottom: '8px',
                                }}
                            />
                        )}
                        <div
                            style={{
                                padding: '12px 16px',
                                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                backgroundColor: msg.role === 'user' ? '#2563eb' : '#f3f4f6',
                                color: msg.role === 'user' ? 'white' : '#111827',
                                fontSize: '14px',
                                lineHeight: 1.5,
                            }}
                        >
                            {msg.content}
                        </div>
                        <div
                            style={{
                                fontSize: '11px',
                                color: '#9ca3af',
                                marginTop: '4px',
                                textAlign: msg.role === 'user' ? 'right' : 'left',
                            }}
                        >
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={16} className="animate-spin" style={{ color: '#6b7280' }} />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>Thinking...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Selected image preview */}
            {selectedImage && (
                <div style={{ padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <img
                            src={selectedImage}
                            alt="Selected"
                            style={{ height: '60px', borderRadius: '8px' }}
                        />
                        <button
                            onClick={() => setSelectedImage(null)}
                            style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={12} color="white" />
                        </button>
                    </div>
                </div>
            )}

            {/* Input area */}
            <div
                style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                />

                <button
                    onClick={() => setShowCamera(true)}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#fbbf24',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="📷 Safety Scan - Take photo to analyze for hazards"
                >
                    <Camera size={18} color="white" />
                </button>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Upload image for analysis"
                >
                    <ImageIcon size={18} color="#6b7280" />
                </button>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage(input, selectedImage || undefined)}
                    placeholder={selectedImage ? 'Describe what to analyze...' : 'Ask anything...'}
                    style={{
                        flex: 1,
                        padding: '10px 14px',
                        borderRadius: '20px',
                        border: '1px solid #e5e7eb',
                        fontSize: '14px',
                        outline: 'none',
                    }}
                />

                <button
                    onClick={startVoiceInput}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isListening ? '#ef4444' : '#f3f4f6',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title="Voice input"
                >
                    {isListening ? <MicOff size={18} color="white" /> : <Mic size={18} color="#6b7280" />}
                </button>

                <button
                    onClick={() => sendMessage(input, selectedImage || undefined)}
                    disabled={isLoading || (!input.trim() && !selectedImage)}
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: (input.trim() || selectedImage) ? '#2563eb' : '#e5e7eb',
                        border: 'none',
                        cursor: (input.trim() || selectedImage) ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Send size={18} color={input.trim() || selectedImage ? 'white' : '#9ca3af'} />
                </button>
            </div>
        </div>
    );
}
