-- ============================================================================
-- Spatial AI Canvas Migration
-- Adds support for advanced canvas features including settings, collaboration,
-- and AI-generated content storage
-- ============================================================================

-- Add new columns to canvases table
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS thumbnail TEXT;
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"showGrid": true, "snapToGrid": true, "gridSize": 16, "showMinimap": true, "backgroundColor": "#f9fafb"}';
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS public_token TEXT;
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES users(id);
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Indexes for canvases
CREATE INDEX IF NOT EXISTS idx_canvases_starred ON canvases(workspace_id, is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_canvases_public ON canvases(public_token) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_canvases_folder ON canvases(folder_id);
CREATE INDEX IF NOT EXISTS idx_canvases_updated ON canvases(workspace_id, updated_at DESC);

-- ============================================================================
-- Canvas Assets Table
-- Stores uploaded files/images associated with canvas nodes
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'document', 'audio')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  thumbnail_path TEXT,
  ai_analysis JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_assets_canvas ON canvas_assets(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_assets_node ON canvas_assets(canvas_id, node_id);
CREATE INDEX IF NOT EXISTS idx_canvas_assets_type ON canvas_assets(canvas_id, asset_type);

-- ============================================================================
-- Canvas AI Generations Table
-- Stores AI-generated images and their metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  prompt TEXT NOT NULL,
  revised_prompt TEXT,
  negative_prompt TEXT,
  parameters JSONB DEFAULT '{}',
  image_url TEXT,
  image_path TEXT,
  thumbnail_url TEXT,
  width INTEGER,
  height INTEGER,
  seed BIGINT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  generation_time_ms INTEGER,
  cost_credits DECIMAL(10, 4),
  in_canvas BOOLEAN DEFAULT false,
  saved_to_library BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_generations_canvas ON canvas_ai_generations(canvas_id);
CREATE INDEX IF NOT EXISTS idx_canvas_generations_node ON canvas_ai_generations(canvas_id, node_id);
CREATE INDEX IF NOT EXISTS idx_canvas_generations_user ON canvas_ai_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_generations_status ON canvas_ai_generations(status) WHERE status = 'generating';

-- ============================================================================
-- Canvas Collaborators Table
-- Tracks active collaborators on a canvas for real-time features
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cursor_x FLOAT,
  cursor_y FLOAT,
  selected_node_ids TEXT[] DEFAULT '{}',
  color TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(canvas_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_canvas_collaborators_canvas ON canvas_collaborators(canvas_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_canvas_collaborators_user ON canvas_collaborators(user_id);

-- ============================================================================
-- Canvas History Table
-- Stores canvas snapshots for version history and undo/redo
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_id UUID NOT NULL REFERENCES canvases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_description TEXT,
  data_snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_history_canvas ON canvas_history(canvas_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_history_created ON canvas_history(canvas_id, created_at DESC);

-- Cleanup old history (keep last 100 versions per canvas)
CREATE OR REPLACE FUNCTION cleanup_canvas_history() RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM canvas_history
  WHERE canvas_id = NEW.canvas_id
  AND id NOT IN (
    SELECT id FROM canvas_history
    WHERE canvas_id = NEW.canvas_id
    ORDER BY version DESC
    LIMIT 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cleanup_canvas_history ON canvas_history;
CREATE TRIGGER trigger_cleanup_canvas_history
  AFTER INSERT ON canvas_history
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_canvas_history();

-- ============================================================================
-- Canvas Templates Table
-- Stores user-created and shared canvas templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS canvas_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  thumbnail TEXT,
  data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_templates_workspace ON canvas_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_canvas_templates_public ON canvas_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_canvas_templates_category ON canvas_templates(category);

-- ============================================================================
-- Row Level Security Policies
-- ============================================================================

-- Canvas Assets RLS
ALTER TABLE canvas_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assets in their workspace canvases" ON canvas_assets
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assets to their workspace canvases" ON canvas_assets
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own assets" ON canvas_assets
  FOR DELETE USING (user_id = auth.uid());

-- Canvas AI Generations RLS
ALTER TABLE canvas_ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view generations in their workspace" ON canvas_ai_generations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert generations in their workspace" ON canvas_ai_generations
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Canvas Collaborators RLS
ALTER TABLE canvas_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view collaborators on accessible canvases" ON canvas_collaborators
  FOR SELECT USING (
    canvas_id IN (
      SELECT c.id FROM canvases c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own collaborator entry" ON canvas_collaborators
  FOR ALL USING (user_id = auth.uid());

-- Canvas History RLS
ALTER TABLE canvas_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of accessible canvases" ON canvas_history
  FOR SELECT USING (
    canvas_id IN (
      SELECT c.id FROM canvases c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add history to accessible canvases" ON canvas_history
  FOR INSERT WITH CHECK (
    canvas_id IN (
      SELECT c.id FROM canvases c
      JOIN workspace_members wm ON wm.workspace_id = c.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

-- Canvas Templates RLS
ALTER TABLE canvas_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public templates" ON canvas_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view templates in their workspace" ON canvas_templates
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own templates" ON canvas_templates
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- Update trigger for canvases updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_canvas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_canvas_updated_at ON canvases;
CREATE TRIGGER trigger_update_canvas_updated_at
  BEFORE UPDATE ON canvases
  FOR EACH ROW
  EXECUTE FUNCTION update_canvas_updated_at();
