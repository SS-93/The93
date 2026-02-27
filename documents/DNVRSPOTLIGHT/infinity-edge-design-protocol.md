# Infinity Edge Design Protocol

**Project:** Denver Spotlight Awards  
**Version:** 1.0  
**Last Updated:** February 26, 2026  
**Status:** Active

---

## Overview

The **Infinity Edge** is a visual design pattern used across Denver Spotlight to create the illusion that content extends infinitely beyond the viewport. Elements appear to fade into the horizon rather than ending with a hard edge, giving a modern, immersive feel.

---

## Core Principles

1. **No horizontal outlines** — Remove left and right borders so content appears unbounded.
2. **Edge fade** — Use CSS mask gradients to soften horizontal edges.
3. **Top/bottom definition** — Keep top and bottom borders for structure and containment.

---

## Implementation

### 1. Border Treatment

Replace full borders with top and bottom only:

```css
/* Instead of: */
border: 1px solid rgba(194, 24, 91, 0.28);

/* Use: */
border-top: 1px solid rgba(194, 24, 91, 0.28);
border-bottom: 1px solid rgba(194, 24, 91, 0.28);
border-left: none;
border-right: none;
```

### 2. Mask Gradient (Edge Fade)

Apply a horizontal linear gradient so content fades at the sides:

```css
mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
-webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
mask-size: 100% 100%;
-webkit-mask-size: 100% 100%;
```

**Gradient stops (adjust per context):**

| Context | Transparent → Solid | Solid → Transparent | Notes |
|---------|---------------------|---------------------|-------|
| Countdown strip | 0% → 12% | 88% → 100% | Wider fade for marquee |
| Step cards, accordion | 0% → 8% | 92% → 100% | Subtle edge |
| CTA buttons (PixelCard) | 0% → 10% | 90% → 100% | Standard |
| Feature tag bubbles | 0% → 10% | 90% → 100% | Compact tags |
| Nomination cards | 0% → 8% | 92% → 100% | Subtle edge (matches step cards) |

---

## Where It's Applied

| Component | File | Variant |
|-----------|------|---------|
| Countdown strip | `CountdownStrip.tsx` | Marquee with horizontal loop |
| Begin Voting button | `PixelCard.css` | `.pixel-btn-lg` |
| Hall of Fame button | `PixelCard.css` | `.pixel-btn-md` |
| How It Works step cards | `SpotlightHome.tsx` | 3 step cards |
| Event Infrastructure accordion | `SpotlightHome.tsx` | Accordion container |
| Feature tag bubbles | `SpotlightHome.tsx` | Vote Routing, Real-Time Analytics, etc. |
| Nomination cards | `ScrollStack.css` | `.scroll-stack-card` (VotingPage) |

---

## Inline Style Example (React)

```tsx
style={{
  borderTop: '1px solid rgba(194,24,91,0.28)',
  borderBottom: '1px solid rgba(194,24,91,0.28)',
  borderLeft: 'none',
  borderRight: 'none',
  maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
  maskSize: '100% 100%',
  WebkitMaskSize: '100% 100%',
}}
```

---

## CSS Class Example

```css
.infinity-edge {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-left: none;
  border-right: none;
  mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
  mask-size: 100% 100%;
  -webkit-mask-size: 100% 100%;
}
```

---

## Notes

- **WebKit prefix** — Always include `-webkit-mask-image` and `-webkit-mask-size` for Safari.
- **Pointer events** — On interactive elements (e.g. feature tags), add `pointerEvents: 'auto'` if a parent mask affects hit-testing.
- **Border radius** — Keep `borderRadius`; the mask does not remove corner rounding.
- **Overflow** — Parent containers often use `overflow: hidden` for marquee/scroll effects.

---

## Related

- [SESSION_LOG_2026-02-26.md](./SESSION_LOG_2026-02-26.md) — Session that introduced infinity edge
- [implementation-plan.md](./implementation-plan.md) — Denver Spotlight implementation plan
