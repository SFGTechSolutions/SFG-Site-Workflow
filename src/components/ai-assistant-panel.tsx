// AI Assistant Panel - Expandable chat panel for AI assistance

'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Sparkles,
    X,
    Send,
    Lightbulb,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import { Button } from './ui';

interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: { label: string; action: string }[];
}

const QUICK_PROMPTS = [
    'What should I do next for this job?',
    'Are there any blockers?',
    'Summarize this job status',
    'Check for missing documents',
];

const MOCK_RESPONSES: Record<string, string> = {
    'What should I do next for this job?': 'Based on the current status, the next step is to complete the site inspection. Make sure to:\n\n1. Take photos of the work area\n2. Document any existing damage\n3. Confirm access arrangements\n\nOnce complete, you can approve the job to move to scheduling.',
    'Are there any blockers?': 'I don\'t see any immediate blockers for this job. All required information has been provided and the site is accessible during business hours.',
    'Summarize this job status': 'This job is currently in the work execution phase. The technician arrived on site this morning and work is progressing as planned. Estimated completion is by end of day.',
    'Check for missing documents': 'All required documents are present:\n✓ Work order\n✓ Site access permit\n✓ Safety checklist\n\nNote: Completion photos will be required before close-out.',
};

interface AIAssistantPanelProps {
    jobId?: string;
    jobStatus?: string;
}

export function AIAssistantPanel({ jobId, jobStatus }: AIAssistantPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: AIMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Simulate AI response
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        const responseText = MOCK_RESPONSES[text] ||
            `I understand you're asking about: "${text}"\n\nFor a production system, I would analyze the job details and provide specific guidance. Currently in demo mode with limited responses.`;

        const assistantMessage: AIMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
            actions: text.includes('next') ? [
                { label: 'Start Inspection', action: 'start_inspection' },
                { label: 'Request More Info', action: 'request_info' },
            ] : undefined,
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                    zIndex: 1000,
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
                <Sparkles size={24} />
            </button>
        );
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                width: 380,
                height: isMinimized ? 56 : 500,
                backgroundColor: 'white',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 1000,
                transition: 'height 0.3s ease',
            }}
        >
            {/* Header */}
            <div
                style={{
                    padding: 'var(--space-3) var(--space-4)',
                    background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Sparkles size={20} />
                    <span style={{ fontWeight: 'var(--font-semibold)' }}>AI Assistant</span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <button
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{ padding: 4, border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        style={{ padding: 4, border: 'none', background: 'none', color: 'white', cursor: 'pointer' }}
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {/* Messages */}
                    <div
                        style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: 'var(--space-3)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-3)',
                        }}
                    >
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                                <Lightbulb size={32} style={{ color: 'var(--primary-300)', marginBottom: 'var(--space-2)' }} />
                                <p style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-4)' }}>
                                    How can I help with this job?
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    {QUICK_PROMPTS.map(prompt => (
                                        <button
                                            key={prompt}
                                            onClick={() => sendMessage(prompt)}
                                            style={{
                                                padding: 'var(--space-2) var(--space-3)',
                                                border: '1px solid var(--primary-200)',
                                                borderRadius: 'var(--radius-full)',
                                                backgroundColor: 'var(--primary-50)',
                                                color: 'var(--primary-700)',
                                                cursor: 'pointer',
                                                fontSize: 'var(--text-sm)',
                                                textAlign: 'left',
                                            }}
                                        >
                                            {prompt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                }}
                            >
                                <div
                                    style={{
                                        padding: 'var(--space-3)',
                                        borderRadius: 'var(--radius-lg)',
                                        backgroundColor: msg.role === 'user' ? 'var(--primary-500)' : 'var(--neutral-100)',
                                        color: msg.role === 'user' ? 'white' : 'var(--neutral-800)',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {msg.content}
                                </div>
                                {msg.actions && (
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                                        {msg.actions.map(action => (
                                            <button
                                                key={action.action}
                                                style={{
                                                    padding: 'var(--space-1) var(--space-2)',
                                                    border: '1px solid var(--primary-300)',
                                                    borderRadius: 'var(--radius-md)',
                                                    backgroundColor: 'white',
                                                    color: 'var(--primary-600)',
                                                    cursor: 'pointer',
                                                    fontSize: 'var(--text-sm)',
                                                }}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div
                                style={{
                                    alignSelf: 'flex-start',
                                    padding: 'var(--space-3)',
                                    borderRadius: 'var(--radius-lg)',
                                    backgroundColor: 'var(--neutral-100)',
                                    color: 'var(--neutral-500)',
                                }}
                            >
                                <span className="typing-dots">Thinking...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div
                        style={{
                            padding: 'var(--space-3)',
                            borderTop: '1px solid var(--neutral-200)',
                            display: 'flex',
                            gap: 'var(--space-2)',
                        }}
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                            placeholder="Ask anything..."
                            style={{
                                flex: 1,
                                padding: 'var(--space-2) var(--space-3)',
                                border: '1px solid var(--neutral-300)',
                                borderRadius: 'var(--radius-full)',
                                outline: 'none',
                            }}
                        />
                        <Button
                            variant="primary"
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isTyping}
                            className="btn-icon"
                        >
                            <Send size={18} />
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
}
