import admin from "firebase-admin";
import fs from "fs";
import path from "path";

// Init Firestore
admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});
const db = admin.firestore();

// Add a single asset to Firestore
async function addAsset(asset) {
  const payload = {
    article: asset.article,
    propertyNumber: Number(asset.propertyNumber),
    description: asset.description,
    typeOfEquipment: asset.typeOfEquipment,
    acquisitionDate: new Date(asset.acquisitionDate),
    acquisitionValue: Number(asset.acquisitionValue),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.collection("assets").add(payload);
  console.log("Added asset:", payload.article);
}

// Parse CSV
function parseCSV(csvFile) {
  const text = fs.readFileSync(csvFile, "utf8").trim();
  const rows = text.split("\n").map((r) => r.split(","));

  const header = rows.shift(); // first row is column names

  return rows.map((cols) => {
    const obj = {};
    header.forEach((key, i) => {
      obj[key.trim()] = cols[i].trim();
    });
    return obj;
  });
}

async function main() {
  const args = process.argv.slice(2);

  // CSV mode
  if (args[0] === "file") {
    const csvPath = path.resolve(args[1]);
    if (!fs.existsSync(csvPath)) {
      console.error("CSV file not found:", csvPath);
      return;
    }

    const assets = parseCSV(csvPath);
    console.log(`Processing ${assets.length} entries from CSV...`);

    for (const asset of assets) {
      await addAsset(asset);
    }

    console.log("CSV import complete.");
    return;
  }

  // Direct CLI mode
  if (args.length < 6) {
    console.log(`
Usage:
  node addAss.js A01 77588 "description" Laptop 2020-12-01 50000

or import CSV:
  node addAss.js file assets.csv
`);
    return;
  }

  const [article, propertyNumber, description, typeOfEquipment, acquisitionDate, acquisitionValue] = args;

  await addAsset({
    article,
    propertyNumber,
    description,
    typeOfEquipment,
    acquisitionDate,
    acquisitionValue,
  });

  console.log("Single asset added successfully.");
}

main().catch(console.error);
