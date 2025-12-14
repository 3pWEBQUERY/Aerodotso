-- Migration: Add workspace_id to notifications and extend for workspace activity tracking
-- Run this in Supabase SQL Editor

-- Add workspace_id column to notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add action_type for categorizing notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'general';
-- action_type values: upload, folder_create, folder_delete, document_delete, note_create, note_delete, link_create, canvas_create, etc.

-- Add metadata for additional context (e.g., file name, folder name)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create index for workspace filtering
CREATE INDEX IF NOT EXISTS idx_notifications_workspace_id ON notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_notifications_action_type ON notifications(action_type);

-- Update RLS policies to allow workspace-based access
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    ) OR
    workspace_id IN (
      SELECT id FROM workspaces WHERE user_id = auth.uid()
    )
  );

-- Allow inserting notifications for workspace members
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

COMMENT ON COLUMN notifications.workspace_id IS 'Workspace this notification belongs to';
COMMENT ON COLUMN notifications.action_type IS 'Type of action: upload, folder_create, folder_delete, document_delete, etc.';
COMMENT ON COLUMN notifications.metadata IS 'Additional context like file names, folder names, etc.';
