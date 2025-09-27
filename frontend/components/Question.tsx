"use client";

import React from 'react';
import { SuggestionCard, Suggestion } from './Suggestion';
import { MathRenderer } from './MathRenderer';

export interface QuestionData {
  id: number;
  title: string;
  suggestions: Suggestion[];
}

interface QuestionProps {
  question: QuestionData;
  className?: string;
  showSuggestions?: boolean;
}

export const Question: React.FC<QuestionProps> = ({ 
  question, 
  className = "",
  showSuggestions = true 
}) => {
  return (
    <div className={`question-container ${className}`}>
      <div className="question-header mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
            {question.id}
          </div>
          <span className="text-sm text-gray-500 uppercase tracking-wide">
            Question {question.id}
          </span>
        </div>
        
        <div className="question-title">
          <MathRenderer 
            content={question.title}
            className="text-2xl font-bold text-gray-900 leading-tight"
          />
        </div>
      </div>

      {showSuggestions && question.suggestions.length > 0 && (
        <div className="suggestions-section">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-1 h-5 bg-cyan-500 rounded"></div>
            Helpful Hints
          </h3>
          
          <div className="suggestions-list space-y-3">
            {question.suggestions.map((suggestion, index) => (
              <SuggestionCard 
                key={index}
                suggestion={suggestion}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
