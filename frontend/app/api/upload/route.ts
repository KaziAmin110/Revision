// import { NextRequest, NextResponse } from "next/server";
// import { Storage } from "@google-cloud/storage";
// import vision from "@google-cloud/vision";
// import fs from "fs";
// import path from "path";

// // --------------------
// // 1. Load environment variables
// // --------------------
// const PROJECT_ID = process.env.GCP_PROJECT_ID!;
// const BUCKET_NAME = process.env.GCP_BUCKET_NAME!;
// const KEYFILE_PATH = process.env.GCP_KEYFILE!;

// // --------------------
// // 2. Initialize Google Cloud clients
// // --------------------
// const storage = new Storage({
//   projectId: PROJECT_ID,
//   keyFilename: KEYFILE_PATH,
// });

// const visionClient = new vision.ImageAnnotatorClient({
//   projectId: PROJECT_ID,
//   keyFilename: KEYFILE_PATH,
// });

// // --------------------
// // 3. Helper function to upload file to GCS
// // --------------------
// async function uploadToGCS(file: Buffer, filename: string) {
//   const bucket = storage.bucket(BUCKET_NAME);
//   const fileRef = bucket.file(filename);
//   await fileRef.save(file);
//   return `gs://${BUCKET_NAME}/${filename}`;
// }

// // --------------------
// // 4. Helper function to extract text from image/PDF using Vision API
// // --------------------
// async function extractTextFromFile(filePath: string) {
//   const [result] = await visionClient.textDetection(filePath);
//   const detections = result.textAnnotations;
//   return detections.length > 0 ? detections[0].description : "";
// }

// // --------------------
// // 5. API Route Handler
// // --------------------
// export async function POST(req: NextRequest) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);
//     const filename = `${Date.now()}-${file.name}`;

//     // 1️⃣ Upload to Google Cloud Storage
//     await uploadToGCS(buffer, filename);

//     // 2️⃣ Save locally temporarily for Vision API
//     const tempPath = path.join("/tmp", filename);
//     fs.writeFileSync(tempPath, buffer);

//     // 3️⃣ Extract text
//     const extractedText = await extractTextFromFile(tempPath);

//     // 4️⃣ Clean up temp file
//     fs.unlinkSync(tempPath);

//     // 5️⃣ Return JSON
//     return NextResponse.json({ text: extractedText, filename });
//   } catch (error) {
//     console.error("Upload error:", error);
//     return NextResponse.json({ error: "Upload failed" }, { status: 500 });
//   }
// }
