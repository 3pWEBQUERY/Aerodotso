-- ============================================================================
-- Fix all RLS and Function Search Path issues
-- ============================================================================

-- ============================================================================
-- PART 1: Enable RLS and add policies for all tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. users table
-- ----------------------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all users" ON users
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. workspaces table
-- ----------------------------------------------------------------------------
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view workspaces they belong to" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own workspaces" ON workspaces
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Workspace owners can update" ON workspaces
  FOR UPDATE USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Workspace owners can delete" ON workspaces
  FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. documents table
-- ----------------------------------------------------------------------------
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents in their workspaces" ON documents
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert documents in their workspaces" ON documents
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update documents in their workspaces" ON documents
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete documents in their workspaces" ON documents
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 4. notes table
-- ----------------------------------------------------------------------------
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notes in their workspaces" ON notes
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert notes in their workspaces" ON notes
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update notes in their workspaces" ON notes
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. links table
-- ----------------------------------------------------------------------------
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view links in their workspaces" ON links
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert links in their workspaces" ON links
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update links in their workspaces" ON links
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own links" ON links
  FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 6. folders table
-- ----------------------------------------------------------------------------
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view folders in their workspaces" ON folders
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert folders in their workspaces" ON folders
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update folders in their workspaces" ON folders
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete folders in their workspaces" ON folders
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 7. scratches table
-- ----------------------------------------------------------------------------
ALTER TABLE scratches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scratches in their workspaces" ON scratches
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert scratches in their workspaces" ON scratches
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update scratches in their workspaces" ON scratches
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own scratches" ON scratches
  FOR DELETE USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 8. workspace_invitations table
-- ----------------------------------------------------------------------------
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for their email" ON workspace_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can insert invitations" ON workspace_invitations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update invitations" ON workspace_invitations
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete invitations" ON workspace_invitations
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- 9. document_embeddings table
-- ----------------------------------------------------------------------------
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings in their workspaces" ON document_embeddings
  FOR SELECT USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert embeddings for their documents" ON document_embeddings
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete embeddings for their documents" ON document_embeddings
  FOR DELETE USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 10. image_embeddings table
-- ----------------------------------------------------------------------------
ALTER TABLE image_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view image embeddings in their workspaces" ON image_embeddings
  FOR SELECT USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert image embeddings for their documents" ON image_embeddings
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete image embeddings for their documents" ON image_embeddings
  FOR DELETE USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 11. document_versions table (if exists)
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'document_versions') THEN
    ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
    
    EXECUTE 'CREATE POLICY "Users can view versions in their workspaces" ON document_versions
      FOR SELECT USING (
        document_id IN (
          SELECT d.id FROM documents d
          JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
          WHERE wm.user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 12. search_history policies (RLS already enabled but no policies)
-- ----------------------------------------------------------------------------
CREATE POLICY "Users can view their search history" ON search_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their search history" ON search_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their search history" ON search_history
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================================
-- PART 2: Fix Function Search Path issues
-- ============================================================================

-- Fix get_user_workspaces function
ALTER FUNCTION public.get_user_workspaces(UUID)
SET search_path = pg_catalog, public;

-- Fix cleanup_canvas_history function
ALTER FUNCTION public.cleanup_canvas_history()
SET search_path = pg_catalog, public;

-- Fix update_canvas_updated_at function
ALTER FUNCTION public.update_canvas_updated_at()
SET search_path = pg_catalog, public;

-- Fix add_workspace_owner function
ALTER FUNCTION public.add_workspace_owner()
SET search_path = pg_catalog, public;
