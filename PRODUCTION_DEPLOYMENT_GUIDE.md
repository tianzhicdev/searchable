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

### 2. Verify Database Table

Check if the `service_heartbeat` table exists in production:

```bash
docker exec searchable-db-1 psql -U searchable -d searchable -c "\dt service_heartbeat"
```

**Expected Output**:
- If table exists: `service_heartbeat | table | searchable`
- If table doesn't exist: `Did not find any relation named "service_heartbeat"`

## Deployment Steps

### Step 1: Add service_heartbeat Table (if missing)

If the table doesn't exist in production, create it:

```bash
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

Verify the table was created:

```bash
docker exec searchable-db-1 psql -U searchable -d searchable -c "SELECT COUNT(*) FROM service_heartbeat;"
```

### Step 2: Deploy to Production

Deploy the changes to production using the standard deployment process:

```bash
./exec.sh remote deploy-all
```

Or deploy specific containers:

```bash
./exec.sh remote deploy flask_api
./exec.sh remote deploy background
```

### Step 3: Verify Deployment

#### 3.1 Check Flask API Logs

```bash
docker logs flask_api --tail 50
```

Look for:
- ✅ "Successfully initialized the database"
- ✅ "Running comprehensive health checks..."
- ❌ NO errors about missing tables or Docker socket

#### 3.2 Test Health Endpoint

```bash
curl https://your-production-domain.com/api/health | jq '.'
```

**Expected Response**:
- Status: 200 (if all healthy) or 503 (if issues detected)
- JSON with all health checks (database, disk_space, docker_containers, services, background_jobs, wallets, external_apis)

#### 3.3 Access Dashboard

Open in browser:
```
https://your-production-domain.com/api/dashboard
```

**Expected Result**:
- Visual dashboard showing all system health metrics
- Auto-refreshes every 10 seconds
- Color-coded status indicators (green/yellow/red)

#### 3.4 Verify Background Job Heartbeats

After 5-10 minutes, check that heartbeats are being recorded:

```bash
docker exec searchable-db-1 psql -U searchable -d searchable -c "SELECT service_name, job_name, last_heartbeat FROM service_heartbeat ORDER BY last_heartbeat DESC;"
```

**Expected Output**: 4 rows showing recent timestamps:
```
 service_name |        job_name        |       last_heartbeat
--------------+------------------------+----------------------------
 background   | withdrawal_checker     | 2026-01-17 04:20:00+00
 background   | invoice_checker        | 2026-01-17 04:19:55+00
 background   | download_token_cleaner | 2026-01-17 04:19:50+00
 background   | lightning_checker      | 2026-01-17 04:19:45+00
```

### Step 4: Configure Uptimebot

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
- `api-server-flask/background.py` - Added heartbeat tracking
- `api-server-flask/api/file_server.py` - Added /health endpoint
- `tether_on_eth/index.js` - Added /health endpoint
- `postgres/init.sql` - Added service_heartbeat table
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
5. **Background Jobs** - 4 job heartbeats (invoice_checker, withdrawal_checker, lightning_checker, download_token_cleaner)
6. **Production Wallet** - ETH and USDT balance for `0x80b4a2ebeceF714dF8E08692A9D2B3ADFb8Ec516` (warning < 0.1 ETH, critical < 0.05 ETH)
7. **External APIs** - Stripe and Infura connectivity

## Rollback Plan

If issues occur, rollback by:

1. **Revert to previous version**:
   ```bash
   git checkout main
   ./exec.sh remote deploy-all
   ```

2. **Remove service_heartbeat table** (optional):
   ```bash
   docker exec searchable-db-1 psql -U searchable -d searchable -c "DROP TABLE IF EXISTS service_heartbeat CASCADE;"
   ```

3. **Check logs for errors**:
   ```bash
   docker logs flask_api
   docker logs searchable-background-1
   ```

## Troubleshooting

### Issue: /api/health returns 500 error

**Cause**: Likely missing service_heartbeat table or Docker socket not mounted

**Fix**:
1. Check logs: `docker logs flask_api --tail 100`
2. Create table using Step 1 above
3. Verify Docker socket mount in docker-compose.yml
4. Restart: `docker restart flask_api`

### Issue: Background jobs show "unknown" status

**Cause**: Heartbeats not being recorded

**Fix**:
1. Check background service logs: `docker logs searchable-background-1 --tail 100`
2. Verify table exists: `docker exec searchable-db-1 psql -U searchable -d searchable -c "\dt service_heartbeat"`
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
3. ✅ Background job heartbeats updating regularly
4. ✅ Uptimebot receiving 200 responses
5. ✅ No errors in Flask API logs
6. ✅ Wallet balance displaying correctly

## Support

If issues arise:
- Check logs: `./exec.sh remote logs flask_api`
- Review this guide's Troubleshooting section
- Rollback if necessary using Rollback Plan above
