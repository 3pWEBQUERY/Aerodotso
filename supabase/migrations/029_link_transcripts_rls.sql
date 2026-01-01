-- Enable Row Level Security for link_transcripts table
-- This addresses the Supabase lint warning about RLS being disabled

ALTER TABLE link_transcripts ENABLE ROW LEVEL SECURITY;

-- Users can view transcripts of links in their workspaces
CREATE POLICY "Users can view transcripts in their workspace" ON link_transcripts
  FOR SELECT USING (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Users can insert transcripts for links in their workspaces
CREATE POLICY "Users can insert transcripts in their workspace" ON link_transcripts
  FOR INSERT WITH CHECK (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Users can update transcripts of links in their workspaces
CREATE POLICY "Users can update transcripts in their workspace" ON link_transcripts
  FOR UPDATE USING (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Users can delete transcripts of links in their workspaces
CREATE POLICY "Users can delete transcripts in their workspace" ON link_transcripts
  FOR DELETE USING (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );
