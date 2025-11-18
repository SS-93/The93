# Tech Stack Document for Compañon

This document explains, in everyday language, the technology choices behind Compañon—a Brand Activation Dashboard that helps brands discover audiences, launch campaigns, measure impact, and build a privacy-first CRM. Each section shows what we use, why we picked it, and how it makes your experience smooth, secure, and reliable.

---

## Frontend Technologies

Our dashboard’s user interface is built to feel fast, look modern, and work well on any device. Here’s what we chose:

- **Next.js 14 (App Router)**
  - A React-based framework that makes pages load quickly and feels snappy. It handles server-side rendering (so you see content faster) and client-side navigation (so moving around feels instant).
  - Built-in support for code splitting means users only download the bits of code they need, keeping the app lightweight.
- **TypeScript**
  - Adds simple type checks to JavaScript, helping us catch errors early and keep the codebase maintainable.
  - Makes it easier to onboard new developers quickly, so we can iterate faster on new features.
- **Tailwind CSS**
  - A utility-first styling tool that lets us build a consistent dark-themed UI with blue accents, without writing a lot of custom CSS.
  - Encourages a design system approach—every button, card, and input follows the same rules, improving visual consistency and accessibility.
- **shadcn UI**
  - A collection of pre-built, accessible React components styled with Tailwind.
  - Speeds up development of form elements, modals, and layout parts while ensuring they meet accessibility standards (WCAG 2.1 AA).
- **Localization Support**
  - Built-in English and Spanish support, with simple file-based translations so text changes immediately when you switch languages.

How these enhance your experience:

- Lightning-fast page loads and real-time updates make exploring campaigns and analytics feel fluid.
- A consistent dark mode design ensures readability and a professional look.
- Accessible components mean keyboard navigation, proper contrast, and screen-reader support out of the box.
- Bilingual support opens the dashboard to both English- and Spanish-speaking users.

---

## Backend Technologies

The backend is where all your data lives, is processed, and is kept safe. We chose managed services so you don’t have to worry about servers:

- **Supabase**
  - **PostgreSQL Database**: Our main database for storing campaigns, audiences, and CRM data. PostgreSQL is reliable, scalable, and open source.
  - **Authentication (Auth)**: User signup, login, and role-based access (Brand Admin, Campaign Manager, Creator, Fan, System Admin) are handled securely, without building custom auth flows.
  - **Storage**: Stores uploaded assets like images or documents in a secure bucket, with easy access control.
  - **Row-Level Security (RLS)**: Ensures each user only sees the data they’re allowed to see.
  - **Real-Time Subscriptions**: Live updates for campaign status and analytics charts.

- **Passport (Internal API & Logging Protocol)**
  - Every action—like creating a campaign or changing consent settings—is logged by Passport for compliance and auditing.
  - Acts as a unified gateway to internal services (MediaID DNA, Coliseum, Locker, etc.) without exposing separate APIs.

- **Real-Time Analytics & Fraud Detection**
  - **Coliseum Integration**: Feeds live event data to the dashboard (e.g., QR scans, fraud flags).
  - Fraud measures include scan limits, geofencing, device fingerprinting, and alerts for manual review.

- **AI & Machine Learning**
  - **GPT-4o and Claude 3.5 Sonnet**: Analyze surveys and feedback to extract sentiment themes and predict trends.
  - Helps brands understand how fans feel and spot emerging cultural patterns.

How these parts work together:

1. Users log in through Supabase Auth.
2. Supabase serves data to the frontend and triggers real-time updates.
3. Passport records every interaction and routes requests to internal systems.
4. AI models process survey answers and feed insights back into the database.
5. Coliseum pushes real-time metrics and fraud alerts to the dashboard.

---

## Infrastructure and Deployment

To make sure Compañon is reliable, easy to update, and scales with your needs, we use:

- **Vercel (Frontend Hosting)**
  - Automatic deployments on every code push.
  - Preview URLs for every change so you can test before it goes live.
  - Custom domains for staging and production (e.g., staging.companon.com and companon.com).
- **Supabase (Backend Hosting)**
  - Fully managed database, auth, and storage services—no server maintenance required.
  - Built-in replication and backups for reliability.
- **Docker (Local Development)**
  - Ensures all developers have the same environment on their machines.
  - Simplifies onboarding and testing of new features.
- **Version Control & CI/CD**
  - **GitHub** for source code and branching workflows.
  - Automatic tests and lint checks run on every pull request, preventing regressions.

These choices mean:

- Quick feedback loops: any fix or feature can go from code to live site in minutes.
- Reliable uptime and scalability: Vercel and Supabase handle traffic spikes automatically.
- Clear separation between staging and production, reducing the risk of mistakes.

---

## Third-Party Integrations

We connect with a handful of trusted services to extend functionality:

- **Stripe**
  - Handles subscription plans and pay-per-campaign billing.
  - Supports coupon codes, discounts, and annual commitments.
  - Webhooks keep billing events synced with Passport audit logs.
- **MediaID DNA**
  - Provides audience attributes (culture, behavior, economics, location) via secure APIs.
  - All queries default to aggregated data; only opted-in users appear in detailed segments.
- **Coliseum**
  - Powers real-time analytics and fraud detection for QR campaigns.
- **Concierto, Locker, CALS, Treasury**
  - Integrated behind the scenes via Passport, without separate authentication steps.

Benefits of these integrations:

- Payment flexibility for brands of all sizes.
- Deep, privacy-safe audience insights.
- Live campaign monitoring and automated fraud checks.
- Unified internal APIs simplify development and maintenance.

---

## Security and Performance Considerations

We built in multiple layers of protection and speed optimizations:

Security Measures:

- HTTPS/TLS for all web traffic; data encrypted at rest in Supabase.
- Supabase Auth with multi-role support and Row-Level Security.
- Tiered consent flows: explicit opt-in checkboxes, logged by Passport.
- Audit logs for every data access and consent change for GDPR/CCPA compliance.
- Anti-fraud controls: scan limits, geofencing, device fingerprinting, manual review triggers.

Performance Optimizations:

- Next.js server-side rendering and static site generation for fast first load (<1s).
- Real-time updates via Supabase subscriptions and Coliseum streams (<2s for new data).
- Tailwind’s tree-shaking to keep CSS bundles small.
- Lazy loading of images and components for mobile users.
- Indexed database columns for common queries (audience filters, campaign lookups).

Accessibility:

- Dark theme with high-contrast blue accents.
- Keyboard navigation, proper ARIA attributes, and screen-reader support.
- WCAG 2.1 AA compliance checks included in our build process.

---

## Conclusion and Overall Tech Stack Summary

We chose technologies that let Compañon deliver a fast, secure, and privacy-first experience:

- **Next.js, TypeScript, Tailwind, shadcn UI** for a modern, accessible, and responsive frontend.
- **Supabase (Postgres, Auth, Storage, RLS)** and **Passport** for a seamless, audited backend.
- **Vercel** and **Docker** for reliable deployment and consistent development environments.
- **Stripe**, **MediaID DNA**, **Coliseum**, and other internal systems for payments, data, and real-time insights.
- **GPT-4o** and **Claude 3.5 Sonnet** for AI-driven sentiment and trend analysis.

Together, these technologies help brands discover audiences, run campaigns in minutes, measure real-time impact, and build lasting, consent-based relationships with fans. The stack is built to scale, secure, and adapt as your needs grow—delivering a unique, privacy-first edge in brand activation.