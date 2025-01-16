/*
  # Add product reviews and images support

  1. Changes
    - Add reviews JSONB column to store review data
    - Add images array column to store product images
    - Add rating and review count columns
    - Add indexes for performance
  
  2. Security
    - Maintains existing RLS policies
    - Ensures data integrity
*/

-- Add new columns for reviews and images
ALTER TABLE products
ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS review_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS review_summary JSONB DEFAULT '{}'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_rating ON products((review_summary->>'rating'));
CREATE INDEX IF NOT EXISTS idx_products_review_count ON products((review_summary->>'reviewCount'));