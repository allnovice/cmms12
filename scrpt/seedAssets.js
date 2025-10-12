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
    };

    await db.collection("assets").add(asset);
    console.log("Added asset:", asset.assetName);
  }
  console.log("Seeding complete!");
}

seedAssets().catch(console.error);
