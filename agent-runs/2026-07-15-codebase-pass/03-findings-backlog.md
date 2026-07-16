# Agent Report

## Agent

Name: Codex

## Scope

Audited current source, auth/session boundaries, payment/credit flows, browser resource lifecycles, React/Next correctness and accessibility diagnostics, package reachability, dead code, metadata wiring, and prior deferred findings.

## Inputs

Baseline report, React Doctor 0.7.8 verbose diagnostics, repository-wide `rg` searches, direct reads of auth/payment/media/store/rules code, prior run findings, current package diagnostics, and the codebase-improvement, auth-workflow, and Vercel React guidance.

## Branch and Push

- Branch: `dev`
- Upstream: `origin/dev`
- Commit: pending findings checkpoint
- Pushed to: pending findings checkpoint
- Sync status: matched `origin/dev` at `439eed5` before report/auth-ledger edits

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop, Auth Discovery Loop, and Auth Architecture Plan Loop
- Goal: convert only evidence-backed issues into bounded tasks and identify decisions that cannot be made locally.
- Verify gate: every confirmed finding has severity, evidence, risk, ownership, and verification; hypotheses/false positives are classified.
- Stop condition: execution order is clear and non-local security decisions are isolated.
- Attempt: 1/1
- Result: pass; locally executable findings are queued and one product/external security blocker is isolated.

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Verification / Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-101 | P0 | Security/Product blocker | Blocked | Credits/IAP | Credits are client-authoritative. Firestore permits owners to update `profile/userData.credits`; `useIAPHandler` accepts an unverified browser `message` and adds 10,000 credits. Secure remediation requires provider receipt validation and server-authoritative credit mutations. | `firestore.rules:30-32`, `src/hooks/useIAPHandler.ts:21-38`, `src/zustand/useProfileStore.ts:169-246` | Do not silently disable mobile purchases. Requires receipt payload/provider credentials and an approved server-credit migration. |
| F-102 | P1 | Security bug | Open | Stripe server actions | `createPaymentIntent` and `validatePaymentIntent` do not verify `frame_session`; validation is not bound to the creating UID. | React Doctor errors; `src/actions/paymentActions.ts:25,55` | Add shared custom-JWT session verification; attach/check Stripe owner metadata; lint/build/React Doctor. |
| F-103 | P1 | Auth hardening | Open | Session CSRF/redirect | Initial session POST skips CSRF when no CSRF cookie exists, and login redirect accepts protocol-relative `//...` values because it only checks `startsWith("/")`. | `src/app/api/session/route.ts:30-42`, `src/app/loginfinish/page.tsx:78-83` | Add CSRF bootstrap GET + always-validated POST; centralize client exchange; validate safe relative paths. |
| F-104 | P2 | Lifecycle bug | Open | Login/popup | Login error redirect timeout is not cancelled; popup `beforeunload` listener is anonymous and not removed when launcher unmounts. | React Doctor errors; `loginfinish/page.tsx:27-110`, `VideoControlsLauncher.tsx:36-64` | Own timeout/listener/window cleanup; lint/build/React Doctor. |
| F-105 | P2 | React correctness/accessibility | Open | UI | Active UI has missing button types, one unstable FAQ index key, two images without `sizes`, redundant header roles, and a provider-array length omission. | React Doctor warnings and direct reads | Apply behavior-preserving fixes; rerun React Doctor. |
| F-106 | P2 | Hydration correctness | Open | Date/time UI | Four client components format locale/timezone values during render, risking server/client text mismatch. | React Doctor warnings in `AuthDataDisplay`, `FeaturedVideoPlayer`, `PaymentSuccess`, `PaymentsSection` | Add one client-only local date/time component and replace render-time locale calls. |
| F-107 | P2 | Performance | Open | Recorder hooks | Two active `useRef(new ...)` initializers construct discarded media/recording managers on every render. | React Doctor warnings in `useScreenRecorder.ts` | Lazy-init refs; preserve cleanup; lint/build/Doctor. |
| F-108 | P2 | Dead code/metadata | Done | Reachability | Unreferenced auth UI, legacy video playback, token-leader, env/type compatibility files, and unused selector/helper exports expanded surface. Five route metadata modules were also unreachable, so intended metadata was not applied. | React Doctor deslop output plus zero external imports from repository-wide `rg`; cleanup lint/build/full Doctor pass | Deleted proven-isolated clusters; wired metadata through route layouts; removed zero-use exports. |
| F-109 | P2 | Dependency | Open | Packages | Safe patch/minor updates and three majors are current candidates; nested Next/PostCSS audit remains. Two manifest dependencies have no source/config use. | Baseline `npm outdated`, `npm audit`, React Doctor dependency reachability, `rg` | Remove unused deps, update safe batch, migrate locally verifiable majors, then lint/build/audit/outdated. |
| F-110 | P2 | Reliability | Done | Firebase initialization | Firebase client/admin initialization caught failures and exported cast-empty SDK objects, deferring clear configuration errors into unrelated runtime calls. | `src/firebase/firebaseClient.ts`, `src/firebase/firebaseAdmin.ts`; lint/build pass; commit `cb53fe7` | Replaced cast-empty fallbacks with explicit initialization failure while preserving static public env access. |
| F-111 | P3 | Maintainability | Done | Zod/Fast Refresh | `z.string().url()` was deprecated in Zod 4; `buttonVariants` was an unused non-component export from a component file. | React Doctor warnings; cleanup full scan no longer reports either warning | Used `z.url()` and narrowed the button export. |
| F-112 | P2 | Test gap | Deferred | Validation | No unit/integration/e2e script exists for auth, payment, media, or rule behavior. | `package.json` scripts | Keep build as TypeScript gate; recommend focused test framework follow-up rather than choosing broad infrastructure inside this pass. |

## Classified Hypotheses / False Positives

- Firebase browser config and collection names are intentionally public; default-deny UID-scoped rules protect data, except the separately confirmed credits authority issue F-101.
- Firebase auth/session synchronization must run after client auth observation; the effect has a version counter that invalidates stale operations. It is not a generic cancellable data fetch.
- Email-link completion necessarily performs client navigation after Firebase finishes; proxy cannot complete the client-only email-link exchange.
- Several `metadata.ts` files are not conventional entry points on their own; they are treated as missing wiring, not blindly deleted.

## Changes Made

- Updated findings, task/run state, and a protection-focused auth run ledger. No app source or package files changed in this phase.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Fail | Payment server boundary lacks session enforcement; credits mutate in client services. | Fix F-102/F-103; block F-101 decision |
| Module cohesion | Watch | Session exchange is duplicated between hook and service. | Consolidate in F-103 |
| Public surface area | Fail | Proven unreachable clusters and 38 unused-export hypotheses. | Remove only search-proven items in F-108 |
| Data and side-effect flow | Fail | Client-authoritative credits/IAP and unauthenticated Stripe actions. | F-101/F-102 |
| Async/cache/resource lifecycle | Fail | Confirmed timeout and popup listener leaks. | F-104 |
| Duplication and dead code | Fail | Multiple isolated clusters have zero entry-point imports. | F-108 |
| Dependency lean-ness | Fail | Current drift/advisory plus two unused manifest dependencies. | F-109 |
| Testability | Fail | No automated test script; browser/external flows are manual. | F-112 deferred |

## Quality Gate

- Command: `npm run lint`; `npm run build` (baseline)
- Result: passed
- Notes: report/auth-ledger-only phase; source unchanged.

## Risks

- F-101 cannot be honestly closed without provider receipt data and server-authoritative credit policy. It remains isolated from locally safe fixes.
- React Doctor diagnostics are treated as hypotheses; only direct-code/search-confirmed items are queued.
- Knip could not be safely downloaded under the sandbox, so no deletion relies solely on unavailable tooling.

## Recommended Execution Order

1. F-102/F-103 auth and server-action security.
2. F-104 lifecycle correctness.
3. F-105/F-106/F-107 React correctness, accessibility, hydration, and recorder performance.
4. F-108/F-110/F-111 lean-code/reliability cleanup.
5. F-109 dependency updates and compatibility migrations.
6. Judge/stabilize; keep F-101 explicitly blocked pending product/external input.
