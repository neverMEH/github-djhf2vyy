/*
  # Fix products table constraints and indexes

  1. Changes
    - Add unique constraint on asin column
    - Add index for asin column
    - Add trigger for updated_at timestamp

  2. Purpose
    - Enable upsert operations using ON CONFLICT
    - Improve query performance
    - Maintain data consistency
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

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_products_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_products_timestamp ON products;
CREATE TRIGGER set_products_timestamp
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_timestamp();