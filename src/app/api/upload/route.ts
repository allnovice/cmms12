// src/app/api/upload/route.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_url: process.env.CLOUDINARY_URL!,
});

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary as raw (for PDFs)
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: process.env.CLOUDINARY_FOLDER || "requests",
            resource_type: "raw", // ✅ important for PDFs
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    return Response.json(uploadResult);
  } catch (err: any) {
    console.error("Upload error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
