# Frame.me Current-State Specification

## Purpose

Frame.me is a web app for creating, managing, and sharing browser screen recordings. The current implementation is a Next.js App Router application with Firebase-backed authentication/data/storage and Stripe payment integration.

## Current User Workflows

- Public visitors can view the home, about, privacy, terms, and support pages.
- Users authenticate through Firebase-backed client flows, then receive a server-signed `frame_session` cookie from `/api/session`.
- Protected routes include capture, recordings, profile, payment attempt/success, and video controls.
- Authenticated users can open recording controls, capture screen video with optional microphone/system audio, store recording metadata, and view recordings.
- Payment UI and server actions integrate with Stripe for checkout and payment history surfaces.

## Implementation Evidence

- App shell and metadata: `src/app/layout.tsx`
- Route protection: `src/proxy.ts`
- Session cookie API: `src/app/api/session/route.ts`
- Provider composition: `src/providers/ClientProvider.tsx`
- Recording managers: `src/lib/media-stream-manager.ts`, `src/lib/recording-manager.ts`
- Firebase initialization: `src/firebase/firebaseClient.ts`, `src/firebase/firebaseAdmin.ts`
- Firestore and Storage policy: `firestore.rules`, `storage.rules`
- Package scripts and dependencies: `package.json`, `package-lock.json`

## Architecture Summary

- Next.js routes live under `src/app/`.
- UI components live under `src/components/`, with auth, video, home, and reusable UI subareas.
- Business logic without React belongs in `src/services/`; React-bound behavior belongs in `src/hooks/`.
- Global state uses Zustand stores under `src/zustand/`.
- Providers are composed in a validated order in `ClientProvider`.
- The edge proxy validates an HS256 JWT session cookie using `jose` before protected routes render.
- Firebase Admin verifies ID tokens in the session API and Firebase/Firestore/Storage provide persistence.
- Media capture is split between stream acquisition/mixing and recording/chunk management.

## Validation

Available package scripts:

- `npm run lint`: ESLint over the repository.
- `npm run build`: Next.js production build.
- `npm run dev`: local development server.
- `npm run start`: serve a built app.

No package-defined unit, integration, e2e, or standalone typecheck script exists currently.

## Quality Risks

- The README dependency version notes appear older than the current `package.json` ranges, so docs should be kept aligned with package metadata.
- There is no automated test suite for auth, media recording, payment, or route-protection flows.
- Firebase Admin initialization falls back to cast empty objects on configuration failure, which can defer failures until runtime call sites.
- Media capture and recording rely on browser APIs that require browser-level validation beyond lint/build.
- The remote push output reported GitHub vulnerability alerts for the default branch; dependency diagnostics should be part of the cleanup phase.

## Current Improvement Goals

- Establish a clean `dev` branch workflow with report-backed checkpoints.
- Record baseline lint/build/dependency status.
- Build an evidence-backed backlog of bugs, race risks, dead code, package drift, architecture risks, and lean-code opportunities.
- Execute only locally verifiable codebase-health improvements while preserving product behavior.
