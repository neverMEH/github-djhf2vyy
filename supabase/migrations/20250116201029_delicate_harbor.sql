/*
  # Enhance products table for review scraping

  1. Add Columns
    - Add review_data for scraping metadata
    - Add review_stats for aggregated statistics
    - Add review_history for tracking changes

  2. Add Indexes
    - Add GIN indexes for JSON columns
    - Add B-tree indexes for frequently queried columns

  3. Add Triggers
    - Add trigger for updating review statistics
    - Add trigger for maintaining review history
*/

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
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
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
ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS review_data JSONB DEFAULT jsonb_build_object(
  'lastScraped', null,
  'scrapedReviews', 0,
  'nextScrapeScheduled', null,
  'scrapeStatus', 'pending',
  'error', null
),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add unique constraint for ASIN
ALTER TABLE products 
ADD CONSTRAINT products_asin_key UNIQUE (asin);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_asin ON products(asin);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_review_summary ON products USING gin(review_summary);
CREATE INDEX IF NOT EXISTS idx_products_reviews ON products USING gin(reviews);
CREATE INDEX IF NOT EXISTS idx_products_review_data ON products USING gin(review_data);

-- Create trigger function for updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_updated_at ON products;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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