# Backend Structure Document

## 1. Backend Architecture

We’re using a serverless, modular design built on Node.js with TypeScript. The backend lives primarily in Supabase (Postgres, Auth, Storage) plus a few Next.js API routes for Stripe webhooks and custom logic.

Key design patterns and frameworks:
- **Modular services**: We separate concerns into modules (ledger, splits, payouts, refunds, disputes, admin, reporting, AI).
- **Event-driven flows**: We use advisory locks and webhooks to process Stripe events, then emit internal events for downstream modules.
- **Role-based access control (RLS)**: Enforced at the database level for security and auditability.
- **Double-entry ledger**: Guarantees every transaction has a matching credit and debit.

How this supports our goals:
- **Scalability**: Supabase scales horizontally for Postgres; serverless functions spin up on demand.
- **Maintainability**: TypeScript types, strict module boundaries, and well-documented API make it easy to onboard new engineers.
- **Performance**: Advisory locks and background jobs (via Supabase functions) keep the main request path fast. On-demand caching can be added later if needed.

---

## 2. Database Management

### Technologies
- **PostgreSQL** (hosted by Supabase)
- **Supabase Auth** for user identity
- **Supabase Storage** for file assets (invoices, reports)

### Data Practices
- **Schema migration** via Supabase migrations CLI.
- **Row-Level Security (RLS)** ensures each user or service only sees the data they’re allowed to.
- **Encryption at rest** handled by Supabase (AES-256).
- **Advisory locks** to ensure no two jobs process the same Stripe webhook or payout run.
- **Backups & point-in-time recovery** provided by Supabase.

---

## 3. Database Schema

### Human-Readable Overview
- **users**: platform users (buyers, hosts, artists, admins) and their roles
- **stripe_accounts**: connected Stripe Express accounts and onboarding status
- **ledger_entries**: double-entry records for every financial movement
- **split_rules**: user-defined or default rules on how to split revenue
- **payouts**: scheduled and instant payout requests with risk flags
- **refunds**: refund events tied back to ledger reversals
- **disputes**: chargebacks and dispute resolution data
- **reports**: metadata for generated CSV/JSON exports
- **anomalies**: AI-detected issues flagged for review
- **audit_logs**: admin overrides and system actions for compliance

### SQL Schema (PostgreSQL)

```sql
-- Users table (buyers, hosts, artists, admins)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL, -- 'buyer', 'host', 'artist', 'admin', 'platform'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stripe Connect accounts
CREATE TABLE stripe_accounts (
  id UUID PRIMARY KEY REFERENCES users(id),
  stripe_account_id TEXT UNIQUE NOT NULL,
  onboarding_status TEXT NOT NULL, -- 'pending', 'completed', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Double-entry ledger
CREATE TABLE ledger_entries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL, -- 'credit' or 'debit'
  event_source TEXT NOT NULL, -- 'stripe_charge', 'refund', 'split', etc.
  reference_id TEXT, -- external ID (like Stripe charge ID)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Revenue split rules
CREATE TABLE split_rules (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID REFERENCES users(id), -- who created it (host or artist)
  name TEXT NOT NULL,
  rules JSONB NOT NULL, -- e.g. [{"recipient_id": ..., "percent": 70}, ...]
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Payout requests
CREATE TABLE payouts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  ledger_entry_id BIGINT REFERENCES ledger_entries(id),
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
  risk_score REAL DEFAULT 0,
  initiated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Refunds
CREATE TABLE refunds (
  id BIGSERIAL PRIMARY KEY,
  stripe_refund_id TEXT UNIQUE NOT NULL,
  original_charge_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'succeeded', 'failed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Disputes
CREATE TABLE disputes (
  id BIGSERIAL PRIMARY KEY,
  stripe_dispute_id TEXT UNIQUE NOT NULL,
  charge_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'needs_response', 'lost', 'won'
  amount_cents BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI anomalies
CREATE TABLE anomalies (
  id BIGSERIAL PRIMARY KEY,
  related_entry_id BIGINT REFERENCES ledger_entries(id),
  description TEXT NOT NULL,
  severity TEXT NOT NULL, -- 'low', 'medium', 'high'
  flagged_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Audit logs
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reports metadata
CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL, -- '1099', 'vat_invoice', 'ledger_export'
  format TEXT NOT NULL, -- 'csv', 'json'
  location TEXT NOT NULL, -- storage path
  generated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 4. API Design and Endpoints

We use RESTful JSON APIs within Next.js App Router (TypeScript). All endpoints require a JWT from Supabase Auth.

### Key Endpoints

- **/api/auth/**
  - Sign-up, login, refresh token (handled by Supabase Auth)

- **/api/stripe/webhook**
  - Receives Stripe events (charges, refunds, disputes)
  - Verifies signature, acquires advisory lock, hands off to event processors

- **/api/ledger/**
  - GET /entries?userId=  — fetch ledger entries
  - POST /entries     — create manual adjustments (admin only)

- **/api/split-rules/**
  - GET /          — list user’s split rules
  - POST /         — create a new split rule
  - PUT /:ruleId   — update existing rule
  - DELETE /:ruleId— delete rule

- **/api/payouts/**
  - POST /initiate — start instant or scheduled payout
  - GET /status    — check payout status

- **/api/refunds/**
  - POST /        — request a refund (buyer or admin)

- **/api/disputes/**
  - GET /open     — list ongoing disputes (admin)
  - POST /comment — add dispute resolution notes

- **/api/admin/**
  - GET /health   — system status
  - POST /override — apply manual changes (audited)

- **/api/reports/**
  - GET /generate — start report generation job
  - GET /download/:id — fetch completed report

- **/api/ai/anomalies/**
  - GET /        — list flagged anomalies
  - POST /resolve— mark as resolved

---

## 5. Hosting Solutions

- **Supabase** for Postgres, Auth, Storage, and Edge Functions.
- **Vercel** for frontend and any edge API routes (mostly for low-latency UI calls).

Benefits:
- High reliability with automated failover (Supabase).
- Global CDN at the edge (Vercel) for fast UI load times.
- Pay-as-you-go pricing keeps costs low in early stages.

---

## 6. Infrastructure Components

- **Load Balancing**: Built in to Supabase (across read replicas) and Vercel edge network.
- **Caching**: Response caching at Vercel edge; we can layer Redis on Supabase if needed.
- **CDN**: Vercel’s global edge network for static assets and API routes.
- **Eventing**: Coliseum (analytics events) and Passport (internal event bus) modules to track and replay events.
- **Job Scheduler**: Supabase cron-like scheduled functions for nightly payouts and report generation.

All components talk over private network links in Supabase and secure HTTPS for any external calls.

---

## 7. Security Measures

- **Authentication & Authorization**
  - Supabase Auth (JWT-based)
  - Role-based access (RLS) on every table
- **Webhook Verification**
  - Stripe signature checks
- **Encryption**
  - Data at rest: AES-256 (Supabase default)
  - In transit: TLS 1.2+
- **PCI-DSS Compliance**
  - We never store raw card data; Stripe handles all sensitive payment data.
  - Transaction records retained per PCI-DSS guidelines.
- **GDPR Compliance**
  - Data deletion endpoints in `/api/auth` and scheduled retention jobs.
- **Key Management**
  - Secrets stored in Supabase environment variables & Vercel secrets.

---

## 8. Monitoring and Maintenance

- **Monitoring Tools**
  - Supabase metrics dashboard (CPU, memory, queries)
  - Custom health checks in `/api/admin/health`
  - Slack alerts in `#treasury-alerts` for critical failures
  - Email alerts to ops mailing list for warnings
- **Logging & Tracing**
  - Audit logs in the database
  - API request logs in Supabase
- **Maintenance**
  - Regular backups (automated daily).
  - Schema migrations via CI/CD (Supabase migrations CLI).
  - Dependency updates on a weekly cadence.
  - On-call rotation for critical alerts.

---

## 9. Conclusion and Overall Backend Summary

Our backend combines the power of Supabase with custom Next.js functions to deliver a secure, auditable, and scalable treasury system for ticketing and content. Key strengths:
- True double-entry ledger with built-in RLS for maximum financial integrity.
- Automated Stripe Connect flows for seamless onboarding, payouts, and webhook handling.
- Flexible split rules managed through a simple UI, with defaults stored in config.
- Robust refund, dispute, and compliance reporting tools.
- AI-driven anomaly detection for extra peace of mind.

Every component has been chosen to keep costs low, performance high, and maintenance simple—so we can focus on delivering value to hosts, creators, and buyers alike.