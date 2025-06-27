-- ===================================
-- TAGS SYSTEM TABLES - BETA MIGRATION
-- ===================================
-- This script adds the tag system to an existing database
-- It uses IF NOT EXISTS to be safe for re-runs

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
    user_id INTEGER NOT NULL,
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

-- Insert pre-defined User Tags (only if they don't exist)
INSERT INTO tags (name, tag_type, description) VALUES
('artist', 'user', 'Visual artists, digital artists, painters, sculptors'),
('musician', 'user', 'Music creators, composers, performers'),
('writer', 'user', 'Authors, bloggers, content writers'),
('photographer', 'user', 'Professional and amateur photographers'),
('developer', 'user', 'Software developers, web developers, app creators'),
('designer', 'user', 'Graphic designers, UI/UX designers, web designers'),
('researcher', 'user', 'Academic researchers, analysts'),
('educator', 'user', 'Teachers, trainers, course creators'),
('consultant', 'user', 'Business consultants, advisors'),
('freelancer', 'user', 'Independent contractors, gig workers'),
('marketer', 'user', 'Digital marketers, growth hackers'),
('entrepreneur', 'user', 'Business owners, startup founders'),
('investor', 'user', 'Angel investors, VCs, traders'),
('blogger', 'user', 'Blog writers and content creators'),
('podcaster', 'user', 'Podcast hosts and audio content creators'),
('videographer', 'user', 'Video creators and editors'),
('influencer', 'user', 'Social media influencers and content creators'),
('coach', 'user', 'Life coaches, business coaches, mentors'),
('gamer', 'user', 'Gaming content creators and streamers')
ON CONFLICT (name) DO NOTHING;

-- Insert pre-defined Searchable Tags (only if they don't exist)
INSERT INTO tags (name, tag_type, description) VALUES
('digital-art', 'searchable', 'Digital paintings, illustrations, 3D art'),
('photography', 'searchable', 'Photos, stock images, photo collections'),
('music', 'searchable', 'Songs, albums, beats, sound effects'),
('writing', 'searchable', 'Articles, stories, poems, scripts'),
('ebooks', 'searchable', 'Digital books, guides, manuals'),
('courses', 'searchable', 'Educational content, tutorials, training materials'),
('templates', 'searchable', 'Document templates, design templates, code templates'),
('software', 'searchable', 'Applications, tools, plugins, scripts'),
('datasets', 'searchable', 'Data collections, research data, statistics'),
('graphics', 'searchable', 'Icons, logos, UI elements, vectors'),
('videos', 'searchable', 'Video content, tutorials, documentaries'),
('podcasts', 'searchable', 'Audio podcasts, interviews, talks'),
('3d-models', 'searchable', '3D assets, models, textures'),
('nfts', 'searchable', 'NFT collections, digital collectibles'),
('games', 'searchable', 'Games, game assets, mods'),
('research', 'searchable', 'Research papers, studies, analysis'),
('recipes', 'searchable', 'Food recipes, cooking guides'),
('fitness', 'searchable', 'Workout plans, fitness guides, nutrition plans'),
('business', 'searchable', 'Business plans, strategies, reports'),
('legal', 'searchable', 'Legal documents, contracts, forms')
ON CONFLICT (name) DO NOTHING;

-- Create/update the user_profile table to ensure it exists
CREATE TABLE IF NOT EXISTS user_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    profile_image_url TEXT,
    introduction TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on user_profile.user_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_profile_user_id ON user_profile(user_id);

-- Report migration results
DO $$
DECLARE
    tag_count INTEGER;
    user_tag_count INTEGER;
    searchable_tag_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tag_count FROM tags;
    SELECT COUNT(*) INTO user_tag_count FROM tags WHERE tag_type = 'user';
    SELECT COUNT(*) INTO searchable_tag_count FROM tags WHERE tag_type = 'searchable';
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Total tags: %', tag_count;
    RAISE NOTICE 'User tags: %', user_tag_count;
    RAISE NOTICE 'Searchable tags: %', searchable_tag_count;
END $$;