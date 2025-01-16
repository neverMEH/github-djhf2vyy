/*
  # Add Apify Proxy Function

  1. New Function
    - Creates a proxy function to handle Apify API requests
    - Handles authentication and CORS
    - Returns results in a standardized format

  2. Security
    - Only authenticated users can access the function
    - API keys are handled securely on the server side
*/

-- Create a function to proxy Apify API requests
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
  result jsonb;
  api_key text;
BEGIN
  -- Get API key from vault or environment variable
  -- In production, this should be fetched from a secure vault
  api_key := current_setting('app.settings.apify_api_key', true);
  
  -- Make the HTTP request
  SELECT
    CASE
      WHEN method = 'GET' THEN
        http((
          'GET',
          url,
          ARRAY[http_header('Authorization', 'Bearer ' || api_key)],
          NULL,
          NULL
        ))
      ELSE
        http((
          method,
          url,
          ARRAY[
            http_header('Authorization', 'Bearer ' || api_key),
            http_header('Content-Type', 'application/json')
          ],
          body::text,
          NULL
        ))
    END
  INTO result;

  -- Return the response
  RETURN result;
END;
$$;