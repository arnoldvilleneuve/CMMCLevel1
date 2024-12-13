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

export const insertPracticeSchema = createInsertSchema(practices);
export const selectPracticeSchema = createSelectSchema(practices);

export const insertAssessmentSchema = createInsertSchema(assessments); 
export const selectAssessmentSchema = createSelectSchema(assessments);

export const insertReportSchema = createInsertSchema(reports);
export const selectReportSchema = createSelectSchema(reports);
