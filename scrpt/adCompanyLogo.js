import admin from "firebase-admin";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

dotenv.config({ path: "../.env.local" });

console.log("Loaded env CLOUDINARY_URL =", process.env.CLOUDINARY_URL);

// --- Firebase Admin ---
admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});

const db = admin.firestore();

// --- Cloudinary config (same env as your Next app) ---

console.log("Loaded env CLOUDINARY_URL =", process.env.CLOUDINARY_URL);

// --- Parse Cloudinary URL manually ---
const cloudinaryUrl = process.env.CLOUDINARY_URL;
const url = new URL(cloudinaryUrl);

cloudinary.config({
  cloud_name: url.hostname,
  api_key: url.username,
  api_secret: url.password,
  secure: true,
});

console.log("Parsed Cloudinary Config =", cloudinary.config());
console.log("API KEY =", cloudinary.config().api_key);

// ------------------------
// Upload Function
// ------------------------
async function uploadLogo(filePath) {
  if (!filePath) {
    console.error("❌ Missing file path. Usage: node uploadLogo.js ./image.png");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error("❌ File not found:", filePath);
    process.exit(1);
  }

  const randomId = randomUUID();
  const filename = filePath.split("/").pop();

  console.log("📤 Uploading image to Cloudinary...");

  const result = await cloudinary.uploader.upload(filePath, {
    folder: "companyLogo",
    public_id: randomId,
    overwrite: true,
    resource_type: "image",
  });

  console.log("✅ Cloudinary upload complete!");
  console.log("🌐 URL:", result.secure_url);

  // Save Firestore record
  await db.collection("companyLogo").doc(randomId).set({
    url: result.secure_url,
    filename,
    uploadedAt: new Date(),
  });

  console.log("\n🔥 Saved to Firestore:");
  console.log("   docId:", randomId);
  console.log("   url:", result.secure_url);

  return { id: randomId, url: result.secure_url };
}

// ------------------------
// CLI Entry
// ------------------------
const file = process.argv[2];

uploadLogo(file)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
