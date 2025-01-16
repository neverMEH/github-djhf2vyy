/*
  # Fix products and reviews schema

  1. Drop Existing Policies
    - Remove existing policies to avoid conflicts
  
  2. Products Table Changes
    - Add missing columns
    - Fix constraints
    - Add proper indexes
  
  3. Reviews Table Changes
    - Create reviews table with proper structure
    - Add indexes and constraints
    - Set up RLS policies
*/

-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "reviews_select_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_insert_policy" ON reviews;
DROP POLICY IF EXISTS "reviews_update_policy" ON reviews;

-- First, ensure we have the required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing constraints if they exist
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_asin_key;

-- Add/update columns for products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS asin TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS price NUMERIC,
ADD COLUMN IF NOT EXISTS currency TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT,
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS best_sellers_rank JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS frequently_bought_together JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS customer_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS categories TEXT[],
ADD COLUMN IF NOT EXISTS features TEXT[],
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS review_summary JSONB DEFAULT jsonb_build_object(
  'rating', 0,
  'reviewCount', 0,
  'starsBreakdown', jsonb_build_object(
    '5star', 0,
    '4star', 0,
    '3star', 0,
    '2star', 0,
    '1star', 0
  ),
  'verifiedPurchases', 0,
  'lastUpdated', null
),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add unique constraint for ASIN
ALTER TABLE products 
ADD CONSTRAINT products_asin_key UNIQUE (asin);

-- Create indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_review_summary ON products USING gin(review_summary);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  review_id TEXT NOT NULL,
  title TEXT,
  content TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  author TEXT,
  author_id TEXT,
  author_profile TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_votes INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  images TEXT[],
  review_date TIMESTAMPTZ,
  variant TEXT,
  variant_attributes JSONB,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT reviews_product_review_key UNIQUE (product_id, review_id)
);

-- Create indexes for reviews table
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date ON reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_verified_purchase ON reviews(verified_purchase);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_votes ON reviews(helpful_votes);
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews(author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_country ON reviews(country);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies for products
CREATE POLICY "products_select_policy"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "products_insert_policy"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "products_update_policy"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create new RLS policies for reviews
CREATE POLICY "reviews_select_policy"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "reviews_insert_policy"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "reviews_update_policy"
  ON reviews FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();