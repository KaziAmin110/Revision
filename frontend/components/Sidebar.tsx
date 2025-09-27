"use client";

import React, { useState } from "react";
import { Suggestion, SuggestionCard } from "./Suggestion";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

interface SidebarProps {
  suggestions: Suggestion[];
}

export const Sidebar: React.FC<SidebarProps> = ({ suggestions }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div
      className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out border-r border-gray-700 ${
        isOpen ? "w-80" : "w-16"
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        {isOpen && <h2 className="text-xl font-bold">Suggestions</h2>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-700 rounded hover:cursor-pointer"
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? (
            <ChevronsLeft size={20} className="hover:cursor-pointer" />
          ) : (
            <ChevronsRight size={20} className="hover:cursor-pointer" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="flex-grow p-4 overflow-y-auto">
          <div className="flex flex-col gap-4">
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, index) => (
                <SuggestionCard key={index} suggestion={suggestion} />
              ))
            ) : (
              <p className="text-gray-400">No suggestions available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
