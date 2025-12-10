-- Add video_url column to links table for storing downloaded YouTube videos
ALTER TABLE links ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add audio_url column for storing extracted audio
ALTER TABLE links ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_links_video_url ON links(video_url) WHERE video_url IS NOT NULL;
