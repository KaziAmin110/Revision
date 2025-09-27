"use client";

import React, { useRef, useEffect, useState } from "react";
import { Pen, Eraser, Trash2, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Suggestion } from "./Suggestion";
import { ProgressBar } from "./ProgressBar";
import { NavigationControls } from "./NavigationControls";
import { questions } from "@/src/questions";

const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);
  const [scale, setScale] = useState(1);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const currentQuestion = questions[currentQuestionIndex];

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1);
    }
  };

  // --- Effect to update suggestions and clear canvas on question change ---
  useEffect(() => {
    // Clear previous suggestions immediately for a snappier feel
    setSuggestions([]);

    // Simulate fetching new suggestions for the current question
    const timer = setTimeout(() => {
      setSuggestions(currentQuestion.suggestions);
    }, 500); // Simulate a short network delay

    clearCanvas();

    return () => clearTimeout(timer);
  }, [currentQuestionIndex, currentQuestion.suggestions]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.restore();
    }
  };

  // Set canvas dimensions on mount and resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setCanvasDimensions = () => {
      const container = canvas.parentElement;
      if (container) {
        const { width, height } = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const context = canvas.getContext("2d");
        if (context) {
          context.scale(dpr, dpr);
          context.lineCap = "round";
          context.strokeStyle = color;
          context.lineWidth = lineWidth;
          contextRef.current = context;
        }
      }
    };

    setCanvasDimensions();
    window.addEventListener("resize", setCanvasDimensions);
    return () => window.removeEventListener("resize", setCanvasDimensions);
  }, [color, lineWidth]);

  // Update context properties when they change
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

  const startDrawing = ({
    nativeEvent,
  }: React.MouseEvent<HTMLCanvasElement>) => {
    const { offsetX, offsetY } = nativeEvent;
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX / scale, offsetY / scale);
      setIsDrawing(true);
    }
  };

  const finishDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
      setIsDrawing(false);
    }
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    if (contextRef.current) {
      contextRef.current.globalCompositeOperation =
        tool === "pen" ? "source-over" : "destination-out";
      contextRef.current.lineTo(offsetX / scale, offsetY / scale);
      contextRef.current.stroke();
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = "whiteboard-solution.png";
      link.click();
    }
  };

  const handleZoom = (direction: "in" | "out") => {
    setScale((prevScale) => {
      const newScale = direction === "in" ? prevScale * 1.1 : prevScale / 1.1;
      return Math.max(0.5, Math.min(newScale, 3));
    });
  };

  return (
    <div className="flex w-screen h-screen bg-white">
      <Sidebar suggestions={suggestions} />
      <div className="w-full flex-1 flex flex-col bg-white overflow-hidden">
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={questions.length}
        />

        <div className="toolbar bg-gray-900 p-4 flex items-center justify-between gap-2 border-b border-gray-700">
          {/* Left tools */}
          <div className="flex items-center gap-2">
            {/* ... pen, eraser, color, range inputs are the same ... */}
            <button
              onClick={() => setTool("pen")}
              className={`p-2 rounded ${
                tool === "pen" ? "bg-cyan-500" : "hover:bg-gray-700"
              }`}
              title="Pen"
            >
              <Pen size={20} className="text-white hover:cursor-pointer" />
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`p-2 rounded ${
                tool === "eraser" ? "bg-cyan-500" : "hover:bg-gray-700"
              }`}
              title="Eraser"
            >
              <Eraser size={20} className="text-white hover:cursor-pointer" />
            </button>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 bg-transparent cursor-pointer"
              title="Color Picker"
            />
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="cursor-pointer"
              title="Line Width"
            />
          </div>

          {/* DYNAMIC Question Title */}
          <div className="flex-grow text-white text-center font-semiobold">
            <h1 className="text-2xl font-bold">{currentQuestion.title}</h1>
          </div>

          {/* Right tools */}
          <div className="flex items-center gap-2">
            {/* ... zoom, download, trash buttons are the same ... */}
            <button
              onClick={() => handleZoom("in")}
              className="p-2 hover:bg-gray-700 rounded hover:cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={20} className="text-white hover:cursor-pointer" />
            </button>
            <button
              onClick={() => handleZoom("out")}
              className="p-2 hover:bg-gray-700 rounded hover:cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={20} className="text-white hover:cursor-pointer" />
            </button>
            <button
              onClick={downloadCanvas}
              className="p-2 hover:bg-gray-700 rounded hover:cursor-pointer"
              title="Download"
            >
              <Download size={20} className="text-white hover:cursor-pointer" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 hover:bg-red-500/20 text-red-400 rounded hover:cursor-pointer"
              title="Clear Canvas"
            >
              <Trash2 size={20} className="hover:cursor-pointer" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-grow w-full h-full overflow-auto bg-white">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={finishDrawing}
            onMouseMove={draw}
            onMouseLeave={finishDrawing}
            className="cursor-crosshair bg-white"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
        </div>

        <NavigationControls
          onPrev={handlePreviousQuestion}
          onNext={handleNextQuestion}
          currentIndex={currentQuestionIndex}
          totalQuestions={questions.length}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
