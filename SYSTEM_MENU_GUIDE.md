# Global System Menu - Implementation Guide

## Overview
The new glassmorphism system menu provides universal access to music controls, events, and app features from any page through a floating action button (FAB) and slide-out panel.

## Components

### 1. FloatingActionButton (`src/components/FloatingActionButton.tsx`)
**Location**: Bottom-right corner (fixed position)
**Features**:
- Glassmorphism styling with backdrop blur
- Shows album art when music is playing
- Animated hamburger icon when no music
- Pulsing glow effect during playback
- Animated waveform indicator badge
- Smooth spring animations

**States**:
- Default: Hamburger menu icon
- Playing: Album art with waveform badge
- Menu Open: X icon with rotation animation

### 2. GlobalSystemMenu (`src/components/GlobalSystemMenu.tsx`)
**Type**: Right-side slide-out panel
**Features**:
- Full-height overlay with backdrop blur
- Organized into sections:
  - **Now Playing**: Mini player with controls, progress, volume
  - **Quick Access**: Discover, Events, Library, Settings
  - **Events & Voting**: Browse, Host Dashboard, Create Event, Live Voting
  - **User Profile**: Avatar, settings access

**Music Controls**:
- Album art display
- Play/pause, skip, shuffle, repeat
- Volume slider with mute toggle
- Progress bar with time display
- Like/favorite button
- Quick actions: Lyrics, Queue, Vertical Player, Share

**Navigation**:
- Quick access to all major sections
- Event management tools
- Host-specific features (if authenticated)
- Settings and profile access

### 3. BucketsSystemTray (Existing)
**Remains**: Bottom system tray still available
**Purpose**: Full-width player controls for desktop experience
**Coexistence**: Works alongside FAB/menu for dual UX options

## Integration (App.tsx)

```tsx
import FloatingActionButton from './components/FloatingActionButton'
import GlobalSystemMenu from './components/GlobalSystemMenu'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <AudioPlayerProvider>
      <RouterProvider router={router} />
      <BucketsSystemTray /> {/* Existing bottom tray */}
      <FloatingActionButton
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
      />
      <GlobalSystemMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </AudioPlayerProvider>
  )
}
```

## Styling

### Glassmorphism Classes (index.css)
```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.glass-strong {
  background: rgba(17, 24, 39, 0.95);
  backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
}
```

## Z-Index Layering
- `z-[80]`: Floating Action Button
- `z-[90]`: Menu backdrop overlay
- `z-[100]`: Menu panel content

## Accessibility Features
- Keyboard navigation (Escape to close)
- ARIA labels on all interactive elements
- Focus management
- Screen reader friendly
- Click outside to close

## Event System Integration
The menu provides direct access to:
- Browse all events (`/events`)
- Host dashboard (`/host/dashboard`)
- Create new event (`/events/create`)
- Join live voting sessions (`/events/live`)

## Music Player Integration
Connects to `AudioPlayerContext` for:
- Current track state
- Playback controls (play/pause/skip)
- Volume management
- Like/favorite functionality
- Queue access

## User Authentication
Menu adapts based on auth state:
- Shows user profile when logged in
- Hides host-specific features when not authenticated
- Provides login prompts when needed

## Mobile Optimization
- Full-height responsive layout
- Touch-optimized controls
- Smooth slide animations
- Backdrop blur for iOS Safari support (`-webkit-backdrop-filter`)

## Performance Considerations
- AnimatePresence for smooth mount/unmount
- Lazy rendering (only when open)
- Optimized animations with `framer-motion`
- Backdrop click handler for quick close

## Future Enhancements
- Notification badges on FAB
- Gesture controls (swipe to close)
- Customizable quick actions
- Theme switching
- Recent activity feed
- Social features integration

## Testing Checklist
✅ Build compiles successfully
✅ No TypeScript errors
✅ FAB visible on all pages
✅ Menu slides in from right
✅ Music controls work when track is playing
✅ Navigation closes menu and routes correctly
✅ ESC key closes menu
✅ Click outside closes menu
✅ Glassmorphism effects render properly

## Browser Support
- Chrome 88+
- Firefox 79+
- Safari 15.2+ (with -webkit-backdrop-filter)
- Edge 88+

## Design Philosophy
Based on Apple's design language:
- Heavy backdrop blur for depth
- Minimal, clean iconography
- Smooth spring animations
- Glassmorphism layering
- Subtle shadows and borders
- Content-first hierarchy