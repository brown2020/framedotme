# Frame.me

Frame.me is a streamlined screen recording application built with Next.js and TypeScript that allows users to create, manage, and share screen recordings directly from their browser.

## Features

- **Screen Recording**: Capture your screen with audio support (both system audio and microphone)
- **Floating Controls**: Detached recording control window for easy access while recording
- **Real-time Preview**: Live preview of your recording with dimension information
- **Status Management**: Clear visual indicators of recording status and progress
- **Error Handling**: Robust error handling for permission and device issues
- **Firebase Integration**: Secure storage and management of recordings

## Tech Stack

- Next.js 16 (locked: 16.1.1)
- React 19 (locked: 19.2.3)
- TypeScript
- Firebase (client SDK; locked: 12.7.0) + Firebase Admin SDK (locked: 13.6.0)
- Zustand (locked: 5.0.9)
- Tailwind CSS 4 (locked: 4.1.18)
- Radix UI primitives/icons
- shadcn/ui Components
- Stripe (server SDK locked: 20.1.0; Stripe.js locked: 8.6.0)

## Firebase Security Rules (Firestore + Storage)

This repo includes a “default deny” security posture and scopes user data by authenticated UID.

### Firestore (`firestore.rules`)

- **Default deny**: all reads/writes are denied unless explicitly allowed.
- **User namespace**: `/users/{userId}` is readable/writable only by the authenticated owner (`request.auth.uid == userId`).
- **Privilege escalation guard**: clients cannot set privileged flags on the user doc (`isAdmin`, `isAllowed`, `isInvited`, `premium` must be absent or `false` on create/update).
- **Subcollections** (owner-only CRUD):
  - `/users/{userId}/profile/userData`
  - `/users/{userId}/settings/recorder`
  - `/users/{userId}/botcasts/{botcastId}`
- **Payments**:
  - `/users/{userId}/payments/{paymentDocId}`: owner can read/create/delete
  - **Updates are denied** (prevents client-side tampering after creation)

### Storage (`storage.rules`)

- **Default deny**: all reads/writes are denied unless explicitly allowed.
- **Recording objects**: `/{userId}/botcasts/{filename}`
  - **read**: owner-only
  - **create/update**: owner-only and `< 500MB`
  - **delete**: owner-only
  - **list**: denied (recordings are discovered via Firestore, not bucket listing)

## Core Components

### Media Management

- `MediaStreamManager`: Handles screen capture and audio stream management
- `RecordingManager`: Controls recording operations and chunk management
- `storageService`: Manages Firebase storage operations and metadata

### UI Components

- `VideoControlsLauncher`: Main recording trigger with status indication
- `VideoControlsPage`: Detached window with full recording controls and preview
- `RecorderStatusProvider`: Global recording status management

## Getting Started

### Prerequisites

- Node.js (Next.js in this repo requires Node `>=20.9.0`)

1. Clone the repository:

```bash
git clone https://github.com/brown2020/framedotme.git
cd framedotme
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_COOKIE_NAME=your_cookie_name
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Click the record button to open the recording controls
2. Grant necessary permissions when prompted
3. Use the floating control window to start/stop recording
4. Access your recordings through the dashboard
5. Download or share your recordings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Powered by [Next.js](https://nextjs.org/)

## Support

For support, email info@ignitechannel.com or create an issue in the repository.

---

Built with ❤️ by [brown2020](https://github.com/brown2020)
