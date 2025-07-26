#!/usr/bin/env python3
"""
User lookup script for Searchable project
Retrieves comprehensive information about a user including:
- User profile
- Searchables (items posted)
- Invoices (as buyer and seller)
- Payments
- Withdrawals
- Ratings (given and received)
- Invoice notes
"""

import sys
import os
import psycopg2
import psycopg2.extras
from datetime import datetime
from decimal import Decimal


def get_db_connection():
    """Get database connection from environment or docker container"""
    # Try to get from environment first
    db_host = os.environ.get('DB_HOST', 'localhost')
    db_port = os.environ.get('DB_PORT', '5433')
    db_name = os.environ.get('DB_NAME', 'searchable')
    db_user = os.environ.get('DB_USER', 'searchable')
    db_pass = os.environ.get('DB_PASS', '19901228')
    
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


def format_currency(amount):
    """Format currency values"""
    if amount is None:
        return "$0.00"
    return f"${float(amount):.2f}"


def lookup_user(user_id):
    """Look up all information about a user"""
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    print(f"\n{'='*60}")
    print(f"USER LOOKUP: User ID {user_id}")
    print(f"{'='*60}\n")
    
    # 1. User Profile
    print("USER PROFILE:")
    print("-" * 40)
    cur.execute("""
        SELECT up.*, u.username, u.email, u.date_joined
        FROM user_profile up
        RIGHT JOIN users u ON u.id = up.user_id
        WHERE u.id = %s
    """, (user_id,))
    
    user_profile = cur.fetchone()
    
    if not user_profile:
        print(f"❌ User with ID {user_id} not found!")
        return
    
    # Extract user info
    print(f"Username: {user_profile['username']}")
    print(f"Email: {user_profile['email']}")
    print(f"Joined: {user_profile['date_joined']}")
    if user_profile['id'] is not None:  # profile exists
        print(f"Profile Image: {user_profile['profile_image_url'] or 'Not set'}")
        print(f"Introduction: {user_profile['introduction'] or 'Not set'}")
    else:
        print(f"Profile: Not created")
    
    # 2. Searchables (Items Posted)
    print(f"\n\nSEARCHABLES (Items Posted):")
    print("-" * 40)
    cur.execute("""
        SELECT searchable_id, type, searchable_data, removed, created_at
        FROM searchables
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    
    searchables = cur.fetchall()
    
    if searchables:
        for s in searchables:
            data = s['searchable_data']
            print(f"\n  ID: {s['searchable_id']} | Type: {s['type']} | Removed: {s['removed']}")
            print(f"  Created: {s['created_at']}")
            print(f"  Title: {data.get('title', 'N/A')}")
            print(f"  Price: {format_currency(data.get('price', 0))}")
            desc = data.get('description', 'N/A')
            if len(desc) > 100:
                desc = desc[:100] + "..."
            print(f"  Description: {desc}")
    else:
        print("  No searchables found")
    
    # 3. Invoices as Buyer
    print(f"\n\nINVOICES AS BUYER:")
    print("-" * 40)
    cur.execute("""
        SELECT i.*, p.status as payment_status, s.searchable_data->>'title' as item_title
        FROM invoice i
        LEFT JOIN payment p ON i.id = p.invoice_id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE i.buyer_id = %s
        ORDER BY i.created_at DESC
    """, (user_id,))
    
    buyer_invoices = cur.fetchall()
    
    if buyer_invoices:
        for inv in buyer_invoices:
            print(f"\n  Invoice ID: {inv['id']} | Searchable: {inv['searchable_id']}")
            print(f"  Item: {inv['item_title'] or 'Unknown'}")
            print(f"  Seller ID: {inv['seller_id']}")
            print(f"  Amount: {format_currency(inv['amount'])} | Fee: {format_currency(inv['fee'])}")
            print(f"  Type: {inv['type']} | Status: {inv['payment_status'] or 'pending'}")
            print(f"  Created: {inv['created_at']}")
    else:
        print("  No purchases found")
    
    # 4. Invoices as Seller
    print(f"\n\nINVOICES AS SELLER:")
    print("-" * 40)
    cur.execute("""
        SELECT i.*, p.status as payment_status, s.searchable_data->>'title' as item_title
        FROM invoice i
        LEFT JOIN payment p ON i.id = p.invoice_id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE i.seller_id = %s
        ORDER BY i.created_at DESC
    """, (user_id,))
    
    seller_invoices = cur.fetchall()
    
    if seller_invoices:
        for inv in seller_invoices:
            print(f"\n  Invoice ID: {inv['id']} | Searchable: {inv['searchable_id']}")
            print(f"  Item: {inv['item_title'] or 'Unknown'}")
            print(f"  Buyer ID: {inv['buyer_id']}")
            print(f"  Amount: {format_currency(inv['amount'])} | Fee: {format_currency(inv['fee'])}")
            print(f"  Type: {inv['type']} | Status: {inv['payment_status'] or 'pending'}")
            print(f"  Created: {inv['created_at']}")
    else:
        print("  No sales found")
    
    # 5. Withdrawals
    print(f"\n\nWITHDRAWALS:")
    print("-" * 40)
    cur.execute("""
        SELECT * FROM withdrawal
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    
    withdrawals = cur.fetchall()
    
    if withdrawals:
        for w in withdrawals:
            print(f"\n  Withdrawal ID: {w['id']}")
            print(f"  Amount: {format_currency(w['amount'])} | Fee: {format_currency(w['fee'])}")
            print(f"  Type: {w['type']} | Status: {w['status']}")
            print(f"  Created: {w['created_at']}")
    else:
        print("  No withdrawals found")
    
    # 6. Ratings Given
    print(f"\n\nRATINGS GIVEN:")
    print("-" * 40)
    cur.execute("""
        SELECT r.*, i.searchable_id, s.searchable_data->>'title' as item_title
        FROM rating r
        JOIN invoice i ON r.invoice_id = i.id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE r.user_id = %s
        ORDER BY r.created_at DESC
    """, (user_id,))
    
    ratings_given = cur.fetchall()
    
    if ratings_given:
        for r in ratings_given:
            print(f"\n  Rating ID: {r['id']} | Invoice: {r['invoice_id']}")
            print(f"  Item: {r['item_title'] or 'Unknown'}")
            print(f"  Rating: {'⭐' * int(r['rating'])} ({r['rating']}/5)")
            print(f"  Review: {r['review'] or 'No review'}")
            print(f"  Created: {r['created_at']}")
    else:
        print("  No ratings given")
    
    # 7. Ratings Received (as seller)
    print(f"\n\nRATINGS RECEIVED:")
    print("-" * 40)
    cur.execute("""
        SELECT r.*, i.searchable_id, s.searchable_data->>'title' as item_title, i.buyer_id
        FROM rating r
        JOIN invoice i ON r.invoice_id = i.id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE i.seller_id = %s AND r.user_id != %s
        ORDER BY r.created_at DESC
    """, (user_id, user_id))
    
    ratings_received = cur.fetchall()
    
    if ratings_received:
        total_rating = sum(float(r['rating']) for r in ratings_received)
        avg_rating = total_rating / len(ratings_received)
        print(f"  Average Rating: {avg_rating:.2f}/5 ({len(ratings_received)} ratings)")
        
        for r in ratings_received:
            print(f"\n  Rating ID: {r['id']} | From User: {r['buyer_id']}")
            print(f"  Item: {r['item_title'] or 'Unknown'}")
            print(f"  Rating: {'⭐' * int(r['rating'])} ({r['rating']}/5)")
            print(f"  Review: {r['review'] or 'No review'}")
            print(f"  Created: {r['created_at']}")
    else:
        print("  No ratings received")
    
    # 8. Invoice Notes
    print(f"\n\nINVOICE NOTES:")
    print("-" * 40)
    cur.execute("""
        SELECT n.*, i.buyer_id, i.seller_id, s.searchable_data->>'title' as item_title
        FROM invoice_note n
        JOIN invoice i ON n.invoice_id = i.id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE n.user_id = %s OR i.buyer_id = %s OR i.seller_id = %s
        ORDER BY n.created_at DESC
    """, (user_id, user_id, user_id))
    
    notes = cur.fetchall()
    
    if notes:
        for n in notes:
            print(f"\n  Note ID: {n['id']} | Invoice: {n['invoice_id']}")
            print(f"  Item: {n['item_title'] or 'Unknown'}")
            print(f"  Role: {n['buyer_seller']} | From User: {n['user_id']}")
            print(f"  Content: {n['content']}")
            print(f"  Created: {n['created_at']}")
    else:
        print("  No invoice notes found")
    
    # 9. Summary Statistics
    print(f"\n\nSUMMARY STATISTICS:")
    print("-" * 40)
    
    # Total earnings
    cur.execute("""
        SELECT COALESCE(SUM(i.amount - i.fee), 0)
        FROM invoice i
        JOIN payment p ON i.id = p.invoice_id
        WHERE i.seller_id = %s AND p.status = 'complete'
    """, (user_id,))
    total_earnings = cur.fetchone()[0]
    
    # Total spent
    cur.execute("""
        SELECT COALESCE(SUM(i.amount), 0)
        FROM invoice i
        JOIN payment p ON i.id = p.invoice_id
        WHERE i.buyer_id = %s AND p.status = 'complete'
    """, (user_id,))
    total_spent = cur.fetchone()[0]
    
    # Active searchables
    cur.execute("""
        SELECT COUNT(*)
        FROM searchables
        WHERE user_id = %s AND removed = FALSE
    """, (user_id,))
    active_searchables = cur.fetchone()[0]
    
    print(f"Total Earnings: {format_currency(total_earnings)}")
    print(f"Total Spent: {format_currency(total_spent)}")
    print(f"Active Searchables: {active_searchables}")
    print(f"Total Searchables: {len(searchables)}")
    print(f"Sales: {len(seller_invoices)}")
    print(f"Purchases: {len(buyer_invoices)}")
    
    print(f"\n{'='*60}\n")
    
    cur.close()
    conn.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python lookup_user.py <user_id>")
        sys.exit(1)
    
    try:
        user_id = int(sys.argv[1])
        lookup_user(user_id)
    except ValueError:
        print("Error: user_id must be a number")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)