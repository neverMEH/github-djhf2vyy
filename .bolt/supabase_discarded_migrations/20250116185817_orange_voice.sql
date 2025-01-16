-- Drop existing constraints if they exist
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_asin_key;

-- Add unique constraint for ASIN
ALTER TABLE products ADD CONSTRAINT products_asin_unique UNIQUE (asin);

-- Update products table structure
ALTER TABLE products 
ALTER COLUMN price TYPE NUMERIC USING (price::numeric),
ALTER COLUMN currency SET DEFAULT 'USD',
ALTER COLUMN status SET DEFAULT 'pending';

-- Create or replace the function to handle product updates
CREATE OR REPLACE FUNCTION handle_product_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Set updated_at timestamp
  NEW.updated_at = CURRENT_TIMESTAMP;
  
  -- Handle price data
  IF NEW.price IS NOT NULL AND NEW.price::text ~ '^\{.*\}$' THEN
    NEW.price = (NEW.price::jsonb->>'value')::numeric;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product updates
DROP TRIGGER IF EXISTS handle_product_update_trigger ON products;
CREATE TRIGGER handle_product_update_trigger
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION handle_product_update();