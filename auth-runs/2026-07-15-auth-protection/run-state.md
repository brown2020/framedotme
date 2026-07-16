# Run State

## Current Phase

- Phase: Protection planning
- Status: Verified; setup/findings checkpoint pending
- Active task: AUTH-001
- Next action: implement shared custom-JWT session verification and bind Stripe intents to the session UID

## Branch And Sync

- Repository root: `/Users/stephenbrown/Code/OPENSOURCE/framedotme`
- Branch: `dev`
- Origin/dev status: matched at `439eed5` before auth-ledger edits
- Working tree: auth run reports only

## Auth State

- Current auth provider: Firebase
- Firebase present: client and admin SDKs
- Auth state model: unknown/loading, signed out, signed in/session ready, session pending/error, signing out
- Session truth model: server-created custom HS256 `frame_session`; Firebase ID token verified at exchange
- Admin UID env: none/admin routes not found
- Protected route policy: proxy-listed app routes plus required checks at server actions

## Blockers

- AUTH-003/F-101: provider-verifiable IAP receipt and server-authoritative credit migration require product/external input.
