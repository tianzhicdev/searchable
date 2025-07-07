-- Migration: Add ai_content table for AI Content Manager feature
-- Date: 2024-01-15

CREATE TABLE IF NOT EXISTS ai_content (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    instructions TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'processed')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ai_content_user_id ON ai_content(user_id);
CREATE INDEX idx_ai_content_status ON ai_content(status);
CREATE INDEX idx_ai_content_created_at ON ai_content(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_content_updated_at BEFORE UPDATE
    ON ai_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_content TO searchable;
GRANT USAGE, SELECT ON SEQUENCE ai_content_id_seq TO searchable;