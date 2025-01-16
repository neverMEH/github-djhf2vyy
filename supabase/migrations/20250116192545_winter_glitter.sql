/*
  # Add unique constraint for products table

  1. Changes
    - Add unique constraint on asin column
    - Add index for better performance
    - Add trigger for last_updated column
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

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_products_asin 
ON products (asin);

-- Add last_updated column with trigger
DO $$ 
BEGIN
  -- Add last_updated column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'last_updated'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN last_updated TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

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