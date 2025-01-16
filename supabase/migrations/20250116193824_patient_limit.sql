/*
  # Fix ASIN constraint

  1. Changes
    - Add unique constraint on products.asin column
    - Add index for better performance
    - Ensure proper conflict handling for upserts

  2. Purpose
    - Enable upsert operations using ASIN as the conflict key
    - Improve query performance for ASIN lookups
*/

-- Drop existing constraint if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_asin_key'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_asin_key;
  END IF;
END $$;

-- Add unique constraint
ALTER TABLE products 
ADD CONSTRAINT products_asin_key UNIQUE (asin);

-- Add index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_products_asin 
ON products (asin);