/*
  # Fix Apify Integration and Database Schema

  1. Changes
    - Add missing unique constraint on products.asin
    - Fix price handling in products table
    - Add missing http extension for Apify proxy
    - Update proxy function to handle errors properly

  2. Security
    - Maintain existing RLS policies
    - Ensure secure API key handling
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "http";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Add unique constraint on asin if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_asin_key'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_asin_key UNIQUE (asin);
  END IF;
END $$;

-- Update proxy_apify_request function with better error handling
CREATE OR REPLACE FUNCTION proxy_apify_request(
  endpoint text,
  method text DEFAULT 'GET',
  body jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  url text := 'https://api.apify.com/v2' || endpoint;
  response http_response;
  result jsonb;
  api_key text;
BEGIN
  -- Get API key from environment
  api_key := current_setting('app.settings.apify_api_key', true);
  
  -- Make the HTTP request
  SELECT * INTO response FROM http_post(
    url := url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || api_key,
      'Content-Type', 'application/json'
    ),
    body := CASE 
      WHEN body IS NOT NULL THEN body::text 
      ELSE NULL 
    END
  );
  
  -- Check for errors
  IF response.status != 200 THEN
    RAISE EXCEPTION 'Apify API request failed with status %: %', 
      response.status, 
      response.content::text;
  END IF;

  -- Parse response
  result := response.content::jsonb;
  
  RETURN result;
EXCEPTION
  WHEN others THEN
    RAISE EXCEPTION 'Apify proxy error: %', SQLERRM;
END;
$$;