#!/usr/bin/env python3
"""
Create user_profile records for existing users who don't have one
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api_server_flask.api.common.database import get_db_connection, execute_sql, Json
from datetime import datetime

def create_missing_user_profiles():
    """Create user_profile records for users who don't have one"""
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # Find users without a user_profile
        execute_sql(cur, """
            SELECT u.id, u.username 
            FROM users u
            LEFT JOIN user_profile up ON u.id = up.user_id
            WHERE up.id IS NULL
        """)
        
        users_without_profile = cur.fetchall()
        
        if not users_without_profile:
            print("All users already have user_profile records")
            return
        
        print(f"Found {len(users_without_profile)} users without profiles")
        
        # Create user_profile for each user
        created_count = 0
        for user_id, username in users_without_profile:
            try:
                execute_sql(cur,
                    """INSERT INTO user_profile (user_id, username, metadata) 
                       VALUES (%s, %s, %s)""",
                    params=(
                        user_id,
                        username,
                        Json({
                            "created_via": "migration",
                            "migration_date": datetime.utcnow().isoformat()
                        })
                    )
                )
                created_count += 1
                print(f"Created profile for user {user_id} ({username})")
            except Exception as e:
                print(f"Failed to create profile for user {user_id}: {e}")
        
        conn.commit()
        print(f"\nSuccessfully created {created_count} user profiles")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    create_missing_user_profiles()