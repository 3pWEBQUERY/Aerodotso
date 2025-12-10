-- Add cover_image column to notes table
ALTER TABLE notes ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- Create note-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-images', 'note-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Note images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload note images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update note images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete note images" ON storage.objects;

-- Allow public access to note-images bucket
CREATE POLICY "Note images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-images');

-- Allow authenticated users to upload note images
CREATE POLICY "Authenticated users can upload note images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'note-images' AND auth.role() = 'authenticated');

-- Allow users to update their own note images
CREATE POLICY "Users can update note images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'note-images' AND auth.role() = 'authenticated');

-- Allow users to delete note images
CREATE POLICY "Users can delete note images"
ON storage.objects FOR DELETE
USING (bucket_id = 'note-images' AND auth.role() = 'authenticated');
