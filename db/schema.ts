import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const practices = pgTable("practices", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(),
  practiceId: text("practice_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  assessment: text("assessment").notNull(),
});

export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  practiceId: text("practice_id").notNull(),
  evidence: text("evidence").notNull(),
  status: text("status").notNull(), // Not Started, In Progress, Complete
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
export const documentChunks = pgTable("document_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  data: text("data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  assessmentId: integer("assessment_id").notNull(),
  filename: text("filename").notNull(),
  totalSize: integer("total_size").notNull(),
  totalChunks: integer("total_chunks").notNull(),
  uploadedChunks: integer("uploaded_chunks").notNull().default(0),
  status: text("status").notNull().default('pending'), // pending, complete, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documents);
export const selectDocumentSchema = createSelectSchema(documents);


export const insertPracticeSchema = createInsertSchema(practices);
export const selectPracticeSchema = createSelectSchema(practices);

export const insertAssessmentSchema = createInsertSchema(assessments); 
export const selectAssessmentSchema = createSelectSchema(assessments);

export const insertReportSchema = createInsertSchema(reports);
export const selectReportSchema = createSelectSchema(reports);
