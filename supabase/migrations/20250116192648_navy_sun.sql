/*
  # Fix unique constraint for products table

  1. Changes
    - Drop existing constraint and index
    - Add unique constraint on asin column
    - Add index for better performance
    - Add trigger for last_updated column
*/

-- Drop existing objects to ensure clean state
DO $$ 
BEGIN
  -- Drop constraint if exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_asin_key'
  ) THEN
    ALTER TABLE products DROP CONSTRAINT products_asin_key;
  END IF;

  -- Drop index if exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_products_asin'
  ) THEN
    DROP INDEX idx_products_asin;
  END IF;
END $$;

-- Add unique constraint
ALTER TABLE products 
ADD CONSTRAINT products_asin_key UNIQUE (asin);

-- Add index for better performance
CREATE INDEX idx_products_asin 
ON products (asin);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_products_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_products_last_updated ON products;
CREATE TRIGGER set_products_last_updated
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_last_updated();