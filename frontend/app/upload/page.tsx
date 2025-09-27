"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, Camera } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface UploadedFile {
  name: string;
  url: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load files from Supabase storage
  const fetchFiles = async () => {
    const { data, error } = await supabase.storage.from("PDFBucket").list("");
    if (error) {
      console.error("Error fetching files:", error);
      return;
    }

    const fileUrls: UploadedFile[] = data.map((file) => {
      const { data: publicUrlData } = supabase.storage
        .from("PDFBucket")
        .getPublicUrl(file.name);
      return { name: file.name, url: publicUrlData.publicUrl || "" };
    });
    setFiles(fileUrls);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Dropzone handler handleupload function
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      const { data, error } = await supabase.storage
        .from("PDFBucket")
        .upload(file.name, file, { cacheControl: "3600", upsert: true });

      if (error) {
        console.error("Upload error:", error);
      } else if (data) {
        const { data: publicUrlData } = supabase.storage
          .from("PDFBucket")
          .getPublicUrl(file.name);
        setFiles((prev) => [
          ...prev,
          { name: file.name, url: publicUrlData.publicUrl || "" },
        ]);
      }
    }

    setUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
      "application/pdf": [".pdf"],
    },
  });

  const removeFile = async (fileName: string) => {
    const { error } = await supabase.storage.from("uploads").remove([fileName]);
    if (error) {
      console.error("Delete error:", error);
    } else {
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
    }
  };

  // Camera handlers
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            await onDrop([file]); // Upload to Supabase
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  }, [onDrop, stopCamera]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <p className="text-lg text-gray-400 mt-2">
            Upload or Capture Homework Images/PDFs
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
                isDragActive
                  ? "border-cyan-400 bg-gray-800"
                  : "border-gray-600 hover:border-cyan-500"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-16 h-16 text-gray-500 mb-4" />
              <p>Drag & drop files</p>
              <p className="text-sm text-gray-500">Supports: JPEG, PNG, PDF</p>
            </div>

            <div
              onClick={startCamera}
              className="flex flex-col items-center border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-xl p-8 text-center cursor-pointer"
            >
              <Camera className="w-16 h-16 text-gray-500 mb-4" />
              <p>Take a picture</p>
            </div>
          </div>

          {uploading && <p className="text-blue-500 mt-4">Uploading...</p>}

          {files.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
              <ul className="space-y-3">
                {files.map((file) => (
                  <li
                    key={file.name}
                    className="bg-gray-800 p-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-6 h-6 text-cyan-400" />
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-xs sm:max-w-md text-blue-400 hover:underline"
                      >
                        {file.name}
                      </a>
                    </div>
                    <button
                      onClick={() => removeFile(file.name)}
                      className="text-red-500 hover:underline"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </main>

        {/* Camera Modal */}
        {isCameraOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-900 rounded-lg"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={capturePhoto}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
