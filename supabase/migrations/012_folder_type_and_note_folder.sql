-- Add type column to folders table for differentiating between document and note folders
ALTER TABLE folders ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'documents';

-- Add folder_id to notes table for organizing notes into folders
ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Create index for faster folder lookups by type
CREATE INDEX IF NOT EXISTS idx_folders_type ON folders(type);

-- Create index for notes folder_id
CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);
