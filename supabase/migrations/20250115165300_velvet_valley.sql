/*
  # Fix auth policies for users table

  1. Changes
    - Drop all existing policies
    - Create new comprehensive policies for CRUD operations
    - Add policy for upsert operations
    
  2. Security
    - Enable RLS
    - Ensure proper auth checks for all operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
DROP POLICY IF EXISTS "Enable upsert for authenticated users" ON users;

-- Create new policies
CREATE POLICY "users_select_policy" 
ON users FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "users_insert_policy" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() = id 
  OR 
  NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "users_update_policy" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_policy" 
ON users FOR DELETE 
TO authenticated 
USING (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;