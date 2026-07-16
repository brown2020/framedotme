# Auth Provider Migration

## Provider Verdict

- Verdict: preserve the existing Firebase Auth provider; no competing provider or migration target exists.
- Evidence: Firebase client/admin SDKs, Google/password/email-link handlers, `/loginfinish`, and Firebase ID-token exchange are the only auth system.
- Replacement needed: no.

## Existing Surfaces

| Surface | Evidence | Result |
| --- | --- | --- |
| Packages | `firebase`, `firebase-admin`, `react-firebase-hooks` | Kept and upgraded |
| Routes/callbacks | `/loginfinish`, `/api/session` | Kept and hardened |
| Proxy | `src/proxy.ts` custom JWT verification | Kept and aligned with server verification |
| Cookies/storage | Firebase client token plus HttpOnly `frame_session` | Kept; CSRF handshake hardened |
| Environment | Static Firebase public vars; server-only Admin/JWT secrets | Kept; initialization now fails clearly |
| UI | Google, password, and email-link paths | Out of protection-only change scope |

## Firebase Setup Gate

Build-time environment names are present locally and documented in `.env.example`. Console-only provider enablement and authorized-domain state cannot be proven from repository source and remain deployment checks rather than code blockers.

## Result

No provider migration performed. The existing Firebase-to-custom-session boundary is now internally consistent.
