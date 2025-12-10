-- Migration: Add notifications, workspace invites, and workspace members tables
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT, -- Optional link to navigate to
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

-- =============================================
-- 2. WORKSPACE MEMBERS TABLE (for multi-user workspaces)
-- =============================================
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- owner, admin, member
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);

-- =============================================
-- 3. WORKSPACE INVITES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invited_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL if user doesn't exist yet
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_workspace_invites_email ON workspace_invites(invited_email);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_user_id ON workspace_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_invites_status ON workspace_invites(status);

-- =============================================
-- 4. ADD NAME TO WORKSPACES IF NOT EXISTS
-- =============================================
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'My Workspace';

-- =============================================
-- 5. HELPER FUNCTION: Get user's workspaces
-- =============================================
CREATE OR REPLACE FUNCTION get_user_workspaces(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  is_owner BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    COALESCE(w.name, 'Workspace') as name,
    COALESCE(wm.role, 'owner') as role,
    (w.user_id = p_user_id) as is_owner
  FROM workspaces w
  LEFT JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = p_user_id
  WHERE w.user_id = p_user_id 
     OR wm.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;

-- Notifications: Users can only see their own
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Workspace members: Users can see members of workspaces they belong to
CREATE POLICY "Users can view workspace members" ON workspace_members
  FOR SELECT USING (
    user_id = auth.uid() OR 
    workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())
  );

-- Workspace invites: Users can see invites sent to them
CREATE POLICY "Users can view their invites" ON workspace_invites
  FOR SELECT USING (
    invited_user_id = auth.uid() OR 
    invited_email = (SELECT email FROM users WHERE id = auth.uid())
  );

COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE workspace_members IS 'Workspace membership for multi-user workspaces';
COMMENT ON TABLE workspace_invites IS 'Pending workspace invitations';
