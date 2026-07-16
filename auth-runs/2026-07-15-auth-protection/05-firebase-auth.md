# Firebase Auth

## Providers

- Google popup, email/password create-or-sign-in, password reset, and passwordless email link are present.
- No provider surface was removed or reconfigured in protection-only mode.

## Session Exchange

- Firebase Admin verifies the client ID token at `/api/session`.
- The route creates the custom HS256 `frame_session`; proxy and server actions verify the same format and secret policy.
- Firebase client/Admin initialization now throws clear missing-configuration errors rather than exporting cast-empty SDK objects.

## Account/Profile

Auth identity is synchronized to the Zustand auth store and Firestore profile. Credit authority is separately blocked as AUTH-003; it is not treated as Firebase Auth identity truth.
