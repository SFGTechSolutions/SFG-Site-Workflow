// Voice AI Agent - Core Engine
// Uses: Browser Speech API + Gemini 2.0 Flash + ElevenLabs

'use client';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface ISpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => ISpeechRecognition;
        webkitSpeechRecognition: new () => ISpeechRecognition;
    }
}

// Types for the voice agent
export interface VoiceNote {
    id: string;
    transcript: string;
    audioUrl?: string;
    location?: { latitude: number; longitude: number };
    timestamp: Date;
    aiResponse?: string;
    jobId?: string;
    stepId?: string;
}

export interface VoiceIntent {
    action:
    | 'add_note'
    | 'complete_step'
    | 'ask_question'
    | 'take_photo'
    | 'get_status'
    | 'read_notes'
    | 'who_assigned'
    | 'whats_left'
    | 'summarize'
    | 'advance_workflow'
    | 'unknown';
    content: string;
    confidence: number;
}

// ElevenLabs configuration
const ELEVENLABS_API_KEY = process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // "Sarah" - professional female voice

// Gemini configuration
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';

/**
 * Speech-to-Text using browser's built-in recognition
 */
export class SpeechRecognizer {
    private recognition: ISpeechRecognition | null = null;
    private isListening = false;

    constructor() {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = true;
                this.recognition.lang = 'en-AU'; // Australian English
            }
        }
    }

    isSupported(): boolean {
        return this.recognition !== null;
    }

    async listen(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.recognition) {
                reject(new Error('Speech recognition not supported'));
                return;
            }

            let finalTranscript = '';

            this.recognition.onresult = (event) => {
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
            };

            this.recognition.onend = () => {
                this.isListening = false;
                resolve(finalTranscript.trim());
            };

            this.recognition.onerror = (event) => {
                this.isListening = false;
                reject(new Error(`Speech recognition error: ${event.error}`));
            };

            this.isListening = true;
            this.recognition.start();
        });
    }

    stop(): void {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    getIsListening(): boolean {
        return this.isListening;
    }
}

/**
 * Process speech with Gemini AI to understand intent
 */
export async function processWithGemini(
    transcript: string,
    context: {
        currentJobId?: string;
        currentStep?: string;
        currentState?: string;
        jobNotes?: string[];
        clientName?: string;
        siteAddress?: string;
        assignedTo?: string[];
        dueDate?: string;
        workOrderRef?: string;
    }
): Promise<{ intent: VoiceIntent; response: string }> {

    const systemPrompt = `You are a helpful voice assistant for field contractors doing maintenance work.
You have FULL ACCESS to job data and can answer questions about it.

=== CURRENT JOB CONTEXT ===
- Job ID: ${context.currentJobId || 'No job selected'}
- Work Order Ref: ${context.workOrderRef || 'N/A'}
- Client: ${context.clientName || 'Unknown'}
- Site Address: ${context.siteAddress || 'Not specified'}
- Current Step: ${context.currentStep || 'Unknown'}
- Current Status: ${context.currentState || 'Unknown'}
- Assigned Team: ${context.assignedTo?.join(', ') || 'Unassigned'}
- Due Date: ${context.dueDate || 'Not set'}
- Recent Notes: ${context.jobNotes?.slice(-5).join(' | ') || 'None'}
===========================

You can help with:
1. STATUS queries - "What's the status?", "Where are we at?"
2. NOTES - "Add note...", "Read the notes"
3. TEAM - "Who is assigned?", "Who's on this job?"
4. WORKFLOW - "Mark complete", "What's next?", "What's left to do?"
5. PHOTOS - "Take a photo"
6. SUMMARIES - "Summarize today's work", "Give me a summary"

Respond with JSON:
{
  "intent": {
    "action": "get_status" | "add_note" | "read_notes" | "who_assigned" | "whats_left" | "complete_step" | "take_photo" | "summarize" | "ask_question" | "unknown",
    "content": "extracted content if applicable",
    "confidence": 0.0 to 1.0
  },
  "response": "Natural spoken response using the job data above. Be specific and helpful."
}

IMPORTANT: Use the actual job data in your responses. Don't say "I don't have access" - you DO have access above.

Examples:
- "What's the status?" -> Use currentState and currentStep to describe where the job is
- "Who's assigned?" -> List the team members from assignedTo
- "Read the notes" -> Read back the recent notes
- "What's left?" -> Describe remaining workflow steps based on currentStep

Always respond in valid JSON only.`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: `${systemPrompt}\n\nUser said: "${transcript}"` }],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 500,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                intent: parsed.intent,
                response: parsed.response,
            };
        }

        // Fallback
        return {
            intent: { action: 'add_note', content: transcript, confidence: 0.5 },
            response: `Got it! I'll add that as a note.`,
        };
    } catch (error) {
        console.error('Gemini error:', error);
        return {
            intent: { action: 'add_note', content: transcript, confidence: 0.3 },
            response: `I heard: "${transcript}". I'll save that as a note.`,
        };
    }
}

// Track current audio to allow cancellation
let currentAudio: HTMLAudioElement | null = null;

/**
 * Text-to-Speech using ElevenLabs
 */
export async function speakWithElevenLabs(text: string): Promise<void> {
    // Stop any previous speech
    stopSpeaking();

    if (!ELEVENLABS_API_KEY) {
        // Fallback to browser speech
        return speakWithBrowser(text);
    }

    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_turbo_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudio = audio;

        return new Promise((resolve) => {
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                if (currentAudio === audio) currentAudio = null;
                resolve();
            };
            audio.onerror = () => {
                if (currentAudio === audio) currentAudio = null;
                resolve();
            };
            audio.play().catch(e => {
                console.error("Audio play error", e);
                resolve();
            });
        });
    } catch (error) {
        console.error('ElevenLabs error:', error);
        return speakWithBrowser(text);
    }
}

/**
 * Fallback browser speech synthesis
 */
function speakWithBrowser(text: string): Promise<void> {
    stopSpeaking(); // Ensure clean slate
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            resolve();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
    });
}

/**
 * Stop any current speech playback
 */
export function stopSpeaking(): void {
    // Stop ElevenLabs audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }

    // Stop Browser synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Get current GPS location
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        return null;
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 5000 }
        );
    });
}

/**
 * Main Voice Agent class
 */
export class VoiceAgent {
    private recognizer: SpeechRecognizer;
    private onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void;
    private onTranscript?: (text: string, isFinal: boolean) => void;

    constructor() {
        this.recognizer = new SpeechRecognizer();
    }

    setCallbacks(callbacks: {
        onStateChange?: (state: 'idle' | 'listening' | 'processing' | 'speaking') => void;
        onTranscript?: (text: string, isFinal: boolean) => void;
    }) {
        this.onStateChange = callbacks.onStateChange;
        this.onTranscript = callbacks.onTranscript;
    }

    isSupported(): boolean {
        return this.recognizer.isSupported();
    }

    async processVoiceCommand(context: {
        currentJobId?: string;
        currentStep?: string;
        currentState?: string;
        jobNotes?: string[];
        clientName?: string;
        siteAddress?: string;
        assignedTo?: string[];
        dueDate?: string;
        workOrderRef?: string;
    }): Promise<{
        transcript: string;
        intent: VoiceIntent;
        response: string;
        location: { latitude: number; longitude: number } | null;
    }> {
        // Start listening
        this.onStateChange?.('listening');

        let transcript: string;
        try {
            transcript = await this.recognizer.listen();
        } catch (error) {
            this.onStateChange?.('idle');
            throw error;
        }

        if (!transcript) {
            this.onStateChange?.('idle');
            throw new Error('No speech detected');
        }

        this.onTranscript?.(transcript, true);
        this.onStateChange?.('processing');

        // Get location in parallel with AI processing
        const [aiResult, location] = await Promise.all([
            processWithGemini(transcript, context),
            getCurrentLocation(),
        ]);

        // Speak response
        this.onStateChange?.('speaking');
        await speakWithElevenLabs(aiResult.response);

        this.onStateChange?.('idle');

        return {
            transcript,
            intent: aiResult.intent,
            response: aiResult.response,
            location,
        };
    }

    stopListening(): void {
        this.recognizer.stop();
        this.onStateChange?.('idle');
    }

    stopSpeaking(): void {
        stopSpeaking(); // Call the module-level function
        this.onStateChange?.('idle');
    }
}

// Singleton instance
let voiceAgentInstance: VoiceAgent | null = null;

export function getVoiceAgent(): VoiceAgent {
    if (!voiceAgentInstance) {
        voiceAgentInstance = new VoiceAgent();
    }
    return voiceAgentInstance;
}

// End of file
