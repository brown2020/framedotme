# Error And Edge States

## Redirect Safety

- Email-link completion accepts only single-slash relative cookie paths and rejects protocol-relative/backslash values before navigation.
- The required post-auth client redirect remains because Firebase email-link completion is client-only.

## CSRF And Abuse Guardrails

- Initial login/session creation no longer bypasses CSRF.
- Client code bootstraps a same-origin CSRF cookie, then sends the matching custom header for POST/DELETE.
- Session bootstrap is explicitly `no-store`.

## Stale/Repeated Login Handling

- A processing ref prevents Strict Mode/effect dependency reruns from invoking email-link sign-in twice.
- The error redirect is owned by a cleanup-returning effect, so unmount/status changes cancel it.
