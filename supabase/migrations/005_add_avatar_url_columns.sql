-- Add avatar_url column to workspaces table
ALTER TABLE workspaces 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ensure users table has avatar_url column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
