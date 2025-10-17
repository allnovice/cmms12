import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});

const db = admin.firestore();

const categories = ["Laptop", "Monitor", "Printer", "Projector", "Desk"];
const locations = ["Office 1", "Office 2", "Warehouse", "Lab", "Lobby"];
const statuses = ["Available", "Assigned", "Under Repair", "Disposed"];
const users = ["Alice", "Bob", "Charlie", "David", "Eva"];

const NUM_ASSETS = 20;

// Metro Manila bounds
const LAT_MIN = 14.50;
const LAT_MAX = 14.70;
const LNG_MIN = 120.95;
const LNG_MAX = 121.10;

// Helper to get random number in range
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

async function seedAssets() {
  for (let i = 0; i < NUM_ASSETS; i++) {
    const asset = {
      assetName: `${categories[Math.floor(Math.random() * categories.length)]} #${i + 1}`,
      assetId: uuidv4().split("-")[0],
      category: categories[Math.floor(Math.random() * categories.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      assignedTo: Math.random() > 0.5 ? users[Math.floor(Math.random() * users.length)] : "",
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      latitude: parseFloat(randomInRange(LAT_MIN, LAT_MAX).toFixed(6)),
      longitude: parseFloat(randomInRange(LNG_MIN, LNG_MAX).toFixed(6)),
    };

    await db.collection("assets").add(asset);
    console.log("Added asset:", asset.assetName, asset.latitude, asset.longitude);
  }
  console.log("Seeding complete!");
}

seedAssets().catch(console.error);
