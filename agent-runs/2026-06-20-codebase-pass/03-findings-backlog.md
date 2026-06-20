# Agent Report

## Agent

Name: Codex

## Scope

Built an evidence-backed backlog for bugs, race risks, dependency drift, architecture hazards, lifecycle cleanup, and test gaps.

## Inputs

Baseline validation report, `package.json`, `package-lock.json`, `README.md`, `CLAUDE.md`, `SPEC.md`, `firestore.rules`, `storage.rules`, and source inspection across auth, payment, recording, Firebase, and utility modules.

## Branch and Push

- Branch: dev
- Upstream: origin/dev
- Commit: pending this phase checkpoint
- Pushed to: pending this phase checkpoint
- Sync status: local `dev` matched `origin/dev` before report edits

## Loop

- Name: Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop
- Goal: produce a prioritized, evidence-backed backlog with file ownership and verification methods.
- Verify gate: every finding has severity, evidence, risk, proposed fix, and local verification.
- Stop condition: backlog is prioritized and the first executable task is clear.
- Attempt: 1/1
- Result: backlog written; first executable task is payment idempotency/credit atomicity.

## Run State

- Current phase: Findings Backlog
- Current task: T-003
- Last pushed commit: 6a7c04d
- Next action: commit/push backlog, then execute F-001.
- Blockers: none.

## Commands Run

```text
rg -n "TODO|FIXME|HACK|eslint-disable|ts-ignore|as any|console\\.|setInterval|setTimeout|addEventListener|removeEventListener|localStorage|sessionStorage|window\\.open|visibilitychange|beforeunload|onAuthStateChanged|onIdTokenChanged|MediaRecorder|navigator\\.mediaDevices" src
rg --files src -g '*.ts' -g '*.tsx' | xargs wc -l | sort -nr | head -30
rg -n "SESSION_COOKIE_NAME|frame_session|framedotmeAuthToken|JWT_SECRET|NEXTAUTH_SECRET|CSRF|csrf" src
rg -n "export \\*|export \\{|export default|export const|export function|export class" src/services src/lib src/utils src/hooks src/zustand
rg -n "\\.destroy\\(|getTabLeader\\(|new TabLeaderElection|tryBecomeLeader\\(|isLeader\\(" src
rg -n "isAdmin|isAllowed|isInvited|premium|lastSignIn" src firestore.rules
npm outdated --json
sed reads of payment, auth, route-protection, media, Firebase, rules, and store modules
```

## Findings

| ID | Severity | Type | Status | Area | Summary | Evidence | Risk | Effort | Verification | Next Step |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | P1 | Bug/Race condition | Open | Payments/credits | Payment success is not atomic: a payment record can be created before credits are added, and retry then sees the payment as existing and skips credits. The claimed idempotent transaction also uses `getDocs(q)` inside `runTransaction`, so the existence check is not part of the transaction read set. | `src/components/PaymentSuccess.tsx` creates the payment with `createPaymentIdempotent` before calling `addCredits`; `src/services/paymentsService.ts` uses `runTransaction` but checks duplicates with non-transactional `getDocs(q)` and writes a random doc. | Users can receive duplicate credits in concurrent success tabs, or receive no credits if credit update fails after the payment record is created. | Medium | Refactor payment processing so duplicate check/payment creation/credit update are one transaction or otherwise transactionally recoverable; run lint/build. | Execute first. |
| F-002 | P2 | Package update | Open | Dependencies | Dependency audit is non-clean and patch/minor updates are available. | `npm audit --audit-level=low` reports 10 vulnerabilities; `npm outdated --json` lists patch/minor updates for Next, Firebase, Stripe, React, ESLint, Tailwind, Zod, Zustand, and others. | Security and maintenance drift, including advisories touching route/proxy framework and Firebase transitive packages. | Medium | Apply safe patch/minor updates, then run `npm run lint`, `npm run build`, and `npm audit --audit-level=low`. | Package cleanup phase. |
| F-003 | P2 | Async/resource lifecycle | Open | Token refresh leader election | `TabLeaderElection.destroy()` sets `destroyed = true` before calling `resign()`, but `resign()` exits early when destroyed. Cleanup can skip heartbeat shutdown and leader-key removal. | `src/utils/tabLeaderElection.ts` lines around `destroy()` and `resign()`; search shows singleton use from `src/hooks/useTokenRefresh.ts`. | Stale leadership and heartbeat resources can persist if the documented cleanup API is used; this undermines the race-prevention utility. | Small | Reorder cleanup so resign/heartbeat/listener cleanup runs before marking destroyed; consider removing singleton map entry. Run lint/build. | Execute after F-001 if scope allows. |
| F-004 | P2 | Reliability | Open | Firebase initialization | Firebase client/admin initialization catches setup failures and casts empty objects to SDK types. | `src/firebase/firebaseClient.ts` and `src/firebase/firebaseAdmin.ts` catch initialization errors and assign `{}` as Firestore/Auth/Storage/Admin types. | Missing or invalid Firebase configuration can surface later as unclear runtime method failures instead of actionable startup errors. | Small/Medium | Fail loudly with a typed initialization error or guarded accessors; run lint/build. | Queue if F-001/F-003 complete cleanly. |
| F-005 | P2 | Test gap | Open | Validation | No package-defined unit/integration/e2e test script exists for payment, auth, route protection, or media recording. | `package.json` only defines `dev`, `build`, `start`, and `lint`; baseline build/lint pass. | Payment/auth/media regressions rely on manual validation. | Medium | Add focused tests where local framework choice is clear, or create a test plan if framework selection needs user approval. | Defer unless needed for a fix. |
| F-006 | P3 | Documentation | Open | README/spec alignment | README dependency version notes are stale relative to current `package.json`. | README lists older locked versions; `package.json` currently uses newer ranges such as Next `^16.2.4`, Firebase `^12.12.1`, Stripe `^22.0.2`. | Future agents/users may install or reason from stale version facts. | Small | Update README version notes after package cleanup, or remove brittle locked-version claims. | Defer to cleanup/docs. |
| F-007 | P3 | Lifecycle/cleanup | Open | Recorder popup | `VideoControlsLauncher` attaches an anonymous `beforeunload` listener to the popup window and only clears the polling interval on parent unmount. | `src/components/VideoControlsLauncher.tsx` opens `/videocontrols`, adds an inline `beforeunload` listener, and polls for closed state. | Low-risk stale listener/window reference if the parent unmounts while popup stays open. | Small | Store listener reference and remove/close on cleanup if behavior is desired. | Defer unless touching recorder lifecycle. |

## Changes Made

- Updated the findings report, task queue, and run state.

## Verification

Findings are based on source search, direct file reads, baseline commands, `npm audit`, and `npm outdated`. No source files were changed in this phase.

## Architecture and Lean Code Scorecard

| Area | Status | Evidence | Action |
| --- | --- | --- | --- |
| Dependency direction | Watch | Directory structure separates app/components/hooks/services/lib/stores, but payment credit flow crosses component, service, and profile store boundaries. | Repair payment boundary in F-001 |
| Module cohesion | Watch | Payment idempotency and credit mutation are split across `PaymentSuccess`, `paymentsService`, and `useProfileStore`. | Consolidate transactional payment success work |
| Public surface area | Watch | Broad selector/service exports exist, but no unused-export proof yet. | Defer dead-code proof |
| Data and side-effect flow | Fail | Payment record creation and credit update are separate writes with retry ambiguity. | Fix F-001 |
| Async/cache/resource lifecycle | Fail | `TabLeaderElection.destroy()` cleanup order prevents `resign()` from running. | Fix F-003 |
| Duplication and dead code | Watch | Largest files identified; no dead-code removals proven. | Reassess after fixes |
| Dependency lean-ness | Fail | Audit and outdated diagnostics are non-clean. | Package cleanup F-002 |
| Testability | Fail | No test script; payment/auth/media flows lack automated coverage. | F-005 |

## Quality Gate

- Command: `npm run lint`
- Result: passed
- Notes: report-only phase; source files unchanged.

## Commit-Push Checkpoint

- Status inspected: clean before report edits
- Diff checked: pending after final report update
- Files staged:
- Dry-run push:
- Push:
- Post-push sync:

## Stabilization

- Cycle: not started
- Completion criteria status: not applicable to this phase
- Remaining blockers: none

## Risks

- F-001 touches money/credit behavior and should stay isolated from package updates.
- F-004 may need care to preserve local development ergonomics around optional Firebase envs.
- F-005 may require a test framework choice if no existing project convention emerges.

## Open Questions

- None.

## Recommended Next Step

Commit and push the backlog, then execute F-001 with a focused payment/credit transaction fix.
