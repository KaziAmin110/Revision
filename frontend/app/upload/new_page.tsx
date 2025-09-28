"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, Camera } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Suggestion {
  type: "info" | "logic" | "feedback";
  title: string;
  content: string;
}

export interface Question {
  id: number;
  title: string;
  suggestions: Suggestion[];
}

interface UploadedFile {
  name: string;
  url: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Record<string, Question[]>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Flask backend
  const API_BASE = "http://localhost:5001";

  // --- Analyze File ---
  const analyzeFile = async (fileName: string, file?: File) => {
    setAnalyzingFile(fileName);

    try {
      if (!file) throw new Error("No file provided to analyzeFile");

      const form = new FormData();
      form.append("image", file); // ✅ must match Flask request.files['image']

      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: form,
      });

      const result = await response.json();
      if (response.ok) {
        console.log("✅ Extracted Questions:", result.questions);
        setQuestions((prev) => ({ ...prev, [fileName]: result.questions }));
      } else {
        console.error("API Error:", result.error || result);
        alert(`Analysis failed: ${result.error || JSON.stringify(result)}`);
      }
    } catch (err) {
      console.error("❌ Network/error during analysis:", err);
      alert(`Network/error during analysis of ${fileName}: ${err}`);
    } finally {
      setAnalyzingFile(null);
    }
  };

  // --- Fetch Files from Supabase ---
  const fetchFiles = async () => {
    const { data, error } = await supabase.storage.from("PDFBucket").list("");
    if (error) return console.error("❌ Supabase list error:", error);

    const fileUrls = data.map((file: { name: string }) => {
      const publicUrl = supabase.storage.from("PDFBucket").getPublicUrl(file.name).data.publicUrl;
      return { name: file.name, url: publicUrl || "" };
    });
    setFiles(fileUrls);
  };
  useEffect(() => {
    fetchFiles();
  }, []);

  // --- Upload Files ---
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    for (const file of acceptedFiles) {
      try {
        const { error } = await supabase.storage.from("PDFBucket").upload(file.name, file, {
          cacheControl: "3600",
          upsert: true,
        });
        if (error) {
          console.error("❌ Upload error:", error);
          continue;
        }

        const publicUrl =
          supabase.storage.from("PDFBucket").getPublicUrl(file.name).data.publicUrl || "";
        setFiles((prev) => [...prev, { name: file.name, url: publicUrl }]);

        // Analyze immediately with the actual file
        analyzeFile(file.name, file);
      } catch (err) {
        console.error("❌ Unexpected error during upload/analyze:", err);
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

  // --- Remove File ---
  const removeFile = async (fileName: string) => {
    const { error } = await supabase.storage.from("PDFBucket").remove([fileName]);
    if (!error) {
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
      setQuestions((prev) => {
        const newQuestions = { ...prev };
        delete newQuestions[fileName];
        return newQuestions;
      });
    }
  };

  // --- Camera ---
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("❌ Camera error:", err);
    }
  };

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setIsCameraOpen(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
          await onDrop([file]);
          stopCamera();
        }
      }, "image/jpeg");
    }
  }, [onDrop, stopCamera]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // --- UI ---
  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center p-4">
      <div className="w-full max-w-4xl">
        <header className="text-center mb-8">
          <p className="text-lg text-gray-400">Upload or Capture Homework Images/PDFs</p>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              {...getRootProps()}
              className={`flex flex-col items-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
                isDragActive ? "border-cyan-400 bg-gray-800" : "border-gray-600 hover:border-cyan-500"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-16 h-16 text-gray-500 mb-4" />
              <p>Drag & drop files or click</p>
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
          {analyzingFile && <p className="text-cyan-500 mt-4">Analyzing "{analyzingFile}"...</p>}

          {files.length > 0 && (
            <div className="mt-8 space-y-6">
              {files.map((file) => (
                <div key={file.name} className="bg-gray-800 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
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
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => analyzeFile(file.name)}
                        disabled={analyzingFile === file.name}
                        className={`text-white text-sm font-semibold py-1 px-3 rounded-md transition-colors ${
                          analyzingFile === file.name
                            ? "bg-gray-500 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {analyzingFile === file.name ? "Analyzing..." : "Analyze"}
                      </button>
                      <button
                        onClick={() => removeFile(file.name)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Show extracted questions for this file */}
                  {questions[file.name] && (
                    <div className="ml-8 mt-3 space-y-3">
                      {questions[file.name].map((q) => (
                        <div key={q.id} className="bg-gray-700 p-3 rounded-lg">
                          <h3 className="font-semibold text-cyan-400">{q.title}</h3>
                          <ul className="mt-2 space-y-2">
                            {q.suggestions.map((s, idx) => (
                              <li
                                key={idx}
                                className="bg-gray-600 p-2 rounded-md text-sm text-gray-200"
                              >
                                <span className="font-bold capitalize text-cyan-300">
                                  {s.type}:
                                </span>{" "}
                                {s.title} — {s.content}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
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

