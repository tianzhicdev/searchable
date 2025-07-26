#!/usr/bin/env python3
"""
User lookup script for Searchable project
Runs inside the Flask container to access database
"""

import sys
import os
sys.path.append('/app')

from api.common.database_context import db
from api.common.config import config
from datetime import datetime
from decimal import Decimal


def format_currency(amount):
    """Format currency values"""
    if amount is None:
        return "$0.00"
    return f"${float(amount):.2f}"


def lookup_user(user_id):
    """Look up all information about a user"""
    
    # Initialize database connection
    db.init(config)
    
    print(f"\n{'='*60}")
    print(f"USER LOOKUP: User ID {user_id}")
    print(f"{'='*60}\n")
    
    # 1. User Profile
    print("USER PROFILE:")
    print("-" * 40)
    user_profile = db.fetch_one("""
        SELECT up.*, u.username, u.email, u.date_joined
        FROM user_profile up
        RIGHT JOIN users u ON u.id = up.user_id
        WHERE u.id = %s
    """, (user_id,))
    
    if not user_profile:
        print(f"❌ User with ID {user_id} not found!")
        return
    
    # Extract user info
    print(f"Username: {user_profile[7]}")
    print(f"Email: {user_profile[8]}")
    print(f"Joined: {user_profile[9]}")
    if user_profile[0] is not None:  # profile exists
        print(f"Profile Image: {user_profile[3] or 'Not set'}")
        print(f"Introduction: {user_profile[4] or 'Not set'}")
    else:
        print(f"Profile: Not created")
    
    # 2. Searchables (Items Posted)
    print(f"\n\nSEARCHABLES (Items Posted):")
    print("-" * 40)
    searchables = db.fetch_all("""
        SELECT searchable_id, type, searchable_data, removed, created_at
        FROM searchables
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    
    if searchables:
        for s in searchables:
            data = s[2]
            print(f"\n  ID: {s[0]} | Type: {s[1]} | Removed: {s[3]}")
            print(f"  Created: {s[4]}")
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
    buyer_invoices = db.fetch_all("""
        SELECT i.*, p.status as payment_status, s.searchable_data->>'title' as item_title
        FROM invoice i
        LEFT JOIN payment p ON i.id = p.invoice_id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE i.buyer_id = %s
        ORDER BY i.created_at DESC
    """, (user_id,))
    
    if buyer_invoices:
        for inv in buyer_invoices:
            print(f"\n  Invoice ID: {inv[0]} | Searchable: {inv[3]}")
            print(f"  Item: {inv[12] or 'Unknown'}")
            print(f"  Seller ID: {inv[2]}")
            print(f"  Amount: {format_currency(inv[4])} | Fee: {format_currency(inv[5])}")
            print(f"  Type: {inv[7]} | Status: {inv[11] or 'pending'}")
            print(f"  Created: {inv[9]}")
    else:
        print("  No purchases found")
    
    # 4. Invoices as Seller
    print(f"\n\nINVOICES AS SELLER:")
    print("-" * 40)
    seller_invoices = db.fetch_all("""
        SELECT i.*, p.status as payment_status, s.searchable_data->>'title' as item_title
        FROM invoice i
        LEFT JOIN payment p ON i.id = p.invoice_id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE i.seller_id = %s
        ORDER BY i.created_at DESC
    """, (user_id,))
    
    if seller_invoices:
        for inv in seller_invoices:
            print(f"\n  Invoice ID: {inv[0]} | Searchable: {inv[3]}")
            print(f"  Item: {inv[12] or 'Unknown'}")
            print(f"  Buyer ID: {inv[1]}")
            print(f"  Amount: {format_currency(inv[4])} | Fee: {format_currency(inv[5])}")
            print(f"  Type: {inv[7]} | Status: {inv[11] or 'pending'}")
            print(f"  Created: {inv[9]}")
    else:
        print("  No sales found")
    
    # 5. Withdrawals
    print(f"\n\nWITHDRAWALS:")
    print("-" * 40)
    withdrawals = db.fetch_all("""
        SELECT * FROM withdrawal
        WHERE user_id = %s
        ORDER BY created_at DESC
    """, (user_id,))
    
    if withdrawals:
        for w in withdrawals:
            print(f"\n  Withdrawal ID: {w[0]}")
            print(f"  Amount: {format_currency(w[2])} | Fee: {format_currency(w[3])}")
            print(f"  Type: {w[5]} | Status: {w[7]}")
            print(f"  Created: {w[8]}")
    else:
        print("  No withdrawals found")
    
    # 6. Ratings Given
    print(f"\n\nRATINGS GIVEN:")
    print("-" * 40)
    ratings_given = db.fetch_all("""
        SELECT r.*, i.searchable_id, s.searchable_data->>'title' as item_title
        FROM rating r
        JOIN invoice i ON r.invoice_id = i.id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE r.user_id = %s
        ORDER BY r.created_at DESC
    """, (user_id,))
    
    if ratings_given:
        for r in ratings_given:
            print(f"\n  Rating ID: {r[0]} | Invoice: {r[1]}")
            print(f"  Item: {r[8] or 'Unknown'}")
            print(f"  Rating: {'⭐' * int(r[3])} ({r[3]}/5)")
            print(f"  Review: {r[4] or 'No review'}")
            print(f"  Created: {r[6]}")
    else:
        print("  No ratings given")
    
    # 7. Ratings Received (as seller)
    print(f"\n\nRATINGS RECEIVED:")
    print("-" * 40)
    ratings_received = db.fetch_all("""
        SELECT r.*, i.searchable_id, s.searchable_data->>'title' as item_title, i.buyer_id
        FROM rating r
        JOIN invoice i ON r.invoice_id = i.id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE i.seller_id = %s AND r.user_id != %s
        ORDER BY r.created_at DESC
    """, (user_id, user_id))
    
    if ratings_received:
        total_rating = sum(r[3] for r in ratings_received)
        avg_rating = total_rating / len(ratings_received)
        print(f"  Average Rating: {avg_rating:.2f}/5 ({len(ratings_received)} ratings)")
        
        for r in ratings_received:
            print(f"\n  Rating ID: {r[0]} | From User: {r[9]}")
            print(f"  Item: {r[8] or 'Unknown'}")
            print(f"  Rating: {'⭐' * int(r[3])} ({r[3]}/5)")
            print(f"  Review: {r[4] or 'No review'}")
            print(f"  Created: {r[6]}")
    else:
        print("  No ratings received")
    
    # 8. Invoice Notes
    print(f"\n\nINVOICE NOTES:")
    print("-" * 40)
    notes = db.fetch_all("""
        SELECT n.*, i.buyer_id, i.seller_id, s.searchable_data->>'title' as item_title
        FROM invoice_note n
        JOIN invoice i ON n.invoice_id = i.id
        LEFT JOIN searchables s ON i.searchable_id = s.searchable_id
        WHERE n.user_id = %s OR i.buyer_id = %s OR i.seller_id = %s
        ORDER BY n.created_at DESC
    """, (user_id, user_id, user_id))
    
    if notes:
        for n in notes:
            print(f"\n  Note ID: {n[0]} | Invoice: {n[1]}")
            print(f"  Item: {n[9] or 'Unknown'}")
            print(f"  Role: {n[3]} | From User: {n[2]}")
            print(f"  Content: {n[4]}")
            print(f"  Created: {n[6]}")
    else:
        print("  No invoice notes found")
    
    # 9. Summary Statistics
    print(f"\n\nSUMMARY STATISTICS:")
    print("-" * 40)
    
    # Total earnings
    total_earnings = db.fetch_one("""
        SELECT COALESCE(SUM(i.amount - i.fee), 0)
        FROM invoice i
        JOIN payment p ON i.id = p.invoice_id
        WHERE i.seller_id = %s AND p.status = 'complete'
    """, (user_id,))[0]
    
    # Total spent
    total_spent = db.fetch_one("""
        SELECT COALESCE(SUM(i.amount), 0)
        FROM invoice i
        JOIN payment p ON i.id = p.invoice_id
        WHERE i.buyer_id = %s AND p.status = 'complete'
    """, (user_id,))[0]
    
    # Active searchables
    active_searchables = db.fetch_one("""
        SELECT COUNT(*)
        FROM searchables
        WHERE user_id = %s AND removed = FALSE
    """, (user_id,))[0]
    
    print(f"Total Earnings: {format_currency(total_earnings)}")
    print(f"Total Spent: {format_currency(total_spent)}")
    print(f"Active Searchables: {active_searchables}")
    print(f"Total Searchables: {len(searchables)}")
    print(f"Sales: {len(seller_invoices)}")
    print(f"Purchases: {len(buyer_invoices)}")
    
    print(f"\n{'='*60}\n")


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