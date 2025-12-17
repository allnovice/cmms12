// src/app/api/deleteAssetPhoto/route.ts
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/firebaseAdmin";

cloudinary.config({ cloud_url: process.env.CLOUDINARY_URL! });

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return new Response(auth.message, { status: auth.status });

  const { public_id } = await req.json();
  try {
    const result = await cloudinary.uploader.destroy(public_id);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
