CREATE TABLE IF NOT EXISTS searchables (
    searchable_id SERIAL PRIMARY KEY,
    searchable_data JSONB NOT NULL
);

-- Create GIN index on the latitude and longitude in the JSONB data
CREATE INDEX IF NOT EXISTS idx_searchables_coordinates ON searchables USING GIN ((searchable_data->'payloads'->'public'->>'latitude'), (searchable_data->'payloads'->'public'->>'longitude'));

-- Index for is_removed flag to quickly filter out removed items
CREATE INDEX IF NOT EXISTS idx_searchables_is_removed ON searchables ((searchable_data->>'is_removed'));


CREATE TABLE IF NOT EXISTS searchable_geo (
    searchable_id INTEGER NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    geohash TEXT NOT NULL,
    PRIMARY KEY (searchable_id),
    FOREIGN KEY (searchable_id) REFERENCES searchable_items(searchable_id) ON DELETE CASCADE
);

-- Index for geohash to improve search performance
CREATE INDEX IF NOT EXISTS idx_searchable_geo_geohash ON searchable_geo(geohash);

-- Index for coordinates to support direct lat/long queries
CREATE INDEX IF NOT EXISTS idx_searchable_geo_coords ON searchable_geo(latitude, longitude);
