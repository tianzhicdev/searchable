#!/usr/bin/env python3
"""
Script to insert random invite codes for promoters: marcus, tyler, sajan
Ensures codes are unique and non-repeating
"""

import random
import string
import json
import psycopg2
from psycopg2.extras import Json
import os
from datetime import datetime

# Database configuration - adjust these for your server
DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': os.environ.get('DB_PORT', '5432'),
    'database': os.environ.get('DB_NAME', 'searchable'),
    'user': os.environ.get('DB_USER', 'searchable'),
    'password': os.environ.get('DB_PASSWORD', 'searchable123')
}

# Promoters configuration
PROMOTERS = {
    'marcus': {
        'description': 'Marcus promotion - Get 5 USDT signup bonus',
        'codes_to_generate': 10
    },
    'tyler': {
        'description': 'Tyler promotion - Get 5 USDT signup bonus',
        'codes_to_generate': 10
    },
    'sajan': {
        'description': 'Sajan promotion - Get 5 USDT signup bonus',
        'codes_to_generate': 10
    }
}

def generate_random_code(length=6):
    """Generate a random 6-letter uppercase code"""
    return ''.join(random.choices(string.ascii_uppercase, k=length))

def get_existing_codes(conn):
    """Get all existing invite codes from the database"""
    cur = conn.cursor()
    cur.execute("SELECT code FROM invite_code")
    existing = set(row[0] for row in cur.fetchall())
    cur.close()
    return existing

def insert_invite_code(conn, code, promoter, description):
    """Insert a single invite code into the database"""
    cur = conn.cursor()
    metadata = {
        'promoter': promoter,
        'description': description,
        'created_at': datetime.utcnow().isoformat(),
        'created_by': 'promoter_script'
    }
    
    try:
        cur.execute(
            """INSERT INTO invite_code (code, active, metadata) 
               VALUES (%s, %s, %s) 
               ON CONFLICT (code) DO NOTHING
               RETURNING code""",
            (code, True, Json(metadata))
        )
        result = cur.fetchone()
        conn.commit()
        cur.close()
        return result is not None
    except Exception as e:
        conn.rollback()
        cur.close()
        print(f"Error inserting code {code}: {e}")
        return False

def main():
    """Main function to generate and insert codes"""
    print("Invite Code Generator for Promoters")
    print("=" * 50)
    
    # Connect to database
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to database")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        print("\nMake sure to set environment variables:")
        print("  export DB_HOST=your_host")
        print("  export DB_PORT=5432")
        print("  export DB_NAME=searchable")
        print("  export DB_USER=your_user")
        print("  export DB_PASSWORD=your_password")
        return
    
    # Get existing codes to avoid duplicates
    existing_codes = get_existing_codes(conn)
    print(f"📊 Found {len(existing_codes)} existing codes in database")
    
    # Track generated codes
    all_generated_codes = set(existing_codes)
    codes_by_promoter = {}
    
    # Generate codes for each promoter
    for promoter, config in PROMOTERS.items():
        print(f"\n🎯 Generating codes for {promoter}...")
        codes_by_promoter[promoter] = []
        
        codes_needed = config['codes_to_generate']
        attempts = 0
        max_attempts = codes_needed * 100  # Prevent infinite loop
        
        while len(codes_by_promoter[promoter]) < codes_needed and attempts < max_attempts:
            attempts += 1
            
            # Generate a unique code
            code = generate_random_code()
            
            # Ensure it's unique across all codes
            if code not in all_generated_codes:
                # Try to insert it
                if insert_invite_code(conn, code, promoter, config['description']):
                    codes_by_promoter[promoter].append(code)
                    all_generated_codes.add(code)
                    print(f"  ✅ Created code: {code}")
                else:
                    print(f"  ⚠️  Failed to insert code: {code}")
        
        if len(codes_by_promoter[promoter]) < codes_needed:
            print(f"  ⚠️  Only generated {len(codes_by_promoter[promoter])}/{codes_needed} codes")
        else:
            print(f"  ✅ Successfully generated {len(codes_by_promoter[promoter])} codes")
    
    # Print summary
    print("\n" + "=" * 50)
    print("Summary of Generated Codes")
    print("=" * 50)
    
    for promoter, codes in codes_by_promoter.items():
        print(f"\n{promoter.upper()} ({len(codes)} codes):")
        for code in sorted(codes):
            print(f"  - {code}")
    
    # Create a file with the generated codes
    output_file = f"promoter_codes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    output_data = {
        'generated_at': datetime.utcnow().isoformat(),
        'promoters': codes_by_promoter,
        'total_codes': sum(len(codes) for codes in codes_by_promoter.values())
    }
    
    with open(output_file, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n📄 Codes saved to: {output_file}")
    
    # Close database connection
    conn.close()
    print("\n✅ Done!")

if __name__ == "__main__":
    main()