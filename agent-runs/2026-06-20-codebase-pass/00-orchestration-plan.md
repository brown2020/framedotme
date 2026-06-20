# Orchestration Plan

## Mode Selection

- Repo: /Users/stephenbrown/Code/OPENSOURCE/framedotme
- Branch: dev
- Work mode: full
- Run folder: /Users/stephenbrown/Code/OPENSOURCE/framedotme/agent-runs/2026-06-20-codebase-pass
- Verifiable gates: `npm run lint`; `npm run build` for route/server/type-sensitive changes; `npm audit` and `npm outdated` during package diagnostics; Git read/dry-run push/sync gates.
- Human-decision blockers: product roadmap changes, auth/security behavior changes not required by a confirmed bug, broad architecture rewrites, risky major dependency upgrades.
- Resume policy: resume from `run-state.md`, `task-queue.md`, Git status, and any local commits ahead of `origin/dev`; push validated in-scope commits before new edits.

## Loop Plan

| Phase | Loop | Verify Gate | Stop Condition |
| --- | --- | --- | --- |
| Preflight and Repo Docs | Orchestration Planning Loop, Docs Sweep Loop | Docs match current repo and checks pass | Plan, state, queue, docs, and report pushed |
| Baseline Validation | Baseline Validation Loop, Quality Gate Selection Loop | Lint/build/dependency status is recorded and failures are classified | Baseline is clean or every failure has reproduction/ownership |
| Findings Backlog | Findings Queue Loop, Architecture Fitness Loop, Lean Code Loop | Evidence-backed backlog and scorecard | Backlog, scorecard, and queue are pushed |
| Execute Fixes and Improvements | Task Queue Loop, Fix Validation Loop, Architecture Fitness Loop, Lean Code Loop | Targeted checks and lint/build gates pass for changed behavior | Highest-priority local/verifiable tasks are done, deferred, or blocked |
| Package and Dead-Code Cleanup | Package Cleanup Loop, Dead Code Loop | Dependency/dead-code changes are evidenced and lint/build pass | Safe cleanup is pushed; risky changes deferred |
| Review | Judge Loop | No actionable P0/P1 or introduced regressions remain | Review report is pushed and new tasks are queued/deferred |
| Stabilization Loop | Stabilization Loop, Judge Loop | Completion criteria pass or real blocker recorded | Stabilization report is pushed |
| Integrator | Final Completion Gate | Branch is clean/synced; quality gates recorded; final report pushed | Workflow success or precise blocker |

## File Ownership

| Task | Owned Files | Notes |
| --- | --- | --- |
| T-001 | `AGENTS.md`, `SPEC.md`, `agent-runs/2026-06-20-codebase-pass/*` | Startup planning, repo guidance, current-state spec, and resume state |
| T-002 | `agent-runs/2026-06-20-codebase-pass/02-baseline-validation.md`, `run-state.md`, `task-queue.md` | Baseline lint/build/dependency status |
| T-003 | `agent-runs/2026-06-20-codebase-pass/03-findings-backlog.md`, `task-queue.md` | Evidence-backed backlog and scorecard |
| T-004 | Source/tests owned by selected finding, `04-execute-fixes-and-improvements.md`, `task-queue.md` | Confirmed bug/race/architecture/lean-code fixes |
| T-005 | `package.json`, `package-lock.json`, proven dead files/code, `05-package-and-dead-code-cleanup.md` | Safe dependency and dead-code cleanup |
| T-006 | `06-review.md`, `task-queue.md` | Judge review and follow-up task creation |
| T-007 | Files owned by remaining actionable tasks, `07-stabilization-loop.md` | Stabilization cycles |
| T-008 | `08-integrator.md`, `final-report.md`, `run-state.md` | Final completion gate |
