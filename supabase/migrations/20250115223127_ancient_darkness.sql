/*
  # Add last_scraped column to products table

  1. Changes
    - Add last_scraped column to track when product data was last updated
    - Add index for performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add last_scraped column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS last_scraped TIMESTAMPTZ;

-- Create index for last_scraped column
CREATE INDEX IF NOT EXISTS idx_products_last_scraped 
ON products (last_scraped);