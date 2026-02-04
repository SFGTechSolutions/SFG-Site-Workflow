// Comment Input Component with Voice Recording

'use client';

import { useState, useRef } from 'react';
import { Send, Mic, MicOff, Clock, User } from 'lucide-react';
import { Button } from './ui';

export interface Comment {
    id: string;
    text: string;
    userId: string;
    userName: string;
    timestamp: Date;
    isVoice?: boolean;
}

interface CommentInputProps {
    onSubmit: (text: string, isVoice?: boolean) => void;
    comments?: Comment[];
    placeholder?: string;
    loading?: boolean;
}

export function CommentInput({
    onSubmit,
    comments = [],
    placeholder = 'Add a comment...',
    loading = false,
}: CommentInputProps) {
    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleSubmit = () => {
        if (text.trim()) {
            onSubmit(text.trim());
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const chunks: BlobPart[] = [];

            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                // In a real app, we'd transcribe or upload the audio
                // For demo, we'll just add a placeholder
                onSubmit('[Voice recording - transcription pending]', true);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(t => t + 1);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording:', err);
            alert('Microphone access denied or not available');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTimestamp = (date: Date) => {
        return new Intl.DateTimeFormat('en-AU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <div>
            {/* Comment History */}
            {comments.length > 0 && (
                <div
                    style={{
                        maxHeight: 300,
                        overflowY: 'auto',
                        marginBottom: 'var(--space-4)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-3)',
                    }}
                >
                    {comments.map(comment => (
                        <div
                            key={comment.id}
                            style={{
                                padding: 'var(--space-3)',
                                backgroundColor: 'var(--neutral-50)',
                                borderRadius: 'var(--radius-md)',
                                borderLeft: comment.isVoice
                                    ? '3px solid var(--primary-500)'
                                    : '3px solid var(--neutral-300)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    marginBottom: 'var(--space-1)',
                                }}
                            >
                                <User size={14} style={{ color: 'var(--neutral-500)' }} />
                                <span
                                    style={{
                                        fontWeight: 'var(--font-medium)',
                                        fontSize: 'var(--text-sm)',
                                    }}
                                >
                                    {comment.userName}
                                </span>
                                <span
                                    style={{
                                        fontSize: 'var(--text-xs)',
                                        color: 'var(--neutral-400)',
                                    }}
                                >
                                    • {formatTimestamp(comment.timestamp)}
                                </span>
                                {comment.isVoice && (
                                    <Mic size={12} style={{ color: 'var(--primary-500)' }} />
                                )}
                            </div>
                            <p style={{ margin: 0, color: 'var(--neutral-700)' }}>
                                {comment.text}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    alignItems: 'flex-end',
                }}
            >
                <div style={{ flex: 1, position: 'relative' }}>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isRecording ? 'Recording...' : placeholder}
                        disabled={isRecording || loading}
                        rows={2}
                        style={{
                            width: '100%',
                            padding: 'var(--space-3)',
                            border: '1px solid var(--neutral-300)',
                            borderRadius: 'var(--radius-md)',
                            resize: 'none',
                            fontFamily: 'inherit',
                            fontSize: 'var(--text-base)',
                            backgroundColor: isRecording ? 'var(--primary-50)' : 'white',
                        }}
                    />
                    {isRecording && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                color: 'var(--error-500)',
                            }}
                        >
                            <div
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--error-500)',
                                    animation: 'pulse 1s infinite',
                                }}
                            />
                            <span> Recording {formatTime(recordingTime)}</span>
                        </div>
                    )}
                </div>

                {/* Voice Recording Button */}
                <Button
                    variant={isRecording ? 'primary' : 'secondary'}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={loading}
                    className="btn-icon"
                    style={{
                        backgroundColor: isRecording ? 'var(--error-500)' : undefined,
                    }}
                >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>

                {/* Send Button */}
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={!text.trim() || isRecording || loading}
                    loading={loading}
                    className="btn-icon"
                >
                    <Send size={18} />
                </Button>
            </div>

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
