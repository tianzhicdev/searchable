#!/bin/bash

# Script to run database migration for searchables table improvements

set -e

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Running database migration for searchables table improvements..."

# Check if we're in local or production environment
if [ "$1" == "prod" ]; then
    echo "Running migration on PRODUCTION database..."
    # You'll need to add production database connection details here
    echo "ERROR: Production migration not configured. Please run manually."
    exit 1
else
    echo "Running migration on LOCAL database..."
    
    # Check if postgres container is running
    if ! docker ps | grep -q "searchable_db"; then
        echo "ERROR: Database container is not running. Please start it with ./exec.sh local deploy db"
        exit 1
    fi
    
    # Run the migration
    docker exec -i searchable_db psql -U searchable -d searchable < postgres/migrations/add_searchables_columns_and_indexes.sql
    
    if [ $? -eq 0 ]; then
        echo "Migration completed successfully!"
        echo ""
        echo "Summary of changes:"
        echo "- Added 'removed' boolean column to searchables table"
        echo "- Added 'created_at' and 'updated_at' timestamp columns"
        echo "- Created indexes on user_id, removed, created_at"
        echo "- Migrated existing removed status from JSON to column"
        echo ""
        echo "The search API is now optimized with:"
        echo "- SQL-based pagination (no more loading all results)"
        echo "- Simple ILIKE text search (case-insensitive)"
        echo "- Direct username JOINs"
        echo "- Proper indexing for fast queries"
    else
        echo "ERROR: Migration failed!"
        exit 1
    fi
fi