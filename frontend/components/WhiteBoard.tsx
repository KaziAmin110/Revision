"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Pen,
  Eraser,
  Trash2,
  ZoomIn,
  ZoomOut,
  Download,
  CircleDot,
  LoaderCircle,
} from "lucide-react";
import { MathRenderer } from "./MathRenderer";
import {
  SuggestionCard,
  type Suggestion as SuggestionType,
} from "./Suggestion";

// --- Type Definitions ---
type QuestionType = {
  id: number;
  title: string;
  suggestions: SuggestionType[];
};

type AIFeedback = {
  isCorrect: boolean;
  suggestion: string;
};

// --- Default Questions ---
const defaultQuestions: QuestionType[] = [
  {
    id: 1,
    title: "Solve for $x$: $2x - 4 = 10$",
    suggestions: [
      {
        type: "info",
        title: "Equation Type",
        content: "This is a two-step linear equation.",
      },
      {
        type: "logic",
        title: "Isolate X",
        content:
          "First, add 4 to both sides of the equation. Then, divide by 2.",
      },
      {
        type: "feedback",
        title: "Check Your Answer",
        content: "The correct answer is $x=7$.",
      },
    ],
  },
];

const ProgressBar = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => (
  <div className="w-full bg-gray-200 h-2 rounded-full">
    <div
      className="bg-[#800000] h-2 transition-all duration-500"
      style={{ width: `${(current / total) * 100}%` }}
    ></div>
  </div>
);

const NavigationControls = ({
  onPrev,
  onNext,
  currentIndex,
  totalQuestions,
}: {
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  totalQuestions: number;
}) => (
  <div className="flex justify-between items-center p-4 bg-gray-100 border-t border-gray-200">
    <button
      onClick={onPrev}
      disabled={currentIndex === 0}
      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
    >
      Previous
    </button>
    <span className="font-medium text-gray-700">
      Question {currentIndex + 1} of {totalQuestions}
    </span>
    <button
      onClick={onNext}
      disabled={currentIndex >= totalQuestions - 1}
      className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-400 transition-colors"
    >
      Next
    </button>
  </div>
);

const Question = ({
  question,
  showSuggestions,
}: {
  question: QuestionType;
  showSuggestions: boolean;
}) => (
  <div>
    <MathRenderer
      content={question.title}
      className="text-xl font-bold mb-4 text-gray-900"
    />
    {showSuggestions &&
      question.suggestions.map((s, i) => (
        <SuggestionCard key={i} suggestion={s} />
      ))}
  </div>
);

const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(8);
  const [scale, setScale] = useState(1);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<QuestionType[]>(defaultQuestions);

  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);

  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load questions from sessionStorage on initial component mount
  useEffect(() => {
    const storedData = sessionStorage.getItem("extractedQuestions");
    if (storedData) {
      try {
        const parsedQuestions = JSON.parse(storedData);
        if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
          setQuestions(parsedQuestions);
        }
      } catch (error) {
        console.error("Error parsing stored questions:", error);
      }
    }
  }, []); // Empty dependency array ensures this runs only once

  // Derive the current question from state
  const currentQuestion = questions[currentQuestionIndex];

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

  const draw = useCallback(
    (x: number, y: number) => {
      if (!isDrawing || !contextRef.current) return;

      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }

      contextRef.current.globalCompositeOperation = "source-over";
      contextRef.current.strokeStyle = tool === "pen" ? color : "white";
      contextRef.current.lineWidth = tool === "pen" ? lineWidth : lineWidth * 5;
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    },
    [isDrawing, tool, color, lineWidth]
  );

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

  const clearCanvas = useCallback(() => {
    const context = contextRef.current;
    if (context) {
      fillWhiteBackground(context);
      setFeedback(null);
    }
  }, []);

  useEffect(() => {
    if (currentQuestion) {
      clearCanvas();
    }
  }, [currentQuestionIndex, currentQuestion, clearCanvas]);

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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = (touch.clientX - rect.left) / scale;
      const y = (touch.clientY - rect.top) / scale;
      draw(x, y);
    };

    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener("touchmove", handleTouchMove);
    };
  }, [draw, scale]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

  const getAIFeedback = async () => {
    if (!canvasRef.current || !currentQuestion) return;

    const imageDataUrl = canvasRef.current.toDataURL("image/jpeg");
    const base64Image = imageDataUrl.split(",")[1];

    setIsLoadingFeedback(true);

    try {
      const response = await fetch(
        "https://revision-backend-p35l.onrender.com/api/analyze-work",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64Image,
            problemContext: currentQuestion.title,
          }),
        }
      );

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
      const image = canvas.toDataURL("image/jpeg", 0.8);
      const link = document.createElement("a");
      link.href = image;
      link.download = "whiteboard-solution.jpeg";
      link.click();
    }
  };

  const handleZoom = (direction: "in" | "out") => {
    setScale((prevScale) => {
      const newScale = direction === "in" ? prevScale * 1.1 : prevScale / 1.1;
      return Math.max(0.5, Math.min(newScale, 3));
    });
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading questions...
      </div>
    );
  }

  return (
    <div className="flex w-screen h-dvh bg-white overflow-hidden">
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
                tool === "pen" ? "bg-[#800000]" : "hover:bg-gray-700"
              }`}
              title="Pen"
            >
              <Pen size={20} className="text-white hover:cursor-pointer" />
            </button>
            <button
              onClick={() => setTool("eraser")}
              className={`p-2 rounded ${
                tool === "eraser" ? "bg-[#800000]" : "hover:bg-gray-700"
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

          <div className="min-w-0 flex-grow text-white text-center font-semibold">
            <MathRenderer
              className="text-2xl"
              content={currentQuestion.title}
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 p-2 rounded bg-gray-700 text-white text-sm">
              {isLoadingFeedback ? (
                <>
                  <LoaderCircle size={16} className="animate-spin" />
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

        <div className="flex flex-1 overflow-hidden">
          {/* Question Display Panel */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <Question question={currentQuestion} showSuggestions={true} />
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-grow w-full overflow-auto bg-white min-h-0 relative">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseUp={finishDrawing}
                onMouseMove={handleMouseMove}
                onMouseLeave={finishDrawing}
                onTouchStart={handleTouchStart}
                onTouchEnd={finishDrawing}
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
                  <MathRenderer
                    content={feedback.suggestion}
                    className="text-lg"
                  />
                </div>
              )}
            </div>
          </div>
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
