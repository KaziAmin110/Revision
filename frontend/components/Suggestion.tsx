// src/components/Suggestion.tsx
import React from "react";
import { Lightbulb, Info, CheckCircle } from "lucide-react";

// Define the types for suggestion data
export type SuggestionType = "logic" | "info" | "feedback";

export interface Suggestion {
  type: SuggestionType;
  title: string;
  content: string;
}

// Map types to icons and colors for styling
const suggestionConfig = {
  logic: {
    icon: <Lightbulb className="text-amber-400" size={20} />,
    borderColor: "border-amber-400",
  },
  info: {
    icon: <Info className="text-cyan-400" size={20} />,
    borderColor: "border-cyan-400",
  },
  feedback: {
    icon: <CheckCircle className="text-green-400" size={20} />,
    borderColor: "border-green-400",
  },
};

export const SuggestionCard: React.FC<{ suggestion: Suggestion }> = ({
  suggestion,
}) => {
  const config = suggestionConfig[suggestion.type];

  return (
    <div
      className={`bg-gray-800 p-3 rounded-lg border-l-4 ${config.borderColor}`}
    >
      <div className="flex items-center gap-2 mb-2">
        {config.icon}
        <h3 className="font-semibold text-white">{suggestion.title}</h3>
      </div>
      <p className="text-sm text-gray-300">{suggestion.content}</p>
    </div>
  );
};
