/*
  # Enhance Product Data Schema

  1. New Columns
    - `availability` - Product availability status
    - `specifications` - Detailed product specifications
    - `dimensions` - Product dimensions and weight
    - `best_sellers_rank` - Product rankings in categories
    - `variations` - Product variations/options
    - `frequently_bought_together` - Related products
    - `customer_questions` - Q&A data
    - `attributes` - Product attributes
    - `product_overview` - Product overview data
    - `a_plus_content` - A+ content data
    - `ai_reviews_summary` - AI-generated review summary

  2. Security
    - Maintain existing RLS policies
    - Add indexes for new searchable columns
*/

-- Add new columns for enhanced product data
ALTER TABLE products
ADD COLUMN IF NOT EXISTS availability TEXT,
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS best_sellers_rank JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS frequently_bought_together JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS customer_questions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS product_overview JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS a_plus_content JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_reviews_summary JSONB DEFAULT '{}'::jsonb;

-- Add indexes for improved query performance
CREATE INDEX IF NOT EXISTS idx_products_availability ON products (availability);
CREATE INDEX IF NOT EXISTS idx_products_best_sellers_rank ON products USING GIN (best_sellers_rank);
CREATE INDEX IF NOT EXISTS idx_products_variations ON products USING GIN (variations);
CREATE INDEX IF NOT EXISTS idx_products_attributes ON products USING GIN (attributes);

-- Update the updated_at trigger to ensure it captures all changes
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS set_products_updated_at ON products;
CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_products_updated_at();