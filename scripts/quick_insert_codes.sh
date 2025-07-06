#!/bin/bash
# Quick script to insert a few test codes for each promoter

echo "Quick Promoter Code Insertion"
echo "============================="

# Adjust these variables for your environment
DB_CONTAINER="${DB_CONTAINER:-searchable-db-1}"
USE_DOCKER="${USE_DOCKER:-true}"

# SQL execution command
if [ "$USE_DOCKER" = "true" ]; then
    PSQL="docker exec -i $DB_CONTAINER psql -U searchable -d searchable"
else
    PSQL="psql -h localhost -U searchable -d searchable"
fi

# Insert test codes for each promoter
echo "Inserting test codes..."

# Marcus codes
$PSQL << EOF
INSERT INTO invite_code (code, active, metadata) VALUES 
('MARCUS', true, '{"promoter": "marcus", "description": "Marcus promotion - Get 5 USDT signup bonus"}'),
('MARCAB', true, '{"promoter": "marcus", "description": "Marcus promotion - Get 5 USDT signup bonus"}'),
('MARCXY', true, '{"promoter": "marcus", "description": "Marcus promotion - Get 5 USDT signup bonus"}')
ON CONFLICT (code) DO NOTHING;
EOF

# Tyler codes  
$PSQL << EOF
INSERT INTO invite_code (code, active, metadata) VALUES
('TYLERX', true, '{"promoter": "tyler", "description": "Tyler promotion - Get 5 USDT signup bonus"}'),
('TYLERA', true, '{"promoter": "tyler", "description": "Tyler promotion - Get 5 USDT signup bonus"}'),
('TYLERB', true, '{"promoter": "tyler", "description": "Tyler promotion - Get 5 USDT signup bonus"}')
ON CONFLICT (code) DO NOTHING;
EOF

# Sajan codes
$PSQL << EOF
INSERT INTO invite_code (code, active, metadata) VALUES
('SAJANA', true, '{"promoter": "sajan", "description": "Sajan promotion - Get 5 USDT signup bonus"}'),
('SAJANB', true, '{"promoter": "sajan", "description": "Sajan promotion - Get 5 USDT signup bonus"}'),
('SAJANX', true, '{"promoter": "sajan", "description": "Sajan promotion - Get 5 USDT signup bonus"}')
ON CONFLICT (code) DO NOTHING;
EOF

echo -e "\n✅ Done! Inserted test codes for marcus, tyler, and sajan"

# Show current codes
echo -e "\nCurrent active codes by promoter:"
$PSQL << EOF
SELECT 
    metadata->>'promoter' as promoter,
    COUNT(*) as code_count,
    array_agg(code ORDER BY code) as codes
FROM invite_code 
WHERE active = true 
    AND metadata->>'promoter' IN ('marcus', 'tyler', 'sajan')
GROUP BY metadata->>'promoter'
ORDER BY promoter;
EOF