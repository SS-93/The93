# Backend Structure Document

This document outlines the backend setup for the Compañon Brand Activation Dashboard. It covers the architecture, database, APIs, hosting, infrastructure, security, monitoring, and maintenance to provide a clear, non-technical overview.

## 1. Backend Architecture

**Overview:**

*   We use Supabase as our primary backend platform, offering a managed PostgreSQL database, authentication, storage, and real-time capabilities.
*   An internal API gateway (Passport) handles routing, orchestration, and audit logging for downstream services (Coliseum, Concierto, Locker, CALS, Stripe).
*   Real-time analytics events flow through Supabase’s real-time engine and Coliseum, feeding live dashboards.
*   AI/ML services (GPT-4o or Claude 3.5 Sonnet) are invoked via serverless functions for sentiment analysis and trend predictions.
*   Docker is used for local development to mirror the production environment.

**Design Patterns & Frameworks:**

*   Layered Architecture:

    1.  **API Layer** (REST endpoints via Supabase Edge Functions)
    2.  **Business Logic Layer** (Edge Functions, Passport)
    3.  **Data Layer** (PostgreSQL with Row-Level Security)

*   Event-Driven: user actions and campaign events emit messages for analytics and fraud detection pipelines.

*   Modular Services: each integration (Stripe, MediaID, Coliseum) lives in its own module behind Passport.

**Scalability, Maintainability & Performance:**

*   Supabase’s managed Postgres scales vertically and horizontally for peak loads.
*   Edge Functions auto-scale globally, reducing latency.
*   RLS enforces multi-tenant security at the database level, simplifying application code.
*   Caching static responses at the edge (Vercel, Supabase CDN) accelerates repeated queries.

## 2. Database Management

**Database Technology:**

*   PostgreSQL (via Supabase)
*   Row-Level Security (RLS) for multi-tenant data isolation and privacy.

**Data Structure & Access:**

*   Relational schema organizing brands, users, campaigns, audiences, engagements, consents, and payments.
*   Storage for uploaded assets (images, videos) in Supabase Storage.
*   Real-time subscriptions to table changes power live dashboards and notifications.

**Data Management Practices:**

*   Automated hourly backups with point-in-time recovery.
*   Migration scripts using Supabase Migrations CLI for schema changes.
*   Periodic VACUUM and indexing to maintain performance.

## 3. Database Schema

### Human-Readable Overview

*   **users**: platform accounts (brands, managers, creators, fans).
*   **roles**: defines user permissions (Brand Admin, Campaign Manager, Creator, Fan, System Admin).
*   **brands**: brand profiles and settings.
*   **campaigns**: details for Locker Drops, Event Partnerships, QR activations.
*   **audience_segments**: saved segments built via the DNA Query Builder.
*   **segment_queries**: raw query definitions for MediaID DNA.
*   **campaign_audience**: many-to-many mapping between campaigns and segments.
*   **consents**: user opt-in records with tier details.
*   **contacts**: CRM contacts and engagement history.
*   **qr_scans**: logs of QR activations, device fingerprint, geofence status, timestamps.
*   **device_fingerprints**: profiles to detect fraud and enforce scan limits.
*   **audit_logs**: Passport-generated logs for all sensitive actions.
*   **subscriptions**, **payments**, **coupons**: local mirrors of Stripe billing data.

### SQL Schema (PostgreSQL)

`-- Users & Roles CREATE TABLE roles ( id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL -- e.g. 'Brand Admin', 'Fan' ); CREATE TABLE users ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role_id INT REFERENCES roles(id), brand_id UUID REFERENCES brands(id), created_at TIMESTAMPTZ DEFAULT now() ); -- Brands CREATE TABLE brands ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, settings JSONB, created_at TIMESTAMPTZ DEFAULT now() ); -- Campaigns CREATE TABLE campaigns ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), brand_id UUID REFERENCES brands(id), type TEXT NOT NULL, -- 'Locker', 'Event', 'QR' name TEXT NOT NULL, status TEXT NOT NULL, -- 'Draft', 'Active', 'Paused', 'Completed' config JSONB, -- geofence, scan_limit, consent tiers created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ ); -- Audience Segments CREATE TABLE audience_segments ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), brand_id UUID REFERENCES brands(id), name TEXT NOT NULL, preview JSONB, -- aggregated counts created_at TIMESTAMPTZ DEFAULT now() ); CREATE TABLE segment_queries ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), segment_id UUID REFERENCES audience_segments(id), query_definition JSONB, -- MediaID DNA filters created_at TIMESTAMPTZ DEFAULT now() ); -- Campaign ↔ Audience mapping CREATE TABLE campaign_audience ( campaign_id UUID REFERENCES campaigns(id), segment_id UUID REFERENCES audience_segments(id), PRIMARY KEY (campaign_id, segment_id) ); -- Consents CREATE TABLE consents ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id), consent_tier TEXT NOT NULL, granted_at TIMESTAMPTZ DEFAULT now(), revoked_at TIMESTAMPTZ ); -- CRM Contacts & Engagement CREATE TABLE contacts ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), brand_id UUID REFERENCES brands(id), user_id UUID REFERENCES users(id), properties JSONB, -- custom fields created_at TIMESTAMPTZ DEFAULT now() ); -- QR Scans & Device Fingerprints CREATE TABLE device_fingerprints ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), fingerprint_hash TEXT UNIQUE NOT NULL, first_seen TIMESTAMPTZ DEFAULT now() ); CREATE TABLE qr_scans ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id UUID REFERENCES campaigns(id), user_id UUID REFERENCES users(id), device_fp_id UUID REFERENCES device_fingerprints(id), location GEOGRAPHY(POINT), scan_time TIMESTAMPTZ DEFAULT now(), flagged BOOLEAN DEFAULT FALSE ); -- Audit Logs CREATE TABLE audit_logs ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, action TEXT NOT NULL, table_name TEXT, record_id UUID, timestamp TIMESTAMPTZ DEFAULT now(), details JSONB ); -- Stripe Billing CREATE TABLE subscriptions ( id TEXT PRIMARY KEY, -- Stripe subscription ID user_id UUID REFERENCES users(id), plan_id TEXT, status TEXT, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ ); CREATE TABLE payments ( id TEXT PRIMARY KEY, -- Stripe payment intent user_id UUID REFERENCES users(id), amount_cents INT, currency TEXT, status TEXT, created_at TIMESTAMPTZ ); CREATE TABLE coupons ( id TEXT PRIMARY KEY, discount_percent INT, expires_at TIMESTAMPTZ );`

## 4. API Design and Endpoints

We follow a RESTful approach with versioned endpoints under `/api/v1` and standardized request/response formats.

**Authentication & User Management:**

*   POST `/api/v1/auth/signup` — create account, trigger email verification and consent flow
*   POST `/api/v1/auth/login` — obtain JWT token
*   POST `/api/v1/auth/logout` — revoke session

**Brand & Profile:**

*   GET `/api/v1/brands` — list brands (admins only)
*   POST `/api/v1/brands` — create new brand (system admins)
*   GET `/api/v1/users/me` — current user profile
*   PUT `/api/v1/users/me` — update profile and consent tiers

**Consent & Privacy:**

*   GET `/api/v1/consents` — list user consents
*   POST `/api/v1/consents` — grant new consent
*   DELETE `/api/v1/consents/{id}` — revoke consent

**Campaigns & Audiences:**

*   GET `/api/v1/campaigns` — list campaigns for brand
*   POST `/api/v1/campaigns` — create new campaign
*   GET `/api/v1/campaigns/{id}` — campaign details
*   PUT `/api/v1/campaigns/{id}` — update campaign
*   POST `/api/v1/campaigns/{id}/launch` — activate campaign
*   GET `/api/v1/audiences` — list audience segments
*   POST `/api/v1/audiences` — create segment
*   GET `/api/v1/audiences/{id}/preview` — realtime counts

**Analytics & CRM:**

*   GET `/api/v1/analytics/overview` — real-time metrics (reach, engagement, ROI)
*   GET `/api/v1/analytics/trends` — AI-powered trend predictions
*   GET `/api/v1/crm/contacts` — list contacts
*   GET `/api/v1/crm/contacts/{id}` — contact detail

**QR Activation (Mobile):**

*   POST `/api/v1/qr/scan` — record scan, enforce limits, geofence
*   GET `/api/v1/qr/{campaignId}/survey` — deliver consent flow and survey questions

**Billing & Payments:**

*   GET `/api/v1/payments/plans` — list subscription plans
*   POST `/api/v1/payments/subscribe` — create subscription via Stripe
*   POST `/api/v1/payments/charge` — one-time payment
*   POST `/api/v1/payments/coupons` — validate coupon code

## 5. Hosting Solutions

*   **Supabase (Backend):** managed PostgreSQL, Auth, Storage, Edge Functions. Offers high availability, automatic scaling, and built-in RLS.
*   **Vercel (Frontend & Edge CDN):** global CDN, zero-config deployments, serverless function hosting for any custom APIs.
*   **Docker (Local Dev):** mirrors production services (Postgres, Edge Functions) for consistent testing.

**Benefits:**

*   Reliability: SLA-backed services, automated failover.
*   Scalability: seamless scaling for database and serverless functions.
*   Cost-Effectiveness: pay-as-you-go pricing, minimal DevOps overhead.

## 6. Infrastructure Components

*   **Load Balancer:** Vercel’s built-in load balancing for frontend and API routes.
*   **Content Delivery Network (CDN):** Vercel + Supabase Storage CDN for static assets and media files.
*   **Caching:** Edge caching for frequently requested data; HTTP caching headers; optional Redis layer for heavy analytical queries.
*   **API Gateway:** Passport handles routing to internal services, enforces policies, and captures audit logs.
*   **Queue & Event Bus:** Supabase Realtime + PostgreSQL NOTIFY for events; optional external queue (e.g., RabbitMQ) for complex workflows (fraud detection reviews).
*   **Storage:** Supabase Storage for user-uploaded assets (images, videos, survey media).

## 7. Security Measures

*   **Authentication:** Supabase Auth with JWT tokens, email/password, OAuth providers if needed.
*   **Authorization:** Role-based access control enforced in application logic and at the database using RLS policies.
*   **Data Encryption:** TLS for data in transit; AES-256 for data at rest (managed by Supabase).
*   **Audit Logging:** Passport logs all data access and admin actions to `audit_logs`.
*   **Consent Management:** Tiered consent stored in `consents`; UI prompts required before sensitive operations.
*   **Anti-Fraud:** Device fingerprinting, geofence checks, scan limits per device/user, flagged scans routed for manual review.
*   **Compliance:** GDPR/CCPA data deletion endpoints; periodic privacy audits.

## 8. Monitoring and Maintenance

*   **Performance Monitoring:** Supabase dashboard for DB metrics; Vercel Analytics for frontend; Datadog or New Relic for end-to-end tracing.
*   **Error Tracking:** Sentry for backend Edge Functions and frontend.
*   **Logs & Alerts:** Centralized logs in Supabase; alerts for slow queries, high error rates, unusual campaigns.
*   **Backups & Recovery:** Automated daily backups; point-in-time restore capability.
*   **CI/CD:** GitHub Actions or GitLab CI automates tests, migrations, and deployments to staging/production.

## 9. Conclusion and Overall Backend Summary

The Compañon backend is built on a robust, scalable, and secure foundation using Supabase and Vercel. Key strengths include:

*   A unified, managed platform (Supabase) for database, auth, storage, and real-time features.
*   A clear separation of concerns via Passport as an API gateway and audit logger.
*   Strong data protection through RLS, encrypted communications, and tiered consent.
*   Real-time analytics and AI-driven insights to meet the project’s performance and privacy goals.
*   Modular integrations with Stripe, MediaID DNA, Coliseum, and internal services for future growth.

This setup ensures a maintainable, high-performing, and compliant backend that aligns with Compañon’s mission to deliver precise audience targeting, seamless campaign management, and privacy-first engagement analytics.
