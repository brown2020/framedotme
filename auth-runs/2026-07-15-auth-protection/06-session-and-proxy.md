# Session And Proxy

## Session Endpoints

- `GET /api/session`: creates a fresh readable double-submit CSRF cookie and is `no-store`.
- `POST /api/session`: always validates CSRF, verifies a Firebase ID token with Admin, and creates the HttpOnly custom HS256 `frame_session` JWT.
- `DELETE /api/session`: always validates CSRF and clears both session and CSRF cookies.
- Client exchange/clear calls are centralized in `sessionCookieService`, which bootstraps CSRF before either mutation.

## Server Verification

- `sessionService` now verifies the custom JWT using the same secret/algorithm as `proxy.ts`; it no longer treats the custom JWT as a Firebase session cookie.
- Both Stripe server actions call `requireAuthenticatedSession` before accessing Stripe.
- New PaymentIntents include `metadata.userId`; validation rejects a session whose UID does not match.

## Route Protection Matrix

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Protected page signed out | Pass by source/build | `proxy.ts` validates signature and redirects protected route list | Manual browser QA still useful |
| Protected server action signed out | Pass by source/Doctor | both exports call `requireAuthenticatedSession` | React Doctor changed scope: no issues |
| Authenticated action owns resource | Pass by source | PaymentIntent metadata UID checked on validation | Existing pre-change intents without metadata are denied |
| Initial session mutation CSRF | Pass by source/build | GET bootstrap + unconditional POST validation | Manual request QA deferred |
| Admin route | N/A | no admin routes found | no policy invented |
