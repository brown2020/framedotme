# Auth Inventory

## Framework And Provider

- Next.js 16 App Router with `proxy.ts`.
- Provider verdict: Firebase client Auth plus Firebase Admin ID-token verification.
- Server route truth: custom HS256 `frame_session` JWT created by `/api/session` after Firebase ID-token verification.
- No Clerk, NextAuth/Auth.js, Auth0, Supabase Auth, WorkOS, or Cognito evidence.

## Route Classes

- Public: `/`, `/about`, `/privacy`, `/terms`, `/support`, `/loginfinish` while completing email-link auth.
- Protected in proxy: `/capture`, `/recordings`, `/profile`, `/payment-attempt`, `/payment-success`, `/videocontrols`.
- Admin: none found.
- Protected server actions: Stripe payment actions now require the shared server-session verifier (AUTH-001 fixed).

## Session And State Evidence

- `/api/session` verifies Firebase ID tokens and sets HttpOnly `frame_session` plus a readable CSRF cookie.
- `proxy.ts` verifies the custom JWT signature and expiration before protected pages render.
- `useAuthSync` coordinates Firebase client state, server session creation, and Zustand state with a version counter.
- Sign-out clears server session, Firebase state, Zustand stores, cookies, storage, and reloads/redirects.
- Initial session creation now bootstraps and validates CSRF; login redirect validation rejects protocol-relative/backslash paths (AUTH-002 fixed).

## Security Gaps

- AUTH-001: fixed; Stripe actions require session and intent ownership.
- AUTH-002: fixed; CSRF handshake and redirect validation hardened.
- AUTH-003: client-authoritative credits/IAP receipt validation is blocked pending provider/server policy.

## Baseline

- `npm run lint`: pass.
- `npm run build`: pass.
- React Doctor: two unauthenticated-server-action errors plus bounded auth-adjacent warnings.
