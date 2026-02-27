# Backend Structure Document

This document outlines the backend setup for the Coliseum Analytics Engine. It explains how the system is built, how data flows through it, and how it stays secure, reliable, and scalable. No deep technical background is required to follow along.

## 1. Backend Architecture

### Overview
The backend is built around a mix of managed services and microservices patterns to handle real-time event ingestion, data processing, and API serving. Key design pillars:

- **Event-Driven Processing**: Incoming Passport events trigger serverless functions for ingestion and aggregation.
- **Managed Databases**: We use Supabase (Postgres) for core data and TimescaleDB for time-series rollups.
- **Caching Layer**: Redis caches hot metrics and leaderboard queries to meet performance targets.
- **Serverless Functions**: Stateless functions handle webhooks, aggregation jobs, and report generation.

### Scalability, Maintainability, Performance
- **Auto-Scaling**: Supabase and Vercel auto-scale functions and databases under load.
- **Separation of Concerns**: Ingestion, aggregation, and API layers are decoupled via queues and serverless boundaries.
- **Horizontal Scaling**: Redis and TimescaleDB can be sharded/clustered as data grows.
- **Code Organization**: Microservices in GitHub monorepo, Dockerized for local parity and CI/CD consistency.

## 2. Database Management

### Technologies Used
- **Supabase (Postgres)**: Primary relational store for users, artists, subscriptions, reports, and audit logs.
- **TimescaleDB** (extension on Postgres): Optimized storage for time-series event metrics and rollups.
- **Redis**: In-memory cache for hot leaderboard queries and rate-limiting counters.

### Data Lifecycle & Access
- **Hot Storage**: 24 months of recent events and rollups in TimescaleDB, queried in real time.
- **Archived Storage**: After 24 months, data moves to a cheaper Postgres archive schema until 36 months.
- **Deletion**: Data older than configured retention is purged automatically, with admin override requests.
- **Access Patterns**:
  - Real-time dashboards read from Redis and TimescaleDB.
  - Report generation jobs read bulk from Postgres.
  - Admin UI reads health metrics from Supabase Realtime.

### Management Practices
- **Backups**: Daily snapshots of Postgres and TimescaleDB.
- **Vacuum & Retention Policies**: Automated scripts to compress old time-series chunks and enforce retention.
- **Migration Tooling**: db-migrate with version-controlled SQL migrations.

## 3. Database Schema

### Human-Readable Description
- **users**: Stores user profiles and entitlements.
- **artists**: List of artists tied to events and leaderboards.
- **events**: Raw event records ingested from Passport (id, type, timestamp, user, artist, metadata).
- **kpi_rollups**: Hourly/daily aggregated metrics per artist.
- **leaderboards_cache**: Cached top-N results per filter set.
- **subscriptions**: Stripe plan info, entitlements, expiration.
- **reports**: Metadata for generated PDF/JSON reports (owner, branding, URL, QR code).
- **audit_logs**: Record of all critical operations and admin actions.

### SQL Schema (Postgres)
```sql
-- Users and Entitlements
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('user','admin')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  plan TEXT CHECK (plan IN ('Basic','Pro','Enterprise')),
  stripe_subscription_id TEXT UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Artists
CREATE TABLE artists (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL
);

-- Raw Events (Time-Series)
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  user_id UUID REFERENCES users(id),
  artist_id UUID REFERENCES artists(id),
  event_metadata JSONB,
  engagement JSONB
);
SELECT create_hypertable('events', 'timestamp');

-- KPI Rollups
CREATE TABLE kpi_rollups (
  id BIGSERIAL PRIMARY KEY,
  artist_id UUID REFERENCES artists(id),
  period_start TIMESTAMPTZ NOT NULL,
  period TEXT CHECK (period IN ('hourly','daily')),
  metrics JSONB,
  UNIQUE (artist_id, period_start, period)
);

-- Cached Leaderboards
CREATE TABLE leaderboards_cache (
  id TEXT PRIMARY KEY, -- e.g. filter hash
  generated_at TIMESTAMPTZ NOT NULL,
  data JSONB
);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT CHECK (type IN ('PDF','JSON')),
  created_at TIMESTAMPTZ DEFAULT now(),
  url TEXT,
  qr_code_url TEXT,
  branding JSONB
);

-- Audit Logs
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```  

## 4. API Design and Endpoints

We use a RESTful approach with clear versioning. Most routes are protected by JWT from Supabase Auth and checked against Stripe entitlements.

### Key Endpoints

- **Authentication & Users** (via Supabase Auth)
  - POST `/auth/signup` – create user
  - POST `/auth/signin` – login

- **Event Ingestion**
  - POST `/webhooks/passport/events` – raw event payloads, idempotent by event_id

- **Metrics & KPIs**
  - GET `/api/v1/kpis?artist_id={}&period={hourly|daily}` – returns aggregated metrics

- **Leaderboards**
  - GET `/api/v1/leaderboards?artist_id={}&time_window={}&city={}&genre={}&page={}`
    • Response cached in Redis

- **Report Generation**
  - POST `/api/v1/reports` – request new PDF/JSON report
  - GET `/api/v1/reports/{report_id}` – download link

- **Admin Monitoring**
  - GET `/api/v1/admin/health` – queue depths, error rates, p95 latencies
  - GET `/api/v1/admin/audit-logs` – paginated admin actions

- **Subscription Management**
  - GET `/api/v1/subscriptions` – current plan & entitlements
  - POST `/api/v1/subscriptions/upgrade` – Stripe checkout session

## 5. Hosting Solutions

- **Supabase**
  - Hosts Postgres, Auth, Storage, Realtime features.
  - Benefits: built-in APIs, row-level security, managed scaling, daily backups.

- **Vercel**
  - Hosts serverless functions (API routes) and frontend Next.js app.
  - Benefits: global CDN, instant cache invalidation, zero-config SSL.

- **Redis**
  - Managed Redis cluster (e.g., Upstash or Redis Labs).
  - Benefits: high throughput, automatic failover, in-memory caching.

## 6. Infrastructure Components

- **Load Balancer / CDN**: Vercel’s global network handles HTTP traffic and static assets.
- **Queue System**: Supabase Realtime + background workers for ingestion and aggregation.
- **Cache Layer**: Redis for leaderboards and rate-limiting counters.
- **Backup & Archival Storage**: Supabase Storage for archived data dumps.

## 7. Security Measures

- **Authentication & Authorization**
  - Supabase Auth with JWTs.
  - Row-Level Security policies in Postgres ensure users only read their own data.
  - Plan-gated routes validated via subscription middleware.

- **Encryption**
  - TLS for all in-transit data.
  - At-rest encryption on Postgres, TimescaleDB, and Redis.

- **Rate Limiting**
  - Redis-based counters enforce per-user and per-endpoint limits.

- **Input Validation**
  - Webhook payloads validated against JSON schemas.
  - File uploads scanned for malware and size limits.

- **Audit Trails**
  - Critical actions logged to `audit_logs` with user ID and details.

- **Compliance**
  - GDPR/CCPA data deletion workflows.
  - Data retention enforcement and user data export endpoints.

## 8. Monitoring and Maintenance

- **Error Tracking**: Sentry captures exceptions from serverless functions.
- **Performance Metrics**: Supabase Realtime and custom Prometheus metrics for queue depths, p95 latencies.
- **Alerts & On-Call**:
  - Slack/email alerts for error rate >2%, queue depth >1000, latency >30s p95.
  - PagerDuty escalation for critical failures.

- **CI/CD**: GitHub Actions runs lint, tests, and deploys Docker images and migrations on merge.
- **Maintenance Windows**: Monthly maintenance for OS and Postgres upgrades, announced 48h in advance.

## 9. Conclusion and Overall Backend Summary

The Coliseum Analytics Engine backend combines managed services (Supabase, Vercel, Redis) with event-driven patterns to deliver a highly scalable, secure, and maintainable system. Real-time ingestion, time-series rollups, and cached leaderboards ensure performance at scale. Stripe-based entitlements gate features cleanly, while robust monitoring and security practices keep data safe and compliant. This setup aligns with the project’s goals of quick time-to-market, gladiator-style branding, and enterprise-grade analytics.