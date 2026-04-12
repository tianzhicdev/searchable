# Production Deployment Checklist - Health Monitoring

Quick reference checklist for deploying health monitoring to production.

## Pre-Deployment (On Production Server)

### 1. Check PostgreSQL Version
```bash
docker exec searchable-db-1 psql --version
```
- [ ] Version is PostgreSQL 16.x (or compatible 13-17)
- [ ] If version 18+, docker-compose.yml must use `image: postgres:16`

## Deployment

### 2. Deploy Changes
```bash
./exec.sh remote deploy-all
```
- [ ] Deployment completed without errors
- [ ] All containers restarted successfully

## Post-Deployment Verification

### 3. Check Logs
```bash
docker logs flask_api --tail 50
```
- [ ] No errors in logs
- [ ] See "Successfully initialized the database"
- [ ] See "Running comprehensive health checks..."

### 4. Test Health Endpoint
```bash
curl https://your-production-domain.com/api/health
```
- [ ] Returns HTTP 200 or 503 (not 500)
- [ ] JSON response includes all health checks
- [ ] Response time < 5 seconds

### 5. Test Dashboard
Open in browser: `https://your-production-domain.com/api/dashboard`
- [ ] Dashboard loads successfully
- [ ] Shows all system metrics
- [ ] Auto-refreshes every 10 seconds
- [ ] All sections visible (Database, Disk Space, Docker Containers, Services, Background Service, Wallet, External APIs)

### 6. Configure Uptimebot
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
- Fix: Verify Docker socket mounted in docker-compose.yml

**Issue**: Background service shows "unknown"
- Check: `docker logs searchable-background-1 --tail 100`
- Fix: Restart background service

**Issue**: Docker containers not detected
- Check: `docker inspect flask_api | grep -A 5 Mounts`
- Fix: Verify Docker socket mounted in docker-compose.yml

## Success Criteria

After 30 minutes in production:
- [ ] ✅ Dashboard accessible and functional
- [ ] ✅ /api/health returning 200 or 503 (not 500)
- [ ] ✅ Uptimebot receiving responses
- [ ] ✅ No errors in logs
- [ ] ✅ Wallet balance displaying (may be 0 or low, that's OK)
- [ ] ✅ All 8 Docker containers running

## Files Changed in This Release

- ✅ api-server-flask/api/common/health_checker.py (NEW)
- ✅ api-server-flask/api/routes/dashboard.py (NEW)
- ✅ api-server-flask/api/routes/metrics.py (MODIFIED)
- ✅ api-server-flask/background.py (MODIFIED - removed heartbeat tracking)
- ✅ docker-compose.yml (MODIFIED - PostgreSQL version, Docker socket)
- ✅ docker-compose.local.yml (MODIFIED - Docker socket)
- ✅ api-server-flask/requirements.txt (MODIFIED - added docker library)
- ✅ api-server-flask/api/__init__.py (MODIFIED - fixed after_request handler)

## Notes

- Frontend container (searchable-frontend-1) will show as "exited" - this is normal, it's a build container
- Production wallet monitored: 0x80b4a2ebeceF714dF8E08692A9D2B3ADFb8Ec516
- Health checks run every request to /api/health
- Dashboard auto-refreshes every 10 seconds
- Background service health verified via Docker container status
- **No database changes required** - deployment is straightforward
