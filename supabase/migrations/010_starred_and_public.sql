-- Add starred and public fields to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS public_token TEXT;

-- Index for starred documents
CREATE INDEX IF NOT EXISTS idx_documents_starred ON documents(workspace_id, is_starred) WHERE is_starred = true;

-- Index for public documents
CREATE INDEX IF NOT EXISTS idx_documents_public ON documents(public_token) WHERE is_public = true;
