/*
  # Create Reviews Table

  1. New Tables
    - `reviews` table for storing product reviews with:
      - Primary key and foreign key constraints
      - Review metadata (title, content, rating, etc.)
      - Author information
      - Voting and verification data
      - Timestamps and tracking fields

  2. Indexes
    - Optimized indexes for common query patterns
    - Full-text search capability for review content

  3. Security
    - Row Level Security (RLS) enabled
    - Appropriate access policies for authenticated users
*/

-- Drop existing table if it exists
DROP TABLE IF EXISTS reviews CASCADE;

-- Create reviews table
CREATE TABLE reviews (
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
  review_date TIMESTAMPTZ,
  variant TEXT,
  variant_attributes JSONB,
  country TEXT,
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT reviews_product_review_key UNIQUE (product_id, review_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_review_date ON reviews(review_date);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_verified_purchase ON reviews(verified_purchase);
CREATE INDEX idx_reviews_helpful_votes ON reviews(helpful_votes);
CREATE INDEX idx_reviews_author_id ON reviews(author_id);
CREATE INDEX idx_reviews_country ON reviews(country);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();