# Frontend Guideline Document

This document outlines the frontend architecture, design principles, styling, component structure, state management, routing, performance optimizations, testing strategies, and overall summary for the Coliseum Analytics Engine UI. It’s written in everyday language and assumes no deep technical background.

## 1. Frontend Architecture

**Frameworks & Libraries**
- **Next.js 14 (App Router)**: Our foundation for server‐side rendering (SSR), routing, and performance.
- **TypeScript**: Provides type safety and helps catch errors early.
- **Tailwind CSS**: Utility-first styling for rapid, consistent UI development.
- **shadcn/ui**: Pre-built, accessible React components that follow Radix UI and Tailwind.
- **Supabase JavaScript Client**: For Auth, Realtime, and data fetching.

**How It Supports Scalability, Maintainability, Performance**
- **Scalability**: Next.js splits code by route and component, so only what’s needed loads. We can add new pages or features without overhauling existing code.
- **Maintainability**: TypeScript + component-based design keeps code organized. Shared components live in a single folder, reducing duplication.
- **Performance**: SSR and static generation (SSG) deliver HTML/CSS quickly. Tailwind’s JIT mode eliminates unused CSS. Vercel deploys on a global edge network for fast load times anywhere.

## 2. Design Principles

1. **Usability**
   - Clear, bold calls to action (CTAs) powered by our primary color “Coliseum orange.”
   - Simple, consistent UI patterns (cards, buttons, modals).
2. **Accessibility**
   - All components meet WCAG AA standards.
   - Proper ARIA roles on interactive elements.
   - Keyboard‐navigable menus and forms.
3. **Responsiveness**
   - Mobile-first breakpoints: small (≤ 640px), medium (641–1024px), large (>1024px).
   - Flexible grid and flexbox layouts adjust to screen size.
4. **Thematic Consistency**
   - Ancient Roman/gladiator inspiration across icons, textures, and typography.
   - “Coliseum orange” highlights key metrics and buttons, evoking energy and focus.

## 3. Styling and Theming

**Styling Approach**
- **Tailwind CSS** with JIT—no separate SASS files. All utilities are in-class, keeping styles co-located.
- **BEM-ish naming** for custom class names when needed (e.g., `.leaderboard__row`).

**Theming**
- Tailwind’s `theme.extend` in `tailwind.config.js` holds our color palette and fonts.
- CSS variables for dynamic theming (e.g., light/dark, custom branding for Enterprise).

**Visual Style**
- **Overall Feel**: Modern interface with subtle glassmorphism on cards (semi-transparent backgrounds, soft shadows) to evoke a polished, immersive dashboard.
- **Palette**:
  - Primary: #E25822 (Coliseum Orange)
  - Secondary: #3A3D42 (Charcoal Gray)
  - Accent: #F4D35E (Golden Laurel)
  - Background Light: #F9F9F9
  - Background Dark: #1F1F23
  - Text Primary: #222222
  - Text Secondary: #555555
  - Border/Divider: #DDDDDD

**Typography**
- **Headings**: “Cinzel” (serif, Roman feel)
- **Body**: “Roboto” (sans-serif, readable)
- Font weights: Light (300), Regular (400), Bold (700)

## 4. Component Structure

**Folder Organization**
```
/app
  /(analytics)
  /(admin)
/components
  /atoms
  /molecules
  /organisms
  /layouts
  /utils
/public
/styles
  tailwind.css
```  
- **Atoms**: Buttons, Icons, Inputs.
- **Molecules**: KPI Tile, Card, Filter Dropdown.
- **Organisms**: Leaderboard Table, Impact Upload Section, Entitlement Banner.
- **Layouts**: Root layout, Analytics layout, Admin dashboard layout.

**Reusability & Maintainability**
- Each component has its own folder with `index.tsx`, `styles.css.ts` (if needed), and tests.
- Prop-driven and fully typed to ensure clarity on required inputs.
- Shared utility functions (e.g., date formatting, chart data transforms) in `/components/utils`.

## 5. State Management

**Data Fetching & Caching**
- **React Query (TanStack Query)** for server state: fetching leaderboards, metrics, report links. Handles caching, refetching, and real-time updates via WebSocket or Supabase Realtime.

**Local & Global UI State**
- **Context API** for global concerns: user session, entitlement plan, theme mode.
- **useState** and **useReducer** in client components for localized UI state (modals open/close, form inputs).

**Why This Approach?**
- Avoids overkill libraries like Redux for mostly server-driven data.
- React Query plus Context API covers both remote and local state without complexity.

## 6. Routing and Navigation

**Routing**
- **Next.js App Router** organizes pages by filesystem under `/app`.
- Layouts (`layout.tsx`) wrap groups of pages (e.g., analytics vs. admin).
- Dynamic routes for filters and IDs (e.g., `/analytics/leaderboard/[artistId]`).

**Navigation**
- **NextLink** with `<Link>` components—fast client-side transitions.
- Persistent sidebar in analytics with links: KPIs, Leaderboards, Impact Reports.
- Top nav for account, entitlements, and logout.
- Breadcrumb component for deeper pages (e.g., detail views).

## 7. Performance Optimization

- **Code Splitting**: Next.js auto-splits by route. Heavy components (charts) use `dynamic()` lazy loading.
- **Image Optimization**: Next.js `<Image>` with automatic resizing and WebP support.
- **CSS Purging**: Tailwind removes unused styles in production.
- **Server Components**: Use for SSR data-heavy parts, reducing bundle size in the browser.
- **Edge Caching & CDNs**: Vercel delivers static assets globally.
- **Memoization**: React’s `memo` and `useMemo` on expensive lists and tables.

## 8. Testing and Quality Assurance

**Unit & Integration Tests**
- **Jest** + **React Testing Library**: Test components in isolation, focusing on behavior and accessibility.
- Coverage target: ≥ 80% on critical modules (leaderboards, entitlements, uploads).

**End-to-End (E2E) Tests**
- **Cypress**: Simulate real user flows—login, view leaderboard, upgrade plan, download report.
- Smoke tests on every deploy, running headless in CI.

**Linting & Formatting**
- **ESLint** with TypeScript and Next.js plugin.
- **Prettier** for consistent code style.
- **Tailwind Linter**: Scans for invalid utility usage.

**CI/CD**
- GitHub Actions runs tests, lints, and builds on every PR.
- Vercel preview deploys for visual QA.

## 9. Conclusion and Overall Frontend Summary

The Coliseum Analytics Engine’s frontend leverages Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui to deliver a fast, scalable, and maintainable user interface. Our gladiator-inspired visual theme—anchored by bold Coliseum orange, glassmorphic cards, and classic Roman typography—ensures an engaging experience. Component-based architecture, React Query for data, and Context API for global state keep the codebase organized. Performance tactics like SSR, code splitting, and edge caching guarantee snappy load times. Robust testing (Jest, Cypress) and CI/CD pipelines maintain high quality.

Together, these guidelines ensure anyone joining the team can quickly understand how we structure, style, and test our frontend, aligning tightly with project goals of real-time analytics, secure entitlements, and a visually striking theme.