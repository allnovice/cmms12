import admin from "firebase-admin";
import serviceAccount from "../../../serviceAccountKey.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export async function verifyIdToken(token?: string | null) {
  if (!token) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (err) {
    console.error("verifyIdToken error:", err);
    return null;
  }
}

export async function isAdminByUid(uid: string) {
  try {
    const snap = await admin.firestore().doc(`users/${uid}`).get();
    if (!snap.exists) return false;
    const data = snap.data() as any;
    return data.role === "admin";
  } catch (err) {
    console.error("isAdminByUid error:", err);
    return false;
  }
}

export async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "Missing token" };
  }
  const token = authHeader.split(" ")[1];
  const decoded = await verifyIdToken(token);
  if (!decoded || !decoded.uid) return { ok: false, status: 401, message: "Invalid token" };
  const adminFlag = await isAdminByUid(decoded.uid);
  if (!adminFlag) return { ok: false, status: 403, message: "Admin required" };
  return { ok: true, uid: decoded.uid };
}
