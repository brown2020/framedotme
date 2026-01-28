# Authentication Architecture

## Dual-Cookie Strategy

This application uses a **two-cookie authentication system** for robust client and server-side authentication:

### 1. Client ID Token Cookie (`CLIENT_ID_TOKEN_COOKIE_NAME`)
- **Type**: JavaScript-readable cookie
- **Purpose**: Accessible to Firebase client SDK in the browser
- **Usage**:
  - Enables client-side auth state restoration
  - Required for real-time Firebase queries with security rules
  - Allows Firebase SDK to maintain auth session across page reloads

### 2. Server Session Cookie (`SESSION_COOKIE_NAME`)
- **Type**: httpOnly, server-only cookie
- **Purpose**: Secure server-side route protection
- **Usage**:
  - Created via `/api/session` endpoint from client ID token
  - Used by `proxy.ts` middleware for server-side route protection
  - Prevents CSRF attacks and XSS token theft
  - Cannot be accessed by JavaScript in the browser

## Why Both Cookies?

The dual-cookie approach solves two platform constraints:

1. **Firebase SDK Requirement**: The Firebase client SDK requires JavaScript access to auth tokens for client-side operations (real-time queries, storage rules, etc.)

2. **Next.js Middleware Limitation**: Next.js middleware (`proxy.ts`) runs on the server and cannot access JavaScript-readable cookies. It needs httpOnly cookies for secure route protection.

## Authentication Flow

### Sign In
1. User authenticates via Firebase (Google OAuth, email/password, etc.)
2. Firebase SDK receives ID token
3. Client stores token in `CLIENT_ID_TOKEN_COOKIE_NAME` (JavaScript-readable)
4. Client calls `/api/session` with ID token
5. Server creates session cookie and stores in `SESSION_COOKIE_NAME` (httpOnly)
6. Both cookies now active

### Token Refresh
Token refresh is handled by `useTokenRefresh` hook:

1. Every 50 minutes (10 min before Firebase's 1-hour expiry)
2. Get fresh token from Firebase SDK
3. Update `CLIENT_ID_TOKEN_COOKIE_NAME`
4. Call `/api/session` to refresh `SESSION_COOKIE_NAME`
5. **Transaction guarantee**: If server session creation fails, client cookie is rolled back

### Route Protection (Server-Side)
`proxy.ts` middleware checks for valid session:

1. Extract `SESSION_COOKIE_NAME` from request
2. Verify session with Firebase Admin SDK
3. If valid: allow request, inject user ID in header
4. If invalid: redirect to login, clear both cookies

### Client-Side Auth State
`useAuthSync` hook manages client state:

1. Listen to Firebase auth state changes
2. Sync auth data to Zustand store
3. Manage both client and server cookies
4. Handle cross-tab synchronization via localStorage

## File Locations

- **Cookie constants**: `src/constants/auth.ts`
- **Token refresh logic**: `src/hooks/useTokenRefresh.ts`
- **Auth state sync**: `src/hooks/useAuthSync.ts`
- **Server verification**: `src/services/sessionService.ts`
- **Middleware**: `proxy.ts`
- **Session API**: `src/app/api/session/route.ts`

## Security Considerations

1. **HttpOnly Cookie**: `SESSION_COOKIE_NAME` cannot be accessed by JavaScript, preventing XSS token theft
2. **SameSite=Lax**: Both cookies use SameSite=Lax to prevent CSRF attacks
3. **Secure in Production**: Both cookies use Secure flag in production (HTTPS only)
4. **Token Expiration**: Server session expires after 5 days; client refreshes every 50 minutes
5. **Transaction Safety**: Client cookie rollback if server session creation fails

## Cross-Tab Synchronization

When a user signs in or refreshes their token in one tab:

1. `useTokenRefresh` updates localStorage with timestamp
2. Other tabs detect change via `storage` event
3. All tabs refresh their tokens (debounced by 1 second)
4. Prevents multiple tabs from making redundant refresh calls

## Debugging

To debug authentication issues:

1. Check both cookies exist in browser DevTools → Application → Cookies
2. Verify `SESSION_COOKIE_NAME` is httpOnly
3. Check console for token refresh logs (development only)
4. Monitor `/api/session` network calls
5. Check middleware logs in server console
