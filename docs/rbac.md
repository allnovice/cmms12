# RBAC for Assets & Photo Management

This project now restricts assignment/office changes and asset photo/upload/delete operations to admin users only. Changes made:

- Added server-side helper: `src/lib/firebaseAdmin.ts` to verify ID tokens and check `users/{uid}.role`.
- Protected API endpoints:
  - `POST /api/uploadAsset` now requires an admin token.
  - `POST /api/deleteAssetPhoto` now requires an admin token.
- Client-side changes:
  - `AssetPhotoUploader` now sends the current user's ID token in the Authorization header.
  - Asset list/detail pages hide/disable assignment/select controls and upload/delete actions for non-admin users.
- Added example Firestore rules in `firestore.rules` to enforce server-side security for assets.

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
