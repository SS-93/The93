# Project Requirements Document

## 1. Project Overview

Compañon is a Brand Activation Dashboard that helps marketing teams discover and target audiences, launch and manage campaigns, measure cultural impact, and build a privacy-first CRM. It leverages MediaID DNA attributes (culture, behavior, economics, location) to create highly focused audience segments, then supports three campaign types—Locker Drops, Event Partnerships, and QR activations—each with built-in anti-fraud safeguards. Real-time analytics and AI-powered insights (sentiment analysis, trend prediction) give brands clear ROI measurements and help them optimize on the fly.

This platform is being built to solve the fragmented, privacy-unsafe nature of many existing campaign tools. Our key objectives are:

*   Enable precise, consent-based audience targeting with MediaID DNA
*   Simplify campaign creation, management, and billing (subscription + pay-per-campaign)
*   Provide real-time, AI-enhanced analytics and compliance logging for trust and transparency
*   Deliver a fast, accessible (WCAG 2.1 AA), bilingual (English/Spanish), mobile-responsive experience

**Success Criteria**

*   Brands can build and launch campaigns in under 5 minutes
*   Audience segments update in real time (<2 s) with aggregated, privacy-safe data
*   Dashboard pages load in <1 s and interactions feel instantaneous (<200 ms)
*   Full audit trails of data access and consent changes are recorded without gaps

## 2. In-Scope vs. Out-of-Scope

### In-Scope (v1)

*   **Onboarding & Authentication** via Supabase
*   **Dark-themed UI** with blue accents, English/Spanish localization
*   **Role-Based Access Control** (Brand Admin, Campaign Manager, Creator, Fan, System Admin)
*   **Subscription + Pay-Per-Campaign Billing** managed by Stripe (supports coupons, discounts, annual plans)
*   **DNA Query Builder**: visual audience segmentation with real-time, aggregated previews
*   **Campaign Builder**: multi-step wizard for Locker Drops, Event Partnerships, QR activations (geofencing, scan limits, device fingerprinting)
*   **Campaign Management**: list/detail views, pause/duplicate/edit, fraud alerts, manual review
*   **Analytics Dashboard**: reach, engagement, conversion, ROI, QR-specific metrics, AI-powered trend & sentiment insights
*   **Privacy-First CRM**: saved audiences, opt-in contact lists, engagement histories, sentiment themes
*   **Mobile-Responsive QR Flow**: scan + survey in web and foundation for native app
*   **Compliance Logging**: every action and consent change recorded by Passport
*   **Staging & Production** environments on Vercel + Supabase; Docker for local dev

### Out-of-Scope (v1)

*   Fully offline-capable native mobile app (only web foundation)
*   Support for languages beyond English and Spanish
*   External API docs or auth for Treasury, Coliseum, Concierto, Locker, CALS (handled internally by Passport)
*   Advanced email marketing or push notifications

## 3. User Flow

Brand administrators arrive at the Compañon dashboard and sign up via Supabase’s secure email/password process. Upon first login, they review and explicitly opt in to our privacy policy (unchecked by default). Passport logs this consent. They then pick staging or production, connect their custom domain, and invite team members—assigning each the correct role. Next, they choose a billing model (subscription or pay-per-campaign), apply any coupon codes, and confirm payment via Stripe.

With billing in place, admins open the DNA Query Builder to define audience filters—culture, behavior, economics, location—with live, aggregated previews. Approved segments get saved to the CRM. From there, they launch the Campaign Builder: pick Locker, Event, or QR format; upload creatives; set schedule, geofences, scan limits, and fingerprinting rules; configure tiered opt-in checkboxes; and finalize payment. Once live, campaigns appear in the Management view with status badges and fraud alerts. The Analytics section offers real-time dashboards and AI insights to monitor performance. In the CRM, admins review contact lists, engagement histories, and sentiment themes extracted from post-campaign surveys.

Fans access QR activations via mobile web (or future native app). They scan a code, see a clear opt-in checkbox (“I agree to share my data with Compañon…”), and consent before continuing. Behind the scenes, geolocation and device fingerprinting run to prevent abuse. Fans then complete a short survey, unlock content in their Locker, and can later revisit their engagement history or adjust consent settings in their profile. All fan interactions sync live to the brand’s dashboard.

## 4. Core Features

*   **Authentication & Onboarding**\
    Supabase-powered signup, email verification, privacy-opt-in flow, Passport logs.
*   **Subscription & Billing**\
    Stripe integration for subscription plans, pay-per-campaign fees, coupon codes, annual discounts.
*   **DNA Query Builder**\
    Drag-and-drop filters for culture, behavior, economics, location; real-time aggregated previews; RLS enforcement.
*   **Campaign Builder**\
    Wizard for Locker Drops, Event Partnerships, QR activations; asset uploads; scheduling; geofencing; scan limits; fingerprinting; consent checkboxes; final payment.
*   **Campaign Management**\
    List/detail views; status indicators; pause/duplicate/edit; real-time fraud alerts (Coliseum); manual review option.
*   **Analytics Dashboard**\
    Reach, engagement, conversions, ROI, QR scans by location; funnel visualizations; GPT-4o/Claude insights (trend & sentiment); date filters; campaign comparisons.
*   **Privacy-First CRM**\
    Saved segments; contact lists with tiered consent statuses; engagement history; sentiment themes; RLS controls.
*   **Mobile-Responsive QR Flow**\
    Quick scan + consent + survey; content delivered to user Locker; real-time sync.
*   **Role-Based Access Control**\
    Five roles with Supabase RLS: Brand Admin, Campaign Manager, Creator, Fan, System Admin.
*   **Compliance & Audit Logging**\
    Passport logs every data access, config change, consent action for auditing.
*   **Anti-Fraud Measures**\
    Scan limits per device/user, geofencing, device fingerprinting, unusual-pattern flagging with manual review.

## 5. Tech Stack & Tools

*   **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn UI
*   **Backend & Storage**: Supabase (PostgreSQL, Auth, Storage), Row-Level Security
*   **Real-Time Analytics**: Supabase + Coliseum integration
*   **Payments**: Stripe (subscriptions, one-time charges, coupons)
*   **AI/ML**: GPT-4o, Claude 3.5 Sonnet (sentiment analysis, trend prediction, feedback extraction)
*   **Logging & Integration Protocol**: Passport (internal API gateway, audit logs)
*   **Deployment**: Vercel (frontend), Supabase (backend), Docker for local dev; staging & production custom domains
*   **IDE/Plugins**: VS Code with optional Windsurf/Cursor for AI-powered coding assistance

## 6. Non-Functional Requirements

*   **Performance**\
    • First Contentful Paint <1 s; interactive <200 ms\
    • Real-time segment preview updates <2 s
*   **Security & Compliance**\
    • HTTPS/TLS encryption in transit; Supabase encryption at rest\
    • Row-Level Security (RLS) for all sensitive data\
    • Immutable audit trails of consent and config changes\
    • GDPR/CCPA compliance—explicit opt-in, easy consent revocation
*   **Usability & Accessibility**\
    • WCAG 2.1 AA compliance (keyboard nav, color contrast)\
    • Fully responsive design; clear dark-mode UI with blue accents\
    • Bilingual support (English, Spanish)
*   **Scalability & Reliability**\
    • Support thousands of concurrent campaigns and real-time events\
    • Graceful degradation under heavy API load; sensible fallbacks

## 7. Constraints & Assumptions

*   **Supabase** is the single backend service (database, auth, storage).
*   **Passport** exists and handles all internal API routing, logging, and permission checks.
*   **MediaID DNA API** endpoints are available, with aggregated data by default and explicit-opt-in for detailed queries.
*   **Stripe** supports both subscription and pay-per-campaign via webhooks and idempotent events.
*   **Device Fingerprinting** and geolocation libraries are available for QR anti-fraud.
*   **Native App** will be built later; v1 focuses on web foundation.
*   **English & Spanish** translations will be provided; text lengths are manageable in UI.

## 8. Known Issues & Potential Pitfalls

*   **API Rate Limits** (MediaID DNA, Coliseum): implement local caching, exponential backoff, and fallback messages.
*   **Complex RLS Policies**: design and test row-level rules early in dev to avoid data leaks.
*   **Stripe Webhook Retries**: ensure idempotency keys to prevent duplicate charges.
*   **Real-Time Data Load**: paginate large data sets; use indexes on frequently queried columns.
*   **Mobile Web vs. Native**: test performance on low-end devices and browsers for the QR flow.
*   **Localization Edge Cases**: account for longer Spanish text and RTL if needed in the future.
*   **Audit Log Volume**: archive older logs or move to cold storage to control database size.

This PRD provides a clear, unambiguous blueprint for Compañon’s first release. All subsequent technical documents (tech stack details, frontend and backend guidelines, file structure, security rules, etc.) should derive directly from this document without additional assumptions.
