const admin = require("firebase-admin");

// Replace this with path to your service account JSON
const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// List of forms to add
const forms = [
  { id: "Purchase", name: "Purchase" },
  { id: "Transfer", name: "Transfer" },
  { id: "Acknowledgement", name: "Acknowledgement" },
  { id: "Borrow", name: "Borrow" },
];

async function populate() {
  try {
    for (const form of forms) {
      await db
        .collection("settings")
        .doc("signatories")
        .collection("requestTypes")
        .doc(form.id)
        .set({
          name: form.name
        });
      console.log(`Added ${form.name}`);
    }
    console.log("All forms added successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error adding forms:", err);
    process.exit(1);
  }
}

populate();
