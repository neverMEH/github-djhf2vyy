/*
  # Add reviews table with proper constraints

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `review_id` (text, not null)
      - `title` (text)
      - `content` (text)
      - `rating` (integer)
      - `author` (text)
      - `verified` (boolean)
      - `helpful_votes` (integer)
      - `total_votes` (integer)
      - `images` (text array)
      - `review_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Constraints
    - Composite unique constraint on (product_id, review_id)
    - Foreign key to products table
    - Check constraint for rating range

  3. Indexes
    - Index on product_id for faster lookups
    - Index on review_date for time-based queries
    - Index on rating for filtering
*/

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  review_id TEXT NOT NULL,
  title TEXT,
  content TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  author TEXT,
  verified BOOLEAN DEFAULT false,
  helpful_votes INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  images TEXT[],
  review_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT reviews_product_review_key UNIQUE (product_id, review_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_review_date ON reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON reviews(verified);

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
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();