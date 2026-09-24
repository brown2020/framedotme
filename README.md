# Frame.me

Browser screen recorder: capture screen (optional mic/system audio), manage recordings in Firebase, and buy credits with Stripe. Live site: [https://frame.me](https://frame.me)

## Features

Verified from the current codebase:

- **Screen recording** — MediaStream + Recording managers; configurable frame rate; floating `/videocontrols` window
- **Capture / recordings** — `/capture`, `/recordings` for authenticated users
- **Auth** — Firebase Auth (login, signup, forgot password, loginfinish); server-signed JWT session cookie via `/api/session` (`frame_session` / `NEXT_PUBLIC_COOKIE_NAME`)
- **Profile & credits** — profile page; Stripe payment attempt/success; credit balance on user docs
- **Cookie consent** — `react-cookie-consent`
- **Legal / support** — about, privacy, terms, support
- **Security rules** — owner-scoped Firestore + Storage (`botcasts` recordings, payments create-only)

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, Radix slot, CVA, Lucide |
| Language | TypeScript 6 |
| Backend | Firebase 12 + firebase-admin 14 |
| Session | `jose` HS256 JWT cookie; `cookies-next` |
| Payments | Stripe + Stripe.js / React Stripe |
| State | Zustand 5 |
| Validation | Zod 4 |
| Toasts | react-hot-toast |
| Tests | Vitest 3 |
| Node (CI) | 22 |

`.npmrc` sets `legacy-peer-deps=true`.

## Project structure

```
framedotme/
├── src/
│   ├── app/              # Pages + /api/session
│   ├── components/       # Auth, home, UI
│   ├── lib/              # media-stream/recording managers, auth, security
│   ├── services/         # storage, session, user
│   ├── actions/          # Stripe payment actions
│   ├── firebase/, hooks/, zustand/, providers/
├── .env.example
├── firestore.rules
├── storage.rules
└── .github/workflows/ci.yml
```

## Getting started

### Prerequisites

- Node.js 22+ (CI uses 22)
- npm
- Firebase project (Auth, Firestore, Storage)
- Stripe account
- A random `JWT_SECRET` (≥32 characters)

### Install

```bash
git clone https://github.com/brown2020/framedotme.git
cd framedotme
git checkout dev
npm install
cp .env.example .env.local
# fill in values — never commit secrets
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Screen capture requires a supporting browser and user permission.

## Environment variables

| Name | Purpose | Where to get it |
|------|---------|-----------------|
| `NEXT_PUBLIC_FIREBASE_APIKEY` | Firebase web API key | Firebase Console → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTHDOMAIN` | Auth domain | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECTID` | Project ID | Same |
| `NEXT_PUBLIC_FIREBASE_STORAGEBUCKET` | Storage bucket | Same |
| `NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID` | Messaging sender ID | Same |
| `NEXT_PUBLIC_FIREBASE_APPID` | App ID | Same |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENTID` | Analytics ID | Optional |
| `FIREBASE_TYPE` | Admin type (`service_account`) | Service account JSON |
| `FIREBASE_PROJECT_ID` | Admin project ID | Same |
| `FIREBASE_PRIVATE_KEY_ID` | Key ID | Same |
| `FIREBASE_PRIVATE_KEY` | Private key | Same |
| `FIREBASE_CLIENT_EMAIL` | Client email | Same |
| `FIREBASE_CLIENT_ID` | Client ID | Same |
| `FIREBASE_AUTH_URI` / `FIREBASE_TOKEN_URI` / `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` / `FIREBASE_CLIENT_CERTS_URL` / `FIREBASE_UNIVERSE_DOMAIN` | Admin OAuth metadata | Same / defaults |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key | Stripe Dashboard |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PRODUCT_NAME` | Product name for credits (e.g. `framedotme_demo_credits`) | Stripe product config |
| `NEXT_PUBLIC_COOKIE_NAME` | Client cookie name hint (example: `framedotmeAuthToken`) | You |
| `JWT_SECRET` | HS256 secret for session cookies (≥32 chars) | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET` | Optional fallback secret name referenced in code | Optional |

## Firebase

- Firestore: `firestore.rules` — owner-only user trees; payments readable/creatable/deletable by owner, **updates denied**
- Storage: `storage.rules` — `/{userId}/botcasts/{filename}` owner R/W, max create size 500MB; listing denied

Deploy with the Firebase CLI when rules change.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve production build |
| `npm run lint` | ESLint (`--max-warnings=0`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |

## Testing and CI

Vitest covers Firebase auth errors, CSRF helpers, session service, and payment action auth.

GitHub Actions (`.github/workflows/ci.yml`) on `dev` / `main` and PRs: `npm ci` → lint → typecheck → test → build. Secrets include Firebase public config, Stripe keys/product name, cookie name, and `JWT_SECRET`. Node 22.

## Deployment

Deploy as a Next.js app (e.g. Vercel) to [https://frame.me](https://frame.me). Set all env vars in the host.

## Contributing

- `main` — production
- `dev` — integration

See [AGENTS.md](./AGENTS.md) and [SPEC.md](./SPEC.md).

## License

[GNU Affero General Public License v3](./LICENSE.md) (AGPL-3.0).
