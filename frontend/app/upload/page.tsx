// "use client";

// import { useState, useCallback, useRef, useEffect } from "react";
// import { useDropzone } from "react-dropzone";
// import { UploadCloud, File as FileIcon, X, Camera } from "lucide-react";

// export default function UploadPage() {
//   const [files, setFiles] = useState<File[]>([]);
//   const [isCameraOpen, setIsCameraOpen] = useState(false);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   const onDrop = useCallback((acceptedFiles: File[]) => {
//     setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
//   }, []);

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: {
//       "image/*": [".jpeg", ".png", ".jpg"],
//       "application/pdf": [".pdf"],
//     },
//   });

//   const removeFile = (fileToRemove: File) => {
//     setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
//   };

//   const startCamera = async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getUserMedia({
//         video: {
//           facingMode: "user", // Use front camera by default for laptops
//           width: { ideal: 1280 },
//           height: { ideal: 720 },
//         },
//         audio: false,
//       });
//       setStream(mediaStream);
//       setIsCameraOpen(true);
//     } catch (error) {
//       console.error("Error accessing camera:", error);
//       // Fallback to file input for devices without camera support
//       const input = document.createElement("input");
//       input.type = "file";
//       input.accept = "image/*";
//       input.capture = "environment";
//       input.onchange = (event) => {
//         const target = event.target as HTMLInputElement;
//         if (target.files && target.files.length > 0) {
//           const capturedFiles = Array.from(target.files);
//           setFiles((prevFiles) => [...prevFiles, ...capturedFiles]);
//         }
//       };
//       input.click();
//     }
//   };

//   const stopCamera = useCallback(() => {
//     if (stream) {
//       stream.getTracks().forEach((track) => track.stop());
//       setStream(null);
//     }
//     setIsCameraOpen(false);
//   }, [stream]);

//   const capturePhoto = useCallback(() => {
//     if (videoRef.current && canvasRef.current) {
//       const video = videoRef.current;
//       const canvas = canvasRef.current;
//       const context = canvas.getContext("2d");

//       canvas.width = video.videoWidth;
//       canvas.height = video.videoHeight;

//       if (context) {
//         context.drawImage(video, 0, 0);
//         canvas.toBlob(
//           (blob) => {
//             if (blob) {
//               const file = new File(
//                 [blob],
//                 `camera-capture-${Date.now()}.jpg`,
//                 {
//                   type: "image/jpeg",
//                 }
//               );
//               setFiles((prevFiles) => [...prevFiles, file]);
//               stopCamera();
//             }
//           },
//           "image/jpeg",
//           0.9
//         );
//       }
//     }
//   }, [videoRef, canvasRef, setFiles, stopCamera]);

//   const handleTakePicture = () => {
//     startCamera();
//   };

//   // Handle spacebar for photo capture
//   useEffect(() => {
//     const handleKeyPress = (event: KeyboardEvent) => {
//       if (event.code === "Space" && isCameraOpen) {
//         event.preventDefault();
//         capturePhoto();
//       }
//       if (event.code === "Escape" && isCameraOpen) {
//         event.preventDefault();
//         stopCamera();
//       }
//     };

//     if (isCameraOpen) {
//       document.addEventListener("keydown", handleKeyPress);
//     }

//     return () => {
//       document.removeEventListener("keydown", handleKeyPress);
//     };
//   }, [isCameraOpen, capturePhoto, stopCamera]);

//   // Handle video stream setup
//   useEffect(() => {
//     if (stream && videoRef.current) {
//       videoRef.current.srcObject = stream;
//       videoRef.current.play().catch(console.error);
//     }
//   }, [stream]);

//   const handleUpload = async () => {
//     if (files.length === 0) {
//       alert("Please select files to upload.");
//       return;
//     }
//     // Mock upload logic
//     console.log("Uploading files:", files);
//     alert(
//       `Starting upload for ${files.length} file(s)... (See console for details)`
//     );
//     // Handle file upload here
//   };

//   return (
//     <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
//       <div className="w-full max-w-3xl">
//         <header className="text-center mb-8">
//           <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">
//             ProRev AI Assistant
//           </h1>
//           <p className="text-lg text-gray-400 mt-2">
//             Upload your homework to get started
//           </p>
//         </header>

//         <main>
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//             <div
//               {...getRootProps()}
//               className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors duration-300 ${
//                 isDragActive
//                   ? "border-cyan-400 bg-gray-800"
//                   : "border-gray-600 hover:border-cyan-500"
//               }`}
//             >
//               <input {...getInputProps()} />
//               <div className="flex flex-col items-center">
//                 <UploadCloud className="w-16 h-16 text-gray-500 mb-4" />
//                 {isDragActive ? (
//                   <p className="text-lg">Drop the files here ...</p>
//                 ) : (
//                   <p className="text-lg">
//                     Drag & drop files here, or click to select
//                   </p>
//                 )}
//                 <p className="text-sm text-gray-500 mt-2">
//                   Supports: Images (JPEG, PNG) and PDF
//                 </p>
//               </div>
//             </div>

//             <div
//               onClick={handleTakePicture}
//               className="border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-colors duration-300"
//             >
//               <div className="flex flex-col items-center">
//                 <Camera className="w-16 h-16 text-gray-500 mb-4" />
//                 <p className="text-lg">Take a picture</p>
//                 <p className="text-sm text-gray-500 mt-2">
//                   Use your device&apos;s camera
//                 </p>
//               </div>
//             </div>
//           </div>

//           {files.length > 0 && (
//             <div className="mt-8">
//               <h2 className="text-xl font-semibold mb-4">Selected Files:</h2>
//               <ul className="space-y-3">
//                 {files.map((file, index) => (
//                   <li
//                     key={index}
//                     className="bg-gray-800 p-3 rounded-lg flex items-center justify-between animate-fade-in"
//                   >
//                     <div className="flex items-center gap-3">
//                       <FileIcon className="w-6 h-6 text-cyan-400" />
//                       <span className="truncate max-w-xs sm:max-w-md">
//                         {file.name}
//                       </span>
//                     </div>
//                     <button
//                       onClick={() => removeFile(file)}
//                       className="text-gray-400 hover:text-red-500 transition-colors"
//                     >
//                       <X className="w-5 h-5" />
//                     </button>
//                   </li>
//                 ))}
//               </ul>
//               <div className="mt-8 text-center">
//                 <button
//                   onClick={handleUpload}
//                   className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-300 transform hover:scale-105"
//                 >
//                   Analyze Homework
//                 </button>
//               </div>
//             </div>
//           )}
//         </main>

//         {/* Camera Modal */}
//         {isCameraOpen && (
//           <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
//             <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-xl font-semibold text-white">
//                   Take a Picture
//                 </h3>
//                 <button
//                   onClick={stopCamera}
//                   className="text-gray-400 hover:text-white transition-colors"
//                 >
//                   <X className="w-6 h-6" />
//                 </button>
//               </div>

//               <div className="relative">
//                 <video
//                   ref={videoRef}
//                   autoPlay
//                   playsInline
//                   className="w-full h-64 sm:h-80 bg-gray-900 rounded-lg object-cover"
//                 />
//                 <canvas ref={canvasRef} className="hidden" />
//               </div>

//               <div className="flex justify-center gap-4 mt-6">
//                 <button
//                   onClick={capturePhoto}
//                   className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
//                 >
//                   <Camera className="w-5 h-5" />
//                   Capture
//                 </button>
//                 <button
//                   onClick={stopCamera}
//                   className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
//                 >
//                   Cancel
//                 </button>
//               </div>

//               <p className="text-sm text-gray-400 text-center mt-4">
//                 Press{" "}
//                 <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">
//                   Space
//                 </kbd>{" "}
//                 to capture or{" "}
//                 <kbd className="bg-gray-700 px-2 py-1 rounded text-xs">
//                   Escape
//                 </kbd>{" "}
//                 to cancel
//               </p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, Camera } from "lucide-react";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            setFiles((prevFiles) => [...prevFiles, file]);
            stopCamera();
          }
        }, "image/jpeg");
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  const handleUpload = async () => {
    if (files.length === 0) {
      alert("Please select files to upload.");
      return;
    }

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        console.log("Cloud response:", data);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-cyan-400">
            ProRev AI Assistant
          </h1>
          <p className="text-lg text-gray-400 mt-2">
            Upload or capture homework images/PDFs
          </p>
        </header>

        <main>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer ${
                isDragActive
                  ? "border-cyan-400 bg-gray-800"
                  : "border-gray-600 hover:border-cyan-500"
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-16 h-16 text-gray-500 mb-4" />
              <p>Drag & drop files or click</p>
              <p className="text-sm text-gray-500">Supports: JPEG, PNG, PDF</p>
            </div>

            <div
              onClick={startCamera}
              className="border-2 border-dashed border-gray-600 hover:border-cyan-500 rounded-xl p-8 text-center cursor-pointer"
            >
              <Camera className="w-16 h-16 text-gray-500 mb-4" />
              <p>Take a picture</p>
            </div>
          </div>

          {files.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Selected Files</h2>
              <ul className="space-y-3">
                {files.map((file, idx) => (
                  <li
                    key={idx}
                    className="bg-gray-800 p-3 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <FileIcon className="w-6 h-6 text-cyan-400" />
                      <span className="truncate max-w-xs sm:max-w-md">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(file)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-8 text-center">
                <button
                  onClick={handleUpload}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg"
                >
                  Analyze Homework
                </button>
              </div>
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
