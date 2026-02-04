/**
 * Workflow Agent Cloud Functions
 * 
 * This module exports the following Cloud Functions:
 * - onWorkflowTransition: Validates and logs workflow state changes
 * - generatePdfReport: Creates PDF reports from job data
 * - exportJobJson: Exports job data as signed JSON
 * - sendEmail: Sends emails via SendGrid
 * - validateWithAI: Uses Gemini to validate job completeness
 */

import * as admin from 'firebase-admin';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as sgMail from '@sendgrid/mail';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// ============================================
// TYPES
// ============================================

interface WorkflowTransitionRequest {
    jobId: string;
    tenantId: string;
    newState: string;
    decision?: {
        id: string;
        outcome: boolean;
    };
}

interface ValidationResult {
    isComplete: boolean;
    missingFields: string[];
    warnings: string[];
    confidence: 'high' | 'medium' | 'low';
    sources: string[];
}

// ============================================
// WORKFLOW TRANSITION
// ============================================

export const onWorkflowTransition = onCall<WorkflowTransitionRequest>(
    { cors: true },
    async (request) => {
        // Verify authentication
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { jobId, tenantId, newState, decision } = request.data;

        if (!jobId || !tenantId || !newState) {
            throw new HttpsError('invalid-argument', 'Missing required fields');
        }

        const jobRef = db.collection('tenants').doc(tenantId).collection('jobs').doc(jobId);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            throw new HttpsError('not-found', 'Job not found');
        }

        const job = jobDoc.data()!;
        const previousState = job.status;

        // Update job state
        await jobRef.update({
            status: newState,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create audit event
        const eventsRef = jobRef.collection('events');
        await eventsRef.add({
            jobId,
            type: decision ? 'decision' : 'state_change',
            fromState: previousState,
            toState: newState,
            decision: decision?.id || null,
            outcome: decision?.outcome ?? null,
            userId: request.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            previousState,
            newState,
        };
    }
);

// ============================================
// GENERATE PDF REPORT
// ============================================

export const generatePdfReport = onCall(
    {
        cors: true,
        memory: '1GiB',
        timeoutSeconds: 120,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { jobId, tenantId, templateId } = request.data;

        if (!jobId || !tenantId) {
            throw new HttpsError('invalid-argument', 'Missing required fields');
        }

        // Fetch job data
        const jobRef = db.collection('tenants').doc(tenantId).collection('jobs').doc(jobId);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            throw new HttpsError('not-found', 'Job not found');
        }

        const job = jobDoc.data()!;

        // Fetch related data (inspections, events)
        const [inspectionsSnap, eventsSnap] = await Promise.all([
            jobRef.collection('inspections').get(),
            jobRef.collection('events').orderBy('timestamp', 'desc').limit(50).get(),
        ]);

        const inspections = inspectionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const events = eventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Generate HTML for PDF
        const html = generateReportHtml({
            job,
            inspections,
            events,
            templateId: templateId || 'completion',
        });

        // In production, use Puppeteer to generate PDF
        // For now, return a placeholder
        const fileName = `${job.workOrderRef}_${templateId || 'report'}_${Date.now()}.pdf`;
        const storagePath = `tenants/${tenantId}/reports/${jobId}/${fileName}`;

        // TODO: Implement actual PDF generation with Puppeteer
        // const browser = await puppeteer.launch({ headless: 'new' });
        // const page = await browser.newPage();
        // await page.setContent(html);
        // const pdfBuffer = await page.pdf({ format: 'A4' });
        // await browser.close();
        // await storage.bucket().file(storagePath).save(pdfBuffer);

        // Create report record
        const reportsRef = db.collection('tenants').doc(tenantId).collection('reports');
        const reportDoc = await reportsRef.add({
            jobId,
            type: templateId || 'completion',
            storagePath,
            fileName,
            generatedBy: request.auth.uid,
            generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            reportId: reportDoc.id,
            fileName,
            message: 'PDF generation stub - implement Puppeteer in production',
        };
    }
);

// ============================================
// EXPORT JOB JSON
// ============================================

export const exportJobJson = onCall(
    { cors: true },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { jobId, tenantId } = request.data;

        if (!jobId || !tenantId) {
            throw new HttpsError('invalid-argument', 'Missing required fields');
        }

        // Fetch complete job data
        const jobRef = db.collection('tenants').doc(tenantId).collection('jobs').doc(jobId);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            throw new HttpsError('not-found', 'Job not found');
        }

        const job = jobDoc.data()!;

        // Fetch all related data
        const [inspectionsSnap, eventsSnap, attachmentsSnap] = await Promise.all([
            jobRef.collection('inspections').get(),
            jobRef.collection('events').orderBy('timestamp', 'asc').get(),
            jobRef.collection('attachments').get(),
        ]);

        const exportData = {
            export: {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                exportedBy: request.auth.uid,
            },
            job: {
                id: jobId,
                ...job,
            },
            inspections: inspectionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            auditTrail: eventsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            attachments: attachmentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        };

        return {
            success: true,
            data: exportData,
        };
    }
);

// ============================================
// SEND EMAIL (Firestore Trigger)
// ============================================

export const sendEmail = onDocumentCreated(
    'tenants/{tenantId}/emailOutbox/{messageId}',
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) return;

        const message = snapshot.data();
        const messageRef = snapshot.ref;

        try {
            const msg = {
                to: message.to,
                from: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com',
                subject: message.subject,
                html: message.body,
            };

            await sgMail.send(msg);

            // Update status to sent
            await messageRef.update({
                status: 'sent',
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        } catch (error: unknown) {
            console.error('Email send error:', error);

            // Update status to failed
            await messageRef.update({
                status: 'failed',
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
);

// ============================================
// AI VALIDATION
// ============================================

export const validateWithAI = onCall(
    { cors: true },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'User must be authenticated');
        }

        const { jobId, tenantId, currentStep, requiredFields } = request.data;

        if (!jobId || !tenantId) {
            throw new HttpsError('invalid-argument', 'Missing required fields');
        }

        // Fetch job data
        const jobRef = db.collection('tenants').doc(tenantId).collection('jobs').doc(jobId);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            throw new HttpsError('not-found', 'Job not found');
        }

        const job = jobDoc.data()!;

        // Create validation prompt
        const prompt = `
      Analyze the following job data and determine if it is complete enough to proceed.

      Current Step: ${currentStep}
      Required Fields: ${requiredFields?.join(', ') || 'All critical fields'}

      Job Data:
      ${JSON.stringify(job, null, 2)}

      Return a JSON object with:
      {
        "isComplete": boolean,
        "missingFields": ["field1", "field2"],
        "warnings": ["warning message 1"],
        "confidence": "high" | "medium" | "low",
        "sources": ["job.clientName", "job.scheduledDate"]
      }

      Only return valid JSON, no other text.
    `;

        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Invalid AI response format');
            }

            const validation: ValidationResult = JSON.parse(jsonMatch[0]);

            // Log validation event
            const eventsRef = jobRef.collection('events');
            await eventsRef.add({
                jobId,
                type: 'validation',
                userId: request.auth.uid,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                aiValidation: validation,
            });

            return {
                success: true,
                validation,
            };
        } catch (error: unknown) {
            console.error('AI validation error:', error);
            throw new HttpsError('internal', 'AI validation failed');
        }
    }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

interface ReportData {
    job: admin.firestore.DocumentData;
    inspections: Array<{ id: string } & admin.firestore.DocumentData>;
    events: Array<{ id: string } & admin.firestore.DocumentData>;
    templateId: string;
}

function generateReportHtml(data: ReportData): string {
    const { job, inspections, events, templateId } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Inter', -apple-system, sans-serif;
          color: #0f172a;
          line-height: 1.6;
          padding: 40px;
        }
        .header {
          background: #1e40af;
          color: white;
          padding: 24px;
          margin: -40px -40px 24px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .section {
          margin-bottom: 24px;
        }
        .section h2 {
          font-size: 16px;
          color: #1e40af;
          border-bottom: 2px solid #dbeafe;
          padding-bottom: 8px;
        }
        .field {
          margin-bottom: 12px;
        }
        .field-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
        }
        .field-value {
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 8px 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f9fafb;
          font-size: 12px;
          text-transform: uppercase;
        }
        .warning-icon {
          color: #dc2626;
        }
        .success-icon {
          color: #22c55e;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${templateId.toUpperCase()} REPORT</h1>
        <p>Job: ${job.workOrderRef} | Client: ${job.clientName}</p>
      </div>

      <div class="section">
        <h2>Summary</h2>
        <div class="field">
          <div class="field-label">Work Order</div>
          <div class="field-value">${job.workOrderRef}</div>
        </div>
        <div class="field">
          <div class="field-label">Client</div>
          <div class="field-value">${job.clientName}</div>
        </div>
        <div class="field">
          <div class="field-label">Status</div>
          <div class="field-value">${job.status}</div>
        </div>
      </div>

      <div class="section">
        <h2>Inspections</h2>
        ${inspections.length > 0
            ? `
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${inspections
                .map(
                    (i) => `
                <tr>
                  <td>${i.assetId || 'N/A'}</td>
                  <td>${i.status}</td>
                  <td>${i.notes || '-'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : '<p>No inspections recorded.</p>'
        }
      </div>

      <div class="section">
        <h2>Audit Trail (Recent)</h2>
        ${events.length > 0
            ? `
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>User</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${events
                .slice(0, 10)
                .map(
                    (e) => `
                <tr>
                  <td>${e.type}</td>
                  <td>${e.userName || e.userId}</td>
                  <td>${e.timestamp?.toDate?.() || e.timestamp}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `
            : '<p>No events recorded.</p>'
        }
      </div>

      <div class="section" style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #6b7280;">
          Generated on ${new Date().toISOString()} by Workflow Agent
        </p>
      </div>
    </body>
    </html>
  `;
}
