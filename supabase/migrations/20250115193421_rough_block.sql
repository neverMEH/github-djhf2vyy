/*
  # Update products table schema

  1. Changes
    - Recreate products table with proper schema
    - Add timestamp handling
    - Set up indexes and RLS policies
    
  2. Security
    - Enable RLS
    - Add comprehensive access policies
*/

-- Drop existing objects with CASCADE to handle dependencies
DROP TRIGGER IF EXISTS handle_products_timestamp_updates ON products;
DROP FUNCTION IF EXISTS handle_products_timestamp_updates();
DROP TABLE IF EXISTS products CASCADE;

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin TEXT UNIQUE NOT NULL,
  title TEXT,
  brand TEXT,
  price NUMERIC,
  currency TEXT,
  rating NUMERIC,
  review_count INTEGER,
  images TEXT[],
  categories TEXT[],
  features TEXT[],
  description TEXT,
  reviews JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create timestamp trigger function
CREATE OR REPLACE FUNCTION handle_products_timestamp_updates()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER handle_products_timestamp_updates
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_products_timestamp_updates();

-- Create indexes
CREATE INDEX products_asin_idx ON products(asin);
CREATE INDEX products_brand_idx ON products(brand);
CREATE INDEX products_status_idx ON products(status);
CREATE INDEX products_updated_at_idx ON products(updated_at);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "products_select_policy" 
ON products FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "products_insert_policy" 
ON products FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "products_update_policy" 
ON products FOR UPDATE 
TO authenticated 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "products_delete_policy" 
ON products FOR DELETE 
TO authenticated 
USING (auth.uid() IS NOT NULL);

-- Recreate foreign key constraint for reviews table
ALTER TABLE reviews
ADD CONSTRAINT reviews_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id)
ON DELETE CASCADE;