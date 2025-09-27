"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Pen,
  Eraser,
  Trash2,
  ZoomIn,
  ZoomOut,
  Download,
  Bot,
  CircleDot,
} from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Suggestion } from "./Suggestion";
import { ProgressBar } from "./ProgressBar";
import { NavigationControls } from "./NavigationControls";
import { MathRenderer } from "./MathRenderer";
import { questions } from "@/src/questionsData";

type AIFeedback = {
  isCorrect: boolean;
  suggestion: string;
};

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

  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fillWhiteBackground = (context: CanvasRenderingContext2D) => {
    const canvas = context.canvas;
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();
  };

  const startDrawing = (x: number, y: number) => {
    if (contextRef.current) {
      // --- MODIFIED: Clear old feedback when the user starts drawing again.
      // This "re-arms" the polling mechanism.
      setFeedback(null);

      contextRef.current.beginPath();
      contextRef.current.moveTo(x, y);
      setIsDrawing(true);
    }
  };

  const finishDrawing = () => {
    if (contextRef.current) {
      contextRef.current.closePath();
      setIsDrawing(false);

      // --- MODIFIED: If feedback is already being shown, do not start a new timer.
      // This stops polling until the user draws again.
      if (feedback) {
        return;
      }

      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
      feedbackTimerRef.current = setTimeout(() => {
        if (!isLoadingFeedback) {
          getAIFeedback();
        }
      }, 1500);
    }
  };

  const draw = (x: number, y: number) => {
    if (!isDrawing || !contextRef.current) return;

    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }

    contextRef.current.globalCompositeOperation = "source-over";
    contextRef.current.strokeStyle = tool === "pen" ? color : "white";
    contextRef.current.lineWidth = tool === "pen" ? lineWidth : lineWidth * 5;
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
  };

  const getCoordsFromEvent = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    const clientX =
      "touches" in e.nativeEvent
        ? e.nativeEvent.touches[0].clientX
        : e.nativeEvent.clientX;
    const clientY =
      "touches" in e.nativeEvent
        ? e.nativeEvent.touches[0].clientY
        : e.nativeEvent.clientY;

    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;

    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordsFromEvent(e);
    startDrawing(x, y);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCoordsFromEvent(e);
    draw(x, y);
  };
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordsFromEvent(e);
    startDrawing(x, y);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordsFromEvent(e);
    draw(x, y);
  };

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

  const clearCanvas = () => {
    const context = contextRef.current;
    if (context) {
      fillWhiteBackground(context);
      setFeedback(null);
    }
  };

  useEffect(() => {
    setSuggestions([]);
    const timer = setTimeout(() => {
      setSuggestions(currentQuestion.suggestions);
    }, 500);
    clearCanvas();
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, currentQuestion.suggestions]);

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
          fillWhiteBackground(context);
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
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

  const getAIFeedback = async () => {
    if (!canvasRef.current) return;

    const imageDataUrl = canvasRef.current.toDataURL("image/png");
    const base64Image = imageDataUrl.split(",")[1];

    setIsLoadingFeedback(true);
    // We no longer clear feedback here, it's cleared when the user starts drawing.

    try {
      const response = await fetch("http://127.0.0.1:5001/api/analyze-work", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          problemContext: currentQuestion.title,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get feedback from the server.");
      }

      const data: AIFeedback = await response.json();
      setFeedback(data);
    } catch (error) {
      console.error("Error getting AI feedback:", error);
      setFeedback({
        suggestion: "Could not get feedback. Please try again.",
        isCorrect: false,
      });
    } finally {
      setIsLoadingFeedback(false);
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
    <div className="flex w-screen h-screen bg-white overflow-hidden">
      <Sidebar suggestions={suggestions} />
      <div className="w-full flex-1 flex flex-col bg-white overflow-hidden">
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={questions.length}
        />

        <div className="toolbar bg-gray-900 p-4 flex items-center justify-between gap-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTool("pen")}
              className={`p-2 rounded ${
                tool === "pen" ? "bg-cyan-500" : "hover:bg-gray-700"
              }`}
              title="Pen"
            >
              {" "}
              <Pen size={20} className="text-white hover:cursor-pointer" />{" "}
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`p-2 rounded ${
                tool === "eraser" ? "bg-cyan-500" : "hover:bg-gray-700"
              }`}
              title="Eraser"
            >
              {" "}
              <Eraser
                size={20}
                className="text-white hover:cursor-pointer"
              />{" "}
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
          <div className="flex-grow text-white text-center font-semiobold">
            <MathRenderer 
              content={currentQuestion.title}
              className="text-2xl font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 p-2 rounded bg-gray-700 text-white text-sm">
              {isLoadingFeedback ? (
                <>
                  <Bot size={16} className="animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <CircleDot size={16} className="text-green-400" />
                  <span>Listening...</span>
                </>
              )}
            </div>
            <button
              onClick={() => handleZoom("in")}
              className="p-2 hover:bg-gray-700 rounded hover:cursor-pointer"
              title="Zoom In"
            >
              {" "}
              <ZoomIn
                size={20}
                className="text-white hover:cursor-pointer"
              />{" "}
            </button>
            <button
              onClick={() => handleZoom("out")}
              className="p-2 hover:bg-gray-700 rounded hover:cursor-pointer"
              title="Zoom Out"
            >
              {" "}
              <ZoomOut
                size={20}
                className="text-white hover:cursor-pointer"
              />{" "}
            </button>
            <button
              onClick={downloadCanvas}
              className="p-2 hover:bg-gray-700 rounded hover:cursor-pointer"
              title="Download"
            >
              {" "}
              <Download
                size={20}
                className="text-white hover:cursor-pointer"
              />{" "}
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 hover:bg-red-500/20 text-red-400 rounded hover:cursor-pointer"
              title="Clear Canvas"
            >
              {" "}
              <Trash2 size={20} className="hover:cursor-pointer" />{" "}
            </button>
          </div>
        </div>

        <div className="flex-grow w-full overflow-auto bg-white min-h-0 relative">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseUp={finishDrawing}
            onMouseMove={handleMouseMove}
            onMouseLeave={finishDrawing}
            onTouchStart={handleTouchStart}
            onTouchEnd={finishDrawing}
            onTouchMove={handleTouchMove}
            className="cursor-crosshair"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          />
          {feedback && (
            <div
              className={`absolute bottom-4 left-4 right-4 p-4 rounded-lg text-white shadow-lg ${
                feedback.isCorrect ? "bg-green-600" : "bg-yellow-600"
              }`}
            >
              <p className="font-bold">ProRev Assistant:</p>
              <p>{feedback.suggestion}</p>
            </div>
          )}
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
