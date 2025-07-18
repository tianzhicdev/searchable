-- Migration to add is_guest field to user_profile table
-- This field will be used to identify guest users instead of relying on email patterns

-- Add is_guest column to user_profile table
ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT FALSE;

-- Update existing guest users based on email pattern
UPDATE user_profile 
SET is_guest = TRUE 
WHERE user_id IN (
    SELECT id 
    FROM users 
    WHERE email LIKE 'guest%@guest.com'
);

-- Add index for faster guest user queries
CREATE INDEX IF NOT EXISTS idx_user_profile_is_guest 
ON user_profile(is_guest) 
WHERE is_guest = TRUE;