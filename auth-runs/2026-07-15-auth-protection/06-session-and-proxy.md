# Session And Proxy

## Auth State Model

| State | Source Of Truth | UI Behavior | Server Behavior | Verification |
| --- | --- | --- | --- | --- |
| Unknown/bootstrap | TBD | TBD | TBD | TBD |
| Signed out | TBD | TBD | TBD | TBD |
| Signed in unverified | TBD | TBD | TBD | TBD |
| Signed in verified | TBD | TBD | TBD | TBD |
| Admin | TBD | TBD | TBD | TBD |
| Stale/invalid | TBD | TBD | TBD | TBD |
| Signing out | TBD | TBD | TBD | TBD |

## Session Endpoints

## Bootstrap And Refresh

## Server Verification

## proxy.ts

## Route Protection Matrix

| Scenario | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Public route signed out | Not run | TBD | TBD |
| Auth-only route signed in | Not run | TBD | TBD |
| Protected page signed out | Not run | TBD | TBD |
| Protected API/server action signed out | Not run | TBD | TBD |
| Protected data not public/static cached | Not run | TBD | TBD |
| Admin route non-admin | Not run | TBD | TBD |
| Admin route admin | Not run | TBD | TBD |
| Stale/revoked session | Not run | TBD | TBD |

## Admin Routes

## Drift And Cache Cleanup
