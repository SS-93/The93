# Frontend Guideline Document

## 1. Frontend Architecture

We use Next.js 14 with the App Router as our main framework. All pages and layouts live under the `app/` directory. TypeScript gives us static typing for safety, and Tailwind CSS plus shadcn UI provide utility-first styling and prebuilt, accessible components.

Key points:

- **Server + Client Components**: We fetch data in server components when possible (fast, SEO-friendly) and use client components only for interactive parts (charts, forms, real-time updates).
- **Modular Folder Structure**: Each feature (onboarding, dashboard, admin, etc.) has its own folder under `app/`, keeping routes, layouts, and components close together.
- **Scalability**: File-based routing and clearly scoped folders make it easy to add new features or teams.
- **Maintainability**: TypeScript interfaces describe data models (e.g., transactions, payouts) so everyone knows what shape data has.
- **Performance**: Next.js handles code splitting, caching, and image optimization out of the box.

## 2. Design Principles

1. Usability
   - Clear calls to action (buttons, links).
   - Consistent layouts for each role (Artist, Host, Buyer, Admin).
2. Accessibility (a11y)
   - Semantic HTML (`<button>`, `<nav>`, etc.).
   - ARIA labels on custom controls.
   - Keyboard navigation and focus outlines.
3. Responsiveness
   - Mobile-first breakpoints (`sm`, `md`, `lg`, `xl`).
   - Flex and grid layouts ensure components adapt to all screen sizes.
4. Security by Design
   - No sensitive data in the DOM.
   - Stripe elements embedded in iframes to stay PCI-compliant.

These principles guide everything from colors and fonts to component behavior. For example, modals trap focus, and buttons have high-contrast text.

## 3. Styling and Theming

### Approach
- **Tailwind CSS**: Utility-first—no BEM or SMACSS layers.
- **shadcn UI**: Prebuilt React components styled with Tailwind, fully customizable via classNames.
- **Dark, Futuristic Theme** with subtle glassmorphism accents.

### Theming
We configure dark mode in `tailwind.config.ts` (`darkMode: 'class'`) and extend the theme colors.

### Style & Visual Language
- Glassmorphism on cards and side panels (backdrop-filter, semi-transparent surfaces).
- Flat controls (buttons, inputs) with neon-style accent borders and hover glows.

### Color Palette
```
--color-bg       : #121212;   // Main background
--color-surface  : rgba(33, 33, 33, 0.6); // Glass card bg
--color-primary  : #1DB954;   // Bright neon green (Spotify style)
--color-secondary: #3A3A3A;   // Dark gray panels
--color-text     : #FFFFFF;   // Primary text
--color-text-muted: #B3B3B3;  // Secondary text
--color-error    : #E0245E;   // Alerts
--color-warning  : #F79E02;
--color-info     : #2780E3;
--color-success  : #21BA45;
```

### Typography
- **Font Family**: Inter (system-fallback: `-apple-system, BlinkMacSystemFont, sans-serif`).
- **Weights**: 400 (regular), 500 (medium), 700 (bold).
- **Sizes**: Base 16px, scaled using Tailwind’s `text-sm`, `text-base`, `text-lg`, etc.

## 4. Component Structure

### Organization
```
app/
  components/      // Shared UI: Button, Card, Modal
    atom/          // Smallest pieces: Icon, Spinner
    molecule/      // Composed UI: InputWithLabel, TabNav
    organism/      // Feature UI: LedgerTable, BalanceCard
  dashboard/       // Dashboard pages & components
  admin/           // Admin pages & overrides
  onboarding/      // Onboarding flows
  layout.tsx       // Root layout
  page.tsx         // Home or landing page
```

### Reuse & Discoverability
- Each component folder has:
  - `Component.tsx`
  - `Component.test.tsx` (unit tests)
  - `styles.ts` if extra Tailwind variations are needed
- Naming follows PascalCase. Props are strongly typed with TypeScript interfaces.

### Why Components?
- **Encapsulation**: Changes in one component don’t break others.
- **Reusability**: Shared UI across roles (e.g., transaction list) lives once.
- **Testability**: Small units are easier to test.

## 5. State Management

### Server State
- Data fetching in server components via the `fetch` API (native in Next.js).
- Use Supabase client in server components for protected data (roles, ledger queries).

### Client/Local State
- **React Context** for global UI state (theme toggle, notification banners).
- **TanStack Query (React Query)** for cached, background-refreshed data in client components (e.g., live transaction feeds).

### Auth & Secure Access
- Supabase Auth handles user sessions. We wrap pages in an `AuthProvider` context that exposes `user`, `role`, and a `signOut` method.
- Role-based conditional rendering ensures only permitted UI is shown.

## 6. Routing and Navigation

### File-based Routing
- `app/dashboard/page.tsx` → `/dashboard`
- `app/dashboard/transactions/[id]/page.tsx` → `/dashboard/transactions/:id`
- Grouped layouts under `app/dashboard/layout.tsx` for shared navbar and sidebar.

### Navigation Patterns
- **Main Nav** for Artists, Hosts, Buyers (bottom-nav on mobile, sidebar on desktop).
- **Admin Nav** separate in `/admin/` with links to health, logs, overrides.
- Use Next.js’s `<Link>` component for client-side transitions.
- Protect routes server-side with middleware that checks roles and redirects unauthorized users.

## 7. Performance Optimization

- **Code Splitting**: Next.js auto splits per route. Heavy components (charts, contract editors) are loaded with `dynamic()` in client components.
- **Image Optimization**: Use `<Image>` from `next/image` for event banners and artist photos.
- **Lazy Loading**: Offscreen components (modals, dropdowns) mount only when opened.
- **Tailwind Purge**: Unused CSS is removed in production builds.
- **Caching & CDN**: Vercel’s edge cache for static assets; ISR (Incremental Static Regeneration) for pages that can be refreshed periodically.

## 8. Testing and Quality Assurance

### Unit Tests
- **Jest** + **React Testing Library** for component rendering, props, and interactions.

### Integration Tests
- Mock Supabase and Stripe calls; test flows like onboarding and payouts.

### End-to-End (E2E)
- **Playwright** for cross-browser tests. Scenarios:
  - Buyer purchases a ticket.
  - Host sets up splits and views their balance.
  - Admin processes a refund.

### Linting & Formatting
- **ESLint** with the Next.js and TypeScript plugins.
- **Prettier** for code formatting. Hooked into Git for pre-commit checks.

## 9. Conclusion and Overall Frontend Summary

This frontend setup combines Next.js 14’s modern App Router with TypeScript, Tailwind CSS, and shadcn UI to build a secure, scalable, and maintainable treasury protocol UI. We adhere to strong design principles—usability, accessibility, and a dark futuristic theme with glassmorphism accents—while keeping performance top of mind through code splitting, image optimization, and CDN caching.

By following these guidelines, any developer (regardless of background) can:

- Understand where code lives and how it’s organized
- Build new features that look, feel, and behave consistently
- Keep the app secure and performant as it grows
- Test each piece thoroughly before it hits production

This approach ensures our platform can handle complex workflows—Stripe onboarding, double-entry ledger, instant payouts, dispute management—while offering a polished, accessible, and high-performance user experience.