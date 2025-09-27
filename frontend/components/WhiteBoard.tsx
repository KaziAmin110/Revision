"use client";

import React, { useRef, useEffect, useState } from "react";
import { Pen, Eraser, Trash2, ZoomIn, ZoomOut, Download } from "lucide-react";

const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#FFFFFF");
  const [lineWidth, setLineWidth] = useState(3);
  const [scale, setScale] = useState(1);

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
      contextRef.current.moveTo(offsetX, offsetY);
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
      if (tool === "pen") {
        contextRef.current.globalCompositeOperation = "source-over";
      } else {
        contextRef.current.globalCompositeOperation = "destination-out";
      }
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
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
    <div className="w-full h-full flex flex-col bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
      <div className="toolbar bg-gray-900 p-2 flex items-center justify-between gap-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded ${
              tool === "pen" ? "bg-cyan-500" : "hover:bg-gray-700"
            }`}
            title="Pen"
          >
            <Pen size={20} />
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded ${
              tool === "eraser" ? "bg-cyan-500" : "hover:bg-gray-700"
            }`}
            title="Eraser"
          >
            <Eraser size={20} />
          </button>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 bg-transparent border-none cursor-pointer"
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom("in")}
            className="p-2 hover:bg-gray-700 rounded"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={() => handleZoom("out")}
            className="p-2 hover:bg-gray-700 rounded"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={downloadCanvas}
            className="p-2 hover:bg-gray-700 rounded"
            title="Download"
          >
            <Download size={20} />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 hover:bg-red-500/20 text-red-400 rounded"
            title="Clear Canvas"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
      <div className="flex-grow w-full h-full overflow-auto">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
          onMouseLeave={finishDrawing} // Stop drawing if mouse leaves canvas
          className="cursor-crosshair"
          style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
