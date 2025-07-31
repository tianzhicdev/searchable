#!/usr/bin/env python3
"""
Feedback lookup script for Searchable project
Retrieves all feedback entries from the database
"""

import sys
import os
import psycopg2
import psycopg2.extras
from datetime import datetime
import json


def get_db_connection():
    """Get database connection from environment"""
    # Use the same connection params as the Flask app
    db_host = os.environ.get('DB_HOST', 'db')
    db_port = os.environ.get('DB_PORT', '5432')
    db_name = os.environ.get('DB_NAME', 'searchable')
    db_user = os.environ.get('DB_USERNAME', 'searchable')
    db_pass = os.environ.get('DB_PASSWORD', '19901228')
    
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_pass
        )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)


def lookup_feedback():
    """Look up all feedback entries"""
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    print(f"\n{'='*80}")
    print(f"FEEDBACK REPORT")
    print(f"{'='*80}\n")
    
    # Get all feedback entries
    cur.execute("""
        SELECT f.*, u.username, u.email
        FROM feedback f
        LEFT JOIN users u ON f.user_id = u.id
        ORDER BY f.created_at DESC
    """)
    
    feedback_entries = cur.fetchall()
    
    if not feedback_entries:
        print("No feedback entries found.")
        cur.close()
        conn.close()
        return
    
    print(f"Total feedback entries: {len(feedback_entries)}\n")
    
    # Display all feedback entries
    for i, entry in enumerate(feedback_entries, 1):
        print(f"\n{'='*60}")
        print(f"FEEDBACK ENTRY #{i}")
        print(f"{'='*60}")
        
        print(f"ID: {entry['id']}")
        print(f"Created: {entry['created_at']}")
        print(f"User: {entry['username']} (ID: {entry['user_id']}, Email: {entry['email']})")
        
        print(f"\nFeedback:")
        print("-" * 40)
        print(entry['feedback'])
        print("-" * 40)
        
        if entry['metadata'] and entry['metadata'] != {}:
            print(f"\nMetadata:")
            print(json.dumps(entry['metadata'], indent=2))
    
    # Summary statistics
    print(f"\n\n{'='*80}")
    print("SUMMARY STATISTICS")
    print(f"{'='*80}\n")
    
    print(f"Total feedback entries: {len(feedback_entries)}")
    
    # Count by user
    cur.execute("""
        SELECT u.username, u.id, COUNT(*) as feedback_count
        FROM feedback f
        JOIN users u ON f.user_id = u.id
        GROUP BY u.id, u.username
        ORDER BY feedback_count DESC
    """)
    user_stats = cur.fetchall()
    
    if user_stats:
        print(f"\nFeedback by user:")
        for stat in user_stats:
            print(f"  - {stat['username']} (ID: {stat['id']}): {stat['feedback_count']} entries")
    
    # Recent feedback (last 7 days)
    cur.execute("""
        SELECT COUNT(*) 
        FROM feedback 
        WHERE created_at > NOW() - INTERVAL '7 days'
    """)
    recent_count = cur.fetchone()[0]
    print(f"\nRecent feedback (last 7 days): {recent_count}")
    
    # Recent feedback (last 30 days)
    cur.execute("""
        SELECT COUNT(*) 
        FROM feedback 
        WHERE created_at > NOW() - INTERVAL '30 days'
    """)
    month_count = cur.fetchone()[0]
    print(f"Recent feedback (last 30 days): {month_count}")
    
    # Feedback by month
    cur.execute("""
        SELECT 
            DATE_TRUNC('month', created_at) as month,
            COUNT(*) as count
        FROM feedback
        GROUP BY month
        ORDER BY month DESC
        LIMIT 6
    """)
    monthly_stats = cur.fetchall()
    
    if monthly_stats:
        print(f"\nFeedback by month (last 6 months):")
        for stat in monthly_stats:
            month_str = stat['month'].strftime("%Y-%m")
            print(f"  - {month_str}: {stat['count']} entries")
    
    # Sample of recent feedback
    print(f"\n\nMOST RECENT FEEDBACK (last 5 entries):")
    print("="*80)
    
    for i, entry in enumerate(feedback_entries[:5], 1):
        print(f"\n{i}. User: {entry['username']} | Date: {entry['created_at'].strftime('%Y-%m-%d %H:%M')}")
        feedback_preview = entry['feedback'][:200] + "..." if len(entry['feedback']) > 200 else entry['feedback']
        print(f"   {feedback_preview}")
    
    print(f"\n{'='*80}\n")
    
    cur.close()
    conn.close()


if __name__ == "__main__":
    try:
        lookup_feedback()
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)