# Auth Protection Plan

## Mode

Protection-only repair for confirmed findings inside the active full codebase pass. Existing Firebase provider/UI behavior remains in place.

## Tasks

1. AUTH-001: Correct the existing custom-JWT verification service, require `frame_session` in both Stripe server actions, attach the UID to new Stripe intents, and deny validation by another UID.
2. AUTH-002: Bootstrap a CSRF cookie through a safe GET, always validate session POST, centralize the client exchange service, and reject protocol-relative login redirects.
3. AUTH-003: Do not invent or bypass provider receipt verification. Record the client-authoritative credit/IAP boundary as blocked pending product/external setup.

## Verification

- Targeted TypeScript/build checks.
- `npm run lint` and `npm run build`.
- React Doctor changed-scope scan.
- Source review proving both exported payment actions call the shared session requirement before Stripe access.

## Stop Conditions

- Stop on an external receipt/provider credential requirement, a product decision that would disable IAP, or a change requiring broad migration of all credit writes.
