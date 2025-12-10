-- Migration: Add profile fields to users table
-- Run this in Supabase SQL Editor

-- Add name column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add avatar/image URL column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add created_at if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Add updated_at if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Optional: Create a storage bucket for avatars if you want to upload images
-- You can run this in Supabase Dashboard -> Storage -> New Bucket
-- Bucket name: avatars
-- Public: true (for easy access)

COMMENT ON COLUMN users.name IS 'Display name of the user';
COMMENT ON COLUMN users.avatar_url IS 'URL to the user profile image';
