# GlobalChat

Static HTML/CSS/JS chat app for StackBlitz.

## Run in StackBlitz

1. Create a new **Static** project on StackBlitz.
2. Add `index.html`, `styles.css`, and `app.js`.
3. Open the preview.

## What works now

- Create account with username and password.
- Chrome can offer to save the username/password because the forms use standard password-manager fields.
- Sign in and sign out.
- Send chat messages with profile picture, display name, and sent time.
- Edit display name and profile picture URL in profile settings.
- Messages and accounts persist in this browser using `localStorage`.

## Important limitation

This static version stores data only in the current browser. For real accounts, shared chat across different people/devices, permanent server storage, and real Google sign-in, connect it to Firebase Authentication and Firestore.
