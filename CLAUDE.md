# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bucket & MediaID** is a React-based audio content platform with TypeScript, Supabase backend, and advanced audio processing capabilities. The platform serves multiple user roles (fans, artists, brands, developers) with MediaID-based privacy-first experiences and audio intelligence features.

## Common Development Commands

### Core Development
```bash
# Standard development server
npm start

# FFmpeg-enabled development (for audio processing features)
npm run start:ffmpeg

# Build for production
npm run build

# Run tests
npm test
```

### Audio Processing Development
```bash
# Build and serve with COOP/COEP headers (required for FFmpeg)
npm run build && node serve-with-headers.js

# Direct Express server with headers
node serve-with-headers.js
```

## Architecture Overview

### Core Structure
- **React + TypeScript**: Main application framework
- **React Router**: Client-side routing with role-based access
- **Supabase**: Authentication, database, and storage backend
- **Stripe**: Payment processing integration
- **FFmpeg.wasm**: Client-side audio processing

### Key Services & Libraries
- **Audio Intelligence**: `src/lib/audioIntelligence.ts` - Mock audio analysis service
- **MediaID System**: `src/lib/MediaId.ts` - Privacy-first user profiling
- **Supabase Client**: `src/lib/supabaseClient.ts` - Backend integration
- **Hybrid Audio Processing**: `src/lib/hybridAudioService.ts` - Client/server audio processing strategy

### Context Providers
- **AuthProvider**: `src/hooks/useAuth.tsx` - Authentication state management
- **AudioPlayerProvider**: `src/context/AudioPlayerContext.tsx` - Global audio player state

## Role-Based Architecture

The application supports multiple user roles with distinct dashboards:

### User Roles
- **fan**: Content consumers, basic access
- **artist**: Content creators, upload capabilities 
- **brand**: Partnership opportunities, marketing features
- **developer**: API access, technical documentation
- **admin**: Full platform access

### Role Routing
- Landing page routes to role-specific login flows
- `AutoRouter` component handles intelligent routing based on user profile
- `SmartRouteGuard` provides role-based access control
- Each role has dedicated dashboard components in `src/components/`

## Audio Processing System

### Processing Strategies
1. **Client-Only**: Real-time FFmpeg.wasm processing
2. **Server-Only**: Supabase Edge Functions (planned)
3. **Hybrid**: Smart routing between client/server
4. **Fallback**: Web Audio API when FFmpeg unavailable

### Audio Intelligence Pipeline
1. Upload → `ArtistUploadManager.tsx`
2. Storage → Supabase `artist-content` bucket
3. Analysis → Queue system in `audio_processing_jobs` table
4. Features → Stored in `audio_features`, `mood_tags` tables
5. Display → `AudioProcessingDashboard.tsx`

### Testing Audio Features
1. Navigate to `/test` for TestDashboard
2. Access "🎼 Audio Processing" dashboard
3. Upload audio files through "🎤 Artist Dashboard"
4. Process files using various processing strategies
5. View generated features and mood tags

## Database Schema (Key Tables)

### Authentication & Profiles
- `auth.users` - Supabase auth users
- `media_ids` - MediaID profiles with privacy settings
- `user_profiles` - Extended user information

### Content Management
- `content_items` - Uploaded audio/content with metadata
- `artist_profiles` - Artist-specific information

### Audio Intelligence
- `audio_features` - BPM, key, energy, valence, etc.
- `mood_tags` - Human-readable mood descriptors
- `lyrics` - Synchronized lyrics with rights management
- `audio_processing_jobs` - Async processing queue

## Development Patterns

### Component Organization
- Dashboard components for each role in `src/components/`
- Shared UI components (LoadingState, ErrorBoundary)
- Auth components in `src/components/auth/`
- Player components in `src/components/player/`

### State Management
- React Context for global state (Auth, AudioPlayer)
- Component-level state for UI interactions
- Supabase for server state synchronization

### Error Handling
- Global ErrorBoundary for React errors
- SmartRouteGuard for unauthorized access
- Graceful degradation for audio features

## Environment Configuration

### Required Environment Variables
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
```

### Optional Features
- Stripe integration for payments (keys in environment)
- FFmpeg requires COOP/COEP headers in production
- Audio processing works in fallback mode without FFmpeg

## Testing Strategy

### Development Testing
1. Use `/test` route for comprehensive testing dashboard
2. Test all user roles through dashboard switching
3. Audio features require `npm run start:ffmpeg` for full functionality
4. Fallback mode testing with regular `npm start`

### Browser Requirements for FFmpeg
- Chrome 88+, Firefox 79+, Safari 15.2+, Edge 88+
- SharedArrayBuffer and WebAssembly support
- Cross-Origin Isolation (COOP/COEP headers)

## Deployment Notes

### Production Headers
- `_headers` file configured for Netlify/Vercel
- `serve-with-headers.js` for manual deployment
- COOP/COEP headers required for FFmpeg features

### Build Process
- React build outputs to `build/` directory
- Static assets served from `public/`
- Supabase integration requires environment variables

## Key Implementation Details

### MediaID Privacy System
- User-controlled privacy settings
- Role-based content access
- Anonymous logging with user consent
- Genre preferences and content flags

### Audio Player Integration
- Global audio context with queue management
- Waveform visualization support
- Social features (likes, play counts)
- Multiple repeat/shuffle modes

### File Upload System
- Drag-and-drop support via react-dropzone
- Multiple format support (MP3, WAV, FLAC, M4A)
- Automatic checksum generation for deduplication
- Artist profile linking and metadata extraction

## Troubleshooting

### Common Issues
- **FFmpeg not working**: Ensure COOP/COEP headers, use `npm run start:ffmpeg`
- **Supabase errors**: Check environment variables and database schema
- **Route access denied**: Verify user role and SmartRouteGuard configuration
- **Upload failures**: Check Supabase storage bucket configuration (`artist-content`)

### Debug Tools
- Browser developer tools for client-side debugging
- Supabase dashboard for backend inspection
- TestDashboard component for feature testing
- Audio Processing Dashboard for upload pipeline debugging