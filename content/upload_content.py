#!/usr/bin/env python3
import os
import json
import sys
import requests
import time
from pathlib import Path

# API endpoints
ENDPOINTS = {
    'local': 'http://localhost:5005',
    'beta': 'https://beta.searchable.ai'
}

class ContentUploader:
    def __init__(self, env='local'):
        self.base_url = ENDPOINTS.get(env, ENDPOINTS['local'])
        self.session = requests.Session()
        
    def create_user(self, metadata):
        """Create a new user account"""
        try:
            # Register user
            register_data = {
                'email': metadata['email'],
                'password': metadata['password'],
                'username': metadata['user_name']
            }
            
            resp = self.session.post(
                f"{self.base_url}/api/users/register",
                json=register_data
            )
            
            if resp.status_code == 200:
                print(f"Created user: {metadata['user_name']}")
                # Extract access token from registration response if available
                data = resp.json()
                if 'token' in data:
                    self.session.headers['Authorization'] = data['token']
                elif 'access_token' in data:
                    self.session.headers['Authorization'] = data['access_token']
                else:
                    # Need to login after registration
                    return self.login_user(metadata['email'], metadata['password'])
                return True
            else:
                response_data = resp.json() if resp.headers.get('content-type', '').startswith('application/json') else {}
                if resp.status_code == 409 or (response_data.get('msg', '').lower().find('already taken') >= 0):
                    print(f"User already exists: {metadata['user_name']}")
                    # Try to login
                    return self.login_user(metadata['email'], metadata['password'])
                else:
                    print(f"Failed to create user: {resp.text}")
                    return False
                
        except Exception as e:
            print(f"Error creating user: {e}")
            return False
    
    def login_user(self, email, password):
        """Login as user"""
        try:
            login_data = {
                'email': email,
                'password': password
            }
            
            resp = self.session.post(
                f"{self.base_url}/api/users/login",
                json=login_data
            )
            
            if resp.status_code == 200:
                data = resp.json()
                if 'token' in data:
                    self.session.headers['Authorization'] = data['token']
                    print(f"Logged in as: {email}")
                    return True
                else:
                    print(f"No token in login response: {data}")
                    return False
            else:
                print(f"Failed to login: {resp.text}")
                return False
                
        except Exception as e:
            print(f"Error logging in: {e}")
            return False
    
    def update_user_profile(self, metadata, gallery_image_ids=None):
        """Update user profile description"""
        try:
            profile_data = {
                'introduction': metadata['user_description']
            }
            
            # Add gallery images to metadata if provided
            if gallery_image_ids:
                profile_data['metadata'] = {
                    'additional_images': gallery_image_ids
                }
            
            resp = self.session.put(
                f"{self.base_url}/api/v1/profile",
                json=profile_data
            )
            
            if resp.status_code == 200:
                print("Updated user profile")
                return True
            else:
                print(f"Failed to update profile: {resp.text}")
                return False
                
        except Exception as e:
            print(f"Error updating profile: {e}")
            return False
    
    def upload_gallery_image(self, image_path):
        """Upload image to user gallery"""
        try:
            with open(image_path, 'rb') as f:
                files = {'file': (os.path.basename(image_path), f, 'image/jpeg')}
                resp = self.session.post(
                    f"{self.base_url}/api/v1/files/upload",
                    files=files
                )
                
            if resp.status_code == 200:
                data = resp.json()
                file_id = data['file_id']
                print(f"Uploaded gallery image: {os.path.basename(image_path)}")
                return file_id
            else:
                print(f"Failed to upload gallery image: {resp.text}")
                return None
                
        except Exception as e:
            print(f"Error uploading gallery image: {e}")
            return None
    
    def create_searchable(self, metadata, music_dir):
        """Create a searchable item with music files"""
        try:
            # First, upload cover images
            image_ids = []
            for i in range(1, 4):
                img_path = os.path.join(music_dir, f'cover_{i}.jpg')
                if os.path.exists(img_path):
                    with open(img_path, 'rb') as f:
                        files = {'file': (f'cover_{i}.jpg', f, 'image/jpeg')}
                        resp = self.session.post(
                            f"{self.base_url}/api/v1/files/upload",
                            files=files
                        )
                        
                    if resp.status_code == 200:
                        data = resp.json()
                        image_ids.append(data['file_id'])
                        print(f"Uploaded searchable image: cover_{i}.jpg")
            
            # Upload music files
            file_ids = []
            for music_file in metadata.get('files', [])[:5]:  # Limit to first 5 files
                file_path = os.path.join(music_dir, music_file)
                if os.path.exists(file_path):
                    file_size = os.path.getsize(file_path)
                    if file_size > 50 * 1024 * 1024:  # Skip files > 50MB
                        print(f"Skipping large file: {music_file}")
                        continue
                        
                    with open(file_path, 'rb') as f:
                        files = {'file': (music_file, f, 'audio/mpeg')}
                        resp = self.session.post(
                            f"{self.base_url}/api/v1/files/upload",
                            files=files
                        )
                        
                    if resp.status_code == 200:
                        data = resp.json()
                        file_ids.append(data['file_id'])
                        print(f"Uploaded music file: {music_file}")
                    
                    time.sleep(0.5)  # Rate limiting
            
            # Create searchable item with proper payload structure
            searchable_data = {
                'payloads': {
                    'public': {
                        'type': 'downloadable',
                        'title': metadata['item_title'],
                        'description': metadata['item_description'],
                        'category': 'music',
                        'price': 0.99,
                        'currency': 'usd',
                        'file_ids': file_ids,
                        'image_ids': image_ids
                    }
                }
            }
            
            resp = self.session.post(
                f"{self.base_url}/api/v1/searchable/create",
                json=searchable_data
            )
            
            if resp.status_code == 201:
                data = resp.json()
                searchable_id = data.get('searchable_id') or data.get('id')
                print(f"Created searchable: {metadata['item_title']} (ID: {searchable_id})")
                return searchable_id
            else:
                print(f"Failed to create searchable: {resp.text}")
                return None
                
        except Exception as e:
            print(f"Error creating searchable: {e}")
            return None
    
    def upload_directory(self, music_dir):
        """Upload content from a music directory"""
        metadata_path = os.path.join(music_dir, 'metadata.json')
        
        if not os.path.exists(metadata_path):
            print(f"No metadata.json found in {music_dir}")
            return False
        
        # Load metadata
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        print(f"\nProcessing: {os.path.basename(music_dir)}")
        print("=" * 50)
        
        # Create user
        if not self.create_user(metadata):
            print("Failed to create/login user, skipping...")
            return False
        
        # Upload gallery images
        gallery_image_ids = []
        for i in range(1, 4):
            img_path = os.path.join(music_dir, f'cover_{i}.jpg')
            if os.path.exists(img_path):
                image_id = self.upload_gallery_image(img_path)
                if image_id:
                    gallery_image_ids.append(image_id)
        
        # Update profile with gallery images
        self.update_user_profile(metadata, gallery_image_ids)
        
        # Create searchable with music
        searchable_id = self.create_searchable(metadata, music_dir)
        
        if searchable_id:
            print(f"Successfully uploaded content for: {metadata['item_title']}")
            return True
        else:
            print(f"Failed to upload content for: {metadata['item_title']}")
            return False

def main():
    if len(sys.argv) < 2:
        print("Usage: ./upload_content.py [local|beta]")
        sys.exit(1)
    
    env = sys.argv[1]
    if env not in ['local', 'beta']:
        print("Environment must be 'local' or 'beta'")
        sys.exit(1)
    
    uploader = ContentUploader(env)
    music_root = "content/music"
    
    if not os.path.exists(music_root):
        print(f"Music directory not found: {music_root}")
        return
    
    # Process each subdirectory
    success_count = 0
    for item in sorted(os.listdir(music_root)):
        item_path = os.path.join(music_root, item)
        if os.path.isdir(item_path) and not item.startswith('.'):
            if uploader.upload_directory(item_path):
                success_count += 1
            time.sleep(2)  # Rate limiting between directories
    
    print(f"\n{'='*50}")
    print(f"Upload complete! Successfully uploaded {success_count} items to {env}")

if __name__ == "__main__":
    main()