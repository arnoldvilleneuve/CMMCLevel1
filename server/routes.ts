import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { db } from "../db";
import { practices, assessments, reports, documents, documentChunks } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Configure middleware for handling large file uploads
  // Configure middleware for handling uploads
  app.use(express.json({ 
    limit: '50mb',  // Increased for initialization payload
    verify: (req, res, buf) => {
      if (req.headers['content-type']?.includes('application/json')) {
        (req as any).rawBody = buf;
      }
    }
  }));
  app.use(express.raw({ 
    type: 'application/octet-stream',
    limit: '6gb', 
    verify: (req, res, buf) => {
      (req as any).rawBody = buf;
    }
  }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Add specific error handling for large files
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof SyntaxError && err.status === 413) {
      return res.status(413).json({
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum allowed size of 50MB.'
      });
    }
    next(err);
  });
  
  // Comprehensive error handling middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server error:', err);
    
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ 
        error: 'File too large',
        message: 'The uploaded file exceeds the maximum allowed size of 100MB.'
      });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        message: err.message
      });
    }
    
    res.status(500).json({
      error: 'Server Error',
      message: 'An unexpected error occurred while processing your request.'
    });
  });
  
  // Add CORS and other necessary middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });
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
  // Initialize chunked upload
  app.post('/api/assessments/:id/documents/init', async (req, res) => {
    try {
      const { id } = req.params;
      const { filename, totalSize, totalChunks } = req.body;
      
      // Enhanced validation
      if (!filename || typeof filename !== 'string') {
        return res.status(400).json({ error: 'Invalid filename' });
      }
      if (!totalSize || typeof totalSize !== 'number' || totalSize <= 0) {
        return res.status(400).json({ error: 'Invalid file size' });
      }
      if (!totalChunks || typeof totalChunks !== 'number' || totalChunks <= 0) {
        return res.status(400).json({ error: 'Invalid chunk count' });
      }
      
      // Validate file size
      const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB in bytes
      if (totalSize > MAX_FILE_SIZE) {
        return res.status(400).json({ 
          error: `File size exceeds maximum limit of 5GB`,
          details: { maxSize: MAX_FILE_SIZE, receivedSize: totalSize }
        });
      }

      const assessment = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, parseInt(id)))
        .execute();

      if (!assessment.length) {
        return res.status(404).json({ error: 'Assessment not found' });
      }

      // Initialize document with proper validation
      const result = await db
        .insert(documents)
        .values({
          assessmentId: parseInt(id),
          filename,
          totalSize,
          totalChunks,
          uploadedChunks: 0,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning()
        .execute();
      
      res.json(result[0]);
    } catch (error) {
      console.error('Document initialization error:', error);
      if (error instanceof Error) {
        res.status(500).json({ 
          error: 'Failed to initialize document upload',
          details: error.message
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to initialize document upload',
          details: 'Unknown error occurred'
        });
      }
    }
  });

  // Upload chunk
  app.post('/api/assessments/:assessmentId/documents/:documentId/chunks/:chunkIndex', async (req, res) => {
    try {
      const { assessmentId, documentId, chunkIndex } = req.params;
      const parsedDocId = parseInt(documentId);
      const parsedChunkIndex = parseInt(chunkIndex);
      
      if (!req.is('application/octet-stream')) {
        return res.status(400).json({ error: 'Invalid content type' });
      }

      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, parsedDocId))
        .execute();

      if (!doc.length) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Check if chunk already exists
      const existingChunk = await db
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.documentId, parsedDocId))
        .where(eq(documentChunks.chunkIndex, parsedChunkIndex))
        .execute();

      if (existingChunk.length > 0) {
        return res.status(409).json({ error: 'Chunk already exists' });
      }

      // Store chunk
      await db
        .insert(documentChunks)
        .values({
          documentId: parsedDocId,
          chunkIndex: parsedChunkIndex,
          data: req.body.toString('base64')
        })
        .execute();

      // Get current upload progress
      const chunks = await db
        .select()
        .from(documentChunks)
        .where(eq(documentChunks.documentId, parsedDocId))
        .execute();

      // Update document progress
      const updatedDoc = await db
        .update(documents)
        .set({
          uploadedChunks: chunks.length,
          status: chunks.length === doc[0].totalChunks ? 'complete' : 'pending',
          updatedAt: new Date()
        })
        .where(eq(documents.id, parsedDocId))
        .returning()
        .execute();

      res.json({
        ...updatedDoc[0],
        progress: Math.round((chunks.length / doc[0].totalChunks) * 100)
      });
    } catch (error) {
      console.error('Chunk upload error:', error);
      if (error instanceof Error) {
        res.status(500).json({ 
          error: 'Failed to upload chunk',
          details: error.message 
        });
      } else {
        res.status(500).json({ 
          error: 'Failed to upload chunk',
          details: 'Unknown error occurred'
        });
      }
    }
  });

  app.delete('/api/assessments/:assessmentId/documents/:docId', async (req, res) => {
    try {
      const { assessmentId, docId } = req.params;
      
      // First verify if document exists and belongs to assessment
      const doc = await db
        .select()
        .from(documents)
        .where(eq(documents.id, parseInt(docId)))
        .where(eq(documents.assessmentId, parseInt(assessmentId)))
        .execute();
      
      if (!doc.length) {
        return res.status(404).json({ error: 'Document not found or does not belong to this assessment' });
      }

      // Delete the document
      await db
        .delete(documents)
        .where(eq(documents.id, parseInt(docId)))
        .execute();

      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Document deletion error:', error);
      res.status(500).json({ error: 'Failed to delete document', details: error.message });
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
          totalSize: documents.totalSize,
          uploadedChunks: documents.uploadedChunks,
          totalChunks: documents.totalChunks,
          status: documents.status,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt
        })
        .from(documents)
        .where(eq(documents.assessmentId, parseInt(id)))
        .execute();
      
      res.json(docs);
    } catch (error) {
      console.error('Document fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}
