CREATE TABLE IF NOT EXISTS searchables (
    searchable_id SERIAL PRIMARY KEY,
    terminal_id INTEGER NOT NULL,
    searchable_data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS searchable_geo (
    searchable_id INTEGER NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    geohash TEXT NOT NULL,
    PRIMARY KEY (searchable_id),
    FOREIGN KEY (searchable_id) REFERENCES searchables(searchable_id) ON DELETE CASCADE
);

-- Index for geohash to improve search performance
CREATE INDEX IF NOT EXISTS idx_searchable_geo_geohash ON searchable_geo(geohash);

-- Index for coordinates to support direct lat/long queries
CREATE INDEX IF NOT EXISTS idx_searchable_geo_coords ON searchable_geo(latitude, longitude);

CREATE TABLE IF NOT EXISTS kv (
    type TEXT NOT NULL,
    pkey TEXT NOT NULL,
    fkey TEXT NOT NULL,
    data JSONB NOT NULL,
    PRIMARY KEY (type, pkey, fkey)
);
-- Index on type for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_type ON kv(type);


-- Index on pkey for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_pkey ON kv(pkey);

-- Index on fkey for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_fkey ON kv(fkey);


CREATE TABLE IF NOT EXISTS terminal (
    terminal_id SERIAL PRIMARY KEY,
    terminal_data JSONB NOT NULL
);

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

