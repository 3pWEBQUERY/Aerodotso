-- Migration: Fix search_history foreign key to reference public.users instead of auth.users
-- The app uses NextAuth with a custom users table, not Supabase Auth

-- Drop the existing foreign key constraint on user_id
ALTER TABLE search_history DROP CONSTRAINT IF EXISTS search_history_user_id_fkey;

-- Add new foreign key constraint referencing public.users table
ALTER TABLE search_history 
ADD CONSTRAINT search_history_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Make user_id nullable to handle cases where session might not have user ID
ALTER TABLE search_history ALTER COLUMN user_id DROP NOT NULL;
