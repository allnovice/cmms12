import fs from "fs";
import readline from "readline";
import { google } from "googleapis";

const SCOPES = ["https://mail.google.com/"];
const TOKEN_PATH = "token.json";
const CREDENTIALS_PATH = "../creds.json";

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf-8"));
const { client_secret, client_id, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // ensures a refresh_token is returned
  });
  console.log("\nAuthorize this app by visiting this URL:\n", authUrl);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("\nEnter the code from that page here: ", async (code) => {
    rl.close();
    try {
      const { tokens } = await oAuth2Client.getToken(code.trim());
      oAuth2Client.setCredentials(tokens);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      console.log("\n✅ Token stored to", TOKEN_PATH);
    } catch (err) {
      console.error("❌ Error retrieving access token:", err);
    }
  });
}

getNewToken(oAuth2Client);
