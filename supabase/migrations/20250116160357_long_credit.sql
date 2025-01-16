/*
  # Add automatic product refresh functionality

  1. New Tables
    - `refresh_queue` - Tracks products that need to be refreshed
      - `id` (uuid, primary key)
      - `product_id` (uuid, references products)
      - `scheduled_for` (timestamptz)
      - `last_refresh` (timestamptz)
      - `status` (text)
      - `error` (text)

  2. Functions
    - `schedule_product_refresh()` - Schedules next refresh for a product
    - `get_products_to_refresh()` - Gets products that need refreshing
    - `mark_product_refreshed()` - Updates refresh status

  3. Security
    - Enable RLS on `refresh_queue` table
    - Add policies for authenticated users
*/

-- Create refresh_queue table
CREATE TABLE IF NOT EXISTS refresh_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  last_refresh TIMESTAMPTZ,
  status TEXT DEFAULT 'pending',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_refresh_queue_product_id ON refresh_queue(product_id);
CREATE INDEX IF NOT EXISTS idx_refresh_queue_scheduled_for ON refresh_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_refresh_queue_status ON refresh_queue(status);

-- Enable RLS
ALTER TABLE refresh_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "refresh_queue_select_policy"
ON refresh_queue FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "refresh_queue_insert_policy"
ON refresh_queue FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "refresh_queue_update_policy"
ON refresh_queue FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Function to schedule next refresh
CREATE OR REPLACE FUNCTION schedule_product_refresh()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule next refresh for 24 hours from now
  INSERT INTO refresh_queue (
    product_id,
    scheduled_for
  ) VALUES (
    NEW.id,
    CURRENT_TIMESTAMP + INTERVAL '24 hours'
  )
  ON CONFLICT (product_id) DO UPDATE
  SET scheduled_for = EXCLUDED.scheduled_for;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to schedule refresh when product is created or updated
DROP TRIGGER IF EXISTS schedule_product_refresh_trigger ON products;
CREATE TRIGGER schedule_product_refresh_trigger
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION schedule_product_refresh();

-- Function to get products that need refreshing
CREATE OR REPLACE FUNCTION get_products_to_refresh(batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  asin TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH updated_queue AS (
    UPDATE refresh_queue
    SET status = 'processing'
    WHERE id IN (
      SELECT id
      FROM refresh_queue
      WHERE status = 'pending'
      AND scheduled_for <= CURRENT_TIMESTAMP
      ORDER BY scheduled_for ASC
      LIMIT batch_size
    )
    RETURNING product_id
  )
  SELECT p.id, p.asin
  FROM updated_queue uq
  JOIN products p ON p.id = uq.product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark product as refreshed
CREATE OR REPLACE FUNCTION mark_product_refreshed(
  p_product_id UUID,
  p_success BOOLEAN DEFAULT true,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE refresh_queue
  SET 
    status = CASE WHEN p_success THEN 'completed' ELSE 'failed' END,
    last_refresh = CURRENT_TIMESTAMP,
    error = p_error,
    scheduled_for = CASE 
      WHEN p_success THEN CURRENT_TIMESTAMP + INTERVAL '24 hours'
      ELSE CURRENT_TIMESTAMP + INTERVAL '1 hour' -- Retry failed refreshes after 1 hour
    END
  WHERE product_id = p_product_id
  AND status = 'processing';
END;
$$ LANGUAGE plpgsql;