-- Enable vector extension if not exists
CREATE EXTENSION IF NOT EXISTS vector;

-- Add search-related columns to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS duration_seconds FLOAT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS transcription TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS embedding vector(768); -- For document/image embeddings

-- Create document_embeddings table for chunked text search
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, chunk_index)
);

-- Create image_embeddings table for visual search (frame-level for videos)
CREATE TABLE IF NOT EXISTS image_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  frame_index INTEGER DEFAULT 0, -- 0 for images, frame number for videos
  timestamp_seconds FLOAT, -- For video frames
  thumbnail_path TEXT, -- Path to frame thumbnail
  embedding vector(768) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  search_type TEXT DEFAULT 'semantic', -- semantic, text, visual
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast vector search
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_image_embeddings_vector ON image_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_search_history_workspace ON search_history(workspace_id, created_at DESC);

-- Function for semantic document search
CREATE OR REPLACE FUNCTION search_documents_semantic(
  p_workspace_id UUID,
  p_query_embedding vector(768),
  p_limit INTEGER DEFAULT 20,
  p_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  document_id UUID,
  title TEXT,
  mime_type TEXT,
  storage_path TEXT,
  thumbnail_path TEXT,
  description TEXT,
  tags TEXT[],
  ai_summary TEXT,
  similarity FLOAT,
  search_type TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT ON (d.id)
    d.id as document_id,
    d.title,
    d.mime_type,
    d.storage_path,
    d.thumbnail_path,
    d.description,
    d.tags,
    d.ai_summary,
    1 - (d.embedding <=> p_query_embedding) as similarity,
    'semantic'::TEXT as search_type
  FROM documents d
  WHERE d.workspace_id = p_workspace_id
    AND d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> p_query_embedding) > p_threshold
  ORDER BY d.id, similarity DESC
  LIMIT p_limit;
$$;

-- Function for visual/image search
CREATE OR REPLACE FUNCTION search_images_visual(
  p_workspace_id UUID,
  p_query_embedding vector(768),
  p_limit INTEGER DEFAULT 20,
  p_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  document_id UUID,
  frame_index INTEGER,
  timestamp_seconds FLOAT,
  thumbnail_path TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    ie.document_id,
    ie.frame_index,
    ie.timestamp_seconds,
    ie.thumbnail_path,
    1 - (ie.embedding <=> p_query_embedding) as similarity
  FROM image_embeddings ie
  JOIN documents d ON d.id = ie.document_id
  WHERE d.workspace_id = p_workspace_id
    AND 1 - (ie.embedding <=> p_query_embedding) > p_threshold
  ORDER BY similarity DESC
  LIMIT p_limit;
$$;

-- Combined search function
CREATE OR REPLACE FUNCTION search_workspace(
  p_workspace_id UUID,
  p_query TEXT,
  p_query_embedding vector(768) DEFAULT NULL,
  p_search_types TEXT[] DEFAULT ARRAY['semantic', 'text', 'visual'],
  p_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
  document_id UUID,
  title TEXT,
  mime_type TEXT,
  storage_path TEXT,
  thumbnail_path TEXT,
  description TEXT,
  tags TEXT[],
  ai_summary TEXT,
  similarity FLOAT,
  search_type TEXT,
  frame_index INTEGER,
  timestamp_seconds FLOAT,
  match_context TEXT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  -- Text search (title, description, tags, transcription)
  SELECT 
    d.id as document_id,
    d.title,
    d.mime_type,
    d.storage_path,
    d.thumbnail_path,
    d.description,
    d.tags,
    d.ai_summary,
    CASE 
      WHEN d.title ILIKE '%' || p_query || '%' THEN 0.9
      WHEN p_query = ANY(d.tags) THEN 0.85
      WHEN d.description ILIKE '%' || p_query || '%' THEN 0.7
      WHEN d.transcription ILIKE '%' || p_query || '%' THEN 0.6
      ELSE 0.5
    END as similarity,
    'text'::TEXT as search_type,
    0 as frame_index,
    NULL::FLOAT as timestamp_seconds,
    CASE 
      WHEN d.title ILIKE '%' || p_query || '%' THEN d.title
      ELSE COALESCE(d.description, '')
    END as match_context
  FROM documents d
  WHERE d.workspace_id = p_workspace_id
    AND 'text' = ANY(p_search_types)
    AND (
      d.title ILIKE '%' || p_query || '%'
      OR d.description ILIKE '%' || p_query || '%'
      OR p_query = ANY(d.tags)
      OR d.transcription ILIKE '%' || p_query || '%'
    )
    
  UNION ALL
  
  -- Semantic search (if embedding provided)
  SELECT 
    d.id as document_id,
    d.title,
    d.mime_type,
    d.storage_path,
    d.thumbnail_path,
    d.description,
    d.tags,
    d.ai_summary,
    1 - (d.embedding <=> p_query_embedding) as similarity,
    'semantic'::TEXT as search_type,
    0 as frame_index,
    NULL::FLOAT as timestamp_seconds,
    d.ai_summary as match_context
  FROM documents d
  WHERE d.workspace_id = p_workspace_id
    AND 'semantic' = ANY(p_search_types)
    AND p_query_embedding IS NOT NULL
    AND d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> p_query_embedding) > 0.45
    
  UNION ALL
  
  -- Visual search (if embedding provided)
  SELECT 
    d.id as document_id,
    d.title,
    d.mime_type,
    d.storage_path,
    ie.thumbnail_path,
    d.description,
    d.tags,
    d.ai_summary,
    1 - (ie.embedding <=> p_query_embedding) as similarity,
    'visual'::TEXT as search_type,
    ie.frame_index,
    ie.timestamp_seconds,
    NULL::TEXT as match_context
  FROM image_embeddings ie
  JOIN documents d ON d.id = ie.document_id
  WHERE d.workspace_id = p_workspace_id
    AND 'visual' = ANY(p_search_types)
    AND p_query_embedding IS NOT NULL
    AND 1 - (ie.embedding <=> p_query_embedding) > 0.45
    
  ORDER BY similarity DESC
  LIMIT p_limit;
END;
$$;
