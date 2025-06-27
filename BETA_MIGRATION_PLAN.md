# Beta Migration Plan for Creator Tab and Tag System

## Overview
This document outlines the steps to safely migrate the creator tab and tag system to the beta environment while preserving existing data.

## Pre-Migration Checklist

1. **Current Beta Status**
   - [ ] Check beta database status: `./exec.sh beta status`
   - [ ] Verify beta has existing data that needs to be preserved
   - [ ] Document current beta branch/version

2. **Backup Beta Database**
   ```bash
   # SSH to beta server
   ssh searchable@cherry-interest.metalseed.net
   
   # Create backup
   docker exec searchable_postgres_1 pg_dump -U searchable searchable > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

## Migration Steps

### Step 1: Create Migration Script
Create a file `migrate_tags_to_beta.sql` with only the new tables:

```sql
-- ===================================
-- TAGS SYSTEM TABLES - MIGRATION
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

-- Insert pre-defined tags only if they don't exist
INSERT INTO tags (name, tag_type, description) 
SELECT * FROM (VALUES
    -- User Tags
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
    ('influencer', 'user', 'Social media influencers, content creators'),
    ('marketer', 'user', 'Digital marketers, growth hackers'),
    ('entrepreneur', 'user', 'Business owners, startup founders'),
    ('investor', 'user', 'Angel investors, VCs, traders'),
    ('blogger', 'user', 'Blog writers and content creators'),
    ('podcaster', 'user', 'Podcast hosts and audio content creators'),
    ('videographer', 'user', 'Video creators and editors'),
    ('influencer', 'user', 'Social media influencers and content creators'),
    ('coach', 'user', 'Life coaches, business coaches, mentors'),
    ('gamer', 'user', 'Gaming content creators and streamers'),
    
    -- Searchable Tags
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
) AS v(name, tag_type, description)
WHERE NOT EXISTS (SELECT 1 FROM tags WHERE tags.name = v.name);
```

### Step 2: Deploy Code to Beta

1. **Merge to beta branch** (if using separate branches)
   ```bash
   git checkout beta
   git merge category  # or your feature branch
   git push origin beta
   ```

2. **Deploy containers**
   ```bash
   ./exec.sh beta deploy-all
   ```

### Step 3: Apply Database Migration

1. **Copy migration script to beta server**
   ```bash
   scp migrate_tags_to_beta.sql searchable@cherry-interest.metalseed.net:/home/searchable/
   ```

2. **Apply migration**
   ```bash
   # SSH to beta
   ssh searchable@cherry-interest.metalseed.net
   
   # Apply migration
   docker exec -i searchable_postgres_1 psql -U searchable searchable < migrate_tags_to_beta.sql
   ```

### Step 4: Verify Migration

1. **Check tables were created**
   ```bash
   docker exec searchable_postgres_1 psql -U searchable searchable -c "\dt tags*"
   docker exec searchable_postgres_1 psql -U searchable searchable -c "\dt user_tags*"
   docker exec searchable_postgres_1 psql -U searchable searchable -c "\dt searchable_tags*"
   ```

2. **Verify tags were inserted**
   ```bash
   docker exec searchable_postgres_1 psql -U searchable searchable -c "SELECT COUNT(*), tag_type FROM tags GROUP BY tag_type;"
   ```

### Step 5: Run Tests

1. **Run tag-specific tests**
   ```bash
   ./exec.sh beta test --t test_tags_basic
   ./exec.sh beta test --t test_tags_comprehensive
   ```

2. **Run comprehensive tests**
   ```bash
   ./exec.sh beta test
   ```

### Step 6: Update Frontend Configuration

1. **Ensure frontend points to beta API**
   - Check `frontend/src/config.js` for correct beta API URL
   - Verify CORS settings allow beta domain

### Step 7: Post-Migration Verification

1. **Frontend Checks**
   - [ ] Login to beta site
   - [ ] Navigate to "Find Creators" tab
   - [ ] Verify tag filters appear and work
   - [ ] Test creator search with tags
   - [ ] Check user profiles display tags
   - [ ] Test content search with tags

2. **Backend Checks**
   - [ ] Profile endpoints return tags
   - [ ] Search endpoints filter by tags correctly
   - [ ] Tag management endpoints work

## Rollback Plan

If issues occur:

1. **Restore database backup**
   ```bash
   docker exec -i searchable_postgres_1 psql -U searchable searchable < backup_YYYYMMDD_HHMMSS.sql
   ```

2. **Revert code deployment**
   ```bash
   git checkout <previous-commit>
   ./exec.sh beta deploy-all
   ```

## Alternative: Fresh Deployment

If beta can be reset completely:

1. **Warning**: This will DELETE all existing data
   ```bash
   ./remote_db_cleanup.sh  # This deletes everything!
   ./exec.sh beta deploy-all
   ```

## Notes

- Beta domain: silkroadonlightning.com
- The migration is additive (new tables only), so existing functionality should not be affected
- User tag associations will be empty initially - users need to select their tags
- Searchable tag associations will be empty - content creators need to tag their items

## Support

For issues during migration:
1. Check container logs: `./exec.sh beta logs <container_name>`
2. Check database logs: `docker logs searchable_postgres_1`
3. Review nginx logs for API errors