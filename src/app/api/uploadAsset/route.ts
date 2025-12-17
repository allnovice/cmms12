// src/app/api/uploadAsset/route.ts
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_url: process.env.CLOUDINARY_URL!,
});

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file = data.get("file") as File;
    const assetId = data.get("assetId") as string;

    if (!file || !assetId) {
      return Response.json({ error: "File or assetId missing" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_FOLDER || "assets",
          resource_type: "image",
          public_id: `asset_${assetId}`, // unique per asset
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return Response.json({ secure_url: uploadResult.secure_url });
  } catch (err: any) {
    console.error("Asset upload error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
