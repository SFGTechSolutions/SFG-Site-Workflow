// Document Processor - Extract job data from PDFs, images, Word docs

/**
 * Extracted job fields from a document
 */
export interface ExtractedJobData {
    clientName?: string;
    clientEmail?: string;
    siteAddress?: string;
    workDescription?: string;
    dueDate?: string;
    scheduledDate?: string;
    jobValue?: string;
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    ragStatus?: 'Red' | 'Amber' | 'Green';
    workOrderRef?: string;
    contactPhone?: string;
    notes?: string;
    rawText?: string;
    confidence: number;
}

// Gemini configuration
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.0-flash';

import { DEMO_MODE, MOCK_DELAY } from './demo-config';

/**
 * Main entry point - process any document type
 */
export async function processDocument(file: File): Promise<ExtractedJobData> {
    if (DEMO_MODE) {
        return extractMockData();
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    // Route to appropriate processor
    if (fileType.startsWith('image/') || fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg')) {
        return extractFromImage(file);
    }

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        return extractFromPDF(file);
    }

    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        return extractFromWord(file);
    }

    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        return extractFromText(file);
    }

    throw new Error(`Unsupported file type: ${fileType || fileName}`);
}

// Mock data extraction for Demo Mode
async function extractMockData(): Promise<ExtractedJobData> {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return {
        clientName: "Ironclad Mining Services",
        clientEmail: "admin@ironcladmining.com.au", // Added dummy email
        siteAddress: "Mt Isa QLD",
        workOrderRef: "WO-000132",
        jobValue: "$40,250.00",
        scheduledDate: "2026-02-18",
        priority: "High",
        ragStatus: "Amber",
        workDescription: "Shutdown support - conveyor access, working at heights permit control, and rescue readiness.",
        notes: "Working at heights, risk classification high.",
        confidence: 1.0,
        rawText: "Mock extraction for demo mode."
    };
}

/**
 * Extract data from image using Gemini Vision
 */
export async function extractFromImage(file: File): Promise<ExtractedJobData> {
    // Convert image to base64
    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'image/jpeg';

    if (!GEMINI_API_KEY) {
        return {
            notes: 'Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to .env.local',
            confidence: 0,
        };
    }

    const prompt = `You are an expert industrial document analyst. Read this document CAREFULLY and SLOWLY to extract accuracy data.

Extract the following specific information:
- **Client Name**: The customer or business entity.
- **Client Email**: Contact email.
- **Site Address**: Where the work is taking place.
- **Work Description**: Scope of work, line items, or instructions.
- **Job Value**: The total financial value or cost (e.g., $500.00). Look for "Total", "Amount", "Est".
- **Dates**: 
    - "Due Date": When the job must be finished.
    - "Scheduled Date": When the work is booked to happen.
- **Work Order Ref**: Any reference numbers (WO#, PO#, Job#).
- **Contact Phone**: Phone number.
- **Priority**: Mark as 'Low', 'Medium', 'High', or 'Critical' based on keywords like "Urgent", "ASAP", or explicit priority fields.
- **RAG Status**: Assign a Red/Amber/Green status:
    - RED: Critical priority, hazardous, or due within 24 hours.
    - AMBER: High priority, important/high-value (>$1000), or due within 3 days.
    - GREEN: Standard maintenance, low priority, or routine work.

Respond ONLY with valid JSON in this exact format:
{
  "clientName": "extracted value or null",
  "clientEmail": "extracted value or null",
  "siteAddress": "extracted value or null",
  "workDescription": "extracted value or null",
  "dueDate": "YYYY-MM-DD or null",
  "scheduledDate": "YYYY-MM-DD or null",
  "jobValue": "$0.00 or null",
  "priority": "Low/Medium/High/Critical",
  "ragStatus": "Red/Amber/Green",
  "workOrderRef": "extracted value or null",
  "contactPhone": "extracted value or null",
  "notes": "any extra context or safety warnings",
  "rawText": "summary of content",
  "confidence": 0.0 to 1.0
}`;

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
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2000,
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
                clientName: parsed.clientName || undefined,
                clientEmail: parsed.clientEmail || undefined,
                siteAddress: parsed.siteAddress || undefined,
                workDescription: parsed.workDescription || undefined,
                dueDate: parsed.dueDate || undefined,
                scheduledDate: parsed.scheduledDate || undefined,
                jobValue: parsed.jobValue || undefined,
                priority: parsed.priority || 'Medium',
                ragStatus: parsed.ragStatus || 'Green',
                workOrderRef: parsed.workOrderRef || undefined,
                contactPhone: parsed.contactPhone || undefined,
                notes: parsed.notes || undefined,
                rawText: parsed.rawText || undefined,
                confidence: parsed.confidence || 0.5,
            };
        }

        return { rawText: text, confidence: 0.3 };
    } catch (error) {
        console.error('Error extracting from image:', error);
        return {
            notes: `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`,
            confidence: 0,
        };
    }
}

/**
 * Extract data from PDF
 * For PDFs, we convert to image and use Gemini Vision
 * Note: For production, you'd want to use pdf.js for text extraction
 */
export async function extractFromPDF(file: File): Promise<ExtractedJobData> {
    // For POC, treat PDF as image (Gemini can handle PDF in base64)
    // This works for single-page PDFs rendered as images
    const base64 = await fileToBase64(file);

    if (!GEMINI_API_KEY) {
        return {
            notes: 'Gemini API key not configured',
            confidence: 0,
        };
    }

    const prompt = `You are an expert industrial document analyst. Read this PDF CAREFULLY and SLOWLY to extract accuracy data.

Extract the following specific information:
- **Client Name**: The customer or business entity.
- **Client Email**: Contact email.
- **Site Address**: Where the work is taking place.
- **Work Description**: Scope of work, line items, or instructions.
- **Job Value**: The total financial value or cost (e.g., $500.00). Look for "Total", "Amount", "Est".
- **Dates**: 
    - "Due Date": When the job must be finished.
    - "Scheduled Date": When the work is booked to happen.
- **Work Order Ref**: Any reference numbers (WO#, PO#, Job#).
- **Contact Phone**: Phone number.
- **Priority**: Mark as 'Low', 'Medium', 'High', or 'Critical' based on keywords like "Urgent", "ASAP", or explicit priority fields.
- **RAG Status**: Assign a Red/Amber/Green status:
    - RED: Critical priority, hazardous, or due within 24 hours.
    - AMBER: High priority, important/high-value (>$1000), or due within 3 days.
    - GREEN: Standard maintenance, low priority, or routine work.

Respond ONLY with valid JSON in this exact format:
{
  "clientName": "extracted value or null",
  "clientEmail": "extracted value or null",
  "siteAddress": "extracted value or null",
  "workDescription": "extracted value or null",
  "dueDate": "YYYY-MM-DD or null",
  "scheduledDate": "YYYY-MM-DD or null",
  "jobValue": "$0.00 or null",
  "priority": "Low/Medium/High/Critical",
  "ragStatus": "Red/Amber/Green",
  "workOrderRef": "extracted value or null",
  "contactPhone": "extracted value or null",
  "notes": "any extra context or safety warnings",
  "rawText": "summary of content",
  "confidence": 0.0 to 1.0
}`;

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
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: 'application/pdf',
                                        data: base64,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        maxOutputTokens: 2000,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                clientName: parsed.clientName || undefined,
                clientEmail: parsed.clientEmail || undefined,
                siteAddress: parsed.siteAddress || undefined,
                workDescription: parsed.workDescription || undefined,
                dueDate: parsed.dueDate || undefined,
                scheduledDate: parsed.scheduledDate || undefined,
                jobValue: parsed.jobValue || undefined,
                priority: parsed.priority || 'Medium',
                ragStatus: parsed.ragStatus || 'Green',
                workOrderRef: parsed.workOrderRef || undefined,
                contactPhone: parsed.contactPhone || undefined,
                notes: parsed.notes || undefined,
                rawText: parsed.rawText || undefined,
                confidence: parsed.confidence || 0.5,
            };
        }

        return { rawText: text, confidence: 0.3 };
    } catch (error) {
        console.error('Error extracting from PDF:', error);
        return {
            notes: `Error processing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`,
            confidence: 0,
        };
    }
}

/**
 * Extract data from Word document (.docx)
 * Uses Gemini to process the text content
 */
export async function extractFromWord(file: File): Promise<ExtractedJobData> {
    try {
        // Read .docx as ArrayBuffer and extract text
        const arrayBuffer = await file.arrayBuffer();
        const textContent = await extractTextFromDocx(arrayBuffer);

        return extractJobFieldsFromText(textContent);
    } catch (error) {
        console.error('Error extracting from Word:', error);
        return {
            notes: `Error processing Word document: ${error instanceof Error ? error.message : 'Unknown error'}`,
            confidence: 0,
        };
    }
}

/**
 * Extract text from plain text file
 */
export async function extractFromText(file: File): Promise<ExtractedJobData> {
    const text = await file.text();
    return extractJobFieldsFromText(text);
}

/**
 * Extract text content from .docx file
 * .docx is a zip file containing XML
 */
async function extractTextFromDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    // Use a simple approach - .docx is a ZIP containing document.xml
    // For production, you'd use a proper library like mammoth.js

    try {
        // Try to decompress and find document.xml
        const blob = new Blob([arrayBuffer], { type: 'application/zip' });

        // Simple text extraction - look for readable text patterns
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = textDecoder.decode(arrayBuffer);

        // Extract text between XML tags
        const textMatches = rawText.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (textMatches) {
            const extractedText = textMatches
                .map(match => match.replace(/<w:t[^>]*>|<\/w:t>/g, ''))
                .join(' ');
            return extractedText;
        }

        // Fallback: return any readable ASCII text
        const readableText = rawText.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
        return readableText.substring(0, 5000); // Limit length
    } catch (error) {
        console.error('Error parsing docx:', error);
        return '';
    }
}

/**
 * Use Gemini to extract structured fields from raw text
 */
async function extractJobFieldsFromText(text: string): Promise<ExtractedJobData> {
    if (!GEMINI_API_KEY) {
        return {
            rawText: text,
            notes: 'Gemini API key not configured',
            confidence: 0,
        };
    }

    if (!text || text.length < 10) {
        return {
            notes: 'No text content found in document',
            confidence: 0,
        };
    }

    const prompt = `Extract detailed job information from this text. Read CAREFULLY.
    
TEXT:
${text.substring(0, 3000)}

Extract:
- Client Name/Email/Address
- Job Value/Cost ($)
- Due Date AND Scheduled Date
- Work Order Ref
- Priority (Low/Medium/High/Critical)
- RAG Status (Red/Amber/Green) based on urgency/value.

Respond ONLY with valid JSON:
{
  "clientName": "value or null",
  "clientEmail": "value or null",
  "siteAddress": "value or null",
  "workDescription": "value or null",
  "dueDate": "YYYY-MM-DD or null",
  "scheduledDate": "YYYY-MM-DD or null",
  "jobValue": "$0.00 or null",
  "priority": "Low/Medium/High/Critical",
  "ragStatus": "Red/Amber/Green",
  "workOrderRef": "value or null",
  "contactPhone": "value or null",
  "notes": "value or null",
  "confidence": 0.0-1.0
}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                clientName: parsed.clientName || undefined,
                clientEmail: parsed.clientEmail || undefined,
                siteAddress: parsed.siteAddress || undefined,
                workDescription: parsed.workDescription || undefined,
                dueDate: parsed.dueDate || undefined,
                scheduledDate: parsed.scheduledDate || undefined,
                jobValue: parsed.jobValue || undefined,
                priority: parsed.priority || 'Medium',
                ragStatus: parsed.ragStatus || 'Green',
                workOrderRef: parsed.workOrderRef || undefined,
                contactPhone: parsed.contactPhone || undefined,
                notes: parsed.notes || undefined,
                rawText: text,
                confidence: parsed.confidence || 0.5,
            };
        }

        return { rawText: text, confidence: 0.3 };
    } catch (error) {
        console.error('Error extracting fields from text:', error);
        return {
            rawText: text,
            notes: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
            confidence: 0,
        };
    }
}

/**
 * Convert file to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (data:image/jpeg;base64,)
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Get supported file types for the upload component
 */
export function getSupportedFileTypes(): string {
    return 'image/*,.pdf,.docx,.txt';
}

export function getAcceptedMimeTypes(): string[] {
    return [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
    ];
}

/**
 * Extract structured workflow specification from a document
 * Transforms PDF/Text into a deterministic state machine definition
 */
export async function extractWorkflowSpec(file: File): Promise<import('./types').WorkflowSpecification> {
    const base64 = await fileToBase64(file);
    const mimeType = file.type || 'application/pdf';

    if (!GEMINI_API_KEY) {
        console.error('Gemini API key not configured');
        return [];
    }

    const prompt = `Treat this document as a WORKFLOW SPECIFICATION.
Extract each step into a structured object with step name, user action, system action, guard conditions, outputs, and a generated audit event.

Do not infer missing data.
Do not merge steps.
Preserve ordering.
Output must be deterministic JSON suitable for a workflow state machine.

Respond ONLY with a valid JSON array of objects fitting this schema:
[
  {
    "step_name": "Generate Work Order Pack",
    "phase": "INITIATION",
    "user_action": "User triggers generation...",
    "system_action": "System generates PDF...",
    "guard_conditions": ["condition1", "condition2"],
    "outputs": ["output1", "output2"],
    "audit_event": "EVENT_NAME_UPPERCASE",
    "next_state": "NEXT_STATE_UPPERCASE"
  }
]`;

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
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: mimeType.startsWith('image/') || mimeType === 'application/pdf' ? mimeType : 'text/plain',
                                        data: base64,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.0, // Strict deterministic output
                        maxOutputTokens: 4000,
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        console.warn('No JSON array found in response');
        return [];

    } catch (error) {
        console.error('Error extracting workflow spec:', error);
        return [];
    }
}
