# Cloudflare and Neon Migration Research

Last updated: 2026-04-12

## Question

Can Cloudflare and Neon replace the current VPS-based deployment, while keeping development and production completely separate?

Short answer:

- Yes, for frontend, CDN, TLS, object storage, and PostgreSQL.
- Not as a lift-and-shift for the current Python and background services.
- Full VPS removal is realistic only with either:
  - a backend rewrite to Workers-native patterns, or
  - temporary use of Cloudflare Containers, which are still in beta

## Current Architecture In This Repo

The production stack is currently centered on Docker Compose and a single host.

### Services in `docker-compose.yml`

- `frontend` build container
- `nginx`
- `flask_api`
- `background`
- `file_server`
- `db`
- `usdt-api`
- `metrics`
- `grafana`

Relevant files:

- `docker-compose.yml`
- `docker-compose.local.yml`
- `redeploy.sh`
- `api-server-flask/Dockerfile.api`
- `api-server-flask/Dockerfile.background`
- `api-server-flask/Dockerfile.file_server`
- `api-server-flask/background.py`
- `api-server-flask/api/common/health_checker.py`
- `api-server-flask/api/file_server.py`
- `metrics-service/app.py`
- `tether_on_eth/index.js`
- `frontend/wrangler.toml`

### Current blockers to a direct Workers migration

1. The API is a Flask + Gunicorn app with `psycopg2`, not a Workers-native application.
2. Background processing is implemented as long-running polling loops in `background.py`.
3. File storage depends on a local writable disk volume mounted at `/app/storage`.
4. Health checks assume Docker socket access, local disk checks, and direct container inspection.
5. The crypto rail is a separate Node service, `usdt-api`, with wallet operations and private-key-backed sends.

## What Cloudflare and Neon Can Replace Cleanly

### Frontend and edge delivery

This part is straightforward.

- The repo already has a `frontend/wrangler.toml`.
- Cloudflare Workers Static Assets supports SPA routing and can serve built assets directly.
- Cloudflare Pages also supports preview deployments per branch.

This can replace:

- the `frontend` build container
- `nginx` for static delivery
- origin TLS termination on the VPS

### PostgreSQL

Neon is a strong fit for replacing the self-hosted Postgres container.

- Neon projects start with a root branch, and child branches are copy-on-write clones.
- Protected branches exist for production-sensitive data.
- Neon connection pooling is built on PgBouncer and is designed for web and serverless workloads.

This can replace:

- the `db` container
- local Postgres backups and manual database patching on the VPS

### File storage

Cloudflare R2 is a good fit for replacing the local file server volume.

- R2 public buckets can sit behind a custom domain.
- R2 presigned URLs support `GET`, `HEAD`, `PUT`, and `DELETE`.

This can replace:

- the `file_server` container
- the `./files` volume on the VPS

## What Does Not Move Cleanly As-Is

### Flask API

The current API does not drop into Workers unchanged.

Why:

- Workers use the Workers runtime, not Gunicorn containers.
- Python Workers are still in beta.
- The current app relies on Flask request/response lifecycle, Gunicorn worker model, and `psycopg2`.

Inference:

Moving `flask_api` to Workers means a rewrite, not a deploy-command change.

### Background jobs

The current worker model is a poor fit for the existing loop-based implementation.

Current behavior:

- invoice polling every 1 second
- withdrawal processing every 5 seconds
- deposit checks every 30 seconds

Cloudflare supports Cron Triggers, Queues, and Workflows, but:

- Cron expressions are minute-based
- Cron and Queue consumers have 15-minute wall-time limits
- the current code would need to become event-driven or queue-driven

Inference:

`background.py` should be redesigned into:

- request-time enqueueing
- webhook-driven updates where possible
- Queue consumers for immediate work
- Cron for periodic reconciliation
- Workflows for long-lived multi-step processes

### `usdt-api`

This service is the hardest compute decision.

Cloudflare Containers can technically run existing containerized apps, including workloads that need a Linux-like environment. But:

- Containers are still in beta
- they are not autoscaled or load balanced yet

Inference:

For finance-sensitive production flows, I would not make Cloudflare Containers the long-term home of `usdt-api` until they reach GA and the missing operational pieces stabilize.

### Metrics and Grafana

These services are also not a clean lift-and-shift.

- `metrics-service` is another Flask app
- `grafana` is a stateful dashboard service
- current health monitoring depends on Docker and local disk

Inference:

You should either:

- replace this stack with Cloudflare-native observability and simpler app metrics, or
- keep Grafana somewhere managed outside the app stack

## Dev and Prod Must Be Completely Separate

If you want true separation, do not use a single Neon project for both environments.

### Neon recommendation

Use:

- one Neon project for production
- one separate Neon project for development

Why:

- branches inside a Neon project are copy-on-write clones of a parent branch
- that is excellent for previews and tests
- but it is not the same as full environment isolation

Recommended structure:

- `searchable-prod` Neon project
  - one protected `production` branch
  - minimal additional branches
- `searchable-dev` Neon project
  - `main` or `dev` branch
  - ephemeral preview branches per PR or test run
  - optional schema-only branches when sensitive production data should not be copied

### Cloudflare recommendation

Baseline separation:

- separate frontend deployment for prod and dev
- separate API Worker for prod and dev
- separate R2 buckets per environment
- separate Queues and Workflows per environment
- separate secrets per environment
- separate custom domains, for example:
  - `app.example.com`
  - `dev.example.com`

Stricter separation:

- separate Cloudflare accounts for prod and dev

That is heavier operationally, but it is the strongest isolation model.

### Preview environments

Cloudflare Pages preview deployments are useful, but they are public by default.

If you use them:

- protect previews with Cloudflare Access
- connect previews only to the dev Neon project
- never attach previews to the prod database

## Recommended Target Architecture

### Production

- Cloudflare Workers Static Assets or Pages for the React app
- Cloudflare Worker API for request handling
- Cloudflare R2 for file storage
- Cloudflare Queues + Workflows + Cron for async work
- Neon production project for Postgres
- externalized crypto rail compute:
  - either a provider-backed payout/deposit integration
  - or a dedicated non-VPS compute target for blockchain signing until Workers-native replacement exists

### Development

- separate Cloudflare dev deployment
- separate dev domains
- separate dev R2 buckets
- separate dev Queues and Workflows
- separate Neon dev project
- preview branches and preview URLs connected only to the dev environment

## Best Migration Path

### Phase 1: Move the database first

- migrate `db` from Docker to Neon
- keep existing Flask apps running
- update all services to use Neon connection strings
- use pooled connections for web-style traffic

### Phase 2: Replace the file server with R2

- replace `api/file_server.py`
- generate object keys in app code
- upload using presigned `PUT` URLs or Worker-mediated writes
- serve downloads through presigned `GET` URLs or a Worker gate

This removes local disk as an infrastructure dependency.

### Phase 3: Move the frontend to Cloudflare

- deploy the built React app with Workers Static Assets or Pages
- keep API on its current host for the moment
- point the frontend at the current backend domain

This removes `nginx` and the frontend build path from the VPS first.

### Phase 4: Rewrite the backend execution model

- replace Flask route-by-route with Worker handlers
- replace polling loops with Queues, Workflows, Cron, and webhooks
- remove Docker-dependent health checks

This is the real application migration.

### Phase 5: Move or replace the crypto services

Best option:

- reduce custom chain compute by using provider-backed rails where possible

Fallback option:

- keep specialized blockchain signing services off-VPS until Cloudflare Containers are mature enough for production use

### Phase 6: Retire the VPS

After all host-bound services are gone:

- shut down the VPS
- remove Docker Compose deployment flow
- replace `redeploy.sh` with CI/CD to Cloudflare and Neon

## Bottom-Line Recommendation

Cloudflare + Neon can replace most of the VPS setup, but not by simply redeploying what exists today.

Recommended stance:

1. Yes, move frontend, storage, and Postgres to Cloudflare + Neon.
2. Yes, create completely separate dev and prod environments.
3. Use separate Neon projects for dev and prod.
4. Use separate Cloudflare resources per environment, and separate accounts if you want the strongest boundary.
5. Do not plan on lifting the current Flask API, background worker, and `usdt-api` into Workers unchanged.
6. Do not make Cloudflare Containers beta the foundation of production payment rails unless you explicitly accept beta risk.

## Source Links

Cloudflare:

- Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Workers environments: https://developers.cloudflare.com/workers/wrangler/environments/
- Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Python Workers: https://developers.cloudflare.com/workers/languages/python/
- Hyperdrive overview: https://developers.cloudflare.com/hyperdrive/
- Neon integration from Cloudflare Workers: https://developers.cloudflare.com/workers/databases/third-party-integrations/neon/
- Hyperdrive with Neon example: https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/
- Queues: https://developers.cloudflare.com/queues/
- Workflows: https://developers.cloudflare.com/workflows/
- Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- R2 public buckets: https://developers.cloudflare.com/r2/buckets/public-buckets/
- R2 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/
- Containers overview: https://developers.cloudflare.com/containers/
- Containers beta info: https://developers.cloudflare.com/containers/beta-info/
- Pages preview deployments: https://developers.cloudflare.com/pages/configuration/preview-deployments/

Neon:

- Introduction: https://neon.com/docs/introduction
- Manage branches: https://neon.com/docs/manage/branches
- Connection pooling: https://neon.com/docs/connect/connection-pooling
- Manage computes: https://neon.com/docs/manage/computes
