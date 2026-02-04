// Voice Notes History Component

'use client';

import React, { useState } from 'react';
import { Mic, MapPin, Clock, Play, Pause, Trash2, Image, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardBody, Button, Badge } from './ui';

export interface VoiceNoteEntry {
    id: string;
    transcript: string;
    audioUrl?: string;
    imageUrl?: string;
    location?: { latitude: number; longitude: number };
    timestamp: Date;
    aiSummary?: string;
    stepId?: string;
    stepName?: string;
}

interface VoiceNotesHistoryProps {
    notes: VoiceNoteEntry[];
    onDelete?: (noteId: string) => void;
    readonly?: boolean;
}

export function VoiceNotesHistory({ notes, onDelete, readonly = false }: VoiceNotesHistoryProps) {
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
    const [playingAudio, setPlayingAudio] = useState<string | null>(null);

    const toggleExpanded = (noteId: string) => {
        const newExpanded = new Set(expandedNotes);
        if (newExpanded.has(noteId)) {
            newExpanded.delete(noteId);
        } else {
            newExpanded.add(noteId);
        }
        setExpandedNotes(newExpanded);
    };

    const playAudio = (noteId: string, audioUrl: string) => {
        if (playingAudio === noteId) {
            setPlayingAudio(null);
            return;
        }

        const audio = new Audio(audioUrl);
        audio.onended = () => setPlayingAudio(null);
        audio.play();
        setPlayingAudio(noteId);
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;

        return new Date(date).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const openInMaps = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    };

    if (notes.length === 0) {
        return (
            <Card>
                <CardBody>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: 'var(--space-8)',
                            color: 'var(--neutral-400)',
                            textAlign: 'center',
                        }}
                    >
                        <Mic size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
                        <p style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>
                            No voice notes yet
                        </p>
                        <p style={{ fontSize: 'var(--text-sm)' }}>
                            Tap the microphone button to add notes hands-free
                        </p>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-2)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Mic size={20} style={{ color: 'var(--primary-600)' }} />
                    <span style={{ fontWeight: 'var(--font-semibold)' }}>Voice Notes</span>
                    <Badge variant="secondary">{notes.length}</Badge>
                </div>
            </div>

            {/* Notes list */}
            {notes.map((note) => {
                const isExpanded = expandedNotes.has(note.id);

                return (
                    <Card key={note.id}>
                        <CardBody style={{ padding: 'var(--space-3)' }}>
                            {/* Main row */}
                            <div
                                style={{
                                    display: 'flex',
                                    gap: 'var(--space-3)',
                                    alignItems: 'flex-start',
                                }}
                            >
                                {/* Image thumbnail */}
                                {note.imageUrl && (
                                    <div
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: 'var(--radius-md)',
                                            overflow: 'hidden',
                                            flexShrink: 0,
                                            border: '1px solid var(--neutral-200)',
                                        }}
                                    >
                                        <img
                                            src={note.imageUrl}
                                            alt="Voice note attachment"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Transcript */}
                                    <p
                                        style={{
                                            fontSize: 'var(--text-sm)',
                                            color: 'var(--neutral-900)',
                                            marginBottom: 'var(--space-2)',
                                            display: isExpanded ? 'block' : '-webkit-box',
                                            WebkitLineClamp: isExpanded ? 'unset' : 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: isExpanded ? 'visible' : 'hidden',
                                        }}
                                    >
                                        "{note.transcript}"
                                    </p>

                                    {/* Meta row */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 'var(--space-3)',
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--neutral-500)',
                                        }}
                                    >
                                        {/* Timestamp */}
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} />
                                            {formatTimestamp(note.timestamp)}
                                        </span>

                                        {/* Location */}
                                        {note.location && (
                                            <button
                                                onClick={() => openInMaps(note.location!.latitude, note.location!.longitude)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    color: 'var(--primary-600)',
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: 0,
                                                    fontSize: 'var(--text-xs)',
                                                }}
                                            >
                                                <MapPin size={12} />
                                                View on Map
                                            </button>
                                        )}

                                        {/* Step badge */}
                                        {note.stepName && (
                                            <Badge variant="secondary" style={{ fontSize: 'var(--text-xs)' }}>
                                                {note.stepName}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                                    {/* Audio play */}
                                    {note.audioUrl && (
                                        <button
                                            onClick={() => playAudio(note.id, note.audioUrl!)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: playingAudio === note.id ? 'var(--primary-100)' : 'var(--neutral-100)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {playingAudio === note.id ? (
                                                <Pause size={14} color="var(--primary-600)" />
                                            ) : (
                                                <Play size={14} color="var(--neutral-600)" />
                                            )}
                                        </button>
                                    )}

                                    {/* Expand */}
                                    <button
                                        onClick={() => toggleExpanded(note.id)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--neutral-100)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {isExpanded ? (
                                            <ChevronUp size={14} color="var(--neutral-600)" />
                                        ) : (
                                            <ChevronDown size={14} color="var(--neutral-600)" />
                                        )}
                                    </button>

                                    {/* Delete */}
                                    {!readonly && onDelete && (
                                        <button
                                            onClick={() => onDelete(note.id)}
                                            style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--neutral-100)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <Trash2 size={14} color="var(--error-500)" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && note.imageUrl && (
                                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--neutral-100)' }}>
                                    <img
                                        src={note.imageUrl}
                                        alt="Full attachment"
                                        style={{
                                            width: '100%',
                                            maxHeight: '300px',
                                            objectFit: 'contain',
                                            borderRadius: 'var(--radius-md)',
                                        }}
                                    />
                                </div>
                            )}

                            {/* AI Summary */}
                            {isExpanded && note.aiSummary && (
                                <div
                                    style={{
                                        marginTop: 'var(--space-3)',
                                        padding: 'var(--space-3)',
                                        backgroundColor: 'var(--primary-50)',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: '3px solid var(--primary-500)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: 'var(--text-xs)',
                                            color: 'var(--primary-600)',
                                            fontWeight: 'var(--font-medium)',
                                            marginBottom: 'var(--space-1)',
                                        }}
                                    >
                                        AI Summary
                                    </div>
                                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--primary-900)' }}>
                                        {note.aiSummary}
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                );
            })}
        </div>
    );
}
