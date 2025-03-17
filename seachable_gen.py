import requests
import random
import json
import time
from faker import Faker

# Initialize Faker for generating realistic data
fake = Faker()

# API endpoint
API_URL = "https://localhost:443/api/searchable"

# Number of items to generate
NUM_ITEMS = 100000

# Disable SSL warnings (for development only)
requests.packages.urllib3.disable_warnings(requests.packages.urllib3.exceptions.InsecureRequestWarning)

def generate_random_location():
    # Generate random coordinates within reasonable bounds
    # These bounds roughly cover the United States
    lat = random.uniform(24.396308, 49.384358)
    lng = random.uniform(-125.000000, -66.934570)
    return lat, lng

def generate_random_data():
    lat, lng = generate_random_location()
    
    # Create a random searchable item
    data = {
        "name": fake.company(),
        "description": fake.catch_phrase(),
        "address": fake.address(),
        "phone": fake.phone_number(),
        "website": fake.url(),
        "email": fake.email(),
        "category": random.choice(["restaurant", "retail", "service", "entertainment", "healthcare"]),
        "tags": random.sample(["family-friendly", "open-late", "takeout", "delivery", "outdoor-seating", 
                              "pet-friendly", "wifi", "parking", "accessible"], k=random.randint(1, 5)),
        "price_level": random.randint(1, 4),
        "rating": round(random.uniform(1.0, 5.0), 1),
        "latitude": lat,
        "longitude": lng,
        "created_at": fake.date_time_this_year().isoformat()
    }
    
    return data

def main():
    success_count = 0
    failure_count = 0
    
    print(f"Starting to generate {NUM_ITEMS} searchable items...")
    
    start_time = time.time()
    
    for i in range(NUM_ITEMS):
        data = generate_random_data()
        
        try:
            # Send POST request to API
            response = requests.post(
                API_URL, 
                json=data,
                verify=False  # Disable SSL verification (for development only)
            )
            
            if response.status_code == 201:
                success_count += 1
            else:
                failure_count += 1
                print(f"Failed to create item {i+1}: {response.text}")
                
        except Exception as e:
            failure_count += 1
            print(f"Error creating item {i+1}: {str(e)}")
        
        # Print progress every 100 items
        if (i + 1) % 100 == 0:
            elapsed = time.time() - start_time
            items_per_second = (i + 1) / elapsed
            print(f"Progress: {i+1}/{NUM_ITEMS} items created ({items_per_second:.2f} items/sec)")
    
    total_time = time.time() - start_time
    print(f"\nGeneration complete!")
    print(f"Successfully created: {success_count} items")
    print(f"Failed to create: {failure_count} items")
    print(f"Total time: {total_time:.2f} seconds")
    print(f"Average rate: {NUM_ITEMS/total_time:.2f} items/second")

if __name__ == "__main__":
    main()
