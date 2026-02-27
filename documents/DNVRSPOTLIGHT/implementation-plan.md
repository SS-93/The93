# Denver Spotlight Awards × Concierto — Implementation Plan

**Version:** 1.0
**Date:** 2026-02-26
**Type:** Front-End Strategic Prototype
**Branch:** `2.0`
**Passcode:** `spotlight`
**Event Date Countdown Target:** February 22, 2027

---

## 1. Strategic Context

This prototype is a vertical deployment of **Concierto** — the event layer of the Buckets Cultural Computation Platform — for Denver Spotlight Awards.

It is:
- White-label event infrastructure
- Institutional award show tooling
- A platform positioning artifact for Concierto

It is NOT:
- An open mic voting page
- A feature inside Buckets
- Connected to any backend (demo mode, front-end only)

---

## 2. Routes

| Route | Purpose |
|-------|---------|
| `/DNVRSpotlight` | Home — hero, nav cards, countdown, how-it-works strip |
| `/DNVRSpotlight/vote` | Voting surface — category rail + nominee stack + spotlight toggle |
| `/DNVRSpotlight/dashboard` | Organizer surface — passcode gate + MagicBento tiles |

**Standalone — no Buckets nav, no shared shell.**

---

## 3. Component Map

### ReactBits Components (source files required)
| Component | File | Route Used |
|-----------|------|------------|
| `InfiniteMenu` | `src/components/dnvrspotlight/InfiniteMenu.tsx` | `/vote?mode=spotlight` |
| `AnimatedList` | `src/components/dnvrspotlight/AnimatedList.tsx` | `/vote` |
| `ScrollStack` | `src/components/dnvrspotlight/ScrollStack.tsx` | `/vote` |
| `CardNav` | `src/components/dnvrspotlight/CardNav.tsx` | `/DNVRSpotlight` |

### Custom Components Built
| Component | File | Purpose |
|-----------|------|---------|
| `SpotlightHome` | `src/components/dnvrspotlight/SpotlightHome.tsx` | Home page |
| `VotingPage` | `src/components/dnvrspotlight/VotingPage.tsx` | Full vote surface |
| `NomineeCard` | `src/components/dnvrspotlight/NomineeCard.tsx` | Individual nominee card |
| `BallotModal` | `src/components/dnvrspotlight/BallotModal.tsx` | Ballot review overlay |
| `VoteToast` | `src/components/dnvrspotlight/VoteToast.tsx` | Vote confirmation toast |
| `DashboardGate` | `src/components/dnvrspotlight/DashboardGate.tsx` | Passcode lock screen |
| `OrganizerDashboard` | `src/components/dnvrspotlight/OrganizerDashboard.tsx` | Full dashboard |
| `ContactsExportTile` | `src/components/dnvrspotlight/ContactsExportTile.tsx` | Excel export feature |
| `CountdownStrip` | `src/components/dnvrspotlight/CountdownStrip.tsx` | Event countdown |
| `DemoBanner` | `src/components/dnvrspotlight/DemoBanner.tsx` | Persistent demo notice |

### Route Files
| File | Route |
|------|-------|
| `src/routes/dnvr-spotlight.tsx` | `/DNVRSpotlight` |
| `src/routes/dnvr-spotlight-vote.tsx` | `/DNVRSpotlight/vote` |
| `src/routes/dnvr-spotlight-dashboard.tsx` | `/DNVRSpotlight/dashboard` |

---

## 4. Mock Data

### Award Categories (5 total)
1. **Artist of the Year**
2. **Best Live Performance**
3. **Breakout Act**
4. **DJ of the Year**
5. **Venue of the Year**

### Nominees (4 per category = 20 total)
Plausible fictional Denver-scene names. Examples:
- Artist of the Year: Marcus Delray, Sofia Vega, The North Table Collective, Amara Jones
- Best Live Performance: River Crane at Cervantes, Neon Pueblo (Globe Hall), The Westwood Sessions, Echo Cartel
- Breakout Act: Lila Frost, Juno Vale, Desert Meridian, Kai Solano
- DJ of the Year: DJ Plateau, Yara Sounds, Blkout Cru, DJ Meridian
- Venue of the Year: The Ogden Theatre, Globe Hall, Cervantes' Masterpiece, The Gothic Theatre

### Mock Contacts (20 rows)
Denver-realistic names, 303/720/970 area codes, Denver neighborhoods, real vote source variety (Web/QR/SMS).

### Dashboard Mock Data
- Total votes: 1,247
- Categories complete: 4/5
- Vote velocity: simulated live increment
- Top category: Artist of the Year
- Sponsor tiles: placeholder names

---

## 5. Dependencies

### Already Installed ✅
| Package | Version | Used For |
|---------|---------|---------|
| `gl-matrix` | ^3.4.4 | InfiniteMenu WebGL |
| `gsap` | ^3.14.2 | CardNav animations |
| `lenis` | ^1.3.17 | ScrollStack smooth scroll |
| `motion` | ^12.34.3 | AnimatedList (`motion/react`) |
| `framer-motion` | ^7.10.3 | Available fallback |
| `react-router-dom` | ^6.30.1 | Route registration |
| `tailwindcss` | ^3.4.17 | Styling |

### Needs Install ⚠️
| Package | Purpose | Command |
|---------|---------|---------|
| `xlsx` | Excel export (SheetJS) | `npm install xlsx` |
| `react-icons` | `GoArrowUpRight` in CardNav | `npm install react-icons` |

### Needs Source Code (ReactBits) 📋
These components must be pasted from ReactBits — they are NOT npm packages:
- `InfiniteMenu.tsx` + `InfiniteMenu.css`
- `AnimatedList.tsx` + `AnimatedList.css`
- `ScrollStack.tsx` + `ScrollStack.css`
- `CardNav.tsx` + `CardNav.css`

---

## 6. Build Order

### Phase 1 — Foundation
1. `npm install xlsx react-icons`
2. Register routes in `src/routes/router.tsx`
3. Create folder: `src/components/dnvrspotlight/`
4. Add ReactBits source files (InfiniteMenu, AnimatedList, ScrollStack, CardNav)
5. Create `mockData.ts` — categories, nominees, contacts, dashboard stats

### Phase 2 — Home Page (`/DNVRSpotlight`)
6. Build `SpotlightHome.tsx` (hero, countdown, CardNav, how-it-works strip)
7. Build `CountdownStrip.tsx` (Feb 22, 2027 target)
8. Build `DemoBanner.tsx` (persistent notice)

### Phase 3 — Voting Surface (`/DNVRSpotlight/vote`)
9. Build `VotingPage.tsx` (two-panel layout)
10. Wire `AnimatedList` for category rail (left panel)
11. Wire `ScrollStack` + `NomineeCard` for nominee stack (right panel)
12. Build vote state logic (localStorage persistence)
13. Build `VoteToast.tsx` (confirmation notification)
14. Build `BallotModal.tsx` (review overlay)
15. Add Spotlight toggle → `InfiniteMenu` mode

### Phase 4 — Dashboard (`/DNVRSpotlight/dashboard`)
16. Build `DashboardGate.tsx` (passcode: `spotlight`)
17. Build `OrganizerDashboard.tsx` (MagicBento tile layout)
18. Build `ContactsExportTile.tsx` (xlsx export)
19. Add vote velocity simulation (`setInterval` increment)
20. Add future capabilities signal card

---

## 7. Design Tokens

```css
/* Base */
--bg-primary: #080C18;
--bg-secondary: #0B0F1C;
--bg-deep: #0F1426;
--bg-card: #10142A;

/* Accents */
--accent-magenta: #C2185B;
--accent-purple: #5B2DFF;
--accent-pink-soft: #FF5CA8;
--accent-pink-light: #FFD6E8;

/* Text */
--text-primary: #F8F9FF;
--text-silver: #C9CCD6;
--text-muted: rgba(201, 204, 214, 0.7);

/* Glow (max 30% opacity) */
--glow-magenta: rgba(194, 24, 91, 0.25);
--glow-purple: rgba(91, 45, 255, 0.20);
--glow-pink: rgba(255, 92, 168, 0.15);

/* Motion */
--transition-base: 200ms ease-out;
--transition-fast: 180ms ease-out;
--transition-slow: 240ms ease-out;
```

---

## 8. UX Ethos (Summary)

**Feels like:** Late-night awards ceremony. Velvet curtains. Stage lights in darkness.

**Motion:** 180–240ms ease-out. No bounce. No elastic. Curtain-reveal pacing.

**Color balance:** 80% dark / 15% silver / 5% accent glow.

**Emotional arc:** Dark → Focus → Selection → Confirmation → Control

**Identity:** Lobby → Stage → Spotlight → Backstage Control Room

---

## 9. Vote Logic (localStorage)

```ts
// Structure
interface VoteState {
  [categoryId: string]: string; // categoryId → nomineeId
}

// Keys
const STORAGE_KEY = 'dnvr_spotlight_votes';

// Operations
const getVotes = (): VoteState => JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
const castVote = (categoryId: string, nomineeId: string) => {
  const votes = getVotes();
  votes[categoryId] = nomineeId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
};
const getProgress = (): { voted: number; total: number } => ({
  voted: Object.keys(getVotes()).length,
  total: 5
});
```

---

## 10. Excel Export

### Library: SheetJS (`xlsx`)

```ts
import * as XLSX from 'xlsx';

function exportContacts() {
  const ws = XLSX.utils.json_to_sheet(mockContacts);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts');
  XLSX.writeFile(wb, 'Denver_Spotlight_Awards_Contacts_Demo.xlsx');
}
```

### Columns
`First Name | Last Name | Email | Phone | City | Category Voted | Nominee Selected | Timestamp | Vote Source`

---

## 11. Dashboard Passcode

**Code:** `spotlight`
**Storage:** `localStorage.setItem('dnvr_dashboard_unlocked', 'true')`
**Label:** "Demo Mode — Passcode gate simulated locally."

---

## 12. Footer Signal (Every Page)

```
Powered by Concierto — Event Infrastructure by Buckets
```
Style: silver text, 60% opacity, centered, small.

---

## 13. Success Criteria

Stakeholder responds:
- "This feels real."
- "This is better than what we use."
- "We could brand this."
- "This scales."

Internal:
- Modular component structure
- Mock data fully separated
- Clean routing
- Zero UX friction
- No backend dependencies
