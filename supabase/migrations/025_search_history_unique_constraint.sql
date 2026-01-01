-- Migration: Add unique constraint to search_history to prevent duplicate entries
-- This allows using upsert to update existing entries instead of creating duplicates

-- Add unique constraint on workspace_id, user_id, query combination
-- Using a partial index to handle NULL user_id properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_search_history_unique_query 
ON search_history (workspace_id, user_id, query) 
WHERE user_id IS NOT NULL;

-- Also add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_search_history_user_workspace 
ON search_history (user_id, workspace_id, created_at DESC)
WHERE user_id IS NOT NULL;
