/*
  # Fix licenses table RLS policy

  1. Security
    - Update RLS policy on `licenses` table to allow authenticated users to perform all operations
    - Ensure proper permissions for INSERT, SELECT, UPDATE, DELETE operations
*/

-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can manage licenses" ON licenses;

-- Create comprehensive policy for authenticated users
CREATE POLICY "Authenticated users can manage licenses"
  ON licenses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;