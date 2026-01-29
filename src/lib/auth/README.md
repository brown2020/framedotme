# Authentication Architecture

## Session-Based Authentication Strategy

This application uses a **session-based authentication system** with JWT tokens for reliable authentication:

### 1. Client ID Token Cookie (`CLIENT_ID_TOKEN_COOKIE_NAME`)

- **Type**: JavaScript-readable cookie
- **Purpose**: Accessible to Firebase client SDK in the browser
- **Usage**:
  - Enables client-side auth state restoration
  - Required for real-time Firebase queries with security rules
  - Allows Firebase SDK to maintain auth session across page reloads

### 2. Server Session Cookie (`SESSION_COOKIE_NAME` = "frame_session")

- **Type**: httpOnly, server-only JWT cookie
- **Purpose**: Used by proxy for route protection and API routes for verification
- **Usage**:
  - Created via `/api/session` endpoint using custom JWT (signed with JWT_SECRET)
  - Validated by `src/proxy.ts` in Edge runtime using jose library
  - Prevents CSRF attacks and XSS token theft
  - Cannot be accessed by JavaScript in the browser
  - **CRITICAL**: This is what the proxy validates - must be created before accessing protected routes

## Why Both Cookies?

The dual-cookie approach solves platform constraints:

1. **Firebase SDK Requirement**: The Firebase client SDK requires JavaScript access to auth tokens for client-side operations (real-time queries, storage rules, etc.)

2. **Edge Runtime Compatibility**: Next.js 16 proxy (`src/proxy.ts`) runs in Edge runtime and cannot use Firebase Admin SDK (Node.js only). Instead, we use custom JWT sessions signed with the `jose` library, which works perfectly in Edge runtime for proper authentication validation.

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

`src/proxy.ts` validates session JWT (full signature verification):

1. Extract `SESSION_COOKIE_NAME` cookie from request
2. Validate JWT using `jose` library (works in Edge runtime)
3. Verify signature and expiration
4. If valid: allow request, inject user ID in header
5. If invalid: redirect to login, clear cookies
6. **Security**: Full JWT validation provides proper security boundary

### Client-Side Auth State

`useAuthSync` hook manages authentication:

1. Listen to Firebase auth state changes
2. Create session cookie via `/api/session`
3. **Wait for session confirmation** before setting `authReady=true`
4. Sync auth data to Zustand store
5. Only allow navigation to protected routes after session is ready

This approach eliminates race conditions by ensuring the session cookie always exists before routing.

## File Locations

- **Cookie constants**: `src/constants/auth.ts`
- **Auth state sync**: `src/hooks/useAuthSync.ts` (creates session and waits for confirmation)
- **JWT validation (Edge)**: `src/proxy.ts` (validates session JWT with jose)
- **Session API**: `src/app/api/session/route.ts` (creates custom JWT with jose)
- **Environment**: `.env` (requires `JWT_SECRET` for session signing)

## Security Considerations

1. **Full JWT Validation**: `src/proxy.ts` validates session JWT with FULL signature verification using jose library (works in Edge runtime). This provides proper security at the routing level.

2. **HttpOnly Cookie**: `SESSION_COOKIE_NAME` cannot be accessed by JavaScript, preventing XSS token theft

3. **SameSite=Lax**: Both cookies use SameSite=Lax to prevent CSRF attacks

4. **Secure in Production**: Both cookies use Secure flag in production (HTTPS only)

5. **Token Expiration**: Server session expires after 5 days (configurable)

6. **Strong Secrets**: JWT_SECRET must be at least 32 characters for security

7. **Session Confirmation**: `authReady` only set after session cookie is created and confirmed, preventing race conditions

8. **Defense in Depth**: Multiple security layers:
   - Proxy validates session JWT (routing protection)
   - Firestore rules (data access protection)
   - API routes verify tokens (operation protection)

## Session Lifecycle

When a user signs in:

1. Firebase authentication completes
2. `useAuthSync` gets fresh ID token
3. Client cookie set for Firebase SDK
4. Session API creates custom JWT
5. Session cookie stored (httpOnly)
6. `authReady` set to true
7. User can access protected routes

When session expires (5 days):

1. Proxy validation fails
2. User redirected to home
3. Must sign in again to refresh session

## Debugging

To debug authentication issues:

1. Check both cookies exist in browser DevTools → Application → Cookies
2. Verify `SESSION_COOKIE_NAME` is httpOnly
3. Check console for token refresh logs (development only)
4. Monitor `/api/session` network calls
5. Check middleware logs in server console
