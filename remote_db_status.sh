#!/bin/bash

# Remote Database Status Script
# This script connects to the remote server and shows database status (non-destructive)

set -e

# Configuration (using same settings as remote_redeploy.sh)
REMOTE_HOST="cherry-interest.metalseed.net"
REMOTE_USER="searchable"
REMOTE_PATH="/home/searchable/searchable"

echo "📊 Database Status Check"
echo "========================"
echo "Remote: $REMOTE_USER@$REMOTE_HOST"
echo ""

# Connect to remote server and check database status
ssh $REMOTE_USER@$REMOTE_HOST << 'EOF'
    echo "📡 Connected to remote server"
    echo "Current directory: $(pwd)"
    
    # Navigate to the codebase directory
    cd /home/searchable/searchable
    echo "📁 Changed to: $(pwd)"
    
    echo ""
    echo "📋 Checking database status..."
    
    # First check if container is running
    echo "🐳 Checking if database container is running..."
    docker ps | grep searchable-db-1 || echo "❌ Database container not found"
    
    echo ""
    echo "📊 Connecting to database..."
    
    # Check database status using the searchable-db-1 container
    echo "Running database queries..."
    docker exec searchable-db-1 psql -U searchable -d searchable -c "
        SELECT 'Current database status:' as message;
        SELECT '========================' as separator;
        
        SELECT 'searchables' as table_name, COUNT(*) as count FROM searchables
        UNION ALL
        SELECT 'terminal', COUNT(*) FROM terminal
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
        UNION ALL
        SELECT 'kv', COUNT(*) FROM kv
        ORDER BY table_name;
    "
    
    echo ""
    echo "Recent data samples:"
    docker exec searchable-db-1 psql -U searchable -d searchable -c "
        SELECT searchable_id, terminal_id, 
               searchable_data->>'payloads'->>'public'->>'title' as title
        FROM searchables 
        ORDER BY searchable_id DESC 
        LIMIT 3;
    " 2>/dev/null || echo "No searchables found"
    
    echo ""
    echo "✅ Database status check completed!"
EOF

echo ""
echo "📊 Status check finished!"