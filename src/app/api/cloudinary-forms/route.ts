// src/app/api/cloudinary-forms/route.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dvch94glx",
  api_key: "782992386246832",
  api_secret: "KxvlSNQ50CDtItxpzYnxzGJ-HWY",
});

export async function GET() {
  try {
    const result = await cloudinary.search
      .expression("folder=requests") // ✅ finds all files in requests/
      .sort_by("created_at", "desc")
      .max_results(50)
      .execute();

    return Response.json({ forms: result.resources });
  } catch (err: any) {
    console.error("Cloudinary fetch error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
