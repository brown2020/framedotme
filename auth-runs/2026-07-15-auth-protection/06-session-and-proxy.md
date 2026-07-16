# Session And Proxy

## Session Endpoints

- `GET /api/session`: creates a fresh readable double-submit CSRF cookie and is `no-store`.
- `POST /api/session`: always validates CSRF, verifies a Firebase ID token with Admin, and creates the HttpOnly custom HS256 `frame_session` JWT.
- `DELETE /api/session`: always validates CSRF and clears both session and CSRF cookies.
- Client exchange/clear calls are centralized in `sessionCookieService`, which bootstraps CSRF before either mutation.

## Server Verification

- `sessionService` now verifies the custom JWT using the same minimum-length secret and HS256-only policy as `proxy.ts`; it no longer treats the custom JWT as a Firebase session cookie.
- Both Stripe server actions call `requireAuthenticatedSession` before accessing Stripe.
- New PaymentIntents include `metadata.userId`; validation rejects a session whose UID does not match.

## Route Protection Matrix

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Protected page signed out | Pass by source/build/smoke | `/capture` and `/profile` return 307 to `/` | Manual authenticated browser QA still useful |
| Protected server action signed out | Pass by source/Doctor | both exports call `requireAuthenticatedSession` | React Doctor changed scope: no issues |
| Authenticated action owns resource | Pass by source | PaymentIntent metadata UID checked on validation | Existing pre-change intents without metadata are denied |
| Initial session mutation CSRF | Pass by source/build/smoke | GET bootstrap 200 + POST without token 403 | Authenticated exchange still needs provider browser QA |
| Admin route | N/A | no admin routes found | no policy invented |
