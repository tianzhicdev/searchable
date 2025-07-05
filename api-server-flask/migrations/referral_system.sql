-- Migration: Add referral system enhancements
-- Date: 2025-01-04

-- Step 1: Modify invite_code table to support multi-use and creator tracking
ALTER TABLE invite_code 
ADD COLUMN creator_user_id INTEGER REFERENCES users(id),
ADD COLUMN max_uses INTEGER DEFAULT NULL,  -- NULL = unlimited uses
ADD COLUMN times_used INTEGER DEFAULT 0;

-- Step 2: Create referrals tracking table
CREATE TABLE referrals (
    id SERIAL PRIMARY KEY,
    referrer_user_id INTEGER REFERENCES users(id) NOT NULL,
    referred_user_id INTEGER REFERENCES users(id) NOT NULL,
    invite_code_id INTEGER REFERENCES invite_code(id) NOT NULL,
    signup_reward_id INTEGER REFERENCES rewards(id),
    referrer_reward_id INTEGER REFERENCES rewards(id),
    referrer_reward_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    searchable_created_at TIMESTAMP DEFAULT NULL,
    UNIQUE(referred_user_id)  -- Each user can only be referred once
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_referrals_referrer_user_id ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX idx_referrals_referrer_reward_paid ON referrals(referrer_reward_paid);
CREATE INDEX idx_invite_code_creator_user_id ON invite_code(creator_user_id);

-- Step 4: Migrate existing data (optional - preserves history)
-- For existing invite codes that were used, we can create referral records
-- This is commented out by default, uncomment if you want to migrate historical data
/*
INSERT INTO referrals (referrer_user_id, referred_user_id, invite_code_id, signup_reward_id, referrer_reward_paid, created_at)
SELECT 
    1 as referrer_user_id,  -- Default to user 1 or admin since we don't know original referrer
    ic.used_by_user_id as referred_user_id,
    ic.id as invite_code_id,
    r.id as signup_reward_id,
    TRUE as referrer_reward_paid,  -- Mark as paid so we don't retroactively pay
    ic.used_at as created_at
FROM invite_code ic
LEFT JOIN rewards r ON r.user_id = ic.used_by_user_id 
    AND r.metadata->>'type' = 'invite_code_reward'
    AND r.metadata->>'invite_code' = ic.code
WHERE ic.used_by_user_id IS NOT NULL;
*/

-- Step 5: Update invite_code to track usage count for legacy codes
UPDATE invite_code 
SET times_used = 1 
WHERE used_by_user_id IS NOT NULL AND active = FALSE;

-- Note: We keep used_by_user_id and used_at columns for backward compatibility
-- New multi-use codes will have these as NULL and track usage via referrals table