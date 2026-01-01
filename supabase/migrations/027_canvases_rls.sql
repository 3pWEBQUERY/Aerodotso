-- Enable Row Level Security for canvases table
-- This addresses the Supabase lint warning about RLS being disabled

ALTER TABLE canvases ENABLE ROW LEVEL SECURITY;

-- Users can view canvases in their workspaces
CREATE POLICY "Users can view canvases in their workspace" ON canvases
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
    OR is_public = true
  );

-- Users can insert canvases in their workspaces
CREATE POLICY "Users can insert canvases in their workspace" ON canvases
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Users can update canvases in their workspaces
CREATE POLICY "Users can update canvases in their workspace" ON canvases
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Users can delete their own canvases
CREATE POLICY "Users can delete their own canvases" ON canvases
  FOR DELETE USING (user_id = auth.uid());
