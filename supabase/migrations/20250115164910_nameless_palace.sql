/*
  # Fix RLS policies for users table

  1. Changes
    - Drop existing RLS policies for users table
    - Add new policies that properly handle user creation and updates
    - Allow authenticated users to insert their own record
    - Allow authenticated users to update their own record
    - Allow authenticated users to read all profiles

  2. Security
    - Enable RLS on users table
    - Restrict users to only modify their own data
    - Allow reading of all user profiles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create new policies
CREATE POLICY "Users can read all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;