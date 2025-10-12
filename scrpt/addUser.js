import admin from "firebase-admin";
import fs from "fs";
import csv from "csv-parser";
import nodemailer from "nodemailer";

// --- CONFIG ---
// Replace these with your Gmail + app password
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS;

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASS,
  },
});

async function createUserAndSendEmail(email) {
  try {
    // Create Firebase user (skip if exists)
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log(`ℹ️ User already exists: ${email}`);
    } catch {
      userRecord = await admin.auth().createUser({ email });
      console.log(`✅ Created user: ${email}`);
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);

    // Send email via Gmail SMTP
    await transporter.sendMail({
      from: `"CMMS Team" <${GMAIL_USER}>`,
      to: email,
      subject: "Set up your CMMS account",
      html: `
        <p>Hello,</p>
        <p>Your CMMS account has been created. Please set your password using the link below:</p>
        <p>username=email</p>
        <p><a href="${resetLink}">Set My Password</a></p>
        <p>Best regards,<br/>CMMS Team</p>
      `,
    });

    console.log(`📧 Email sent to: ${email}`);
  } catch (error) {
    console.error(`❌ Error for ${email}:`, error.message);
  }
}

// Handle single or CSV input
const arg = process.argv[2];

if (!arg) {
  console.log("Usage:");
  console.log("  node addUser.js user@example.com");
  console.log("  node addUser.js users.csv");
  process.exit(1);
}

// If CSV file
if (arg.endsWith(".csv")) {
  const emails = [];
  fs.createReadStream(arg)
    .pipe(csv())
    .on("data", (row) => {
      const email = row.email?.trim();
      if (email) emails.push(email);
    })
    .on("end", async () => {
      console.log("✅ Finished reading CSV, processing users...");
      for (const email of emails) {
        await createUserAndSendEmail(email);
      }
      console.log("✅ All users processed.");
    });
} else {
  // Single email
  createUserAndSendEmail(arg);
}
