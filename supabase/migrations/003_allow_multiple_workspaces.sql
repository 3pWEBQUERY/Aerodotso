-- Migration: Allow users to have multiple workspaces
-- Run this in Supabase SQL Editor

-- Remove the unique constraint on user_id to allow multiple workspaces per user
ALTER TABLE workspaces DROP CONSTRAINT IF EXISTS workspaces_user_id_key;

-- Add an index for performance (instead of unique constraint)
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
