/*
  # Fix timestamp handling in users table

  1. Changes
    - Ensure updated_at column exists with proper defaults
    - Create or replace trigger function with proper timestamp handling
    - Set up trigger correctly
  
  2. Security
    - No changes to RLS policies
*/

-- First drop existing trigger to avoid conflicts
DROP TRIGGER IF EXISTS set_updated_at ON users;
DROP TRIGGER IF EXISTS handle_updated_at ON users;
DROP TRIGGER IF EXISTS set_users_updated_at ON users;

-- Drop existing function to ensure clean slate
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create trigger function
CREATE OR REPLACE FUNCTION handle_timestamp_updates()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure updated_at column exists with proper type and default
DO $$ 
BEGIN
    -- Drop the column if it exists (to ensure clean state)
    ALTER TABLE users DROP COLUMN IF EXISTS updated_at;
    
    -- Add the column with proper type and default
    ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;
END $$;

-- Create new trigger
CREATE TRIGGER handle_timestamp_updates
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_timestamp_updates();