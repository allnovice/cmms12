# adCompanyLogo.js – Upload a company logo to Cloudinary and Firestore

Uploads an image to Cloudinary (using the same env vars as the app) and records it in Firestore under `companyLogo/{randomId}`.

## Requirements
- Node.js
- `.env.local` containing `CLOUDINARY_URL`
- Service account JSON at `../serviceAccountKey.json` (relative to `scrpt/`)
- Cloudinary credentials with permissions to upload images
- File path to an image on disk

## Usage
From `scrpt/`:
```bash
node adCompanyLogo.js ./logo.png
```

## Behavior
- Parses `CLOUDINARY_URL` to configure Cloudinary.
- Uploads the provided image to the `companyLogo` folder with a random UUID as `public_id` (overwrite enabled).
- On success, logs the secure URL and writes a Firestore doc in `companyLogo` with fields:
  - `url` (secure_url from Cloudinary)
  - `filename` (basename of the uploaded file)
  - `uploadedAt` (JS Date)
- Exits with code 1 on errors (missing file arg, file not found, upload errors).

## Common issues
- Missing/invalid `CLOUDINARY_URL`: ensure `.env.local` exists and is readable from `scrpt/`.
- File not found: pass a valid path.
- Firestore/Cloudinary permission errors: verify service account and Cloudinary credentials.
