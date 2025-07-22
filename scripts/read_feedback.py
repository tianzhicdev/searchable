#!/usr/bin/env python3
"""
Script for developers to read user feedback from the database
Usage: python read_feedback.py [--days N] [--user USER_ID] [--export FILE]
"""

import os
import sys
import json
import argparse
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from tabulate import tabulate

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database connection from environment
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    """Create database connection"""
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL environment variable not set")
        sys.exit(1)
    return psycopg2.connect(DATABASE_URL)

def format_timestamp(timestamp):
    """Format timestamp for display"""
    return timestamp.strftime('%Y-%m-%d %H:%M:%S')

def truncate_text(text, max_length=50):
    """Truncate text with ellipsis if too long"""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + '...'

def fetch_feedback(days=None, user_id=None):
    """Fetch feedback from database with optional filters"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Build query
        query = """
            SELECT 
                f.id,
                f.user_id,
                u.email as user_email,
                f.feedback,
                f.created_at,
                f.metadata
            FROM feedback f
            JOIN users u ON f.user_id = u.id
            WHERE 1=1
        """
        params = []
        
        # Add filters
        if days:
            query += " AND f.created_at >= %s"
            params.append(datetime.utcnow() - timedelta(days=days))
        
        if user_id:
            query += " AND f.user_id = %s"
            params.append(user_id)
        
        query += " ORDER BY f.created_at DESC"
        
        cur.execute(query, params)
        return cur.fetchall()
        
    finally:
        cur.close()
        conn.close()

def display_feedback_table(feedback_list):
    """Display feedback in a table format"""
    if not feedback_list:
        print("No feedback found.")
        return
    
    # Prepare table data
    table_data = []
    for fb in feedback_list:
        metadata = fb['metadata'] or {}
        viewport = metadata.get('viewport', 'N/A')
        page = metadata.get('currentPage', 'N/A')
        if page and len(page) > 40:
            page = '...' + page[-37:]
        
        table_data.append([
            fb['id'],
            fb['user_email'],
            format_timestamp(fb['created_at']),
            truncate_text(fb['feedback'], 60),
            viewport,
            page
        ])
    
    headers = ['ID', 'User Email', 'Created At', 'Feedback', 'Viewport', 'Page']
    print(tabulate(table_data, headers=headers, tablefmt='grid'))
    
    print(f"\nTotal feedback entries: {len(feedback_list)}")

def display_feedback_detailed(feedback_list):
    """Display feedback in detailed format"""
    if not feedback_list:
        print("No feedback found.")
        return
    
    for fb in feedback_list:
        print("\n" + "="*80)
        print(f"Feedback ID: {fb['id']}")
        print(f"User: {fb['user_email']} (ID: {fb['user_id']})")
        print(f"Created: {format_timestamp(fb['created_at'])}")
        
        metadata = fb['metadata'] or {}
        if metadata:
            print(f"Viewport: {metadata.get('viewport', 'N/A')}")
            page = metadata.get('currentPage', 'N/A')
            print(f"Page: {page}")
            if metadata.get('userAgent'):
                print(f"User Agent: {metadata['userAgent'][:80]}...")
        
        print(f"\nFeedback:")
        print("-" * 40)
        print(fb['feedback'])
    
    print("\n" + "="*80)
    print(f"Total feedback entries: {len(feedback_list)}")

def export_feedback(feedback_list, filename):
    """Export feedback to JSON file"""
    if not feedback_list:
        print("No feedback to export.")
        return
    
    # Convert datetime objects to strings
    export_data = []
    for fb in feedback_list:
        fb_copy = dict(fb)
        fb_copy['created_at'] = format_timestamp(fb['created_at'])
        export_data.append(fb_copy)
    
    with open(filename, 'w') as f:
        json.dump(export_data, f, indent=2)
    
    print(f"Exported {len(export_data)} feedback entries to {filename}")

def main():
    parser = argparse.ArgumentParser(description='Read user feedback from database')
    parser.add_argument('--days', type=int, help='Show feedback from last N days')
    parser.add_argument('--user', type=int, help='Show feedback from specific user ID')
    parser.add_argument('--export', help='Export feedback to JSON file')
    parser.add_argument('--detailed', action='store_true', help='Show detailed view')
    
    args = parser.parse_args()
    
    # Fetch feedback
    print("Fetching feedback from database...")
    feedback_list = fetch_feedback(days=args.days, user_id=args.user)
    
    # Export if requested
    if args.export:
        export_feedback(feedback_list, args.export)
    else:
        # Display feedback
        if args.detailed:
            display_feedback_detailed(feedback_list)
        else:
            display_feedback_table(feedback_list)

if __name__ == "__main__":
    main()