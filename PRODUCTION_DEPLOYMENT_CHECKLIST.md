# Production Deployment Checklist - Health Monitoring

Quick reference checklist for deploying health monitoring to production.

## Pre-Deployment (On Production Server)

### 1. Check PostgreSQL Version
```bash
docker exec searchable-db-1 psql --version
```
- [ ] Version is PostgreSQL 16.x (or compatible 13-17)
- [ ] If version 18+, docker-compose.yml must use `image: postgres:16`

### 2. Check if service_heartbeat Table Exists
```bash
docker exec searchable-db-1 psql -U searchable -d searchable -c "\dt service_heartbeat"
```
- [ ] If table doesn't exist, proceed to Step 3
- [ ] If table exists, skip to deployment

### 3. Add service_heartbeat Table (if needed)
```bash
# Option A: Using migration file
docker exec -i searchable-db-1 psql -U searchable -d searchable < migrations/add_service_heartbeat_table.sql

# Option B: Direct command
docker exec searchable-db-1 psql -U searchable -d searchable <<'EOF'
CREATE TABLE IF NOT EXISTS service_heartbeat (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL,
    job_name VARCHAR(100) NOT NULL,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    UNIQUE(service_name, job_name)
);
CREATE INDEX IF NOT EXISTS idx_heartbeat_service ON service_heartbeat(service_name);
CREATE INDEX IF NOT EXISTS idx_heartbeat_timestamp ON service_heartbeat(last_heartbeat DESC);
EOF
```
- [ ] Table created successfully
- [ ] Can query table: `SELECT COUNT(*) FROM service_heartbeat;`

## Deployment

### 4. Deploy Changes
```bash
./exec.sh remote deploy-all
```
- [ ] Deployment completed without errors
- [ ] All containers restarted successfully

## Post-Deployment Verification

### 5. Check Logs
```bash
docker logs flask_api --tail 50
```
- [ ] No errors in logs
- [ ] See "Successfully initialized the database"
- [ ] See "Running comprehensive health checks..."

### 6. Test Health Endpoint
```bash
curl https://your-production-domain.com/api/health
```
- [ ] Returns HTTP 200 or 503 (not 500)
- [ ] JSON response includes all health checks
- [ ] Response time < 5 seconds

### 7. Test Dashboard
Open in browser: `https://your-production-domain.com/api/dashboard`
- [ ] Dashboard loads successfully
- [ ] Shows all system metrics
- [ ] Auto-refreshes every 10 seconds
- [ ] All sections visible (Database, Disk Space, Docker Containers, Services, Background Jobs, Wallet, External APIs)

### 8. Verify Background Job Heartbeats (wait 5-10 minutes)
```bash
docker exec searchable-db-1 psql -U searchable -d searchable -c "SELECT service_name, job_name, last_heartbeat FROM service_heartbeat ORDER BY last_heartbeat DESC;"
```
- [ ] Shows 4 background jobs
- [ ] Timestamps are recent (within last few minutes)
- [ ] Jobs: invoice_checker, withdrawal_checker, lightning_checker, download_token_cleaner

### 9. Configure Uptimebot
- [ ] Set monitoring URL: `https://your-production-domain.com/api/health`
- [ ] Set interval: 5 minutes
- [ ] Set alert on HTTP status ≥ 500

## If Issues Occur

### Quick Rollback
```bash
git checkout main
./exec.sh remote deploy-all
```

### Common Issues

**Issue**: /api/health returns 500
- Check: `docker logs flask_api --tail 100`
- Fix: Verify service_heartbeat table exists

**Issue**: Background jobs show "unknown"
- Check: `docker logs searchable-background-1 --tail 100`
- Fix: Restart background service

**Issue**: Docker containers not detected
- Check: `docker inspect flask_api | grep -A 5 Mounts`
- Fix: Verify Docker socket mounted in docker-compose.yml

## Success Criteria

After 30 minutes in production:
- [ ] ✅ Dashboard accessible and functional
- [ ] ✅ /api/health returning 200 or 503 (not 500)
- [ ] ✅ Background heartbeats updating every 1-2 minutes
- [ ] ✅ Uptimebot receiving responses
- [ ] ✅ No errors in logs
- [ ] ✅ Wallet balance displaying (may be 0 or low, that's OK)

## Files Changed in This Release

- ✅ api-server-flask/api/common/health_checker.py (NEW)
- ✅ api-server-flask/api/routes/dashboard.py (NEW)
- ✅ migrations/add_service_heartbeat_table.sql (NEW)
- ✅ api-server-flask/api/routes/metrics.py (MODIFIED)
- ✅ api-server-flask/background.py (MODIFIED)
- ✅ postgres/init.sql (MODIFIED)
- ✅ docker-compose.yml (MODIFIED)
- ✅ docker-compose.local.yml (MODIFIED)
- ✅ api-server-flask/requirements.txt (MODIFIED)

## Notes

- Frontend container (searchable-frontend-1) will show as "exited" - this is normal, it's a build container
- Production wallet monitored: 0x80b4a2ebeceF714dF8E08692A9D2B3ADFb8Ec516
- Health checks run every request to /api/health
- Dashboard auto-refreshes every 10 seconds
- Background heartbeats update every 30-120 seconds depending on job
