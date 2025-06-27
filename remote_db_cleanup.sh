#!/bin/bash

# Remote Database Cleanup Script
# This script connects to the remote server and cleans all data from the database

set -e

# Configuration (using same settings as remote_redeploy.sh)
REMOTE_HOST="cherry-interest.metalseed.net"
REMOTE_USER="searchable"
REMOTE_PATH="/home/searchable/searchable"

echo "🗑️  Database Cleanup Script"
echo "================================"
echo "Remote: $REMOTE_USER@$REMOTE_HOST"
echo "This will DELETE ALL DATA from the database!"
echo ""

# Confirmation prompt
read -p "Are you sure you want to clean ALL database data? (type 'YES' to confirm): " confirmation
if [ "$confirmation" != "YES" ]; then
    echo "❌ Cleanup cancelled."
    exit 1
fi

echo ""
echo "🚀 Connecting to remote server and cleaning database..."
echo ""

# Connect to remote server and clean database
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
    echo "📡 Connected to remote server"
    echo "Current directory: $(pwd)"
    
    # Navigate to the codebase directory
    cd /home/searchable/searchable
    echo "📁 Changed to: $(pwd)"
    
    echo ""
    echo "🧹 Starting database cleanup..."
    
    # Display current data counts before cleanup
    echo "📊 Data before cleanup:"
    docker exec searchable-db-1 psql -U searchable -d searchable -c "
        SELECT 'searchables' as table_name, COUNT(*) as count FROM searchables
        UNION ALL
        SELECT 'files', COUNT(*) FROM files
        UNION ALL
        SELECT 'purchases', COUNT(*) FROM purchases
        UNION ALL
        SELECT 'invoice', COUNT(*) FROM invoice
        UNION ALL
        SELECT 'payment', COUNT(*) FROM payment
        UNION ALL
        SELECT 'withdrawal', COUNT(*) FROM withdrawal
        UNION ALL
        SELECT 'invoice_note', COUNT(*) FROM invoice_note
        UNION ALL
        SELECT 'rating', COUNT(*) FROM rating
        UNION ALL
        SELECT 'user_profile', COUNT(*) FROM user_profile
        ORDER BY table_name;
    "
    
    echo ""
    echo "🗑️ Cleaning database tables..."
    
    # Execute the database cleanup in a transaction
    docker exec searchable-db-1 psql -U searchable -d searchable -c "
        BEGIN;
        
        -- Delete data in order respecting foreign key constraints
        -- Start with dependent tables first
        DELETE FROM rating;
        DELETE FROM invoice_note;
        DELETE FROM payment;
        DELETE FROM withdrawal;
        DELETE FROM invoice;
        DELETE FROM purchases;
        DELETE FROM user_profile;
        DELETE FROM files;
        DELETE FROM searchables;
        
        COMMIT;
    "
    
    echo ""
    echo "🔄 Resetting sequences..."
    docker exec searchable-db-1 psql -U searchable -d searchable -c "
        ALTER SEQUENCE searchables_searchable_id_seq RESTART WITH 1;
        ALTER SEQUENCE terminal_terminal_id_seq RESTART WITH 1;
        ALTER SEQUENCE files_file_id_seq RESTART WITH 1;
        ALTER SEQUENCE purchases_purchase_id_seq RESTART WITH 1;
        ALTER SEQUENCE invoice_id_seq RESTART WITH 1;
        ALTER SEQUENCE payment_id_seq RESTART WITH 1;
        ALTER SEQUENCE withdrawal_id_seq RESTART WITH 1;
        ALTER SEQUENCE invoice_note_id_seq RESTART WITH 1;
        ALTER SEQUENCE rating_id_seq RESTART WITH 1;
        ALTER SEQUENCE user_profile_id_seq RESTART WITH 1;
    "
    
    echo ""
    echo "📊 Data after cleanup:"
    docker exec searchable-db-1 psql -U searchable -d searchable -c "
        SELECT 'searchables' as table_name, COUNT(*) as count FROM searchables
        UNION ALL
        SELECT 'files', COUNT(*) FROM files
        UNION ALL
        SELECT 'purchases', COUNT(*) FROM purchases
        UNION ALL
        SELECT 'invoice', COUNT(*) FROM invoice
        UNION ALL
        SELECT 'payment', COUNT(*) FROM payment
        UNION ALL
        SELECT 'withdrawal', COUNT(*) FROM withdrawal
        UNION ALL
        SELECT 'invoice_note', COUNT(*) FROM invoice_note
        UNION ALL
        SELECT 'rating', COUNT(*) FROM rating
        UNION ALL
        SELECT 'user_profile', COUNT(*) FROM user_profile
        ORDER BY table_name;
    "
    
    echo ""
    echo "🎉 Remote database cleanup completed!"
EOF

echo ""
echo "✅ Database cleanup finished!"
echo "🔄 You may want to restart the application containers:"
echo "   ./remote_redeploy.sh"