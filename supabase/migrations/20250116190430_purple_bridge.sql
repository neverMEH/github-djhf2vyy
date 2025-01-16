-- Drop existing function if it exists
DROP FUNCTION IF EXISTS proxy_apify_request;

-- Create improved proxy function with better error handling
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
  
  IF method = 'GET' THEN
    SELECT * INTO response FROM http_get(
      url := url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || api_key,
        'Content-Type', 'application/json'
      )
    );
  ELSE
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
  END IF;
  
  -- Check for errors
  IF response.status NOT BETWEEN 200 AND 299 THEN
    RAISE EXCEPTION 'Apify API request failed with status %: %', 
      response.status, 
      response.content::text;
  END IF;

  -- Parse response
  result := response.content::jsonb;
  
  RETURN result;
EXCEPTION
  WHEN others THEN
    -- Log error details
    RAISE LOG 'Apify proxy error: % (URL: %, Method: %, Body: %)', 
      SQLERRM, url, method, body;
    
    -- Re-raise with clean message
    RAISE EXCEPTION 'Failed to proxy Apify request: %', SQLERRM;
END;
$$;