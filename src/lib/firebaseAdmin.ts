// firebaseAdmin helper removed
// If you need server-side admin checks for Cloudinary or other endpoints,
// reintroduce this file and initialize the Admin SDK using environment variables
// (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) instead
// of committing a service account JSON to the repo.

export function requireAdmin() {
  throw new Error("firebaseAdmin helper removed. Use Firestore rules or re-add a server helper if you need server-side checks.");
}

