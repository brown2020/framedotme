# Repository Guidance

## Project Shape

Frame.me is a Next.js 16 App Router application for browser-based screen recording. It uses React 19, TypeScript, Firebase Auth/Firestore/Storage, Stripe payments, Zustand state stores, Tailwind CSS 4, and shadcn/Radix-style UI primitives.

## Common Commands

- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Run production build: `npm run build`
- Start built app: `npm run start`
- Run lint: `npm run lint`

There is no dedicated `test` or `typecheck` script in `package.json` at the time of this note. Use `npm run lint` as the required pre-push quality gate and `npm run build` when changes touch routing, server code, config, or type-sensitive boundaries.

## Architecture Notes

- `src/app/` contains Next.js routes, layouts, metadata, loading, and API route handlers.
- `src/components/` contains UI and feature components. `src/components/ui/` holds reusable primitives.
- `src/providers/ClientProvider.tsx` composes app providers. The order is validated in development and should stay:
  `ErrorBoundary -> ViewportProvider -> AuthProvider -> RouteGuardProvider -> RecorderStatusProvider -> ToasterProvider -> CookieConsentProvider`.
- `src/proxy.ts` is the edge route-protection layer. It validates the server-signed `frame_session` JWT and guards protected routes before render.
- `src/app/api/session/route.ts` exchanges Firebase ID tokens for the app session cookie and handles session deletion.
- `src/services/` is for business logic without React hooks.
- `src/hooks/` is for client-side React hooks.
- `src/zustand/` holds global stores and selectors.
- `src/lib/media-stream-manager.ts` and `src/lib/recording-manager.ts` own browser media capture and recording lifecycle logic.
- `src/firebase/` initializes Firebase client/admin SDKs.

## Safety Rules

- Preserve the legacy Firestore collection name `botcasts`; do not rename it without a migration.
- Keep Firebase/Stripe/server secrets out of `NEXT_PUBLIC_*` variables.
- Access `NEXT_PUBLIC_*` variables statically so Next.js can replace them at build time.
- Media stream changes must preserve cleanup of tracks, event handlers, and `AudioContext` resources.
- Auth changes must preserve the server-side session cookie flow and edge proxy validation. Client state may personalize UI, but server/proxy checks authorize protected routes.
- Firestore and Storage rules use a default-deny posture scoped by authenticated UID; do not weaken this without explicit product/security approval.
- Keep bug fixes separate from dependency updates and broad refactors.

## Current Validation Gaps

- No automated unit/integration/e2e test command is defined.
- `npm run lint` is the only package-defined static quality gate.
- Browser media capture and auth flows need manual or future automated browser coverage for full confidence.
