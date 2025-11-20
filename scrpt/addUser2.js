// addUser.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

// --- Load environment variables ---
dotenv.config({ path: path.join(__dirname, "../.env.local") });
const SENDER_EMAIL = process.env.GMAIL_SENDER;
if (!SENDER_EMAIL) {
  console.error("❌ Please set GMAIL_SENDER in .env.local");
  process.exit(1);
}

// --- Initialize Firebase Admin ---
admin.initializeApp({
  credential: admin.credential.cert(path.join(__dirname, "../serviceAccountKey.json")),
});

// --- Load token.json and (optionally) gmail_creds.json ---
const TOKEN_PATH = path.join(__dirname, "token.json");
const CREDS_PATH = path.join(__dirname, "../creds.json"); // downloaded from Google Cloud

if (!fs.existsSync(TOKEN_PATH)) {
  console.error(`❌ token.json not found at ${TOKEN_PATH}`);
  process.exit(1);
}

const token = JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));

// If token.json doesn't include client_id/client_secret, try loading gmail_creds.json
let clientId = token.client_id || token.clientId;
let clientSecret = token.client_secret || token.clientSecret;
if (!clientId || !clientSecret) {
  if (!fs.existsSync(CREDS_PATH)) {
    console.error("❌ token.json missing client_id/client_secret AND gmail_creds.json not found.");
    console.error("Place the Google credentials JSON (the file you downloaded from Cloud Console) as gmail_creds.json in the same folder, or merge creds into token.json.");
    process.exit(1);
  }
  const creds = JSON.parse(fs.readFileSync(CREDS_PATH, "utf8"));
  // creds for desktop app are usually under "installed"
  const installed = creds.installed || creds.web || creds;
  clientId = installed.client_id;
  clientSecret = installed.client_secret;
  if (!clientId || !clientSecret) {
    console.error("❌ Could not find client_id/client_secret inside gmail_creds.json");
    process.exit(1);
  }
}

// --- Setup Gmail OAuth2 ---
const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
oAuth2Client.setCredentials(token);

// --- Send Email via Gmail API OAuth2 ---
async function sendEmail(to, subject, html) {
  try {
    const accessTokenObj = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenObj.token || accessTokenObj;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: SENDER_EMAIL,
        clientId,
        clientSecret,
        refreshToken: token.refresh_token,
        accessToken,
      },
    });

    await transporter.sendMail({
      from: `"CMMS Team" <${SENDER_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log(`📧 Email sent to: ${to}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message || err);
  }
}

// --- Create Firebase User and Send Email ---
async function createUserAndSendEmail(email) {
  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`ℹ️ User already exists: ${email}`);
    } catch {
      userRecord = await admin.auth().createUser({ email });
      console.log(`✅ Created user: ${email}`);
    }

    const resetLink = await admin.auth().generatePasswordResetLink(email);

    const html = `
      <p>Hello,</p>
      <p>Your CMMS account has been created. Please set your password using the link below:</p>
      <p>username: ${email}</p>
      <p><a href="${resetLink}">Set My Password</a></p>
      <p>You can also access the CMMS web app here: <a href="https://cmms12.vercel.app">cmms12.vercel.app</a></p>
      <p>Best regards,<br/>CMMS Team</p>
    `;
    await sendEmail(email, "Set up your CMMS account", html);
  } catch (err) {
    console.error(`❌ Error for ${email}:`, err.message || err);
  }
}

// --- Handle single email or CSV ---
const arg = process.argv[2];
if (!arg) {
  console.log("Usage:");
  console.log("  node addUser.js user@example.com");
  console.log("  node addUser.js users.csv");
  process.exit(1);
}

// CSV bulk
if (arg.endsWith(".csv")) {
  const emails = [];
  fs.createReadStream(arg)
    .pipe(csv())
    .on("data", (row) => {
      const email = (row.email || row.Email || row.EMAIL || "").trim();
      if (email) emails.push(email);
    })
    .on("end", async () => {
      console.log(`📂 Found ${emails.length} users in CSV`);
      for (const email of emails) {
        await createUserAndSendEmail(email);
      }
      console.log("✅ All users processed.");
    });
} else {
  // Single email
  createUserAndSendEmail(arg);
}
