-- Scratches Table for drawing/sketch functionality
CREATE TABLE IF NOT EXISTS scratches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Scratch',
  data JSONB DEFAULT '{"elements": [], "appState": {}}',
  thumbnail TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scratches_workspace ON scratches(workspace_id);
CREATE INDEX IF NOT EXISTS idx_scratches_user ON scratches(user_id);
CREATE INDEX IF NOT EXISTS idx_scratches_folder ON scratches(folder_id);
