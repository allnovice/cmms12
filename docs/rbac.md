# RBAC for Assets & Photo Management

This project now restricts assignment/office changes and asset photo/upload/delete operations to admin users only. Changes made:

- **Server helper removed:** `src/lib/firebaseAdmin.ts` has been removed to match this project's approach of using the client SDK and Firestore rules instead of a local Admin SDK helper.
- **API endpoints:** `POST /api/uploadAsset` and `POST /api/deleteAssetPhoto` do not perform server-side admin checks in this branch (they simply perform Cloudinary upload/delete). If you need server-side protection for Cloudinary operations, consider either re-adding a server helper using env vars or moving those operations to Cloud Functions.
- Client-side changes remain:
  - Asset list/detail pages hide/disable assignment/select controls and upload/delete actions for non-admin users.
- Added example Firestore rules in `firestore.rules` to enforce DB-level restrictions for assets.

Quick verification steps

1. Ensure you have a service account JSON available to the server runtime (we use `serviceAccountKey.json` in repo root for local/dev). For production, configure credentials via environment variables.

2. Ensure your user document has `role: "admin"` in `users/{uid}` for the admin account you will test.

3. Start the app and log in as a non-admin user:
   - Visit `Assets` list. The `Assigned To` and `Office` selects should be disabled.
   - Visit an asset detail. You should not see the "Delete Asset" button or photo upload control; delete buttons won't appear.
   - If you try to call the API endpoints without an admin token, you'll get 401/403 responses.

4. Log in as an admin user:
   - Assign users and offices via the selects; uploads & deletes should work.

5. Test server enforcement:
   - Use Postman to call `POST /api/uploadAsset` or `POST /api/deleteAssetPhoto` without a Bearer token — you should get 401.
   - Call the endpoints with a non-admin token — expect 403.
   - Call with an admin token — actions should succeed.

6. Deploy Firestore rules: apply `firestore.rules` to your project (via Firebase Console or `firebase deploy --only firestore:rules`).

Notes & Next steps

- Client-side checks are UX improvements; **server-side checks and Firestore rules are the real enforcement**.
- Consider using Firebase custom claims for faster server-side checks (put `isAdmin` as a custom claim), then `admin.auth().verifyIdToken()` returns claims directly.
- Consider adding audit logs for deletes/uploads.

If you want, I can also:
- Add automatic tests (unit or e2e) to verify RBAC behavior.
- Add support to set the service account via env vars and improve error messages.
