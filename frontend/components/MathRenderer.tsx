"use client";

import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ 
  content, 
  className = "", 
  inline = true 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const renderContent = (text: string) => {
        const parts = text.split(/(\$\$.*?\$\$|\$.*?\$)/g);
        let html = '';
        
        parts.forEach((part) => {
          if (part.startsWith('$$') && part.endsWith('$$')) {
            const mathContent = part.slice(2, -2);
            try {
              html += katex.renderToString(mathContent, {
                displayMode: true,
                throwOnError: false
              });
            } catch (error) {
              html += `<span class="katex-error">${part}</span>`;
            }
          } else if (part.startsWith('$') && part.endsWith('$')) {
            // inline math
            const mathContent = part.slice(1, -1);
            try {
              html += katex.renderToString(mathContent, {
                displayMode: false,
                throwOnError: false
              });
            } catch (error) {
              html += `<span class="katex-error">${part}</span>`;
            }
          } else { // regular text
            html += part;
          }
        });
        
        return html;
      };

      containerRef.current.innerHTML = renderContent(content);
    }
  }, [content]);

  return (
    <div ref={containerRef} className={className} />
  );
};
