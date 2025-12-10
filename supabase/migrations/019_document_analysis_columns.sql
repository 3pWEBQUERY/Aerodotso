-- Add columns for AI analysis results
ALTER TABLE documents ADD COLUMN IF NOT EXISTS analysis_model TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS detailed_analysis JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS searchable_text TEXT;

-- Add index for searchable text
CREATE INDEX IF NOT EXISTS idx_documents_searchable_text ON documents USING gin(to_tsvector('english', searchable_text));

COMMENT ON COLUMN documents.analysis_model IS 'The AI model used for image analysis (e.g., gemini-2.0-flash, claude-3-5-sonnet)';
COMMENT ON COLUMN documents.detailed_analysis IS 'Detailed JSON analysis including subjects, colors, objects, mood, etc.';
COMMENT ON COLUMN documents.searchable_text IS 'Full searchable text generated from AI analysis';
