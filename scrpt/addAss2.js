import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

// Init Firestore
admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});
const db = admin.firestore();

// REQUIRED CSV HEADERS
const REQUIRED_HEADERS = [
  "article",
  "propertyNumber",
  "description",
  "typeOfEquipment",
  "unitOfMeasurement",
  "quantityPerPropertyCard",
  "quantityPerPhysicalCount",
  "remarks",
  "acquisitionDate",
  "acquisitionValue",
];

// Add a single asset (SKIP if article exists)
async function addAsset(asset) {
  if (!asset.article) {
    console.log("Skipped row with empty article");
    return;
  }

  const ref = db.collection("assets").doc(asset.article);
  const snap = await ref.get();

  if (snap.exists) {
    console.log("Skipped duplicate article:", asset.article);
    return;
  }

  const quantityPerPropertyCard = Number(asset.quantityPerPropertyCard) || 0;
  const quantityPerPhysicalCount = Number(asset.quantityPerPhysicalCount) || 0;
  const acquisitionValue = Number(asset.acquisitionValue) || 0;

  const acquisitionDate = new Date(asset.acquisitionDate);
  const validDate = isNaN(acquisitionDate) ? null : acquisitionDate;

  const payload = {
    article: asset.article,
    propertyNumber: asset.propertyNumber,
    description: asset.description,
    typeOfEquipment: asset.typeOfEquipment,
    unitOfMeasurement: asset.unitOfMeasurement,
    quantityPerPropertyCard,
    quantityPerPhysicalCount,
    remarks: asset.remarks || "",
    acquisitionDate: validDate,
    acquisitionValue,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await ref.set(payload);
  console.log("Added asset:", asset.article);
}

// Parse CSV
function parseCSV(csvFile) {
  const text = fs.readFileSync(csvFile, "utf8");

  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (records.length === 0) throw new Error("CSV is empty");

  const missing = REQUIRED_HEADERS.filter(
    h => !Object.keys(records[0]).includes(h)
  );
  if (missing.length)
    throw new Error(`CSV header error. Missing: ${missing.join(", ")}`);

  return records;
}

async function main() {
  const args = process.argv.slice(2);

  // CSV import mode
  if (args[0] === "file") {
    const csvPath = path.resolve(args[1]);
    if (!fs.existsSync(csvPath)) {
      console.error("CSV file not found:", csvPath);
      return;
    }

    try {
      const assets = parseCSV(csvPath);
      console.log(`Processing ${assets.length} entries...`);

      for (const asset of assets) {
        await addAsset(asset);
      }

      console.log("CSV import complete.");
    } catch (err) {
      console.error("Import failed:", err.message);
    }
    return;
  }

  // CLI mode
  if (args.length < 10) {
    console.log(`
Usage:
node addAss.js \
A01 77588 "description" Laptop \
"unit" 1 1 "remarks" \
2020-12-01 50000

or import CSV:
node addAss.js file assets.csv
`);
    return;
  }

  const [
    article,
    propertyNumber,
    description,
    typeOfEquipment,
    unitOfMeasurement,
    quantityPerPropertyCard,
    quantityPerPhysicalCount,
    remarks,
    acquisitionDate,
    acquisitionValue,
  ] = args;

  await addAsset({
    article,
    propertyNumber,
    description,
    typeOfEquipment,
    unitOfMeasurement,
    quantityPerPropertyCard,
    quantityPerPhysicalCount,
    remarks,
    acquisitionDate,
    acquisitionValue,
  });

  console.log("Single asset processed.");
}

main().catch(console.error);
