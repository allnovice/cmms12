// src/app/api/fill-upload/route.ts
import { v2 as cloudinary } from "cloudinary";
import htmlDocx from "html-docx-js/dist/html-docx";
 
// configure Cloudinary (use envs or explicit as you prefer)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dvch94glx",
  api_key: process.env.CLOUDINARY_API_KEY || "782992386246832",
  api_secret: process.env.CLOUDINARY_API_SECRET || "YOUR_SECRET_HERE",
  secure: true,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { html, filename, originalPublicId } = body;

    if (!html) {
      return new Response(JSON.stringify({ error: "No html provided" }), { status: 400 });
    }
    // convert html -> docx (uint8 array)
    const docxBuf = htmlDocx.asBlob(html); // returns a Blob in browser; in Node this returns Buffer-like
    // ensure we have Buffer
    let buffer: Buffer;
    if (docxBuf.arrayBuffer) {
      // if Blob-like
      const arr = await docxBuf.arrayBuffer();
      buffer = Buffer.from(arr);
    } else if (docxBuf instanceof Buffer) {
      buffer = docxBuf;
    } else {
      // html-docx-js sometimes returns an ArrayBuffer directly
      buffer = Buffer.from(docxBuf);
    }

    // upload buffer to Cloudinary (raw resource)
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "filled",
          public_id: filename ? filename.replace(/\.docx$/i, "") : undefined,
          use_filename: false,
          unique_filename: true,
        },
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
      stream.end(buffer);
    });

    return new Response(JSON.stringify({ secure_url: uploadResult.secure_url, result: uploadResult }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("fill-upload error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
}
