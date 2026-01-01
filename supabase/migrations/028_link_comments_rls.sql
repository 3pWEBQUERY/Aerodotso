-- Enable Row Level Security for link_comments table
-- This addresses the Supabase lint warning about RLS being disabled

ALTER TABLE link_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on links in their workspaces
CREATE POLICY "Users can view comments in their workspace" ON link_comments
  FOR SELECT USING (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Users can insert comments on links in their workspaces
CREATE POLICY "Users can insert comments in their workspace" ON link_comments
  FOR INSERT WITH CHECK (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON link_comments
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON link_comments
  FOR DELETE USING (user_id = auth.uid());

-- Index for policy performance
CREATE INDEX IF NOT EXISTS idx_link_comments_user_id ON link_comments(user_id);
