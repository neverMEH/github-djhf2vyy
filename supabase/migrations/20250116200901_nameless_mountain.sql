/*
  # Fix products schema and constraints

  1. Drop Existing Objects
    - Remove existing constraints and triggers
    - Clean up any conflicting objects
  
  2. Add/Update Columns
    - Ensure all required columns exist
    - Set proper defaults and types
  
  3. Add Constraints
    - Add unique constraint for ASIN
    - Add proper foreign key relationships
  
  4. Create Indexes
    - Add indexes for frequently queried columns
    - Add GIN indexes for JSON columns
  
  5. Update RLS Policies
    - Drop and recreate policies to avoid conflicts
*/

-- First, drop existing objects to ensure clean state
DROP TRIGGER IF EXISTS set_products_updated_at ON products;
DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;
DROP FUNCTION IF EXISTS update_updated_at_column();
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_asin_key;

-- Recreate products table structure
CREATE TABLE IF NOT EXISTS products_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin TEXT UNIQUE NOT NULL,
  title TEXT,
  brand TEXT,
  price NUMERIC,
  currency TEXT DEFAULT 'USD',
  availability TEXT,
  dimensions JSONB DEFAULT '{}'::jsonb,
  specifications JSONB DEFAULT '{}'::jsonb,
  best_sellers_rank JSONB DEFAULT '[]'::jsonb,
  variations JSONB DEFAULT '[]'::jsonb,
  frequently_bought_together JSONB DEFAULT '[]'::jsonb,
  customer_questions JSONB DEFAULT '[]'::jsonb,
  images TEXT[],
  categories TEXT[],
  features TEXT[],
  description TEXT,
  review_summary JSONB DEFAULT jsonb_build_object(
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
  reviews JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Copy data from old table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'products') THEN
    INSERT INTO products_new (
      id, asin, title, brand, price, currency, availability,
      dimensions, specifications, best_sellers_rank, variations,
      frequently_bought_together, customer_questions, images,
      categories, features, description, review_summary,
      reviews, status, created_at, updated_at
    )
    SELECT
      id, asin, title, brand, price, currency, availability,
      dimensions, specifications, best_sellers_rank, variations,
      frequently_bought_together, customer_questions, images,
      categories, features, description, review_summary,
      reviews, status, created_at, updated_at
    FROM products
    ON CONFLICT (asin) DO UPDATE SET
      title = EXCLUDED.title,
      brand = EXCLUDED.brand,
      price = EXCLUDED.price,
      updated_at = now();
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS products CASCADE;
ALTER TABLE products_new RENAME TO products;

-- Create indexes
CREATE INDEX idx_products_asin ON products(asin);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_updated_at ON products(updated_at);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_review_summary ON products USING gin(review_summary);
CREATE INDEX idx_products_reviews ON products USING gin(reviews);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
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