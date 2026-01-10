# CMMS12  
![Vercel Deploy](https://deploy-badge.vercel.app/vercel/cmms12?st)

This is a [Next.js](https://nextjs.org) project bootstrapped with create-next-app.

Full script/operator docs live in [docs/](docs/) (CSV imports, options, logo upload, user onboarding, etc.).

## 🚀 Quick start (app)
- Install deps: `npm install`
- Env: copy `.env.local` and fill Firebase + Cloudinary/Gmail keys (see below)
- Run dev: `npm run dev`
- Prod build: `npm run build && npm start`

## 🔑 Env vars (common)
Set these in `.env.local`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `CLOUDINARY_URL` (for asset/logo uploads)
- `GMAIL_SENDER` (for onboarding emails)

## 🌐 Hosted
- Live (if configured): https://cmms12.vercel.app

---

## 🧩 Basic Server Run

Servers are in separate repos:  
- [req2serv](https://github.com/allnovice/req2serv.git)  
- [notifsrv](https://github.com/allnovice/notifsrv.git)  

# Run servers (from each repo)
node notify-server.js
node cmms-server.js

---

# CMMS User Setup Guide

This guide explains how to set up Firebase, Gmail OAuth, and run the Node scripts to add users and send password setup emails.

---

1. **Clone Repository & Install Dependencies**  
   - Clone the repository:  
     ```bash
     git clone <repo-url>
     ```
   - Navigate to the script folder and install dependencies:  
     ```bash
     cd root/scrpt
     npm install
     ```

2. **Create Firebase Project**  
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a project (e.g., `CMMS11`).  
   - Add a **Web App** in the project settings.  
   - Create a `.env` file in the root folder for your Firebase configuration and Gmail sender email:
     ```env
     GMAIL_SENDER=example@example.com
     NEXT_PUBLIC_FIREBASE_API_KEY=
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
     NEXT_PUBLIC_FIREBASE_APP_ID=
     ```

    - Additional helper docs (imports, options, logos, onboarding) are in [docs/](docs/):
       - [addAss2](docs/addAss2.md): import assets via CSV/CLI
       - [adloc](docs/adloc.md): import/upsert office locations
       - [adOptions](docs/adOptions.md): add dropdown options (division/designation)
       - [adCompanyLogo](docs/adCompanyLogo.md): upload company logo to Cloudinary + Firestore
       - [addUser2](docs/addUser2.md): create users and email password setup links (Gmail OAuth)

3. **Download Firebase Service Account**  
   - Go to **Project Settings → Service Accounts → Generate new private key**.  
   - Save the file as `serviceAccountKey.json` in the `root/` folder.  
   - This allows Node scripts to create users and generate password reset links.

4. **Create Google Desktop OAuth Credentials**  
   - Go to [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials).  
   - Create an **OAuth Client ID → Desktop App**.  
   - Download the JSON as `creds.json` in the `root/` folder.  
   - This contains `client_id`, `client_secret`, and `redirect_uris` needed to generate the token.

5. **Generate `token.json` (Refresh Token + Access Token)**  
   - Run the `autorize2.js` script:  
     ```bash
     node autorize2.js
     ```  
   - Visit the URL displayed in the terminal, log in with your Gmail account, copy the code shown, and paste it back into the terminal.  
   - This generates `token.json` in the same folder.

6. **Add Users via Script**  
   - Use `addUser2.js` (or your `addUser` script) to create users and send password setup emails.  
   - The script will:  
     - Read a single email or CSV file of emails.  
     - Create Firebase users if they do not exist.  
     - Generate a password reset link.  
     - Send an email via Gmail using `token.json`.

7. **Important Notes**  
   - `.gitignore` entries to keep credentials safe:
     ```
     token.json
     serviceAccountKey.json
     creds.json
     .env
     ```
   - Avoid hitting `RESET_PASSWORD_EXCEED_LIMIT` in Firebase by **not sending multiple password reset emails** to the same user in a short period.  
   - All network operations (sending emails, creating Firebase users) require internet.  
   - Node scripts must be run in `root/scrpt` where `package.json` is installed.  

---
## 🧱 Build & Deploy Commands

# Local
npm run build
npm start

# Render
npm install && npm start

# Vercel
Handled automatically via Git integration

TODO
+timestamp caching
+chatbot>quick tickt
+forms
+dashbrds
