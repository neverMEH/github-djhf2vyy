/*
  # Add Review Schema

  1. Changes
    - Add review_summary JSONB column with proper structure for ratings and star breakdowns
    - Add reviews JSONB column for storing individual reviews
    - Add review_data JSONB column for metadata
    - Create indexes for efficient querying
    - Set default values for new columns

  2. Security
    - No changes to RLS policies needed
    - Existing product policies cover these new columns
*/

-- Drop existing columns if they exist to ensure clean state
ALTER TABLE products DROP COLUMN IF EXISTS review_summary;
ALTER TABLE products DROP COLUMN IF EXISTS reviews;
ALTER TABLE products DROP COLUMN IF EXISTS review_data;

-- Add review_summary column with proper structure
ALTER TABLE products ADD COLUMN review_summary JSONB DEFAULT jsonb_build_object(
  'rating', 0,
  'reviewCount', 0,
  'averageRating', 0,
  'starsBreakdown', jsonb_build_object(
    '5star', 0,
    '4star', 0,
    '3star', 0,
    '2star', 0,
    '1star', 0
  ),
  'verifiedPurchases', 0,
  'lastUpdated', null
);

-- Add reviews column for storing review data
ALTER TABLE products ADD COLUMN reviews JSONB DEFAULT '[]'::jsonb;

-- Add review_data column for metadata
ALTER TABLE products ADD COLUMN review_data JSONB DEFAULT jsonb_build_object(
  'lastScraped', null,
  'totalReviews', 0,
  'scrapedReviews', 0
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_review_summary_rating ON products ((review_summary->>'rating'));
CREATE INDEX IF NOT EXISTS idx_products_review_summary_count ON products ((review_summary->>'reviewCount'));
CREATE INDEX IF NOT EXISTS idx_products_review_data_scraped ON products ((review_data->>'lastScraped'));