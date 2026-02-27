# Frontend Guideline Document

This document outlines the frontend architecture, design principles, and technologies for the Compañon Brand Activation Dashboard. It is written in everyday language so that anyone can understand how the frontend is set up and maintained.

## 1. Frontend Architecture

**Frameworks and Libraries**
- **Next.js 14 (App Router):** Handles page routing, server-side rendering (SSR), and static site generation (SSG) for fast initial loads.
- **TypeScript:** Adds type safety to JavaScript, reducing runtime errors and improving developer productivity.
- **Tailwind CSS:** Utility-first CSS framework for styling components quickly and consistently.
- **shadcn UI:** A component library built on top of Tailwind CSS, providing accessible, ready-made UI building blocks.
- **Supabase JS Client:** Connects to Supabase for authentication, realtime data, and database queries.
- **Stripe JS:** Manages payments, subscriptions, and billing flows.

**How It Supports Scalability, Maintainability, and Performance**
- **Modular Code:** Components are self-contained and reusable, making it easy to add or update features.
- **Server-Side Rendering & Code Splitting:** Next.js automatically splits code by route and can pre-render pages, leading to faster load times.
- **Utility CSS:** Tailwind’s small, composable classes keep CSS files small and avoid style conflicts.
- **Type Safety:** TypeScript catches many bugs at compile time, making large codebases easier to maintain.
- **API Abstraction:** A single `passport` client handles logging, access control, and error handling, simplifying API calls across the app.

## 2. Design Principles

We follow these key principles to guide our UI design and interactions:

1. **Usability**
   - Clear, intuitive workflows for onboarding, campaign creation, and analytics.
   - Wizard-style multi-step flows keep users focused on one task at a time.

2. **Accessibility (WCAG 2.1 AA)**
   - Semantic HTML elements, ARIA labels, and keyboard-friendly navigation.
   - Color contrast meets accessibility standards for text and interactive elements.

3. **Responsiveness**
   - Fluid layouts and breakpoints for mobile, tablet, and desktop.
   - Special touch-friendly components for mobile QR scanning and surveys.

4. **Consistency**
   - Shared design tokens (colors, spacing, typography) ensure a uniform look and feel.
   - shadcn UI components are customized with our theme to maintain consistency.

## 3. Styling and Theming

**Styling Approach**
- We use **Tailwind CSS** with a custom configuration file (`tailwind.config.ts`).
- CSS follows a utility-first approach; we avoid large custom CSS files.
- For complex UI states or animations, we create small, scoped CSS modules.

**Theming**
- A dark theme with blue tones is our default:
  - Backgrounds: `#121212` (primary), `#1E1E2A` (secondary)
  - Primary Blue: `#3B82F6` (buttons, links, highlights)
  - Accent Blue: `#60A5FA` (hover states, progress bars)
  - Text: `#E0E0E0` (primary text), `#A3A3A3` (secondary text)
- Themes are defined in `tailwind.config.ts` under `theme.extend.colors`.

**Visual Style**
- Modern flat design with subtle glassmorphism cards:
  - Semi-transparent panels with a slight backdrop blur for depth.
  - Soft shadows (`shadow-lg`) to lift key components off the background.
- Font: **Inter**, a versatile, legible sans-serif typeface loaded via Google Fonts.

## 4. Component Structure

**Organization**
- `app/` directory (Next.js App Router) contains feature folders:
  - `app/onboarding/`
  - `app/dashboard/`
  - `app/campaigns/`
  - `app/analytics/`
- Each feature folder has:
  - `page.tsx` (route entry)
  - `components/` (related sub-components)
  - `hooks/` (data-fetching and state hooks)

**Reusability**
- UI building blocks (buttons, modals, form fields) live in a shared `ui/` directory.
- We follow a pattern of small, single-responsibility components.

**Benefits**
- Easier to find and update code related to a specific feature.
- Less duplication, since shared components live in one place.
- Clear folder structure helps new developers onboard faster.

## 5. State Management

**Approach**
- **React Context & Hooks:** For global UI state (theme toggling, user session).
- **Custom Hooks + SWR (Stale-While-Revalidate):** For data fetching and caching from Supabase and Passport.

**Why This Works**
- Context is lightweight and built into React, no extra dependencies.
- SWR handles caching, revalidation on focus, and polling for real-time updates with minimal setup.
- We avoid heavy state libraries unless we see complexity growing beyond this scope.

## 6. Routing and Navigation

**Next.js App Router**
- File-based routing in the `app/` directory automatically maps to URLs.
- Nested routes for layout sharing (e.g., `app/dashboard/layout.tsx` for common dashboard frame).

**Client-Side Navigation**
- `<Link>` component from Next.js for fast, pre-fetching navigation.
- Route guards using middleware and Supabase RLS to prevent unauthorized access.

**Navigation Structure**
- Top-level nav items: Onboarding, Campaigns, Analytics, CRM, Settings.
- Sidebar with collapsible sections for quick access.
- Mobile menu toggles via a slide-in panel.

## 7. Performance Optimization

**Key Strategies**
- **Code Splitting:** Next.js auto-splits by route. We also use dynamic imports for heavy components (e.g., analytics charts).
- **Image Optimization:** Next.js `<Image>` component and built-in image CDN.
- **Lazy Loading:** Defer non-critical components (modals, tooltips) until needed.
- **Minification & Compression:** Handled by Next.js and Vercel automatically.

**Results**
- Faster initial page loads (first contentful paint < 1s on 3G emulation).
- Reduced bundle sizes (< 150 KB per route on average).

## 8. Testing and Quality Assurance

**Unit Tests**
- **Jest + React Testing Library:** Test individual components and hooks.
- Coverage target: ≥ 80% across critical UI components.

**Integration Tests**
- Test page flows (onboarding wizard, campaign builder) with mocked API responses.

**End-to-End (E2E) Tests**
- **Playwright:** Simulate real user interactions across staging.
- Key scenarios: signup/login, campaign launch, analytics dashboard.

**Linting & Formatting**
- **ESLint:** Enforce coding standards and catch errors early.
- **Prettier:** Automatic code formatting for consistency.
- **Tailwind CSS Linter:** Checks for unused classes in production.

## 9. Conclusion and Overall Frontend Summary

This guideline provides a clear map of our frontend setup. By leveraging Next.js, TypeScript, Tailwind CSS, and shadcn UI, we create a performant, scalable, and maintainable dashboard. Our design principles ensure usability, accessibility, and responsiveness. Consistent theming and component structure speed up development and keep the UI consistent. State management via React Context plus SWR keeps data flow simple and reliable. Next.js routing and Vercel deployment deliver a fast, seamless user experience, while rigorous testing safeguards quality. Together, these choices align with Compañon’s goals of secure, privacy-first brand activation and deliver a polished experience for brands, creators, and fans alike.