# Auth QA

## Browser QA

Not fully automatable in this repository: Google popup, Firebase email delivery/link completion, and authenticated Firestore behavior require provider/browser state. No test script exists.

## API/Server QA

| Check | Result |
| --- | --- |
| Public `/` and `/about` | 200 |
| Signed-out `/capture` and `/profile` | 307 to `/` |
| `GET /api/session` | 200 CSRF bootstrap |
| `POST /api/session` without CSRF header | 403 fail closed |
| Production build | compile, TypeScript, 16 routes pass |
| Changed-scope React Doctor | no issues, 90/100 |

## Remaining Manual QA

Sign in with each enabled Firebase provider, confirm session creation and protected navigation, sign out, complete an email link, exercise Stripe checkout, and test recorder popup/media behavior in a supported browser.
