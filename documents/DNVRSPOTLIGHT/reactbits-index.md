# ReactBits Index — Denver Spotlight × Concierto Demo

This document consolidates **all ReactBits code snippets** reviewed in this thread and how they map into the Denver Spotlight Awards demo experience.

Status: **Front-end only** (demo), no backend logic.

---

## 0) Where these components appear in the demo

### Routes (final aligned)
- `/DNVRSpotlight` — **Home** surface (CardNav entry into Vote / Spotlight / Dashboard)
- `/DNVRSpotlight/vote` — **Vote Mode** (AnimatedList → ScrollStack flow) + **Spotlight View** (InfiniteMenu toggle)
- `/DNVRSpotlight/dashboard` — **Organizer surface** (MagicBento tiles + contact export)

---

## 1) Infinite Menu — `InfiniteMenu` (Spotlight View)

### Purpose
An immersive "Spotlight View" where users explore nominees via an interactive WebGL2 sphere/grid menu.

### Imports
```js
import { useEffect, useRef, useState } from 'react';
import { mat4, quat, vec2, vec3 } from 'gl-matrix';
import './InfiniteMenu.css';
```

### Key code blocks
- Shaders: `discVertShaderSource`, `discFragShaderSource`
- Geometry utilities: `Face`, `Vertex`, `Geometry`, `IcosahedronGeometry`, `DiscGeometry`
- WebGL helpers: `createShader`, `createProgram`, `makeVertexArray`, `resizeCanvasToDisplaySize`, `makeBuffer`, `createAndSetupTexture`
- Interaction: `ArcballControl`
- Core engine: `InfiniteGridMenu`
- React wrapper: `export default function InfiniteMenu({ items = [], scale = 1.0 })`
- Overlay behavior: `activeItem` title/description + action button, `isMoving` to hide overlays on drag

### Mount pattern
```jsx
<div style={{ height: '600px', position: 'relative' }}>
  <InfiniteMenu items={items} scale={1} />
</div>
```

### Default items structure
```js
const defaultItems = [
  {
    image: 'https://picsum.photos/900/900?grayscale',
    link: 'https://google.com/',
    title: '',
    description: ''
  }
];
```

### Demo mapping
- Spotlight View items map from nominees:
  - `title`: nominee name
  - `description`: `${categoryTitle} • ${subtitle}`
  - `image`: placeholder (picsum or real)
  - `link`: external IG/website (or `#`)

### Overlay CSS
```css
#infinite-grid-menu-canvas {
  cursor: grab;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  outline: none;
}
#infinite-grid-menu-canvas:active { cursor: grabbing; }

.action-button {
  position: absolute;
  left: 50%;
  z-index: 10;
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  background: #5227ff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  border: 5px solid #000;
}

.face-title {
  user-select: none;
  position: absolute;
  font-weight: 900;
  font-size: 3rem;
  left: 1.6em;
  top: 50%;
}

.face-description {
  user-select: none;
  position: absolute;
  max-width: 10ch;
  top: 50%;
  font-size: 1.2rem;
  right: 1%;
  transform: translate(0, -50%);
}

@media (max-width: 1500px) {
  .face-title, .face-description { display: none; }
}
```

---

## 2) Animated List — `AnimatedList` (Voting Category Selector)

### Purpose
Scrollable animated category list — hover selection, click callback, keyboard navigation, gradient fades.

### Imports
```js
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useInView } from 'motion/react';
import './AnimatedList.css';
```

### Props
```ts
items: string[]
onItemSelect: (item: string, index: number) => void
showGradients?: boolean
enableArrowNavigation?: boolean
displayScrollbar?: boolean
initialSelectedIndex?: number
className?: string
itemClassName?: string
```

### CSS
```css
.scroll-list-container { position: relative; width: 500px; }
.scroll-list { max-height: 400px; overflow-y: auto; padding: 16px; }
.scroll-list::-webkit-scrollbar { width: 8px; }
.scroll-list::-webkit-scrollbar-track { background: #060010; }
.scroll-list::-webkit-scrollbar-thumb { background: #271e37; border-radius: 4px; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.item { padding: 16px; background-color: #170d27; border-radius: 8px; margin-bottom: 1rem; }
.item.selected { background-color: #271e37; }
.item-text { color: white; margin: 0; }
.top-gradient {
  position: absolute; top: 0; left: 0; right: 0; height: 50px;
  background: linear-gradient(to bottom, #060010, transparent);
  pointer-events: none; transition: opacity 0.3s ease;
}
.bottom-gradient {
  position: absolute; bottom: 0; left: 0; right: 0; height: 100px;
  background: linear-gradient(to top, #060010, transparent);
  pointer-events: none; transition: opacity 0.3s ease;
}
```

### Demo mapping
- Voting page left panel — award categories list
- On select → sets active category → renders nominees via ScrollStack

---

## 3) Scroll Stack — `ScrollStack` (Nominee Cards)

### Purpose
Stacked-card scroll interaction (Lenis-powered) for nominees after category selection.

### Imports
```js
import { useLayoutEffect, useRef, useCallback } from 'react';
import Lenis from 'lenis';
import './ScrollStack.css';
```

### Usage pattern
```jsx
import ScrollStack, { ScrollStackItem } from './ScrollStack'

<ScrollStack>
  <ScrollStackItem>
    <h2>Nominee Name</h2>
    <p>Category subtitle</p>
    <button>Cast Vote</button>
  </ScrollStackItem>
</ScrollStack>
```

### Key props
```ts
itemDistance?: number
itemScale?: number
itemStackDistance?: number
stackPosition?: string
scaleEndPosition?: string
baseScale?: number
rotationAmount?: number
blurAmount?: number
useWindowScroll?: boolean
onStackComplete?: () => void
```

### CSS
```css
.scroll-stack-scroller {
  position: relative; width: 100%; height: 100%;
  overflow-y: auto; overflow-x: visible;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  transform: translateZ(0);
  will-change: scroll-position;
}
.scroll-stack-inner { padding: 20vh 5rem 50rem; min-height: 100vh; }
.scroll-stack-card {
  transform-origin: top center;
  will-change: transform, filter;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  box-shadow: 0 0 30px rgba(0,0,0,0.1);
  height: 20rem; width: 100%;
  margin: 30px 0; padding: 3rem;
  border-radius: 40px;
  box-sizing: border-box;
  transform: translateZ(0);
  position: relative;
}
.scroll-stack-end { width: 100%; height: 1px; }
```

### Demo mapping
- Nominee cards rendered after category selection
- Each card: nominee name + subtitle + "Cast Vote" CTA (demo only, localStorage persist)

---

## 4) Card Navigation — `CardNav` (Home Page)

### Purpose
Cinematic GSAP-animated expandable nav for home page routing to Vote / Spotlight / Dashboard.

### Imports
```js
import { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import './CardNav.css';
```

### Key props
```ts
logo?: string
items: { label: string; link: string }[]
ease?: string
baseColor?: string
menuColor?: string
buttonBgColor?: string
buttonTextColor?: string
```

### Demo mapping
- Home page hero nav — routes to:
  - Vote Mode → `/DNVRSpotlight/vote`
  - Dashboard → `/DNVRSpotlight/dashboard`
  - Spotlight View → `/DNVRSpotlight/vote?mode=spotlight`

---

## 5) Integration Snippets (Usage Patterns)

### Spotlight View mount
```jsx
<div style={{ height: '600px', position: 'relative' }}>
  <InfiniteMenu items={nomineeItems} scale={1} />
</div>
```

### Vote page integration
```jsx
// Left panel
<AnimatedList
  items={categoryNames}
  onItemSelect={(item, idx) => setActiveCategory(idx)}
  showGradients={true}
  enableArrowNavigation={true}
/>

// Right panel
<ScrollStack>
  {nominees[activeCategory].map(n => (
    <ScrollStackItem key={n.id}>
      <NomineeCard nominee={n} onVote={handleVote} />
    </ScrollStackItem>
  ))}
</ScrollStack>
```

---

## 6) Quick Reference

| Component | Purpose | Route |
|-----------|---------|-------|
| `InfiniteMenu` | WebGL2 nominee sphere explorer | `/DNVRSpotlight/vote?mode=spotlight` |
| `AnimatedList` | Category selector list | `/DNVRSpotlight/vote` |
| `ScrollStack` | Stacked nominee cards | `/DNVRSpotlight/vote` |
| `CardNav` | Home page cinematic nav | `/DNVRSpotlight` |

---

## 7) Brand Alignment Notes (Denver Spotlight)

Override ReactBits defaults with:
- **Backgrounds**: `#080C18` (not white/light gray)
- **Primary accent**: `#C2185B` (magenta, not default purple)
- **Secondary accent**: `#5B2DFF` (royal purple)
- **Text**: `#F8F9FF` primary, `#C9CCD6` silver secondary
- **Glow max opacity**: 30%
- **No**: neon bloom, rainbow gradients, heavy tilt effects
- **Yes**: soft diffused glow, 180–240ms ease-out transitions, controlled vertical reveals
