import admin from "firebase-admin";
import fs from "fs";
import csvParser from "csv-parser";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});

const db = admin.firestore();

const argv = yargs(hideBin(process.argv))
  .option("collection", { type: "string", describe: "Firestore collection name" })
  .option("name", { type: "string", describe: "Single item name" })
  .option("file", { type: "string", describe: "CSV file path" })
  .parseSync();

// Merge item into collection document
async function mergeOption(collection, name) {
  if (!collection || !name) return;
  const docRef = db.collection(collection).doc("allOptions");
  await docRef.set(
    { options: admin.firestore.FieldValue.arrayUnion(name) },
    { merge: true }
  );
  console.log(`Added "${name}" to collection "${collection}"`);
}

// Single item
async function addSingle(collection, name) {
  await mergeOption(collection, name);
}

// CSV import
async function addFromCSV(file) {
  if (!fs.existsSync(file)) {
    console.error("CSV file not found:", file);
    process.exit(1);
  }

  const rows = [];
  fs.createReadStream(file)
    .pipe(csvParser())
    .on("data", (data) => rows.push(data))
    .on("end", async () => {
      for (const row of rows) {
        if (!row.collection || !row.name) {
          console.warn("Skipping invalid row:", row);
          continue;
        }
        await mergeOption(row.collection, row.name);
      }
      console.log("CSV import complete!");
      process.exit(0);
    });
}

(async () => {
  if (argv.file) {
    await addFromCSV(argv.file);
  } else if (argv.collection && argv.name) {
    await addSingle(argv.collection, argv.name);
    process.exit(0);
  } else {
    console.error("Provide either --file or --collection + --name");
    process.exit(1);
  }
})();
