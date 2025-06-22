-- SQL statement to insert 200 invite codes
-- This generates unique 6-letter uppercase codes

-- Using a CTE (Common Table Expression) to generate 200 unique codes
WITH RECURSIVE code_generator AS (
  -- Start with row number 1
  SELECT 1 as n
  UNION ALL
  -- Generate up to 200 rows
  SELECT n + 1 FROM code_generator WHERE n < 200
),
generated_codes AS (
  SELECT 
    n,
    -- Generate a unique 6-letter code based on the row number
    -- This creates codes like: AAAAAA, AAAAAB, AAAAAC, etc.
    CHR(65 + ((n-1) / 15625) % 26) ||  -- 1st letter (26^5 = 11881376)
    CHR(65 + ((n-1) / 3125) % 26) ||   -- 2nd letter (26^4 = 456976)
    CHR(65 + ((n-1) / 625) % 26) ||    -- 3rd letter (26^3 = 17576)
    CHR(65 + ((n-1) / 125) % 26) ||    -- 4th letter (26^2 = 676)
    CHR(65 + ((n-1) / 25) % 26) ||     -- 5th letter (26^1 = 26)
    CHR(65 + ((n-1) % 25))             -- 6th letter
    AS code
  FROM code_generator
)
INSERT INTO invite_code (code, active, metadata)
SELECT 
  code,
  true,
  jsonb_build_object(
    'batch', 'bulk_insert_200',
    'created_date', CURRENT_DATE,
    'description', 'Bulk generated invite code #' || n
  )
FROM generated_codes;

-- Alternative approach using random codes (may have duplicates, so we use ON CONFLICT)
-- Uncomment below if you prefer random codes instead of sequential

/*
-- Function to generate random 6-letter codes
CREATE OR REPLACE FUNCTION generate_random_code() RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * 26 + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Insert 200 random codes (with retry on duplicates)
DO $$
DECLARE
  i INTEGER;
  attempts INTEGER;
  new_code TEXT;
BEGIN
  FOR i IN 1..200 LOOP
    attempts := 0;
    LOOP
      new_code := generate_random_code();
      BEGIN
        INSERT INTO invite_code (code, active, metadata)
        VALUES (
          new_code,
          true,
          jsonb_build_object(
            'batch', 'random_bulk_200',
            'created_date', CURRENT_DATE,
            'description', 'Random invite code #' || i
          )
        );
        EXIT; -- Success, exit the retry loop
      EXCEPTION
        WHEN unique_violation THEN
          attempts := attempts + 1;
          IF attempts > 100 THEN
            RAISE EXCEPTION 'Too many attempts to generate unique code';
          END IF;
          -- Continue loop to try again
      END;
    END LOOP;
  END LOOP;
END $$;

-- Clean up the function
DROP FUNCTION IF EXISTS generate_random_code();
*/

-- Verify the insertion
SELECT COUNT(*) as total_codes, 
       COUNT(CASE WHEN active THEN 1 END) as active_codes
FROM invite_code
WHERE metadata->>'batch' = 'bulk_insert_200';