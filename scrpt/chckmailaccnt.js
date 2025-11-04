import { google } from "googleapis";
import fs from "fs";

const credentials = JSON.parse(fs.readFileSync("../creds.json"));
const token = JSON.parse(fs.readFileSync("./token.json"));
const { client_secret, client_id } = credentials.installed;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret);
oAuth2Client.setCredentials(token);

async function checkGmailSend() {
  try {
    const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
    console.log("✅ Authorized Gmail account can send email.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

checkGmailSend();
