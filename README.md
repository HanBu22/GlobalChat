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
8. Use `firestore.rules`, or paste these Firestore rules for a simple public chat demo:

```txt
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null && request.auth.uid == userId;
    }

    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.text is string
        && request.resource.data.text.size() > 0
        && request.resource.data.text.size() <= 500;
    }
  }
}
```

## Features

- Real global messages through Firestore.
- Real account creation through Firebase Authentication.
- Google sign-in support.
- Discord-style interface.
- Profile settings inside Settings.
- Uploaded profile pictures, compressed and saved with the user profile.
- Notification sound and desktop notification settings.
- Logout and local settings reset.

## Note

Uploaded profile pictures are stored as compressed data URLs in Firestore for simplicity. For a bigger real app, use Firebase Storage for avatars.

## Local preview

Run this from the project folder:

```sh
node server.js
```

Then open <http://127.0.0.1:5173>.
