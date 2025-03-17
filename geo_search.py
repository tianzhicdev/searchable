import psycopg2
import random
import geohash2
from math import radians, sin, cos, sqrt, atan2

# Database connection parameters
DB_PARAMS = {
    "dbname": "postgres",
    "user": "abc",
    "password": "12345",
    "host": "localhost",
    "port": "3005"
}

def connect_to_db():
    """Connect to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def create_table(conn):
    """Create the geo_locations table if it doesn't exist"""
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS geo_locations (
        searchable_id INTEGER PRIMARY KEY,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        geohash TEXT NOT NULL
    );
    
    -- Index for geohash to improve search performance
    CREATE INDEX IF NOT EXISTS idx_geo_locations_geohash ON geo_locations(geohash);
    
    -- Index for coordinates to support direct lat/long queries
    CREATE INDEX IF NOT EXISTS idx_geo_locations_coords ON geo_locations(latitude, longitude);
    """)
    conn.commit()
    cursor.close()

def generate_random_location():
    """Generate a random latitude and longitude"""
    # Valid latitude range: -90 to 90
    latitude = random.uniform(-90, 90)
    # Valid longitude range: -180 to 180
    longitude = random.uniform(-180, 180)
    # Generate geohash with precision 9
    geo_hash = geohash2.encode(latitude, longitude, precision=9)
    return latitude, longitude, geo_hash

def insert_random_locations(conn, count=100):
    """Insert random locations into the geo_locations table"""
    cursor = conn.cursor()
    
    # Check if there are already records in the table
    cursor.execute("SELECT COUNT(*) FROM geo_locations")
    existing_count = cursor.fetchone()[0]
    
    for i in range(count):
        searchable_id = existing_count + i + 1
        latitude, longitude, geo_hash = generate_random_location()
        
        cursor.execute(
            "INSERT INTO geo_locations (searchable_id, latitude, longitude, geohash) VALUES (%s, %s, %s, %s)",
            (searchable_id, latitude, longitude, geo_hash)
        )
    
    conn.commit()
    cursor.close()
    print(f"Inserted {count} random locations into the database")

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    # Radius of earth in kilometers
    r = 6371
    return c * r

def find_closest_locations(conn, latitude, longitude, limit=10, precision=5):
    """
    Find the closest locations to the given latitude and longitude using geohash
    
    Parameters:
    conn -- database connection
    latitude -- target latitude
    longitude -- target longitude
    limit -- maximum number of results to return
    precision -- geohash prefix length to use (3: ~20km, 4: ~5km, 5: ~2.4km)
    """
    cursor = conn.cursor()
    
    # Generate geohash for the target location
    target_geohash = geohash2.encode(latitude, longitude, precision=9)
    # Log the target geohash for debugging purposes
    print(f"Target geohash: {target_geohash} (precision={precision})")
    
    locations = []
    
    # Start with initial precision and reduce until we have enough locations
    current_precision = precision
    while len(locations) < limit and current_precision > 0:
        # Query locations with matching geohash prefix
        cursor.execute(
            "SELECT searchable_id, latitude, longitude, geohash FROM geo_locations WHERE geohash LIKE %s",
            (target_geohash[:current_precision] + '%',)
        )
        locations = cursor.fetchall()
        print(f"Found {len(locations)} locations with precision {current_precision}")
        
        # Reduce precision if we need more locations
        if len(locations) < limit:
            current_precision -= 1
    
    # If we still don't have enough locations, get all locations
    if len(locations) < limit:
        cursor.execute("SELECT searchable_id, latitude, longitude, geohash FROM geo_locations")
        locations = cursor.fetchall()
    
    # Calculate distance for each location
    locations_with_distance = []
    for loc in locations:
        searchable_id, lat, lon, geohash = loc
        distance = haversine_distance(latitude, longitude, lat, lon)
        locations_with_distance.append((searchable_id, lat, lon, geohash, distance))
    
    # Sort by distance and get the closest ones
    closest_locations = sorted(locations_with_distance, key=lambda x: x[4])[:limit]
    
    cursor.close()
    return closest_locations

def main():
    # Connect to the database
    conn = connect_to_db()
    if not conn:
        return
    
    # Create table if it doesn't exist
    create_table(conn)
    
    # Insert random locations
    insert_random_locations(conn, 1000000) # 1 million locations
    
    # Example: Find closest locations to a specific point
    test_latitude = 40.7128  # New York City latitude
    test_longitude = -74.0060  # New York City longitude
    
    print(f"\nFinding 10 closest locations to ({test_latitude}, {test_longitude}):")
    closest = find_closest_locations(conn, test_latitude, test_longitude)
    
    print("\nClosest locations:")
    print("ID\tLatitude\tLongitude\tGeohash\t\tDistance (km)")
    print("-" * 70)
    for loc in closest:
        searchable_id, lat, lon, geohash, distance = loc
        print(f"{searchable_id}\t{lat:.6f}\t{lon:.6f}\t{geohash}\t{distance:.2f}")
    
    # Close the connection
    conn.close()

if __name__ == "__main__":
    main()
