CREATE TABLE IF NOT EXISTS searchables (
    searchable_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    searchable_data JSONB NOT NULL,
    removed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for searchables table
CREATE INDEX IF NOT EXISTS idx_searchables_user_id ON searchables(user_id);
CREATE INDEX IF NOT EXISTS idx_searchables_removed ON searchables(removed);
CREATE INDEX IF NOT EXISTS idx_searchables_created_at ON searchables(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searchables_user_id_removed ON searchables(user_id, removed);


CREATE TABLE IF NOT EXISTS files (
    file_id SERIAL PRIMARY KEY,
    uri TEXT NOT NULL,
    metadata JSONB NOT NULL
);

-- Index on uri for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_uri ON files(uri);

CREATE TABLE IF NOT EXISTS purchases (
    purchase_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    file_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL,
    FOREIGN KEY (file_id) REFERENCES files(file_id) ON DELETE CASCADE
);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);

-- Index on file_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchases_file_id ON purchases(file_id);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_purchases_created_at ON purchases(created_at);

-- Updated invoice table with better structure
CREATE TABLE IF NOT EXISTS invoice (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER NOT NULL,
    seller_id INTEGER NOT NULL,
    searchable_id INTEGER NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL CHECK (currency = 'usd'),
    type TEXT NOT NULL CHECK (type IN ('stripe', 'balance')),
    external_id TEXT NOT NULL UNIQUE, -- Stripe session ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Index on buyer_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_buyer_id ON invoice(buyer_id);

-- Index on seller_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_seller_id ON invoice(seller_id);

-- Index on searchable_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_searchable_id ON invoice(searchable_id);

-- Index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_type ON invoice(type);

-- Index on external_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_external_id ON invoice(external_id);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON invoice(created_at);

-- Updated payment table
CREATE TABLE IF NOT EXISTS payment (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL CHECK (currency = 'usd'),
    type TEXT NOT NULL CHECK (type IN ('stripe', 'balance')),
    external_id TEXT, -- External payment ID if available
    status TEXT NOT NULL CHECK (status IN ('pending','complete', 'delayed', 'error')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Index on invoice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_invoice_id ON payment(invoice_id);

-- Index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_type ON payment(type);

-- Index on status for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment(created_at);

-- Updated withdrawal table with currency field
CREATE TABLE IF NOT EXISTS withdrawal (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(20,8) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL CHECK (currency = 'usd'),
    type TEXT NOT NULL CHECK (type = 'bank_transfer'),
    external_id TEXT, -- Transaction ID
    status TEXT NOT NULL CHECK (status IN ('pending', 'complete', 'failed', 'delayed', 'error')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_withdrawal_user_id ON withdrawal(user_id);

-- Index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_withdrawal_type ON withdrawal(type);

-- Index on status for faster lookups
CREATE INDEX IF NOT EXISTS idx_withdrawal_status ON withdrawal(status);

-- Index on currency for faster lookups
CREATE INDEX IF NOT EXISTS idx_withdrawal_currency ON withdrawal(currency);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_withdrawal_created_at ON withdrawal(created_at);

-- Migration: Add delayed status to existing withdrawal table
ALTER TABLE withdrawal 
DROP CONSTRAINT IF EXISTS withdrawal_status_check;

ALTER TABLE withdrawal 
ADD CONSTRAINT withdrawal_status_check 
CHECK (status IN ('pending', 'complete', 'failed', 'delayed', 'error'));

-- Invoice notes table for communication between buyer and seller
CREATE TABLE IF NOT EXISTS invoice_note (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    buyer_seller TEXT NOT NULL, -- 'buyer' or 'seller'
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on invoice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_note_invoice_id ON invoice_note(invoice_id);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoice_note_user_id ON invoice_note(user_id);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_invoice_note_created_at ON invoice_note(created_at);

-- Rating table for buyer/seller ratings
CREATE TABLE IF NOT EXISTS rating (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoice(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    rating DOUBLE PRECISION NOT NULL CHECK (rating >= 0 AND rating <= 5),
    review TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on invoice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_rating_invoice_id ON rating(invoice_id);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_rating_user_id ON rating(user_id);

-- Index on rating for faster aggregations
CREATE INDEX IF NOT EXISTS idx_rating_rating ON rating(rating);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_rating_created_at ON rating(created_at);

-- User profiles table for public profile information
CREATE TABLE IF NOT EXISTS user_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE, -- References users.id
    username TEXT NOT NULL, -- Duplicated from users table for faster access
    profile_image_url TEXT, -- URL to profile image
    introduction TEXT, -- User's bio/introduction
    metadata JSONB NOT NULL DEFAULT '{}', -- Additional profile data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);

-- Index on username for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profile_username ON user_profile(username);

-- Index on created_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_user_profile_created_at ON user_profile(created_at);

-- Index on updated_at for faster date-based queries
CREATE INDEX IF NOT EXISTS idx_user_profile_updated_at ON user_profile(updated_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on user_profile changes
CREATE TRIGGER update_user_profile_updated_at 
    BEFORE UPDATE ON user_profile 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on searchables changes
CREATE TRIGGER update_searchables_updated_at 
    BEFORE UPDATE ON searchables 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Metrics table for event tracking and analytics
CREATE TABLE IF NOT EXISTS metrics (
    event_id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,  -- e.g., 'page_view', 'user_signup'
    metric_value DOUBLE PRECISION DEFAULT 1,  -- Default 1 for count events
    tag1 TEXT,  -- e.g., 'user_id:123'
    tag2 TEXT,  -- e.g., 'searchable_type:offline'
    tag3 TEXT,  -- e.g., 'ip:192.168.1.1'
    tag4 TEXT,  -- Optional extra tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON metrics(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_tag1 ON metrics(tag1) WHERE tag1 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_tag2 ON metrics(tag2) WHERE tag2 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_tag3 ON metrics(tag3) WHERE tag3 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON metrics(created_at DESC);

-- Invite codes table for registration rewards
CREATE TABLE IF NOT EXISTS invite_code (
    id SERIAL PRIMARY KEY,
    code VARCHAR(6) NOT NULL UNIQUE CHECK (code ~ '^[A-Z]{6}$'), -- 6 uppercase letters
    active BOOLEAN NOT NULL DEFAULT true,
    used_by_user_id INTEGER, -- References users.id when used
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Index on code for faster lookups
CREATE INDEX IF NOT EXISTS idx_invite_code_code ON invite_code(code);

-- Index on active for faster active code queries
CREATE INDEX IF NOT EXISTS idx_invite_code_active ON invite_code(active) WHERE active = true;

-- Index on used_by_user_id for tracking usage
CREATE INDEX IF NOT EXISTS idx_invite_code_used_by ON invite_code(used_by_user_id) WHERE used_by_user_id IS NOT NULL;

-- Rewards table for promotional credits and bonuses
CREATE TABLE IF NOT EXISTS rewards (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL CHECK (currency = 'usd') DEFAULT 'usd',
    user_id INTEGER NOT NULL, -- References users.id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Index on user_id for faster balance calculations
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);

-- Index on created_at for date-based queries
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON rewards(created_at);

-- Index on amount for aggregation queries
CREATE INDEX IF NOT EXISTS idx_rewards_amount ON rewards(amount);

-- ===================================
-- TAGS SYSTEM TABLES
-- ===================================

-- Tags table for pre-defined tags
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    tag_type VARCHAR(20) NOT NULL CHECK (tag_type IN ('user', 'searchable')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User tags mapping (many-to-many)
CREATE TABLE IF NOT EXISTS user_tags (
    user_id INTEGER NOT NULL, -- References terminal.terminal_id
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tag_id)
);

-- Searchable tags mapping (many-to-many)
CREATE TABLE IF NOT EXISTS searchable_tags (
    searchable_id INTEGER NOT NULL REFERENCES searchables(searchable_id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (searchable_id, tag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags(tag_type);
CREATE INDEX IF NOT EXISTS idx_tags_active ON tags(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_user_tags_user_id ON user_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tags_tag_id ON user_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_searchable_tags_searchable_id ON searchable_tags(searchable_id);
CREATE INDEX IF NOT EXISTS idx_searchable_tags_tag_id ON searchable_tags(tag_id);

-- ===================================
-- PRE-DEFINED TAGS DATA
-- ===================================

-- Insert pre-defined User Tags
INSERT INTO tags (name, tag_type, description) VALUES
-- Creator/Professional Types
('artist', 'user', 'Visual artists, digital artists, painters, sculptors'),
('musician', 'user', 'Music creators, composers, performers'),
('writer', 'user', 'Authors, bloggers, content writers'),
('photographer', 'user', 'Professional and amateur photographers'),
('designer', 'user', 'Graphic designers, UI/UX designers, product designers'),
('developer', 'user', 'Software developers, web developers, app creators'),
('educator', 'user', 'Teachers, trainers, course creators'),
('researcher', 'user', 'Academic researchers, analysts'),

-- Business Types
('store', 'user', 'Online stores, retail businesses'),
('publisher', 'user', 'Book publishers, content publishers'),
('agency', 'user', 'Marketing agencies, creative agencies'),
('startup', 'user', 'New businesses and startups'),
('freelancer', 'user', 'Independent contractors and freelancers'),
('consultant', 'user', 'Business and specialized consultants'),

-- Content Creator Types
('blogger', 'user', 'Blog writers and content creators'),
('podcaster', 'user', 'Podcast hosts and audio content creators'),
('streamer', 'user', 'Live streamers and video content creators'),
('influencer', 'user', 'Social media influencers and content creators'),

-- Specialty Types
('nonprofit', 'user', 'Non-profit organizations and charities'),
('community', 'user', 'Community groups and organizations'),
('collector', 'user', 'Collectors of various items and memorabilia')

ON CONFLICT (name) DO NOTHING;

-- Insert pre-defined Searchable Tags
INSERT INTO tags (name, tag_type, description) VALUES
-- Content Types
('books', 'searchable', 'Books, ebooks, novels, textbooks'),
('music', 'searchable', 'Songs, albums, audio tracks, soundtracks'),
('art', 'searchable', 'Digital art, paintings, illustrations, graphics'),
('photos', 'searchable', 'Photography, stock photos, portraits'),
('videos', 'searchable', 'Video content, tutorials, entertainment'),
('software', 'searchable', 'Applications, tools, plugins, scripts'),
('games', 'searchable', 'Video games, mobile games, game assets'),
('courses', 'searchable', 'Educational content, tutorials, training materials'),

-- Digital Products
('templates', 'searchable', 'Design templates, document templates'),
('fonts', 'searchable', 'Typography, custom fonts, typefaces'),
('icons', 'searchable', 'Icon sets, symbols, graphics'),
('themes', 'searchable', 'Website themes, app themes, UI kits'),
('presets', 'searchable', 'Photo presets, audio presets, filters'),
('plugins', 'searchable', 'Software plugins, extensions, add-ons'),
('assets', 'searchable', 'Game assets, design assets, resources'),

-- Physical Products/Services
('prints', 'searchable', 'Physical prints, posters, merchandise'),
('crafts', 'searchable', 'Handmade items, crafts, DIY products'),
('services', 'searchable', 'Consulting, custom work, freelance services'),
('coaching', 'searchable', 'Personal coaching, mentorship, advice'),

-- Content Categories
('fiction', 'searchable', 'Fiction books, stories, novels'),
('nonfiction', 'searchable', 'Non-fiction books, educational content'),
('romance', 'searchable', 'Romance novels and content'),
('scifi', 'searchable', 'Science fiction content'),
('fantasy', 'searchable', 'Fantasy books and content'),
('horror', 'searchable', 'Horror content and stories'),
('comedy', 'searchable', 'Comedy content and entertainment'),
('documentary', 'searchable', 'Documentary content and educational videos'),

-- Skill/Topic Areas
('business', 'searchable', 'Business-related content and tools'),
('technology', 'searchable', 'Tech-related content and tools'),
('health', 'searchable', 'Health and wellness content'),
('fitness', 'searchable', 'Fitness and exercise content'),
('cooking', 'searchable', 'Recipes, cooking tutorials, food content'),
('travel', 'searchable', 'Travel guides, photography, experiences'),
('lifestyle', 'searchable', 'Lifestyle content and advice'),
('finance', 'searchable', 'Financial advice, tools, and content'),

-- Style/Genre Tags
('minimalist', 'searchable', 'Clean, simple, minimalist design'),
('vintage', 'searchable', 'Retro and vintage style content'),
('modern', 'searchable', 'Contemporary and modern design'),
('abstract', 'searchable', 'Abstract art and design'),
('realistic', 'searchable', 'Realistic art and photography'),
('experimental', 'searchable', 'Experimental and avant-garde content')

ON CONFLICT (name) DO NOTHING;






-- Create deposit table for USDT deposits
CREATE TABLE IF NOT EXISTS deposit (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usdt',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    external_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'failed')),
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deposit_user_id ON deposit(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_status ON deposit(status);
CREATE INDEX IF NOT EXISTS idx_deposit_created_at ON deposit(created_at);
CREATE INDEX IF NOT EXISTS idx_deposit_external_id ON deposit(external_id);

-- Add comment explaining metadata fields
COMMENT ON COLUMN deposit.metadata IS 'Contains: eth_address, private_key (encrypted), tx_hash, confirmations, expires_at, checked_at, error';

-- Add tx_hash column to deposit table
ALTER TABLE deposit 
ADD COLUMN IF NOT EXISTS tx_hash TEXT;

-- Create unique index on tx_hash (excluding NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_deposit_tx_hash 
ON deposit(tx_hash) 
WHERE tx_hash IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN deposit.tx_hash IS 'Ethereum transaction hash for the USDT deposit';