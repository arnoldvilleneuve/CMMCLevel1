import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { db } from "../db";
import { practices, assessments, reports, documents } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Increase payload size limit for file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.get('/api/practices', async (req, res) => {
    try {
      const allPractices = await db.select().from(practices);
      res.json(allPractices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch practices' });
    }
  });

  app.get('/api/assessments', async (req, res) => {
    try {
      const allAssessments = await db.select().from(assessments);
      res.json(allAssessments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch assessments' });
    }
  });

  app.post('/api/assessments', async (req, res) => {
    try {
      const { practiceId, evidence, status } = req.body;
      const result = await db
        .insert(assessments)
        .values({
          practiceId,
          evidence,
          status,
        })
        .returning();
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create assessment' });
    }
  });

  app.post('/api/reports', async (req, res) => {
    try {
      const { title } = req.body;
      const [assessmentData, practiceData] = await Promise.all([
        db.select().from(assessments),
        db.select().from(practices)
      ]);
      
      const report = await db
        .insert(reports)
        .values({
          title,
          data: {
            assessments: assessmentData,
            practices: practiceData,
            generatedAt: new Date().toISOString()
          }
        })
        .returning();
      
      res.json(report[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate report' });
    }
  });
  app.post('/api/assessments/:id/documents', async (req, res) => {
    try {
      const { id } = req.params;
      const { filename, data } = req.body;
      
      if (!filename || !data) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate assessment exists
      const assessment = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, parseInt(id)))
        .limit(1);

      if (!assessment.length) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      // Insert new document
      const result = await db
        .insert(documents)
        .values({
          assessmentId: parseInt(id),
          filename,
          data
        })
        .returning();
      
      const doc = result[0];
      res.json({
        id: doc.id,
        assessmentId: doc.assessmentId,
        filename: doc.filename,
        data: doc.data,
        createdAt: doc.createdAt
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  app.delete('/api/assessments/:assessmentId/documents/:docId', async (req, res) => {
    try {
      const { assessmentId, docId } = req.params;
      
      // Verify document exists and belongs to the assessment
      const document = await db
        .select()
        .from(documents)
        .where(eq(documents.id, parseInt(docId)))
        .where(eq(documents.assessmentId, parseInt(assessmentId)))
        .limit(1);

      if (!document.length) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete the document
      await db
        .delete(documents)
        .where(eq(documents.id, parseInt(docId)))
        .where(eq(documents.assessmentId, parseInt(assessmentId)));

      res.json({ success: true });
    } catch (error) {
      console.error('Document deletion error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  app.get('/api/assessments/:id/documents', async (req, res) => {
    try {
      const { id } = req.params;
      
      // Fetch all documents for this assessment
      const docs = await db
        .select({
          id: documents.id,
          assessmentId: documents.assessmentId,
          filename: documents.filename,
          createdAt: documents.createdAt
        })
        .from(documents)
        .where(eq(documents.assessmentId, parseInt(id)))
        .orderBy(documents.createdAt);
      
      res.json(docs);
    } catch (error) {
      console.error('Document fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
