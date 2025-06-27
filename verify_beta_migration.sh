#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Beta Migration Verification Script${NC}"
echo "===================================="

# Function to run SQL command on beta
run_beta_sql() {
    ssh searchable@cherry-interest.metalseed.net \
        "docker exec searchable_postgres_1 psql -U searchable searchable -t -c \"$1\""
}

echo -e "\n${YELLOW}1. Checking if tags tables exist:${NC}"
tables=$(run_beta_sql "\dt tags, user_tags, searchable_tags" 2>&1)
if [[ $tables == *"tags"* ]]; then
    echo -e "${GREEN}✓ Tags tables found${NC}"
else
    echo -e "${RED}✗ Tags tables NOT found${NC}"
fi

echo -e "\n${YELLOW}2. Counting tags by type:${NC}"
tag_counts=$(run_beta_sql "SELECT tag_type, COUNT(*) FROM tags GROUP BY tag_type ORDER BY tag_type;")
echo "$tag_counts"

echo -e "\n${YELLOW}3. Checking user_profile table:${NC}"
profile_check=$(run_beta_sql "\dt user_profile" 2>&1)
if [[ $profile_check == *"user_profile"* ]]; then
    echo -e "${GREEN}✓ user_profile table exists${NC}"
else
    echo -e "${RED}✗ user_profile table NOT found${NC}"
fi

echo -e "\n${YELLOW}4. Sample tags:${NC}"
echo "User tags:"
run_beta_sql "SELECT name, description FROM tags WHERE tag_type = 'user' LIMIT 5;"
echo -e "\nSearchable tags:"
run_beta_sql "SELECT name, description FROM tags WHERE tag_type = 'searchable' LIMIT 5;"

echo -e "\n${YELLOW}5. Checking indexes:${NC}"
indexes=$(run_beta_sql "\di idx_tags_*" 2>&1)
if [[ $indexes == *"idx_tags"* ]]; then
    echo -e "${GREEN}✓ Tag indexes found${NC}"
else
    echo -e "${RED}✗ Tag indexes NOT found${NC}"
fi

echo -e "\n${YELLOW}Migration verification complete!${NC}"