import admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});

const db = admin.firestore();

const types = ["Laptop", "Monitor", "Printer", "Projector", "Desk"];

const NUM_ASSETS = 20;

// Random date between 2020–2024
function randomDate() {
  const start = new Date("2020-01-01").getTime();
  const end = new Date("2024-12-31").getTime();
  return new Date(start + Math.random() * (end - start));
}

// Random peso value
function randomValue(min = 5000, max = 150000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedAssets() {
  for (let i = 0; i < NUM_ASSETS; i++) {

    const articleId = `A${String(i + 1).padStart(2, "0")}`;   // A01, A02...

    const propertyNum = Math.floor(10000 + Math.random() * 90000); // 5-digit

    const asset = {
      article: articleId,
      propertyNumber: propertyNum,
      description: `Description for ${articleId}`,
      serialNumber: uuidv4().split("-")[0].toUpperCase(),
      typeOfEquipment: types[Math.floor(Math.random() * types.length)],
      acquisitionDate: randomDate(),
      acquisitionValue: randomValue(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("assets").add(asset);
    console.log(`Added: ${articleId} | ₱${asset.acquisitionValue}`);
  }

  console.log("Seeding complete!");
}

seedAssets().catch(console.error);
