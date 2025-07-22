-- Migration: Add feedback table
-- Date: 2025-01-22

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feedback TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- Add comment for documentation
COMMENT ON TABLE feedback IS 'User feedback submissions';
COMMENT ON COLUMN feedback.user_id IS 'ID of user who submitted feedback';
COMMENT ON COLUMN feedback.feedback IS 'Feedback text content';
COMMENT ON COLUMN feedback.metadata IS 'Additional context (page, browser, etc)';