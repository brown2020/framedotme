# CLAUDE.md - Frame.me Development Guide

## Quick Start

```bash
npm install     # Install dependencies
npm run dev     # Start development server (http://localhost:3000)
npm run build   # Production build
npm run lint    # Run ESLint
```

## Project Overview

Frame.me is a screen recording web application built with Next.js 16, React 19, Firebase (Auth + Firestore + Storage), and Stripe for payments.

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # React components (~45 files)
│   ├── auth/               # Auth UI components
│   ├── video/              # Video playback & overlays
│   └── ui/                 # shadcn/ui primitives
├── zustand/                # Global state stores
├── providers/              # Context providers (order matters!)
├── hooks/                  # Custom React hooks
├── services/               # Business logic (no React)
├── lib/                    # Utilities & managers
├── firebase/               # Firebase SDK initialization
├── types/                  # TypeScript definitions
├── constants/              # Application constants
├── utils/                  # Pure utility functions
├── actions/                # Server actions
└── proxy.ts                # Edge middleware
```

### Key Patterns

**Authentication**: Dual-cookie strategy
- Firebase Auth (client) + custom HS256 JWT session cookie (server)
- Edge middleware (`proxy.ts`) validates JWT before rendering protected routes
- Token refresh: 50-minute interval (Firebase tokens expire at 60 min)

**State Management**: Zustand stores with optimized selectors
- `useAuthStore` - Auth state
- `usePaymentsStore` - Payment history
- `useProfileStore` - User profile
- `useRecorderStatusStore` - Recording lifecycle

**Provider Order**: Critical - validated at runtime
```
ErrorBoundary → ViewportProvider → AuthProvider → RouteGuardProvider → RecorderStatusProvider → ToasterProvider → CookieConsentProvider
```

**Media Recording**: MediaStreamManager + RecordingManager
- Screen + microphone capture with Web Audio API mixing
- 1-second chunk intervals (prevents OOM on long recordings)
- Max file size: 500MB

### Firestore Data Model

```
users/{uid}/
├── profile/userData        # User profile document
├── settings/recorder       # Recorder settings
├── botcasts/{recordingId}  # Video metadata (legacy name - don't rename!)
└── payments/{paymentId}    # Payment records (immutable)
```

### Protected vs Public Routes

**Protected** (require auth): `/capture`, `/recordings`, `/profile`, `/payment-attempt`, `/payment-success`, `/videocontrols`

**Public**: `/`, `/about`, `/privacy`, `/terms`, `/support`

## Environment Variables

Copy `.env.example` and fill in:

```bash
# Firebase Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_APIKEY
NEXT_PUBLIC_FIREBASE_AUTHDOMAIN
NEXT_PUBLIC_FIREBASE_PROJECTID
NEXT_PUBLIC_FIREBASE_STORAGEBUCKET
NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID
NEXT_PUBLIC_FIREBASE_APPID

# Firebase Server (service account)
FIREBASE_PROJECT_ID
FIREBASE_PRIVATE_KEY
FIREBASE_CLIENT_EMAIL
# ... other service account fields

# Stripe
NEXT_PUBLIC_STRIPE_KEY
STRIPE_SECRET_KEY

# JWT Session
JWT_SECRET  # Must be >= 32 characters
```

## Code Conventions

### TypeScript
- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- All stores, services, and components are fully typed

### Zustand Store Pattern
```typescript
// Always use exported selectors to prevent re-renders
export const useData = () => useStore((state) => state.data);
export const useDataLoading = () => useStore((state) => state.loading);
```

### Services vs Hooks
- **Services** (`src/services/`): No React - safe for SSR/server
- **Hooks** (`src/hooks/`): React hooks - client-side only

### Error Handling
- Custom `AppError` class with categories (auth, payment, media, validation)
- Logger utility at `src/utils/logger.ts`

## Important Notes

1. **NEXT_PUBLIC_* variables**: Use direct string access (static replacement at build time), never dynamic access

2. **MediaStreamManager**: Always call `cleanup()` to release tracks and remove listeners

3. **"botcasts" collection**: Legacy name for recordings - don't rename without data migration

4. **JWT Secret**: Generate with `openssl rand -base64 32`

5. **Recording chunks**: 1-second intervals are intentional - prevents memory exhaustion

6. **Provider order**: Changes require updating validation in ClientProvider

## Tech Stack

- **Framework**: Next.js 16, React 19
- **Auth**: Firebase Auth + custom JWT
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Payments**: Stripe
- **State**: Zustand
- **Styling**: Tailwind CSS v4
- **Validation**: Zod
- **UI Components**: shadcn/ui (Radix primitives)
