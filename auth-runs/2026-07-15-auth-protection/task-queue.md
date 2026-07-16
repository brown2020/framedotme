# Task Queue

| ID | Priority | Status | Phase | Owned Files | Done-Check | Verification | Attempts | Stop Condition | Next Action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-001 | P1 | Verified; push pending | Server protection | `src/services/sessionService.ts`, `src/actions/paymentActions.ts`, auth reports | Both actions require a valid session and Stripe intent UID matches | lint/build/Doctor/source review pass | 1/3 | Fixed or concrete blocker | Commit/push |
| AUTH-002 | P1 | Verified; push pending | Session truth | session route/service, `useAuthSync`, login finish, auth reports | Initial POST always has valid CSRF pair; redirects are safe relative paths | lint/build/Doctor/source review pass | 1/3 | Fixed or concrete blocker | Commit/push |
| AUTH-003 | P0 | Blocked | Credit authority | Firestore rules, IAP/profile/payment boundaries | Provider receipt is verified server-side and all credit writes are server-authoritative | external/provider integration plus rules tests | 0/1 | Product/provider inputs supplied | Request direction after safe local work |
