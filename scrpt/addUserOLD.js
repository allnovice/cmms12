const fs = require("fs");
const csv = require("csv-parser");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

// --- Load environment variables ---
dotenv.config({ path: "../.env.local" });

const SENDER_EMAIL = process.env.GMAIL_SENDER;

// --- Initialize Firebase Admin with service account ---
admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});

// --- Setup Gmail OAuth2 ---
let credentials, token;
try {
  credentials = JSON.parse(process.env.GMAIL_CREDS);
  token = JSON.parse(process.env.GMAIL_TOKEN);
} catch (err) {
  console.error("❌ Failed to parse GMAIL_CREDS or GMAIL_TOKEN:", err.message);
  process.exit(1);
}

const { client_id, client_secret } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
oAuth2Client.setCredentials(token);

// --- Send Email via Gmail API OAuth2 ---
async function sendEmail(to, subject, html) {
  try {
    const accessTokenObj = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenObj.token;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: SENDER_EMAIL,
        clientId: client_id,
        clientSecret: client_secret,
        refreshToken: token.refresh_token,
        accessToken: accessToken,
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
    console.error(`❌ Failed to send email to ${to}:`, err.message);
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
      <p>Best regards,<br/>CMMS Team</p>
    `;
    await sendEmail(email, "Set up your CMMS account", html);
  } catch (err) {
    console.error(`❌ Error for ${email}:`, err.message);
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
      const email = row.email && row.email.trim();
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
