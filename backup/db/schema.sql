-- CMMC Compliance Portal Database Schema
-- Generated: 2024-12-14
-- Version: 1.0.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables if needed
DROP TABLE IF EXISTS document_chunks;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS practices;

-- Practices Table - Stores CMMC practice requirements
CREATE TABLE practices (
    id SERIAL PRIMARY KEY,
    domain TEXT NOT NULL,
    practice_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    assessment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT practice_id_format CHECK (practice_id ~ '^[A-Z]{2}\.[L][1-5]-[A-Z]\.[0-9]+\.[A-Z]+$')
);

-- Create index on practice_id for faster lookups
CREATE INDEX idx_practices_practice_id ON practices(practice_id);

-- Assessments Table - Stores assessment responses
CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    practice_id TEXT NOT NULL REFERENCES practices(practice_id),
    evidence TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('Not Started', 'In Progress', 'Complete'))
);

-- Create index on practice_id for faster joins
CREATE INDEX idx_assessments_practice_id ON assessments(practice_id);

-- Documents Table - Stores uploaded evidence documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    total_size INTEGER NOT NULL CHECK (total_size > 0 AND total_size <= 5368709120), -- Max 5GB
    total_chunks INTEGER NOT NULL CHECK (total_chunks > 0),
    uploaded_chunks INTEGER NOT NULL DEFAULT 0 CHECK (uploaded_chunks >= 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chunks_validation CHECK (uploaded_chunks <= total_chunks)
);

-- Create indexes for document queries
CREATE INDEX idx_documents_assessment_id ON documents(assessment_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Document Chunks Table - Stores document chunks for large file uploads
CREATE TABLE document_chunks (
    id SERIAL PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
    data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_chunk UNIQUE (document_id, chunk_index)
);

-- Create index for chunk retrieval
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id, chunk_index);

-- Reports Table - Stores assessment reports
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_practices_modtime
    BEFORE UPDATE ON practices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_modtime
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_modtime
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE practices IS 'Stores CMMC practice requirements and guidelines';
COMMENT ON TABLE assessments IS 'Tracks assessment status and evidence for each practice';
COMMENT ON TABLE documents IS 'Manages uploaded evidence documents with chunked upload support';
COMMENT ON TABLE document_chunks IS 'Stores individual chunks of large document uploads';
COMMENT ON TABLE reports IS 'Stores generated assessment reports and analytics';

-- Initial setup complete
SELECT 'Database schema installation complete' as status;
