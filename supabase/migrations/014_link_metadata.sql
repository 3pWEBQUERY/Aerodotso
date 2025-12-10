-- Add description and thumbnail_url columns to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;
ALTER TABLE links ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Create link_comments table for timestamped comments
CREATE TABLE IF NOT EXISTS link_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  timestamp_seconds FLOAT,
  frame_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_comments_link_id ON link_comments(link_id);
CREATE INDEX IF NOT EXISTS idx_link_comments_timestamp ON link_comments(link_id, timestamp_seconds);

-- Create link_transcripts table for video transcriptions
CREATE TABLE IF NOT EXISTS link_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  text TEXT NOT NULL,
  speaker TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_link_transcripts_link_id ON link_transcripts(link_id);
CREATE INDEX IF NOT EXISTS idx_link_transcripts_time ON link_transcripts(link_id, start_time);

-- Enable full text search on transcripts
CREATE INDEX IF NOT EXISTS idx_link_transcripts_text_search ON link_transcripts USING GIN(to_tsvector('german', text));
