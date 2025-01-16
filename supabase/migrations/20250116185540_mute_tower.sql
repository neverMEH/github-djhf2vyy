/*
  # Add Review Management Support

  1. New Columns
    - Add review_data column for storing metadata about review scraping
    - Add review_stats column for storing aggregated review statistics
    - Add review_history column for tracking review changes over time

  2. Functions
    - Add function to update review statistics
    - Add function to track review history
    - Add function to manage review refresh scheduling

  3. Indexes
    - Add indexes for efficient querying of review data
*/

-- Add new columns for review management
ALTER TABLE products
ADD COLUMN IF NOT EXISTS review_data JSONB DEFAULT jsonb_build_object(
  'lastScraped', null,
  'scrapedReviews', 0,
  'nextScrapeScheduled', null,
  'scrapeStatus', 'pending'
);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS review_stats JSONB DEFAULT jsonb_build_object(
  'totalReviews', 0,
  'verifiedReviews', 0,
  'unverifiedReviews', 0,
  'positiveReviews', 0,
  'negativeReviews', 0,
  'neutralReviews', 0,
  'averageRating', 0,
  'lastUpdated', null
);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS review_history JSONB DEFAULT '[]'::jsonb;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_products_review_data ON products USING GIN (review_data);
CREATE INDEX IF NOT EXISTS idx_products_review_stats ON products USING GIN (review_stats);
CREATE INDEX IF NOT EXISTS idx_products_review_history ON products USING GIN (review_history);

-- Function to update review statistics
CREATE OR REPLACE FUNCTION update_review_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate review statistics
  NEW.review_stats = jsonb_build_object(
    'totalReviews', jsonb_array_length(NEW.reviews),
    'verifiedReviews', (
      SELECT count(*)
      FROM jsonb_array_elements(NEW.reviews) AS r
      WHERE (r->>'verified')::boolean = true
    ),
    'unverifiedReviews', (
      SELECT count(*)
      FROM jsonb_array_elements(NEW.reviews) AS r
      WHERE (r->>'verified')::boolean = false
    ),
    'positiveReviews', (
      SELECT count(*)
      FROM jsonb_array_elements(NEW.reviews) AS r
      WHERE (r->>'rating')::integer >= 4
    ),
    'negativeReviews', (
      SELECT count(*)
      FROM jsonb_array_elements(NEW.reviews) AS r
      WHERE (r->>'rating')::integer <= 2
    ),
    'neutralReviews', (
      SELECT count(*)
      FROM jsonb_array_elements(NEW.reviews) AS r
      WHERE (r->>'rating')::integer = 3
    ),
    'averageRating', (
      SELECT COALESCE(
        AVG((r->>'rating')::numeric),
        0
      )
      FROM jsonb_array_elements(NEW.reviews) AS r
    ),
    'lastUpdated', CURRENT_TIMESTAMP
  );

  -- Update review history if statistics have changed
  IF OLD.review_stats IS NULL OR OLD.review_stats != NEW.review_stats THEN
    NEW.review_history = COALESCE(OLD.review_history, '[]'::jsonb) || jsonb_build_object(
      'timestamp', CURRENT_TIMESTAMP,
      'stats', NEW.review_stats
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review statistics updates
DROP TRIGGER IF EXISTS update_review_statistics_trigger ON products;
CREATE TRIGGER update_review_statistics_trigger
  BEFORE UPDATE OF reviews ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_review_statistics();

-- Function to schedule next review scrape
CREATE OR REPLACE FUNCTION schedule_review_scrape()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule next scrape based on review count and last scrape time
  NEW.review_data = jsonb_set(
    COALESCE(NEW.review_data, '{}'::jsonb),
    '{nextScrapeScheduled}',
    to_jsonb(
      CASE
        WHEN (NEW.review_stats->>'totalReviews')::integer > 1000 THEN
          CURRENT_TIMESTAMP + INTERVAL '12 hours'
        WHEN (NEW.review_stats->>'totalReviews')::integer > 500 THEN
          CURRENT_TIMESTAMP + INTERVAL '24 hours'
        ELSE
          CURRENT_TIMESTAMP + INTERVAL '48 hours'
      END
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for review scrape scheduling
DROP TRIGGER IF EXISTS schedule_review_scrape_trigger ON products;
CREATE TRIGGER schedule_review_scrape_trigger
  BEFORE UPDATE OF review_stats ON products
  FOR EACH ROW
  EXECUTE FUNCTION schedule_review_scrape();