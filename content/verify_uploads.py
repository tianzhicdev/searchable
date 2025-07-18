#!/usr/bin/env python3
import requests
import sys

def verify_uploads(env='local'):
    base_url = 'http://localhost:5005' if env == 'local' else 'https://beta.searchable.ai'
    
    print(f"Verifying uploads on {env} environment...")
    print("=" * 60)
    
    # List of users we created
    users = [
        ('nilsfrahm@ec.com', 'nilsfrahm123!'),
        ('tenniscoats@ec.com', 'tenniscoats123!'),
        ('parkhyejin@ec.com', 'parkhyejin123!'),
        ('radioinsane@ec.com', 'radioinsane123!'),
        ('ichikoaoba@ec.com', 'ichikoaoba123!'),
        ('soapskin@ec.com', 'soapskin123!'),
        ('artist94@ec.com', 'artist94123!')
    ]
    
    total_searchables = 0
    
    for email, password in users:
        # Login
        resp = requests.post(
            f"{base_url}/api/users/login",
            json={'email': email, 'password': password}
        )
        
        if resp.status_code == 200:
            data = resp.json()
            token = data.get('token')
            username = data.get('user', {}).get('username', email.split('@')[0])
            
            # Get user's searchables
            headers = {'Authorization': token}
            search_resp = requests.get(
                f"{base_url}/api/v1/searchable/search",
                params={'query': username},
                headers=headers
            )
            
            if search_resp.status_code == 200:
                searchables = search_resp.json().get('searchables', [])
                print(f"\n{username}: {len(searchables)} searchables")
                for s in searchables:
                    print(f"  - {s.get('title', 'Untitled')} (ID: {s.get('searchable_id')})")
                total_searchables += len(searchables)
            else:
                print(f"\n{username}: Failed to get searchables")
        else:
            print(f"\n{email}: Failed to login")
    
    print(f"\n{'='*60}")
    print(f"Total searchables uploaded: {total_searchables}")

if __name__ == "__main__":
    env = sys.argv[1] if len(sys.argv) > 1 else 'local'
    verify_uploads(env)