# StreamVerse

StreamVerse is a responsive live-streaming app built with React, Vite, Tailwind CSS, Firebase Authentication/Firestore, React Router, Lucide, and browser WebRTC. Live listings, chat, creator profiles, signaling, and viewer presence use Firebase; the app does not seed fake broadcasters or simulate playback.

## Requirements

- Node.js 20.19+ or 22.12+ (required by the installed Vite version)
- A Firebase project with Email/Password Authentication and Cloud Firestore enabled
- A camera/microphone and a modern browser for broadcasting

## Run locally

1. Install packages: `npm install`
2. Copy `.env.example` to `.env` and set the Firebase web app values from Firebase Console → Project settings → Your apps.
3. In Firebase Console → Authentication → Sign-in method, enable Email/Password.
4. Create a Firestore database and deploy `firestore.rules`. With Firebase CLI: `firebase deploy --only firestore:rules` (log in and select the intended project first).
5. Start Vite: `npm run dev`. Open the localhost URL printed by Vite.

Restart the dev server after changing `.env`. Camera and microphone access requires `localhost` or HTTPS. Use separate browser profiles/devices to test a host and viewer; the host and viewer must connect to the same Firebase project.

## Firebase configuration

The Vite client configuration belongs in `.env`; `.gitignore` excludes local environment files. Firebase web API keys identify the project and are not server secrets. Enforce access through the included Firestore rules, restrict authorized domains in Firebase Authentication, and never put service-account credentials in this client app.

`firestore.rules` allows public live-list reads, owner-controlled stream metadata, authenticated profile edits, participant-only peer signaling, and authenticated live chat. Review and test rules against your exact Firebase project before production. A profile avatar is currently a public image URL; Firebase Storage upload and Storage rules are not included.

## What live means here

- **Broadcasting:** The browser captures camera/microphone media with `getUserMedia`. A WebRTC peer connection is created for every viewer; Firestore carries SDP offers/answers and ICE candidates. Firestore chat and viewer-presence records update in real time.
- **STUN/TURN:** A public STUN URL is the development default. STUN helps peers discover reachable addresses but cannot bridge every NAT or firewall. Configure a TURN provider with short-lived credentials for reliable connectivity. TURN credentials placed in a browser environment are visible to users; production deployments should issue expiring credentials from a trusted backend.
- **Audience size:** This is a mesh prototype, not a broadcast CDN. The creator uploads a separate media copy to every connected viewer, so creator upload and CPU use grow with audience size. Use a WebRTC SFU (for example, a managed service or self-hosted media server) for larger audiences, recording, transcoding, and production reliability. Firebase is signaling/chat/presence here, not a media relay.
- **Presence:** Viewer counts represent active WebRTC connections with a Firestore heartbeat and can take up to about 40 seconds to expire after an abrupt browser/network loss.

## Commands

- `npm run dev` — local development
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build
- `npm run lint` — Oxlint

## Deployment

Run `npm run build`, deploy `dist/` to a static host, and configure the same `VITE_FIREBASE_*` variables in that host's build environment. Add the deployed hostname to Firebase Authentication's authorized domains and serve the app over HTTPS. Configure the host to rewrite app routes to `index.html` for React Router. Set up TURN credentials (or replace the peer mesh with an SFU) before relying on streaming beyond local testing.