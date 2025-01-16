/*
  # Add product history tracking

  1. New Tables
    - `product_history`
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `price` (numeric)
      - `rating` (numeric)
      - `review_count` (integer)
      - `best_sellers_rank` (jsonb)
      - `captured_at` (timestamptz)

  2. Security
    - Enable RLS on `product_history` table
    - Add policies for authenticated users
*/

-- Create product_history table
CREATE TABLE IF NOT EXISTS product_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price NUMERIC,
  rating NUMERIC,
  review_count INTEGER,
  best_sellers_rank JSONB DEFAULT '[]'::jsonb,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_history_product_id ON product_history(product_id);
CREATE INDEX IF NOT EXISTS idx_product_history_captured_at ON product_history(captured_at);
CREATE INDEX IF NOT EXISTS idx_product_history_price ON product_history(price);
CREATE INDEX IF NOT EXISTS idx_product_history_rating ON product_history(rating);
CREATE INDEX IF NOT EXISTS idx_product_history_review_count ON product_history(review_count);

-- Enable RLS
ALTER TABLE product_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "product_history_select_policy"
ON product_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "product_history_insert_policy"
ON product_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to automatically record history
CREATE OR REPLACE FUNCTION record_product_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record history if relevant fields have changed
  IF (
    NEW.price IS DISTINCT FROM OLD.price OR
    (NEW.review_summary->>'rating')::numeric IS DISTINCT FROM (OLD.review_summary->>'rating')::numeric OR
    (NEW.review_summary->>'reviewCount')::integer IS DISTINCT FROM (OLD.review_summary->>'reviewCount')::integer OR
    NEW.best_sellers_rank IS DISTINCT FROM OLD.best_sellers_rank
  ) THEN
    INSERT INTO product_history (
      product_id,
      price,
      rating,
      review_count,
      best_sellers_rank,
      captured_at
    ) VALUES (
      NEW.id,
      NEW.price,
      (NEW.review_summary->>'rating')::numeric,
      (NEW.review_summary->>'reviewCount')::integer,
      NEW.best_sellers_rank,
      NEW.updated_at
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to record history on product updates
DROP TRIGGER IF EXISTS record_product_history_trigger ON products;
CREATE TRIGGER record_product_history_trigger
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION record_product_history();