/*
  # Add unique constraint and indexes for products table

  1. Changes
    - Add unique constraint on asin column (if not exists)
    - Add index on asin column for better performance
    - Add last_updated column with trigger
*/

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_asin_key'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_asin_key UNIQUE (asin);
  END IF;
END $$;

-- Add index for better performance (IF NOT EXISTS is part of CREATE INDEX syntax)
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