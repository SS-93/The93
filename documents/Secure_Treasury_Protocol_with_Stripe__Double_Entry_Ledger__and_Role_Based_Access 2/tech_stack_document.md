# Tech Stack Document

This document explains the technology choices for our secure, auditable treasury protocol in simple, everyday language. You’ll learn why each tool and service was picked, how they work together, and how they help us meet our goals of security, compliance, and ease of use.

## 1. Frontend Technologies
We want the user interface to be fast, responsive, and easy to update. Here’s what we’ve chosen:

- **Next.js 14 (App Router)**
  - A popular framework built on React that lets us render pages quickly, handle routing automatically, and split code so users only download what they need.
- **TypeScript**
  - A version of JavaScript with extra checks that catch errors early, making our code more reliable and easier to maintain.
- **Tailwind CSS**
  - A utility-first styling tool that provides small, reusable CSS classes—so we can build consistent, dark-futuristic designs (think Spotify-style gradients) without writing a lot of custom code.
- **shadcn UI**
  - A library of accessible, pre-built components (buttons, forms, modals, etc.) that speed up development and ensure a consistent look-and-feel.

How this helps our users:

- Pages load quickly and feel snappy.
- The dark-futuristic theme is easy to tweak and keeps the interface modern.
- Accessibility and consistency are built in from the start.

## 2. Backend Technologies
Behind the scenes, we need a robust system to handle payments, ledger entries, and user data. Here’s our setup:

- **Node.js with TypeScript**
  - A server environment that runs JavaScript code. TypeScript adds type safety so we catch mistakes early and refactor with confidence.
- **Supabase (Postgres Database)**
  - Our main database is PostgreSQL hosted by Supabase. It stores all financial records, ledger entries, user profiles, and configuration rules.
- **Supabase Auth**
  - Manages user sign-up, sign-in, and secure session handling.
- **Supabase Storage**
  - Stores generated reports, exports, and any other file assets (e.g., CSV/JSON downloads).
- **Stripe Connect (Express)**
  - Handles payments, onboarding of Artists and Hosts, transfers, and payouts. We rely on Stripe’s secure APIs and webhook events to keep our money flows accurate.

How these pieces work together:

1. A user action on the frontend calls our Node.js API.  
2. We store or fetch data in Postgres via Supabase.  
3. For payments, we call Stripe’s API and listen to webhooks (events) to trigger ledger entries.  
4. Supabase Auth ensures only the right people see the right data (using row-level security).  
5. Supabase Storage handles file-based exports for compliance and reporting.

## 3. Infrastructure and Deployment
We want reliable hosting, smooth updates, and clear version control:

- **Vercel**
  - Hosts our Next.js frontend. Every time we push to our Git repository, Vercel automatically builds and deploys the latest version.
- **Supabase Hosting**
  - Manages our Postgres database, Auth, and Storage with built-in tools for schema migrations.
- **Git & GitHub**
  - Stores all code and provides pull-request workflows for safe collaboration and code reviews.
- **CI/CD Pipelines**
  - Vercel’s built-in pipeline for the frontend and Supabase migration tools for the backend ensure that new features and fixes get rolled out smoothly.
- **Scheduler / Cron Jobs**
  - We run nightly jobs for batch payouts, retries, and report generation using Supabase’s scheduling features or a simple cron setup.

Why this matters:

- Automated deployments reduce human error.  
- Version control (Git) gives us a clear history and rollback path.  
- Scheduled tasks keep financial operations on time without manual intervention.

## 4. Third-Party Integrations
To avoid reinventing the wheel, we integrate with best-in-class services:

- **Stripe Connect (Express)**  
  Payment processing, transfers, payouts, webhooks, dispute handling.
- **Coliseum Analytics Module**  
  Captures revenue metrics, leaderboards, and real-time dashboards.
- **Passport Event Module**  
  Emits audit and analytics events at key moments (e.g., ledger entry creation).
- **Slack Alerts**  
  Critical and warning notifications routed to a private channel (e.g., #treasury-alerts).
- **Email Alerts**  
  Daily digests and immediate notifications for operations via a dedicated email list.
- **AI Services (GPT-4o, Claude 3.5 Sonnet)**  
  Assist with documentation generation, anomaly detection in the ledger, and support chatbots.

Benefits:

- Faster development by leveraging proven platforms.  
- Real-time visibility into financial health.  
- Proactive alerts keep our team informed and responsive.

## 5. Security and Performance Considerations
Security and speed are top priorities when handling money. Here’s what we’ve put in place:

- **Row-Level Security (RLS)**  
  Ensures each user role (Platform, Artist, Host, Buyer, Brand, Admin) only sees what they’re allowed to see in the database.
- **Key Management Service (KMS)**  
  Encrypts sensitive configuration and secrets at rest.
- **Stripe Webhook Verification**  
  Every incoming webhook is signature-verified and processed idempotently (so we never double-count an event).
- **Advisory Locks in Postgres**  
  Prevent race conditions when multiple webhooks or jobs try to update the same ledger records simultaneously.
- **Audit Trails and Immutable Metadata**  
  Every ledger entry includes timestamps, user IDs, correlation IDs, and Stripe IDs. We never overwrite past data—just add reversal entries for refunds or disputes.
- **Testing Strategy**  
  Comprehensive unit tests, integration tests, and load tests ensure correctness and performance at scale.
- **Performance Optimizations**  
  - Database indexes on critical columns (timestamps, IDs)  
  - Batched writes for large jobs (payout scheduling)  
  - Caching non-sensitive configuration where possible

## 6. Conclusion and Overall Tech Stack Summary
We chose a combination of modern, battle-tested tools that balance developer productivity, end-user experience, and rock-solid security:

- Frontend: Next.js 14, TypeScript, Tailwind CSS, shadcn UI  
- Backend: Node.js with TypeScript, Supabase (Postgres, Auth, Storage)  
- Payments: Stripe Connect (Express)  
- Analytics & Events: Coliseum, Passport  
- Monitoring & Alerts: Custom dashboards, Slack, Email  
- AI Support: GPT-4o, Claude 3.5 Sonnet  
- Hosting & CI/CD: Vercel, Supabase migrations, Git/GitHub

These choices ensure:
- **Security & Compliance** through RLS, KMS, audit logs, and retention policies.  
- **Scalability & Reliability** via serverless hosting, automated deployments, and advisory locks.  
- **Extensibility & Future Ready** with hooks for smart contracts, multi-currency support, and AI-driven insights.

Together, this tech stack forms a flexible, secure, and user-friendly foundation for our treasury protocol—ready to handle payments, splits, payouts, refunds, and advanced analytics today and evolve easily tomorrow.