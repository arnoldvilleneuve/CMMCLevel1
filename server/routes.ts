import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "../db";
import { practices, assessments, reports } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
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
      
      const result = await db
        .insert(documents)
        .values({
          assessmentId: parseInt(id),
          filename,
          data
        })
        .returning();
      
      res.json(result[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload document' });
    }
  });

  app.get('/api/assessments/:id/documents', async (req, res) => {
    try {
      const { id } = req.params;
      const docs = await db
        .select()
        .from(documents)
        .where(eq(documents.assessmentId, parseInt(id)));
      
      res.json(docs.map(doc => ({
        id: doc.id,
        assessmentId: doc.assessmentId,
        filename: doc.filename,
        createdAt: doc.createdAt
      })));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
