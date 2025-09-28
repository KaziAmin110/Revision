"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  UploadCloud,
  File as FileIcon,
  X,
  Camera,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

interface OCRResult {
  isCorrect?: boolean;
  suggestion?: string;
  extractedText?: string;
  confidence?: number;
  status?: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  name: string;
  url: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const selectedFile = acceptedFiles[0];
      setUploading(true);
      setError("");
      try {
        if (file) {
          await removeFile(file.name);
        }
        const fileName = `${Date.now()}-${selectedFile.name}`;
        const { data, error } = await supabase.storage
          .from("PDFBucket")
          .upload(fileName, selectedFile);
        if (error) throw error;
        const { data: urlData } = supabase.storage
          .from("PDFBucket")
          .getPublicUrl(fileName);
        setFile({
          file: selectedFile,
          preview: URL.createObjectURL(selectedFile),
          name: fileName,
          url: urlData.publicUrl,
        });
        setOcrResult(null);
      } catch (error) {
        console.error("Upload error:", error);
        setError("Failed to upload file.");
      } finally {
        setUploading(false);
      }
    },
    [file]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
    },
    multiple: false,
    maxFiles: 1,
  });

  const removeFile = async (fileName: string) => {
    const { error } = await supabase.storage
      .from("PDFBucket")
      .remove([fileName]);
    if (error) {
      console.error("Delete error:", error);
    } else {
      setFile(null);
      setOcrResult(null);
    }
  };

  // Process single file with OCR
  const processFileWithOCR = async () => {
    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    setIsProcessing(true);
    setError("");
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file.file);

      const response = await fetch(
        "https://revision-backend-p35l.onrender.com/api/extract-questions",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setOcrResult(result);

      sessionStorage.setItem("extractedQuestions", JSON.stringify(result));
      router.push("/whiteboard");
    } catch (error) {
      console.error("I couldn't understand your document: ", error);
      setError(
        `Failed to understand your document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsProcessing(false);
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
    <div className="bg-white min-h-screen text-black flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Before we get started...</h1>
          <p className="text-lg text-gray-400 mt-2">
            Upload your question images or PDF files to begin solving!
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
                isDragActive
                  ? "border-red-700 bg-gray-100"
                  : "border-gray-300 hover:border-red-700"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-16 h-16 text-black mb-4" />
              <p className="font-medium">
                {file ? "Replace current file" : "Drag & drop PDF or click"}
              </p>
              <p className="text-sm text-gray-600">Supports: PDF, JPG, PNG</p>
              <p className="text-xs text-gray-500 mt-1">
                Upload one document to begin practice
              </p>
            </div>

            <div
              onClick={startCamera}
              className="flex flex-col items-center border-2 border-dashed border-gray-300 hover:border-red-700 rounded-xl p-8 text-center cursor-pointer bg-white"
            >
              <Camera className="w-16 h-16 text-black mb-4" />
              <p className="font-medium">Take a photo</p>
              <p className="text-sm text-gray-600">
                {file ? "Replace with photo" : "Photograph documents"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                For documents or handwritten text
              </p>
            </div>
          </div>

          {uploading && (
            <div className="text-center mt-4">
              <p className="text-red-700">Uploading...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
              <AlertCircle className="text-red-700 mt-0.5" size={20} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Single File Display */}
          {file && (
            <div className="mt-8 flex flex-col items-center justify-center w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Current File</h2>
              </div>

              <div className="bg-white p-4 rounded-lg flex items-center justify-between w-full border border-gray-200">
                <div className="flex items-center gap-3">
                  <FileIcon className="w-6 h-6 text-black" />
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black hover:underline truncate max-w-xs sm:max-w-md"
                  >
                    {file.name}
                  </a>
                </div>
                <button
                  onClick={() => removeFile(file.name)}
                  className="text-red-600 hover:text-red-500 hover:cursor-pointer"
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>
              <button
                onClick={processFileWithOCR}
                disabled={isProcessing}
                className="mt-8 text-white bg-red-800 hover:bg-red-900 disabled:bg-gray-300 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors w-full max-w-sm hover:cursor-pointer"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Cooking up your ReVision...
                  </div>
                ) : (
                  "Begin Solving!"
                )}
              </button>
            </div>
          )}
        </main>

        {/* Camera Modal */}
        {isCameraOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 border border-gray-200">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-black">
                  Take a Photo
                </h3>
                <p className="text-sm text-gray-600">
                  {file
                    ? "This will replace your current document"
                    : "Capture your document to begin ReVising"}
                </p>
              </div>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-gray-100 rounded-lg object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={capturePhoto}
                  className="bg-red-800 hover:bg-red-900 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">
                Point your camera at the document and click capture!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
