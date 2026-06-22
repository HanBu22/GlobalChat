# GlobalChat

Discord-style static chat app that becomes global when connected to Firebase.

## Files

- `index.html`
- `styles.css`
- `app.js`
- `firebase-config.js`

## StackBlitz setup

1. Create a new **Static** project.
2. Add all four files above.
3. Create a Firebase project at <https://console.firebase.google.com/>.
4. In Firebase, create a Web app and paste its config into `firebase-config.js`.
5. Enable **Authentication > Sign-in method > Email/Password**.
6. Enable **Authentication > Sign-in method > Google** if you want Google sign-in.
7. Create **Firestore Database**.
8. Use `firestore.rules` in **Firestore Database > Rules**.
9. Enable **Storage**, then use `storage.rules` in **Storage > Rules** so image, GIF, and video messages can upload.

## Features

- Real global messages through Firestore.
- Image, GIF, and video messages through Firebase Storage, up to 250 MB per file.
- Real account creation through Firebase Authentication.
- Google sign-in support.
- Discord-style interface.
- Profile settings inside Settings.
- Uploaded profile pictures, compressed and saved with the user profile.
- Notification sound and desktop notification settings.
- Logout and local settings reset.
- Three official voice servers.
- Unofficial public/private voice servers with generated join codes.
- Join other servers browser with pages, host name, and start time.
- Host rename for unofficial voice servers.
- Local mic, camera, audio device, video filter, and screen share beta controls.

## Note

Uploaded profile pictures are stored as compressed data URLs in Firestore for simplicity. For a bigger real app, use Firebase Storage for avatars.
Voice server membership is stored globally in Firestore. Real live audio/video between multiple users requires adding WebRTC signaling and peer connections.
Firebase Auth uses local browser persistence, so users stay signed in after refresh until they log out.

## Local preview

Run this from the project folder:

```sh
node server.js
```

Then open <http://127.0.0.1:5173>.
