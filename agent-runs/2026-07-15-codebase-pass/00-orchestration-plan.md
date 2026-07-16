# Orchestration Plan

## Mode Selection

- Repo: `/Users/stephenbrown/Code/OPENSOURCE/framedotme`
- Branch: `dev`
- Work mode: full codebase improvement with all locally verifiable package upgrades
- Run folder: `agent-runs/2026-07-15-codebase-pass/`
- Verifiable gates: `npm run lint`, `npm run build`, `npm outdated --long`, `npm audit --audit-level=low`, targeted searches, Git diff/status, remote read, dry-run push
- Human-decision blockers: product behavior changes, unsafe force fixes/downgrades, external credentials or services, and broad architecture/security policy changes
- Resume policy: re-run Git preflight, read `run-state.md` and `task-queue.md`, validate owned dirty files, then continue the recorded next action

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop, Quality Gate Selection Loop | Lint/build/dependency diagnostics are classified | Baseline clean or every failure has evidence and ownership |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes | Task Queue Loop, Fix Validation Loop | Confirmed bugs/warnings fixed with targeted checks plus lint/build | Executable findings are done, deferred, or blocked with evidence |
| Package Cleanup | Package Cleanup Loop, Dead Code Loop | Package/lockfile changes align; lint/build pass; audit/outdated recorded | Safe upgrades applied and risky migrations classified |
| Review | Judge Loop | PASS or each FAIL becomes a bounded task | No unqueued actionable review finding remains |
| Stabilization | Stabilization Loop, Judge Loop | Final lint/build and review pass | Completion criteria pass or a real blocker is recorded |
| Integrate | Final Completion Gate, Commit-Push Checkpoint Loop | Clean tree on synced `dev`; reports and commits pushed | Final report is pushed and branch matches `origin/dev` |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `AGENTS.md`, `SPEC.md`, run planning and preflight reports | Startup planning, current guidance, and resume state |
| T-002 | Baseline report, run state, task queue | Read-only validation and dependency diagnostics |
| T-003 | Findings report, run state, task queue | Evidence-backed source/package audit |
| T-004 | Finding-owned source files and execution report | Confirmed bug and warning fixes only |
| T-005 | `package.json`, `package-lock.json`, cleanup report | Dependency upgrades and proven dead-code cleanup |
| T-006 | Review report, run state, task queue | Read-only judge pass |
| T-007 | Finding-owned files and stabilization report | Bounded review/quality-gate fixes |
| T-008 | Integrator/final reports, run state | Final verification and Git completion gate |
