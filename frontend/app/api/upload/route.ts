import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import vision from "@google-cloud/vision";
import fs from "fs";
import path from "path";

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEYFILE,
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME!);
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GCP_KEYFILE,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join("/tmp", file.name);
    fs.writeFileSync(tempPath, buffer);

    // Upload to Cloud Storage
    const blob = bucket.file(file.name);
    await blob.save(buffer);

    let extractedText = "";

    if (file.type.startsWith("image/")) {
      // OCR image using Vision API
      const [result] = await visionClient.textDetection(tempPath);
      extractedText = result.fullTextAnnotation?.text || "";
    } else if (file.type === "application/pdf") {
      // Simplified: PDFs would normally go through Document AI
      extractedText = "PDF uploaded. Parsing not implemented here.";
    }

    const problemJSON = { fileName: file.name, text: extractedText };

    return NextResponse.json(problemJSON);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
