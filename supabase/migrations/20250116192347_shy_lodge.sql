/*
  # Add unique constraint for products table

  1. Changes
    - Add unique constraint on asin column
    - Add index on asin column for better performance
    - Add last_updated column with trigger
*/

-- Add unique constraint on asin column
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