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
- **Purpose**: Used by API routes for server-side authentication
- **Usage**:
  - Created via `/api/session` endpoint from client ID token
  - Used by API routes for secure server-side verification
  - Prevents CSRF attacks and XSS token theft
  - Cannot be accessed by JavaScript in the browser
  - Note: `src/proxy.ts` runs in Edge runtime and validates the client JWT instead

## Why Both Cookies?

The dual-cookie approach solves two platform constraints:

1. **Firebase SDK Requirement**: The Firebase client SDK requires JavaScript access to auth tokens for client-side operations (real-time queries, storage rules, etc.)

2. **Edge Runtime Limitation**: Next.js 16 proxy (`src/proxy.ts`) runs in Edge runtime and cannot use Firebase Admin SDK (Node.js only). The proxy validates the client JWT for UX (preventing flash of protected content), while API routes use the httpOnly session cookie for actual security boundaries.

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

### Route Protection (Edge Runtime)

`src/proxy.ts` checks for valid JWT (UX-focused, not a security boundary):

1. Extract `CLIENT_ID_TOKEN_COOKIE_NAME` from request
2. Parse JWT and validate expiry (no signature verification in Edge runtime)
3. If valid: allow request, inject user ID in header
4. If invalid: redirect to login, clear both cookies
5. **Security**: Actual data protection happens via Firestore rules and API route verification

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
- **Server verification**: `src/services/sessionService.ts` (used by API routes)
- **Edge proxy**: `src/proxy.ts` (Next.js 16, Edge runtime)
- **Session API**: `src/app/api/session/route.ts`

## Security Considerations

1. **Edge Runtime Trade-off**: `src/proxy.ts` validates JWT expiry WITHOUT signature verification (Edge runtime can't use Firebase Admin SDK). This is acceptable because:
   - Primary purpose is UX (prevent flash of protected content)
   - All data access is protected by Firestore security rules
   - API routes verify tokens server-side with proper signature verification
   - Worst case: Attacker sees empty UI shells without actual data

2. **HttpOnly Cookie**: `SESSION_COOKIE_NAME` cannot be accessed by JavaScript, preventing XSS token theft

3. **SameSite=Lax**: Both cookies use SameSite=Lax to prevent CSRF attacks

4. **Secure in Production**: Both cookies use Secure flag in production (HTTPS only)

5. **Token Expiration**: Server session expires after 5 days; client refreshes every 50 minutes

6. **Transaction Safety**: Client cookie rollback if server session creation fails

7. **Defense in Depth**: Multiple security layers (proxy for UX, Firestore rules for data, API verification for operations)

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
