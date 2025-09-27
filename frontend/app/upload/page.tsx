"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X } from "lucide-react";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".jpg"],
      "application/pdf": [".pdf"],
    },
  });

  const removeFile = (fileToRemove: File) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select files to upload.");
      return;
    }
    // Mock upload logic
    console.log("Uploading files:", files);
    alert(
      `Starting upload for ${files.length} file(s)... (See console for details)`
    );
    // In a real application, you would handle the file upload to your backend here.
    // e.g., using FormData and fetch to send to a Python backend.
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">
            ProRev AI Assistant
          </h1>
          <p className="text-lg text-gray-400 mt-2">
            Upload your homework to get started
          </p>
        </header>

        <main>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors duration-300 ${
              isDragActive
                ? "border-cyan-400 bg-gray-800"
                : "border-gray-600 hover:border-cyan-500"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <UploadCloud className="w-16 h-16 text-gray-500 mb-4" />
              {isDragActive ? (
                <p className="text-lg">Drop the files here ...</p>
              ) : (
                <p className="text-lg">
                  Drag & drop files here, or click to select
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Supports: Images (JPEG, PNG) and PDF
              </p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Selected Files:</h2>
              <ul className="space-y-3">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="bg-gray-800 p-3 rounded-lg flex items-center justify-between animate-fade-in"
                  >
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-6 h-6 text-cyan-400" />
                      <span className="truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(file)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-8 text-center">
                <button
                  onClick={handleUpload}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105"
                >
                  Analyze Homework
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
