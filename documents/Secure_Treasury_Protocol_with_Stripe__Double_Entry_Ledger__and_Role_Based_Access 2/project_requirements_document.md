# Project Requirements Document

## 1. Project Overview

We’re building a secure, auditable treasury protocol that lives at the heart of a ticketing and content platform. It handles everything from ticket sales, tips, subscriptions, and brand offers through to final payouts and refunds. By using Stripe Connect (Express) for movement of funds, a double-entry ledger for financial truth, and tight role-based access control, we ensure every dollar is tracked, split, held or released exactly as intended. Event and analytics hooks feed real-time insights, while audit trails and alerts keep administrators in control.

Our goal is to deliver a bulletproof money-management engine that any Artist, Host, Brand or Buyer can trust. Success means zero reconciliation errors, sub-second ledger writes, Stripe integration with 100% webhook reliability, and clear dashboards for users and admins. We’ll meet PCI-DSS and GDPR requirements with configurable data-retention and deletion policies, prepare groundwork for instant payouts, smart-contract hooks, multi-currency support and advanced AI-driven anomaly detection in future phases.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (Version 1.0)

*   **User onboarding** via Stripe Connect Express for Artists and Hosts.
*   **Buyer payment flow** using Stripe Checkout sessions for tickets, tips, subscriptions, and brand offers.
*   **Webhook ingestion** with idempotent handlers, advisory locks, and signature verification.
*   **Double-entry ledger** with paired debit/credit entries, immutable metadata, and Row-Level Security (RLS) by role.
*   **Automated splits & transfers** based on user-defined rules (UI) and platform defaults (config).
*   **Payout scheduling** (nightly batches) and **instant payout engine** with cool-off windows and risk scoring.
*   **Refunds, disputes & chargeback** workflows with reversal entries and negative-balance handling.
*   **Admin dashboards** for monitoring health, queue depths, reserves, audit logs and overrides.
*   **Export & reporting** tools for CSV/JSON reports, 1099s (US) and VAT invoices (EU).
*   **Monitoring & alerts** routed to a private Slack channel (`#treasury-alerts`) and operations email list by severity.
*   **AI assistance** hooks for documentation, ledger anomaly detection, and support chat via GPT-4o or Claude 3.5 Sonnet.

### Out-of-Scope (Later Phases)

*   Multi-currency FX or crypto payouts (USD only at launch).
*   On-chain smart contract deployment (we’ll simulate logic off-chain in v1).
*   Advanced tax automation for jurisdictions beyond US/EU.
*   Mobile-native apps (web only).
*   Deep AI-driven forecasting dashboards.
*   Complete dark/light theming beyond base “dark-futuristic” UI.

## 3. User Flow

A new Artist or Host visits the web app, clicks “Get Started,” and signs up with email or OAuth. They’re guided through a Stripe Connect Express widget to link their bank account. Once complete, they land on a dark-themed dashboard showing their current balance, recent transactions, and prompts to set up split rules or request payouts. Side navigation offers quick links to Events (for Hosts), Releases (for Artists), Payouts, and Settings. Behind the scenes, Passport events track onboarding steps and Coliseum collects analytics data.

A Buyer browses upcoming events or artist pages, selects a ticket or subscription, and clicks “Checkout.” The frontend creates a Stripe Checkout session and redirects them to enter payment details. After payment, a webhook updates the ledger: debiting the Buyer’s virtual account, crediting the platform reserve, and emitting events to Passport and Coliseum. The Buyer returns to a confirmation screen, sees the item in their purchase history, and receives an email receipt. Meanwhile, the system calculates splits and schedules transfers to Hosts, Artists, and Brands per their rules, all visible in each participant’s dashboard.

## 4. Core Features

*   **Double-Entry Ledger**\
    • Paired debit and credit entries for every money movement\
    • Immutable metadata: timestamps, Stripe IDs, role IDs, correlation IDs\
    • RLS policies enforce that each role sees only permitted data
*   **Stripe Connect Onboarding & Payments**\
    • Embedded Express onboarding for Artists and Hosts\
    • Stripe Checkout sessions for ticket, tip, subscription, brand offers\
    • Idempotent webhook handlers with signature checks and advisory locks
*   **Automated Splits & Transfers**\
    • UI for Hosts to define percent-based splits; defaults in config files\
    • Eligibility checks on reserves and risk score before scheduling transfers\
    • Ledger entries for each payee’s share, plus holds if risk thresholds are exceeded
*   **Payout Scheduling & Instant Engine**\
    • Nightly batch runner for scheduled payouts\
    • Instant payout path with configurable cool-off periods and risk scoring\
    • Exponential backoff retries and escalation for persistent failures
*   **Refunds, Disputes & Chargebacks**\
    • Full lifecycle handling via webhooks or manual requests\
    • Reversal ledger entries and negative-balance flags\
    • Admin notifications and manual intervention flows
*   **Admin Dashboards & Overrides**\
    • Real-time system health, queue depths, reserves, audit logs\
    • Slack/email alerts by severity: Critical, Warning, Info\
    • Manual override tools with KMS-protected secrets and audit trails
*   **Export & Reporting Tools**\
    • On-demand and scheduled CSV/JSON exports\
    • 1099 form generation (US) and VAT invoices (EU)\
    • GDPR-compliant masking and configurable retention
*   **AI Integration Points**\
    • GPT-4o / Claude 3.5 for anomaly detection, documentation auto-generation, support chat\
    • Hooks in monitoring pipeline and admin console

## 5. Tech Stack & Tools

*   **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn UI components
*   **Backend**: Node.js with TypeScript, Supabase (Postgres DB, Auth, Storage), custom scheduler
*   **Payments**: Stripe Connect (Express), Stripe Checkout, Webhook API
*   **Analytics & Events**: Coliseum analytics module, Passport event module
*   **Monitoring & Alerts**: Custom dashboards, Slack (`#treasury-alerts`), email notifications
*   **AI**: GPT-4o or Claude 3.5 Sonnet for documentation, anomaly detection, chat support
*   **Hosting & CI/CD**: Frontend on Vercel, Supabase-managed backend, Vercel pipeline + Supabase migrations
*   **Security & Secrets**: Supabase RLS, KMS for secret storage, encrypted connections, PCI-DSS compliance

## 6. Non-Functional Requirements

*   **Performance**:\
    • API responses under 200 ms for critical endpoints\
    • Dashboard loads under 2 s on 3G mobile\
    • Webhook processing queue depth under 100 events
*   **Security & Compliance**:\
    • PCI-DSS adherence for payment data; GDPR for personal data\
    • RLS ensures least-privilege data access per role\
    • All sensitive data encrypted at rest and in transit\
    • Audit logs immutable and retained 1–7 years (configurable)
*   **Reliability & Scalability**:\
    • Idempotent webhooks and advisory locks to prevent race conditions\
    • Automatic retries with backoff; horizontal scaling of worker processes\
    • 99.9% uptime SLA for core transaction flows
*   **Usability & Accessibility**:\
    • Dark-futuristic theme, responsive design\
    • WCAG 2.1 AA compliance for key screens\
    • Clear error messages and onboarding tooltips

## 7. Constraints & Assumptions

*   **Stripe Connect Express** must support required Onboarding and Payout APIs.
*   **Supabase** provides Postgres, RLS, Auth and Storage as core services.
*   Single-currency (USD) launch; multi-currency and crypto deferred.
*   Smart-contract logic simulated server-side until v2 on EVM chains.
*   Coliseum and Passport API docs available but may need clarification.
*   Email/Slack alert routing relies on dedicated channels and mailing lists.
*   Users define splits via UI; underlying rules live in config until finalized.
*   GDPR deletion workflows assume Supabase can purge personal data on schedule.

## 8. Known Issues & Potential Pitfalls

*   **Webhook Duplicates & Rate Limits**\
    • Mitigation: idempotency keys, advisory locks, exponential backoff.
*   **Race Conditions in Splits & Holds**\
    • Mitigation: database advisory locks around split calculations, strict transaction boundaries.
*   **Data-Retention Policies Conflicts**\
    • Mitigation: configurable retention window per record type, automated purge jobs.
*   **Risk-Scoring False Positives**\
    • Mitigation: adjustable thresholds, manual review queue with admin overrides.
*   **Scaling Instant Payout Engine**\
    • Mitigation: isolate instant payouts into dedicated worker pool, monitor queue depth.
*   **Incomplete External API Specs**\
    • Mitigation: stub integrations early; collaborate with Coliseum/Passport teams for clarifications.
*   **CI/CD & Migration Failures**\
    • Mitigation: enforce migration review, backup strategies, roll-back runbooks.

This document serves as the single source of truth for the AI model and development teams. It spells out exactly what the protocol must do, which technologies to use, and how users will interact with every piece—from onboarding and payments through ledger entries, splits, payouts, and audits—without leaving room for guesswork.
