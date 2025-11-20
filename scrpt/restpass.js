// restpass.js
import fs from "fs";
import { google } from "googleapis";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config({ path: "../.env.local" });

const SENDER_EMAIL = process.env.GMAIL_SENDER;

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});

// Load token.json for Gmail OAuth
const token = JSON.parse(fs.readFileSync("./token.json", "utf-8"));
const oAuth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oAuth2Client.setCredentials(token);

async function sendEmail(to, subject, html) {
  try {
    const accessToken = (await oAuth2Client.getAccessToken()).token;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: SENDER_EMAIL,
        clientId: token.client_id,
        clientSecret: token.client_secret,
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

    console.log(`📧 Reset email sent to: ${to}`);
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err.message);
  }
}

async function resetPassword(email) {
  try {
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    const html = `
      <p>Hello,</p>
      <p>You requested a password reset. Click the link below to set a new password:</p>
      <p><a href="${resetLink}">Set My Password</a></p>
      <p>If you didn’t request this, please ignore this email.</p>
      <p>Best regards,<br/>CMMS Team</p>
    `;

    await sendEmail(email, "Reset your CMMS password", html);
  } catch (err) {
    console.error(`❌ Error generating reset link for ${email}:`, err.message);
  }
}

// --- CLI ---
const email = process.argv[2];
if (!email) {
  console.log("Usage: node restpass.js user@example.com");
  process.exit(1);
}

resetPassword(email);
