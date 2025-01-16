/*
  # Create reviews table with proper structure

  1. New Tables
    - `reviews` table for storing Amazon product reviews
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `review_id` (text, Amazon's review ID)
      - `title` (text, review title)
      - `content` (text, review content)
      - `rating` (integer, 1-5 stars)
      - `author` (text, reviewer name)
      - `helpful_votes` (integer)
      - `total_votes` (integer)
      - `images` (text[], review images)
      - `review_date` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Primary key on id
    - Foreign key to products
    - Composite unique constraint on product_id and review_id
    - Indexes for common query patterns

  3. Security
    - Enable RLS
    - Policies for authenticated users
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
  helpful_votes INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  images TEXT[],
  review_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT reviews_product_review_key UNIQUE (product_id, review_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_review_date ON reviews(review_date);
CREATE INDEX idx_reviews_rating ON reviews(rating);

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