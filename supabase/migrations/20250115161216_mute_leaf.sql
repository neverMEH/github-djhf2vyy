/*
  # Add missing auth users to users table

  1. Changes
    - Insert missing auth users into the users table
    - Only inserts users that don't already exist in the users table
    - Preserves existing user data
    - Safe to run multiple times

  2. Security
    - Maintains existing RLS policies
    - No security changes needed
*/

-- Insert missing users from auth.users into public.users
INSERT INTO public.users (id, email, created_at)
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL;