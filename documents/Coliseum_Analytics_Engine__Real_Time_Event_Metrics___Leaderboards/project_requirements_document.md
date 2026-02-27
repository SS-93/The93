# Coliseum Analytics Engine – Project Requirements Document

## 1. Project Overview

The Coliseum Analytics Engine is a production-ready analytics layer that continuously ingests real-time event data from the Passport system (plays, votes, attendance, revenue, engagement) and unified external signals. It transforms raw events into actionable KPIs, leaderboards, impact analyses, and brand/right-holder intelligence. Users at various entitlement levels access dashboards and reports that feel like a grand arena—complete with “Coliseum orange” accents, Roman-inscription style fonts, and 3D-inspired UI flourishes—to monitor performance in near real time.

This engine is being built to solve the gap between fragmented event data and meaningful insights for artists, event hosts, brands, and admins. Key objectives for Sprint 1 (MVP) include:

*   **High-throughput ingestion** of 100k+ events/day with idempotent processing and hourly/daily rollups
*   **Real-time leaderboards** and KPI tiles that update under 30 s (p95)
*   **Pre-configured PDF/JSON report generation** with shareable links and QR codes
*   **Plan-based access gating** via Stripe (Basic, Pro, Enterprise)
*   **Admin monitoring** of pipeline health (queue depth, error rates, latency)\
    Success is measured by meeting performance SLAs, enforcing entitlements correctly, ensuring data security/compliance, and delivering a smooth, “video-game meets gladiator” user experience.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Sprint 1/MVP)

*   Real-time JSON webhook ingestion from Passport
*   Idempotent event processing, Redis caching, TimescaleDB for rollups
*   Dashboard with KPI tiles (plays, votes, attendance, revenue, engagement) and time-range switcher
*   Global and event-specific leaderboards (filters: time window, city, genre; pagination)
*   PDF and JSON report generation with shareable links & QR codes
*   Stripe-based entitlements: Basic, Pro, Enterprise plans enforcing feature/usage caps
*   Admin (DIA) dashboard: queue depth, error rates, latency charts; pause/resume processing; audit logs
*   Data retention policy: 24 months hot, 12 months archived, then deletion; early/extended retention requests
*   Deployment on Vercel (frontend) and Supabase services; Docker for dev consistency; CI/CD pipelines

### Out-of-Scope / Future Phases

*   Full OCR-driven impact analysis via user-uploaded screenshots or documents
*   Social sentiment analysis or automated brand matching
*   External API backfills beyond Passport feeds
*   White-label embed widgets for third-party sites
*   Advanced ML (beyond optional GPT-4o for OCR error correction)
*   Mobile/native apps (focus is web first)

## 3. User Flow

A new user lands on the Coliseum Analytics Engine login screen, authenticates via Supabase Auth (email/password or social sign-on), and is routed to the main dashboard. Based on their Stripe plan, the UI immediately shows or hides gated features—Basic users see view-only leaderboards refreshed every 5 minutes, Pro users get 60 s updates and API access, Enterprise users enjoy sub-30 s real-time WebSocket leaderboards. The left sidebar provides tabs for Event Analytics, Global Leaderboards, DIA Admin (if permitted), and Account settings.

In the Event Analytics tab, KPI tiles pulse with live data, and users pick time intervals (hourly, daily, custom). Scrolling down reveals filterable leaderboards. To generate a report, users click “Generate Report,” choose PDF or JSON, and receive a QR code/shareable link styled with Coliseum orange accents. Admins switch to the DIA panel to monitor ingestion metrics, pause/resume the pipeline, and review audit logs. Throughout, entitlement banners prompt upgrades when locked features are accessed. Finally, users logout via a secure Supabase sign-out, revoking row-level access immediately.

## 4. Core Features

*   **Real-Time Event Ingestion & Aggregation**\
    • Webhook endpoint accepts JSON payloads (event_id, type, timestamp, user_id, artist_id, metadata, engagement).\
    • Idempotent writes to Postgres; hourly/daily rollups in TimescaleDB.\
    • Redis layer caches hot queries to meet p95 < 30 s.
*   **Leaderboards & KPI Tiles**\
    • Global and per-event leaderboards with filters (time window, city, genre) and pagination.\
    • KPI tiles (plays, votes, attendance, revenue, engagement) with live updates via Supabase Realtime or WebSocket.
*   **Report Generation**\
    • On-demand PDF and JSON reports stored in Supabase Storage.\
    • QR code and shareable link generation.\
    • Watermarks or custom branding based on plan.\
    • Configurable expiration of shared links.
*   **Stripe-Based Entitlements**\
    • Three plans (Basic, Pro, Enterprise) with enforced quotas (refresh rate, OCR calls, data retention, API rate limits).\
    • Server-side guards and rate limiting.
*   **DIA Admin Dashboard**\
    • Queue depth, error rate, and latency charts via Supabase Realtime & Sentry.\
    • Pause/resume controls for ingestion pipeline.\
    • Real-time audit log viewer.
*   **Data Retention & Compliance**\
    • 24 months hot storage, 12 months archive, then deletion.\
    • GDPR and CCPA compliance: consent capture, data access/deletion endpoints, encryption at rest/in transit, audit trails.
*   **Monitoring & Alerts**\
    • Sentry for error tracking.\
    • Alerts on queue depth > 1000, error rate > 2% over 10 min, or p95 latency > 30 s.\
    • Notifications to Slack, email; PagerDuty for critical failures.

## 5. Tech Stack & Tools

*   **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
*   **Backend & Storage**:\
    • Supabase (Postgres for OLTP, Auth, Storage, Realtime)\
    • TimescaleDB extension for time-series rollups\
    • Redis for caching
*   **Payments & Entitlements**: Stripe + Treasury Protocol
*   **OCR & AI (scaffolded)**: Google Vision or AWS Textract APIs; potential GPT-4o for OCR error correction (future)
*   **Monitoring**: Sentry, Supabase Realtime widgets
*   **CI/CD & Deployment**: Vercel (frontend), Supabase built-in deploys, Docker for local/dev
*   **IDE/Plugins**: VS Code with Windsurf, Cursor integration (optional)

## 6. Non-Functional Requirements

*   **Performance**:\
    • Ingest 100k+ events/day, serve 500+ concurrent requests\
    • Leaderboard and KPI updates within 30 s (p95)
*   **Reliability**: 99.9% uptime; automated retries and dead-letter queues for failed events
*   **Security & Compliance**:\
    • Encryption at rest (AES-256) and in transit (TLS 1.2+)\
    • Row-level security policies in Postgres\
    • GDPR/CCPA support: user consent, data subject requests
*   **Usability**:\
    • Intuitive, game-inspired UI with accessible components\
    • Responsive design for desktop/tablet
*   **Maintainability**:\
    • Clear code structure, documented APIs, automated tests (unit, integration, performance)

## 7. Constraints & Assumptions

*   Passport system supports real-time JSON webhooks in the agreed schema.
*   OCR uploads are deferred; OCR pipeline architecture in place for future.
*   GPT-4o availability is subject to OpenAI API limits.
*   Supabase and Vercel services remain within plan quotas for storage, bandwidth, and function calls.
*   Users require Stripe-managed payment flows; any custom billing logic is out of scope.
*   Branding assets (fonts, logos) will be provided before full UI polish.

## 8. Known Issues & Potential Pitfalls

*   **Webhook Burst Handling**: Sudden spikes may overflow the ingestion queue—mitigate with auto-scaling worker pools and dead-letter queues.
*   **API Rate Limits**: Stripe, OCR, and GPT-4o calls could hit quotas—add exponential backoff and usage dashboards for early warning.
*   **Schema Evolution**: Future event metadata changes require versioning; include a `schema_version` field and migration strategy.
*   **OCR Accuracy**: If OCR is reintroduced, template mismatch or image quality can cause errors—capture confidence scores and fallback heuristics.
*   **Compliance Drift**: New regional regulations may emerge—schedule periodic audits and modularize privacy/privacy-policy logic for easy updates.

This document delivers a clear, unambiguous foundation for all subsequent technical artifacts—frontend guidelines, backend structure, file organization, and flowcharts—ensuring the Coliseum Analytics Engine is built smoothly and iteratively.
