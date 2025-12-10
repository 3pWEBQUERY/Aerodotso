-- Migration: Add workspace_id to documents table
-- Run this in Supabase SQL Editor

-- Add workspace_id column to documents
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_workspace_id ON documents(workspace_id);

-- Update existing documents to belong to the first workspace of their uploader
-- (This is a one-time migration, adjust as needed)
-- UPDATE documents d
-- SET workspace_id = (SELECT id FROM workspaces LIMIT 1)
-- WHERE workspace_id IS NULL;
