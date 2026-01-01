-- ============================================================================
-- Fix RLS Performance Issues
-- - Replace auth.uid() with (select auth.uid()) for better query planning
-- - Remove redundant service_role policies (service_role bypasses RLS anyway)
-- - Remove duplicate indexes
-- ============================================================================

-- ============================================================================
-- PART 1: Drop duplicate indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_documents_workspace;
DROP INDEX IF EXISTS idx_workspace_members_user;
DROP INDEX IF EXISTS idx_workspace_members_workspace;

-- ============================================================================
-- PART 2: Fix notifications policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 3: Fix workspace_members policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view workspace members" ON workspace_members;

CREATE POLICY "Users can view workspace members" ON workspace_members
  FOR SELECT USING (
    user_id = (select auth.uid()) OR 
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

-- ============================================================================
-- PART 4: Fix workspace_invites policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their invites" ON workspace_invites;

CREATE POLICY "Users can view their invites" ON workspace_invites
  FOR SELECT USING (
    invited_user_id = (select auth.uid()) OR 
    invited_email = (SELECT email FROM users WHERE id = (select auth.uid()))
  );

-- ============================================================================
-- PART 5: Fix chat_sessions policies (remove service_role, fix auth.uid())
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Service role can do anything on chat_sessions" ON chat_sessions;

CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create their own chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own chat sessions" ON chat_sessions
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own chat sessions" ON chat_sessions
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 6: Fix chat_messages policies (remove service_role, fix auth.uid())
-- ============================================================================

DROP POLICY IF EXISTS "Users can view messages in their chat sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their chat sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can update messages in their chat sessions" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete messages in their chat sessions" ON chat_messages;
DROP POLICY IF EXISTS "Service role can do anything on chat_messages" ON chat_messages;

CREATE POLICY "Users can view messages in their chat sessions" ON chat_messages
  FOR SELECT USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can create messages in their chat sessions" ON chat_messages
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can update messages in their chat sessions" ON chat_messages
  FOR UPDATE USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete messages in their chat sessions" ON chat_messages
  FOR DELETE USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = (select auth.uid()))
  );

-- ============================================================================
-- PART 7: Fix canvas_assets policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view assets in their workspace canvases" ON canvas_assets;
DROP POLICY IF EXISTS "Users can insert assets to their workspace canvases" ON canvas_assets;
DROP POLICY IF EXISTS "Users can delete their own assets" ON canvas_assets;

CREATE POLICY "Users can view assets in their workspace canvases" ON canvas_assets
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert assets to their workspace canvases" ON canvas_assets
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete their own assets" ON canvas_assets
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 8: Fix canvas_ai_generations policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view generations in their workspace" ON canvas_ai_generations;
DROP POLICY IF EXISTS "Users can insert generations in their workspace" ON canvas_ai_generations;

CREATE POLICY "Users can view generations in their workspace" ON canvas_ai_generations
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert generations in their workspace" ON canvas_ai_generations
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

-- ============================================================================
-- PART 9: Fix canvas_collaborators policies (combine into one)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view collaborators on accessible canvases" ON canvas_collaborators;
DROP POLICY IF EXISTS "Users can manage their own collaborator entry" ON canvas_collaborators;

CREATE POLICY "Users can view collaborators on accessible canvases" ON canvas_collaborators
  FOR SELECT USING (
    user_id = (select auth.uid()) OR
    canvas_id IN (
      SELECT c.id FROM canvases c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert their own collaborator entry" ON canvas_collaborators
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own collaborator entry" ON canvas_collaborators
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own collaborator entry" ON canvas_collaborators
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 10: Fix canvas_history policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view history of accessible canvases" ON canvas_history;
DROP POLICY IF EXISTS "Users can add history to accessible canvases" ON canvas_history;

CREATE POLICY "Users can view history of accessible canvases" ON canvas_history
  FOR SELECT USING (
    canvas_id IN (
      SELECT c.id FROM canvases c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can add history to accessible canvases" ON canvas_history
  FOR INSERT WITH CHECK (
    canvas_id IN (
      SELECT c.id FROM canvases c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 11: Fix canvas_templates policies (combine SELECT policies)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view public templates" ON canvas_templates;
DROP POLICY IF EXISTS "Users can view templates in their workspace" ON canvas_templates;
DROP POLICY IF EXISTS "Users can manage their own templates" ON canvas_templates;

CREATE POLICY "Users can view templates" ON canvas_templates
  FOR SELECT USING (
    is_public = true OR
    user_id = (select auth.uid()) OR
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert their own templates" ON canvas_templates
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own templates" ON canvas_templates
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own templates" ON canvas_templates
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 12: Fix link_comments policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view comments in their workspace" ON link_comments;
DROP POLICY IF EXISTS "Users can insert comments in their workspace" ON link_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON link_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON link_comments;

CREATE POLICY "Users can view comments in their workspace" ON link_comments
  FOR SELECT USING (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert comments in their workspace" ON link_comments
  FOR INSERT WITH CHECK (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own comments" ON link_comments
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own comments" ON link_comments
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 13: Fix link_transcripts policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view transcripts in their workspace" ON link_transcripts;
DROP POLICY IF EXISTS "Users can insert transcripts in their workspace" ON link_transcripts;
DROP POLICY IF EXISTS "Users can update transcripts in their workspace" ON link_transcripts;
DROP POLICY IF EXISTS "Users can delete transcripts in their workspace" ON link_transcripts;

CREATE POLICY "Users can view transcripts in their workspace" ON link_transcripts
  FOR SELECT USING (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert transcripts in their workspace" ON link_transcripts
  FOR INSERT WITH CHECK (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update transcripts in their workspace" ON link_transcripts
  FOR UPDATE USING (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete transcripts in their workspace" ON link_transcripts
  FOR DELETE USING (
    link_id IN (
      SELECT l.id FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 14: Fix canvases policies (from migration 027)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view canvases in their workspace" ON canvases;
DROP POLICY IF EXISTS "Users can insert canvases in their workspace" ON canvases;
DROP POLICY IF EXISTS "Users can update canvases in their workspace" ON canvases;
DROP POLICY IF EXISTS "Users can delete their own canvases" ON canvases;

CREATE POLICY "Users can view canvases in their workspace" ON canvases
  FOR SELECT USING (
    is_public = true OR
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert canvases in their workspace" ON canvases
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can update canvases in their workspace" ON canvases
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete their own canvases" ON canvases
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============================================================================
-- PART 15: Fix policies from migration 030
-- ============================================================================

-- users
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can view all users" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated USING (id = (select auth.uid()));

-- workspaces
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON workspaces;
DROP POLICY IF EXISTS "Users can insert their own workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can update" ON workspaces;
DROP POLICY IF EXISTS "Workspace owners can delete" ON workspaces;

CREATE POLICY "Users can view workspaces they belong to" ON workspaces
  FOR SELECT USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert their own workspaces" ON workspaces
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Workspace owners can update" ON workspaces
  FOR UPDATE USING (
    id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()) AND role = 'owner')
  );

CREATE POLICY "Workspace owners can delete" ON workspaces
  FOR DELETE USING (user_id = (select auth.uid()));

-- documents
DROP POLICY IF EXISTS "Users can view documents in their workspaces" ON documents;
DROP POLICY IF EXISTS "Users can insert documents in their workspaces" ON documents;
DROP POLICY IF EXISTS "Users can update documents in their workspaces" ON documents;
DROP POLICY IF EXISTS "Users can delete documents in their workspaces" ON documents;

CREATE POLICY "Users can view documents in their workspaces" ON documents
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert documents in their workspaces" ON documents
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can update documents in their workspaces" ON documents
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete documents in their workspaces" ON documents
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

-- notes
DROP POLICY IF EXISTS "Users can view notes in their workspaces" ON notes;
DROP POLICY IF EXISTS "Users can insert notes in their workspaces" ON notes;
DROP POLICY IF EXISTS "Users can update notes in their workspaces" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

CREATE POLICY "Users can view notes in their workspaces" ON notes
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert notes in their workspaces" ON notes
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can update notes in their workspaces" ON notes
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete their own notes" ON notes
  FOR DELETE USING (user_id = (select auth.uid()));

-- links
DROP POLICY IF EXISTS "Users can view links in their workspaces" ON links;
DROP POLICY IF EXISTS "Users can insert links in their workspaces" ON links;
DROP POLICY IF EXISTS "Users can update links in their workspaces" ON links;
DROP POLICY IF EXISTS "Users can delete their own links" ON links;

CREATE POLICY "Users can view links in their workspaces" ON links
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert links in their workspaces" ON links
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can update links in their workspaces" ON links
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete their own links" ON links
  FOR DELETE USING (user_id = (select auth.uid()));

-- folders
DROP POLICY IF EXISTS "Users can view folders in their workspaces" ON folders;
DROP POLICY IF EXISTS "Users can insert folders in their workspaces" ON folders;
DROP POLICY IF EXISTS "Users can update folders in their workspaces" ON folders;
DROP POLICY IF EXISTS "Users can delete folders in their workspaces" ON folders;

CREATE POLICY "Users can view folders in their workspaces" ON folders
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert folders in their workspaces" ON folders
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can update folders in their workspaces" ON folders
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete folders in their workspaces" ON folders
  FOR DELETE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

-- scratches
DROP POLICY IF EXISTS "Users can view scratches in their workspaces" ON scratches;
DROP POLICY IF EXISTS "Users can insert scratches in their workspaces" ON scratches;
DROP POLICY IF EXISTS "Users can update scratches in their workspaces" ON scratches;
DROP POLICY IF EXISTS "Users can delete their own scratches" ON scratches;

CREATE POLICY "Users can view scratches in their workspaces" ON scratches
  FOR SELECT USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can insert scratches in their workspaces" ON scratches
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can update scratches in their workspaces" ON scratches
  FOR UPDATE USING (
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Users can delete their own scratches" ON scratches
  FOR DELETE USING (user_id = (select auth.uid()));

-- workspace_invitations
DROP POLICY IF EXISTS "Users can view invitations for their email" ON workspace_invitations;
DROP POLICY IF EXISTS "Admins can insert invitations" ON workspace_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON workspace_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON workspace_invitations;

CREATE POLICY "Users can view invitations for their email" ON workspace_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can insert invitations" ON workspace_invitations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can update invitations" ON workspace_invitations
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete invitations" ON workspace_invitations
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members 
      WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
    )
  );

-- document_embeddings
DROP POLICY IF EXISTS "Users can view embeddings in their workspaces" ON document_embeddings;
DROP POLICY IF EXISTS "Users can insert embeddings for their documents" ON document_embeddings;
DROP POLICY IF EXISTS "Users can delete embeddings for their documents" ON document_embeddings;

CREATE POLICY "Users can view embeddings in their workspaces" ON document_embeddings
  FOR SELECT USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert embeddings for their documents" ON document_embeddings
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete embeddings for their documents" ON document_embeddings
  FOR DELETE USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

-- image_embeddings
DROP POLICY IF EXISTS "Users can view image embeddings in their workspaces" ON image_embeddings;
DROP POLICY IF EXISTS "Users can insert image embeddings for their documents" ON image_embeddings;
DROP POLICY IF EXISTS "Users can delete image embeddings for their documents" ON image_embeddings;

CREATE POLICY "Users can view image embeddings in their workspaces" ON image_embeddings
  FOR SELECT USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert image embeddings for their documents" ON image_embeddings
  FOR INSERT WITH CHECK (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete image embeddings for their documents" ON image_embeddings
  FOR DELETE USING (
    document_id IN (
      SELECT d.id FROM documents d
      JOIN workspace_members wm ON wm.workspace_id = d.workspace_id
      WHERE wm.user_id = (select auth.uid())
    )
  );

-- search_history
DROP POLICY IF EXISTS "Users can view their search history" ON search_history;
DROP POLICY IF EXISTS "Users can insert their search history" ON search_history;
DROP POLICY IF EXISTS "Users can delete their search history" ON search_history;

CREATE POLICY "Users can view their search history" ON search_history
  FOR SELECT USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their search history" ON search_history
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their search history" ON search_history
  FOR DELETE USING (user_id = (select auth.uid()));
