CREATE TABLE IF NOT EXISTS searchable (
    searchable_id INTEGER PRIMARY KEY,
    searchable_data JSONB NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    geohash TEXT NOT NULL
);

-- Index for geohash to improve search performance
CREATE INDEX IF NOT EXISTS idx_searchable_geohash ON searchable(geohash);

-- Index for coordinates to support direct lat/long queries
CREATE INDEX IF NOT EXISTS idx_searchable_coords ON searchable(latitude, longitude);
