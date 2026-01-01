-- Add searchable fields to scratches table
ALTER TABLE scratches ADD COLUMN IF NOT EXISTS searchable_text TEXT;
ALTER TABLE scratches ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE scratches ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add source_scratch_id to notes for linking uploaded scratches to auto-generated notes
ALTER TABLE notes ADD COLUMN IF NOT EXISTS source_scratch_id UUID REFERENCES scratches(id) ON DELETE SET NULL;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS searchable_text TEXT;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create indexes for search
CREATE INDEX IF NOT EXISTS idx_scratches_searchable_text ON scratches USING gin(to_tsvector('english', COALESCE(searchable_text, '')));
CREATE INDEX IF NOT EXISTS idx_scratches_tags ON scratches USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_notes_searchable_text ON notes USING gin(to_tsvector('english', COALESCE(searchable_text, '')));
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_notes_source_scratch ON notes(source_scratch_id);
