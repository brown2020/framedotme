# Run State

## Current Phase

- Phase: Protection validation
- Status: AUTH-001/AUTH-002 verified; commit/push pending
- Active task: AUTH-001/AUTH-002
- Next action: checkpoint the verified auth security repair, then finalize protection reports after the broader pass

## Branch And Sync

- Repository root: `/Users/stephenbrown/Code/OPENSOURCE/framedotme`
- Branch: `dev`
- Origin/dev status: matched at `647d351` before source edits
- Working tree: AUTH-001/AUTH-002-owned source and reports

## Auth State

- Current auth provider: Firebase
- Firebase present: client and admin SDKs
- Auth state model: unknown/loading, signed out, signed in/session ready, session pending/error, signing out
- Session truth model: server-created custom HS256 `frame_session`; Firebase ID token verified at exchange
- Admin UID env: none/admin routes not found
- Protected route policy: proxy-listed app routes plus required checks at server actions

## Blockers

- AUTH-003/F-101: provider-verifiable IAP receipt and server-authoritative credit migration require product/external input.
