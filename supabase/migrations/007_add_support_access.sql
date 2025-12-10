-- Add support_access column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS support_access BOOLEAN DEFAULT false;
