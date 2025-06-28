-- Migration: Add removed column and indexes to searchables table
-- Date: 2025-01-06

-- Add removed column to searchables table
ALTER TABLE searchables 
ADD COLUMN IF NOT EXISTS removed BOOLEAN DEFAULT FALSE;

-- Add created_at column to searchables table
ALTER TABLE searchables 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at column to searchables table
ALTER TABLE searchables 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Migrate existing removed status from JSON to column
UPDATE searchables 
SET removed = TRUE 
WHERE searchable_data->>'removed' = 'true';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_searchables_user_id ON searchables(user_id);
CREATE INDEX IF NOT EXISTS idx_searchables_removed ON searchables(removed);
CREATE INDEX IF NOT EXISTS idx_searchables_created_at ON searchables(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searchables_user_id_removed ON searchables(user_id, removed);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_searchables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_searchables_updated_at ON searchables;
CREATE TRIGGER update_searchables_updated_at 
    BEFORE UPDATE ON searchables 
    FOR EACH ROW EXECUTE FUNCTION update_searchables_updated_at();