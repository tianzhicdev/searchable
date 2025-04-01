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

-- Index on pkey for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_pkey ON kv(pkey);

-- Index on fkey for faster lookups
CREATE INDEX IF NOT EXISTS idx_kv_fkey ON kv(fkey);


CREATE TABLE IF NOT EXISTS terminal (
    terminal_id SERIAL PRIMARY KEY,
    terminal_data JSONB NOT NULL
);
