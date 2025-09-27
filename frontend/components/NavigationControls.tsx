import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface NavigationControlsProps {
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  totalQuestions: number;
}
export const NavigationControls: React.FC<NavigationControlsProps> = ({
  onPrev,
  onNext,
  currentIndex,
  totalQuestions,
}) => {
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="bg-gray-900 p-4 flex items-center justify-between gap-4 border-t border-gray-700 w-full">
      <button
        onClick={onPrev}
        disabled={isFirstQuestion}
        className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 hover:cursor-pointer"
      >
        <ArrowLeft size={18} />
        Previous
      </button>
      <button
        onClick={onNext}
        disabled={isLastQuestion}
        className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-cyan-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-500 hover:cursor-pointer"
      >
        Next
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
