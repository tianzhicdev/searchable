-- Migration: Add service_heartbeat table for health monitoring
-- Created: 2026-01-17
-- Purpose: Track background job heartbeats for health checks

-- Create the service_heartbeat table
CREATE TABLE IF NOT EXISTS service_heartbeat (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    job_name VARCHAR(100) NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    UNIQUE(service_name, job_name)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_heartbeat_service ON service_heartbeat(service_name);
CREATE INDEX IF NOT EXISTS idx_heartbeat_timestamp ON service_heartbeat(last_heartbeat DESC);

-- Verify table creation
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename = 'service_heartbeat';

-- Show initial count (should be 0 for fresh install)
SELECT COUNT(*) as heartbeat_count FROM service_heartbeat;
