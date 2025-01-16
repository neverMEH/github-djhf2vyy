-- Drop and recreate get_products_to_refresh function with fixed column references
CREATE OR REPLACE FUNCTION get_products_to_refresh(batch_size INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  asin TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH updated_queue AS (
    UPDATE refresh_queue rq
    SET status = 'processing'
    WHERE rq.id IN (
      SELECT rq2.id
      FROM refresh_queue rq2
      WHERE rq2.status = 'pending'
      AND rq2.scheduled_for <= CURRENT_TIMESTAMP
      ORDER BY rq2.scheduled_for ASC
      LIMIT batch_size
    )
    RETURNING rq.product_id
  )
  SELECT p.id, p.asin
  FROM updated_queue uq
  JOIN products p ON p.id = uq.product_id;
END;
$$ LANGUAGE plpgsql;