# Production Deployment Guide - Health Monitoring System

## Overview
This guide covers deploying the new health monitoring system to production, including the `/api/health` endpoint and `/api/dashboard` UI.

## Pre-Deployment Checklist

### 1. Check PostgreSQL Version in Production

Run this command on your production server:

```bash
docker exec searchable-db-1 psql --version
```

**Expected Output**: PostgreSQL 16.x

**If the version is different**:
- If it's PostgreSQL 13-17: Should be compatible, but consider upgrading to 16 for consistency
- If it's PostgreSQL 18+: You MUST pin to version 16 in docker-compose.yml (already done in this branch)

## Deployment Steps

### Step 1: Deploy to Production

Deploy the changes to production using the standard deployment process:

```bash
./exec.sh remote deploy-all
```

Or deploy specific containers:

```bash
./exec.sh remote deploy flask_api
./exec.sh remote deploy background
```

### Step 2: Verify Deployment

#### 2.1 Check Flask API Logs

```bash
docker logs flask_api --tail 50
```

Look for:
- ✅ "Successfully initialized the database"
- ✅ "Running comprehensive health checks..."
- ❌ NO errors about missing tables or Docker socket

#### 2.2 Test Health Endpoint

```bash
curl https://your-production-domain.com/api/health | jq '.'
```

**Expected Response**:
- Status: 200 (if all healthy) or 503 (if issues detected)
- JSON with all health checks (database, disk_space, docker_containers, services, background_jobs, wallets, external_apis)

#### 2.3 Access Dashboard

Open in browser:
```
https://your-production-domain.com/api/dashboard
```

**Expected Result**:
- Visual dashboard showing all system health metrics
- Auto-refreshes every 10 seconds
- Color-coded status indicators (green/yellow/red)

### Step 3: Configure Uptimebot

Update your uptimebot monitoring to use the new `/api/health` endpoint:

**Endpoint**: `https://your-production-domain.com/api/health`
**Interval**: 5 minutes (as per original requirements)
**Alert Conditions**:
- Alert if HTTP status ≥ 500 (unhealthy/degraded systems)
- Alert if response time > 10 seconds
- Alert if endpoint unreachable

**Response Codes**:
- `200`: All systems healthy
- `503`: System degraded or unhealthy (contains error details in JSON)

## What Changed

### New Files
- `api-server-flask/api/common/health_checker.py` - Core health monitoring logic
- `api-server-flask/api/routes/dashboard.py` - Dashboard UI endpoint

### Modified Files
- `api-server-flask/api/routes/metrics.py` - Enhanced /api/health endpoint
- `api-server-flask/api/file_server.py` - Added /health endpoint
- `tether_on_eth/index.js` - Added /health endpoint
- `docker-compose.yml` - Pinned PostgreSQL to version 16, added Docker socket mount
- `docker-compose.local.yml` - Added Docker socket mount
- `api-server-flask/requirements.txt` - Added docker>=6.0.0
- `api-server-flask/api/__init__.py` - Fixed after_request handler

### Monitoring Coverage

The system now monitors:

1. **Database Health** - PostgreSQL connectivity and latency
2. **Disk Space** - Root and storage volumes (warning at 85%, critical at 90%)
3. **Docker Containers** - 8 running services (nginx, flask_api, file_server, db, usdt-api, background, metrics, grafana)
4. **Service Health** - file_server, usdt-api, metrics endpoints
5. **Background Service** - Background container running status (via Docker monitoring)
6. **Production Wallet** - ETH and USDT balance for `0x80b4a2ebeceF714dF8E08692A9D2B3ADFb8Ec516` (warning < 0.1 ETH, critical < 0.05 ETH)
7. **External APIs** - Stripe and Infura connectivity

## Rollback Plan

If issues occur, rollback by:

1. **Revert to previous version**:
   ```bash
   git checkout main
   ./exec.sh remote deploy-all
   ```

2. **Check logs for errors**:
   ```bash
   docker logs flask_api
   docker logs searchable-background-1
   ```

## Troubleshooting

### Issue: /api/health returns 500 error

**Cause**: Likely Docker socket not mounted or service endpoint unreachable

**Fix**:
1. Check logs: `docker logs flask_api --tail 100`
2. Verify Docker socket mount in docker-compose.yml
3. Restart: `docker restart flask_api`

### Issue: Background service shows "unknown" status

**Cause**: Background container not running

**Fix**:
1. Check container status: `docker ps | grep background`
2. Check background service logs: `docker logs searchable-background-1 --tail 100`
3. Restart background service: `docker restart searchable-background-1`

### Issue: Docker containers showing "unhealthy"

**Cause**: Docker socket not mounted or permissions issue

**Fix**:
1. Verify socket mount: `docker inspect flask_api | grep -A 5 Mounts`
2. Should see: `/var/run/docker.sock:/var/run/docker.sock:ro`
3. If missing, add to docker-compose.yml and redeploy

### Issue: Wallet balance shows "unknown"

**Cause**: USDT API not responding or Infura connectivity issue

**Fix**:
1. Test USDT API: `curl http://localhost:3100/health`
2. Check USDT API logs: `docker logs searchable-usdt-api-1`
3. Verify Infura API key in .env.secrets

## Post-Deployment Verification

After 30 minutes of running in production:

1. ✅ Dashboard accessible and showing all metrics
2. ✅ /api/health returning proper status codes
3. ✅ Uptimebot receiving 200 responses
4. ✅ No errors in Flask API logs
5. ✅ Wallet balance displaying correctly
6. ✅ All Docker containers running

## Support

If issues arise:
- Check logs: `./exec.sh remote logs flask_api`
- Review this guide's Troubleshooting section
- Rollback if necessary using Rollback Plan above
