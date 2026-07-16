# Navigation, Account, And Sign-Out

## Navigation

The header remains state-neutral; protected navigation is authorized by the proxy, not client presentation. No admin UI/routes exist.

## Account And Sign-Out

- Profile sign-out and support reset use the shared `useSignOut` boundary.
- Sign-out best-effort deletes the server session through the CSRF-protected endpoint, signs out Firebase, resets Zustand stores, clears readable cookies/storage, and redirects/reloads.
- Server/proxy authorization does not rely on the client store.

## State Matrix

| State | Result | Evidence |
| --- | --- | --- |
| Unknown/bootstrap | Client provider waits for Firebase state | `useAuthSync` loading guard |
| Signed out | Protected routes redirect to `/` | proxy smoke: 307 |
| Signed in/session ready | Protected UI/store may personalize | session created before `authReady=true` |
| Session pending/error | Client remains not ready | `authPending=true`, `authReady=false` |
| Stale/invalid session | Proxy fails closed on protected routes | signed JWT verification/cookie clear |
| After logout | Server and client state cleared | shared sign-out flow |
