-- Extended Video AI Features for Gemini 3 Flash Analysis
-- Adds support for: AI Summary, Highlights, Chapters, Visual Tags, Speaker Detection

-- Add new columns to links table for AI analysis results
ALTER TABLE links ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS ai_key_takeaways JSONB DEFAULT '[]'::jsonb;
ALTER TABLE links ADD COLUMN IF NOT EXISTS ai_topics JSONB DEFAULT '[]'::jsonb;
ALTER TABLE links ADD COLUMN IF NOT EXISTS ai_sentiment TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS ai_duration_seconds FLOAT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS ai_language TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE links ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending';

-- Create link_chapters table for video chapters
CREATE TABLE IF NOT EXISTS link_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time FLOAT NOT NULL,
  end_time FLOAT,
  description TEXT,
  thumbnail_url TEXT,
  is_ai_generated BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_chapters_link_id ON link_chapters(link_id);
CREATE INDEX IF NOT EXISTS idx_link_chapters_time ON link_chapters(link_id, start_time);

-- Create link_highlights table for AI-detected important moments
CREATE TABLE IF NOT EXISTS link_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  start_time FLOAT NOT NULL,
  end_time FLOAT,
  text TEXT NOT NULL,
  category TEXT NOT NULL, -- 'key_point', 'action_item', 'question', 'decision', 'important'
  importance INTEGER DEFAULT 5, -- 1-10 scale
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_highlights_link_id ON link_highlights(link_id);
CREATE INDEX IF NOT EXISTS idx_link_highlights_category ON link_highlights(link_id, category);
CREATE INDEX IF NOT EXISTS idx_link_highlights_importance ON link_highlights(importance DESC);

-- Create link_visual_tags table for detected objects, scenes, text
CREATE TABLE IF NOT EXISTS link_visual_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  category TEXT, -- 'object', 'person', 'scene', 'text', 'action', 'emotion', 'color'
  confidence FLOAT,
  first_appearance FLOAT, -- timestamp in seconds
  appearances JSONB DEFAULT '[]'::jsonb, -- array of {start, end} timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_visual_tags_link_id ON link_visual_tags(link_id);
CREATE INDEX IF NOT EXISTS idx_link_visual_tags_tag ON link_visual_tags(tag);
CREATE INDEX IF NOT EXISTS idx_link_visual_tags_category ON link_visual_tags(category);

-- Add speaker field to transcripts if not exists
ALTER TABLE link_transcripts ADD COLUMN IF NOT EXISTS speaker TEXT;
ALTER TABLE link_transcripts ADD COLUMN IF NOT EXISTS confidence FLOAT;
ALTER TABLE link_transcripts ADD COLUMN IF NOT EXISTS is_highlight BOOLEAN DEFAULT FALSE;
ALTER TABLE link_transcripts ADD COLUMN IF NOT EXISTS highlight_category TEXT;

-- Add frame_data improvements to link_comments for drawing annotations
ALTER TABLE link_comments ADD COLUMN IF NOT EXISTS drawing_data JSONB;
ALTER TABLE link_comments ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE;
ALTER TABLE link_comments ADD COLUMN IF NOT EXISTS parent_comment_id UUID REFERENCES link_comments(id);
ALTER TABLE link_comments ADD COLUMN IF NOT EXISTS mentioned_users JSONB DEFAULT '[]'::jsonb;

-- Enable RLS on new tables
ALTER TABLE link_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_visual_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for link_chapters
CREATE POLICY "Users can view chapters for links in their workspaces" ON link_chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = link_chapters.link_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chapters for links in their workspaces" ON link_chapters
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = link_chapters.link_id
      AND wm.user_id = auth.uid()
    )
  );

-- RLS Policies for link_highlights
CREATE POLICY "Users can view highlights for links in their workspaces" ON link_highlights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = link_highlights.link_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert highlights for links in their workspaces" ON link_highlights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = link_highlights.link_id
      AND wm.user_id = auth.uid()
    )
  );

-- RLS Policies for link_visual_tags
CREATE POLICY "Users can view visual tags for links in their workspaces" ON link_visual_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = link_visual_tags.link_id
      AND wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert visual tags for links in their workspaces" ON link_visual_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM links l
      JOIN workspace_members wm ON wm.workspace_id = l.workspace_id
      WHERE l.id = link_visual_tags.link_id
      AND wm.user_id = auth.uid()
    )
  );

-- Full text search indexes
CREATE INDEX IF NOT EXISTS idx_link_highlights_text_search ON link_highlights USING GIN(to_tsvector('german', text));
CREATE INDEX IF NOT EXISTS idx_link_visual_tags_search ON link_visual_tags USING GIN(to_tsvector('simple', tag));
