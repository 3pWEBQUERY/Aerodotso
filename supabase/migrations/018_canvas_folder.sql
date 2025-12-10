-- Add folder_id to canvases table for organizing canvases into folders
ALTER TABLE canvases ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Index for faster folder lookups on canvases
CREATE INDEX IF NOT EXISTS idx_canvases_folder ON canvases(folder_id);
