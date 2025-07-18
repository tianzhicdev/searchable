#!/usr/bin/env python3
import os
import json
import re
import sys
import time
from pathlib import Path
import requests
from urllib.parse import quote
import subprocess

def clean_filename(filename):
    """Extract clean song and artist info from filename"""
    # Remove file extension
    name = os.path.splitext(filename)[0]
    # Remove track numbers like "01. " or "1 - "
    name = re.sub(r'^\d+[\.\-\s]+', '', name)
    # Try to extract artist and song
    if ' - ' in name:
        parts = name.split(' - ', 1)
        return parts[0].strip(), parts[1].strip()
    return None, name.strip()

def search_music_info(artist, album, songs):
    """Search for music information online"""
    try:
        # Search using MusicBrainz API (free and no key required)
        search_query = f"{artist} {album}" if artist else album
        url = f"https://musicbrainz.org/ws/2/release/?query={quote(search_query)}&fmt=json&limit=1"
        
        headers = {'User-Agent': 'MusicMetadataGenerator/1.0'}
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('releases'):
                release = data['releases'][0]
                artist_credit = release.get('artist-credit', [{}])[0]
                artist_name = artist_credit.get('name', artist or album)
                
                # Get more artist info
                if artist_credit.get('artist', {}).get('id'):
                    artist_id = artist_credit['artist']['id']
                    artist_url = f"https://musicbrainz.org/ws/2/artist/{artist_id}?fmt=json"
                    artist_response = requests.get(artist_url, headers=headers)
                    if artist_response.status_code == 200:
                        artist_data = artist_response.json()
                        artist_description = artist_data.get('disambiguation', '')
                        if not artist_description and artist_data.get('type'):
                            artist_description = f"{artist_data['type']} musician"
                    else:
                        artist_description = "Electronic music artist"
                else:
                    artist_description = "Independent music artist"
                
                return {
                    'artist': artist_name,
                    'album': release.get('title', album),
                    'description': f"Album by {artist_name}",
                    'artist_description': artist_description
                }
        
        # Fallback if API fails
        return {
            'artist': artist or album,
            'album': album,
            'description': f"Music album featuring {len(songs)} tracks",
            'artist_description': "Independent music artist"
        }
        
    except Exception as e:
        print(f"Error searching music info: {e}")
        return {
            'artist': artist or album,
            'album': album,
            'description': f"Music collection with {len(songs)} tracks",
            'artist_description': "Music artist"
        }

def download_album_art(music_dir, artist, album):
    """Download album artwork using iTunes API"""
    try:
        # Search iTunes for album art
        search_query = f"{artist} {album}".replace(' ', '+')
        url = f"https://itunes.apple.com/search?term={search_query}&entity=album&limit=1"
        
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if data.get('results'):
                artwork_url = data['results'][0].get('artworkUrl100', '')
                if artwork_url:
                    # Get higher resolution
                    artwork_url = artwork_url.replace('100x100', '600x600')
                    
                    # Download images
                    for i, size in enumerate(['600x600', '300x300', '150x150']):
                        img_url = artwork_url.replace('600x600', size)
                        img_path = os.path.join(music_dir, f'cover_{i+1}.jpg')
                        
                        img_response = requests.get(img_url)
                        if img_response.status_code == 200:
                            with open(img_path, 'wb') as f:
                                f.write(img_response.content)
                            print(f"Downloaded cover image: {img_path}")
                    return True
        
        # Fallback: create placeholder images using ImageMagick
        for i in range(3):
            size = 600 - (i * 200)
            img_path = os.path.join(music_dir, f'cover_{i+1}.jpg')
            color = ['#2196F3', '#4CAF50', '#FF9800'][i]
            text = album[:20] + '...' if len(album) > 20 else album
            
            cmd = [
                'convert', '-size', f'{size}x{size}', f'xc:{color}',
                '-gravity', 'center', '-pointsize', '48', '-fill', 'white',
                '-annotate', '+0+0', text,
                img_path
            ]
            
            try:
                subprocess.run(cmd, check=True, capture_output=True)
                print(f"Created placeholder image: {img_path}")
            except:
                pass
                
    except Exception as e:
        print(f"Error downloading album art: {e}")

def generate_metadata_for_directory(music_dir):
    """Generate metadata.json for a music directory"""
    dir_name = os.path.basename(music_dir)
    metadata_path = os.path.join(music_dir, 'metadata.json')
    
    # Skip if metadata already exists and has images
    if os.path.exists(metadata_path):
        has_images = any(os.path.exists(os.path.join(music_dir, f'cover_{i}.jpg')) for i in range(1, 4))
        if has_images:
            print(f"Metadata and images already exist for {dir_name}, skipping...")
            return
    
    # Get all music files
    music_files = []
    for file in os.listdir(music_dir):
        if file.endswith(('.mp3', '.flac', '.wav', '.m4a')):
            music_files.append(file)
    
    if not music_files:
        print(f"No music files found in {dir_name}")
        return
    
    # Extract artist info from first file
    artist, song = clean_filename(music_files[0])
    
    # Search for album info
    print(f"Searching info for: {dir_name}")
    time.sleep(1)  # Rate limiting for API
    music_info = search_music_info(artist, dir_name, music_files)
    
    # Create username from artist name
    username = re.sub(r'[^a-zA-Z0-9]', '', music_info['artist'].lower())[:20]
    
    # If username is empty after cleaning, use directory name
    if not username:
        username = re.sub(r'[^a-zA-Z0-9]', '', dir_name.lower())[:20]
    
    # If still empty, use a default
    if not username:
        username = f"artist{hash(dir_name) % 10000}"
    
    # Generate metadata
    metadata = {
        "item_title": music_info['album'],
        "item_description": music_info['description'],
        "user_name": username,
        "user_description": music_info['artist_description'],
        "email": f"{username}@ec.com",
        "password": f"{username}123!",
        "artist": music_info['artist'],
        "track_count": len(music_files),
        "files": [f for f in music_files]
    }
    
    # Save metadata
    with open(metadata_path, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    print(f"Generated metadata for {dir_name}")
    
    # Download album artwork
    download_album_art(music_dir, music_info['artist'], music_info['album'])

def main():
    music_root = "content/music"
    
    if not os.path.exists(music_root):
        print(f"Music directory not found: {music_root}")
        return
    
    # Process each subdirectory
    for item in os.listdir(music_root):
        item_path = os.path.join(music_root, item)
        if os.path.isdir(item_path) and not item.startswith('.'):
            generate_metadata_for_directory(item_path)

if __name__ == "__main__":
    main()