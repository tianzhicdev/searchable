-- Sample invite codes for testing
-- These codes can be used for testing the invite code feature

-- Insert some active invite codes
INSERT INTO invite_code (code, active, metadata) VALUES 
    ('TESTME', true, '{"description": "Test code for development"}'),
    ('DEMO01', true, '{"description": "Demo code 1"}'),
    ('DEMO02', true, '{"description": "Demo code 2"}'),
    ('SUMMER', true, '{"description": "Summer promotion code"}'),
    ('WINTER', true, '{"description": "Winter promotion code"}'),
    ('LAUNCH', true, '{"description": "Launch promotion code"}');

-- Insert some already used codes for testing
INSERT INTO invite_code (code, active, used_by_user_id, used_at, metadata) VALUES 
    ('USED01', false, 1, NOW() - INTERVAL '1 day', '{"description": "Already used code"}'),
    ('USED02', false, 2, NOW() - INTERVAL '2 days', '{"description": "Already used code"}');

-- Example query to check invite codes
-- SELECT code, active, used_by_user_id, used_at FROM invite_code ORDER BY created_at DESC;