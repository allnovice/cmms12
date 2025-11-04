import admin from "firebase-admin";
import fs from "fs";
import readline from "readline";

admin.initializeApp({
  credential: admin.credential.cert("../serviceAccountKey.json"),
});

const db = admin.firestore();

async function addSingle(name, latitude, longitude, overwrite = false) {
  const snapshot = await db.collection("locations").where("name", "==", name).get();

  if (!snapshot.empty) {
    if (!overwrite) {
      console.log(`⚠️ Location "${name}" already exists. Use --overwrite to replace it.`);
      return;
    }
    const doc = snapshot.docs[0];
    await db.collection("locations").doc(doc.id).set({
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    }, { merge: true });
    console.log(`✅ Updated existing location "${name}".`);
  } else {
    const newDoc = db.collection("locations").doc();
    await newDoc.set({
      name,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    });
    console.log(`✅ Added new location "${name}" (ID: ${newDoc.id})`);
  }
}

async function addFromCSV(csvFile, overwrite = false) {
  const data = fs.readFileSync(csvFile, "utf8");
  const lines = data.split("\n").filter(l => l.trim() !== "");
  
  for (const line of lines) {
    const [name, lat, lng] = line.split(",").map(v => v.trim());
    await addSingle(name, lat, lng, overwrite);
  }
  console.log("📦 Finished adding locations from CSV.");
}

async function main() {
  const args = process.argv.slice(2);
  const name = args.find(a => a.startsWith("--name="))?.split("=")[1];
  const lat = args.find(a => a.startsWith("--latitude="))?.split("=")[1];
  const lng = args.find(a => a.startsWith("--longitude="))?.split("=")[1];
  const csv = args.find(a => a.startsWith("--csv="))?.split("=")[1];
  const overwrite = args.includes("--overwrite");

  if (csv) {
    await addFromCSV(csv, overwrite);
  } else if (name && lat && lng) {
    await addSingle(name, lat, lng, overwrite);
  } else {
    console.log(`
Usage:
  node addLocations.js --name="QPO" --latitude=14.7263366 --longitude=121.6354393 [--overwrite]
  node addLocations.js --csv="locations.csv" [--overwrite]
`);
  }
}

main();
