-- Add link_type column to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS link_type TEXT DEFAULT 'website';

-- Common link types: video, article, social, image, document, website
