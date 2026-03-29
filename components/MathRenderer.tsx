
import React, { useEffect, useRef, useState } from 'react';

interface MathRendererProps {
  content: string;
  inline?: boolean;
  highlightClass?: string;
  className?: string;
  palette?: 'default' | 'contrast' | 'blue-contrast';
  customColor?: string | null; // New prop for custom color
}

declare global {
  interface Window {
    MathJax: any;
  }
}

// Mảng màu sắc rực rỡ mặc định (Cầu vồng - thay đổi theo Light/Dark)
const MATH_COLORS = [
  'text-cyan-600 dark:text-cyan-400',
  'text-fuchsia-600 dark:text-fuchsia-400',
  'text-lime-600 dark:text-lime-400',
  'text-orange-600 dark:text-orange-400',
  'text-sky-600 dark:text-sky-400',
  'text-rose-600 dark:text-rose-400',
  'text-violet-600 dark:text-violet-400'
];

// Mảng 3 màu NEON tuyệt đối
const CONTRAST_COLORS = [
  'text-[#FFFF00]', // Yellow Neon
  'text-[#00FFFF]', // Cyan Neon
  'text-[#00FF00]'  // Green Neon
];

const MathRenderer: React.FC<MathRendererProps> = ({ content, inline = false, highlightClass = "", className = "", palette = 'default', customColor = null }) => {
  const containerRef = useRef<HTMLElement>(null);
  
  // Ensure content is safe
  const safeContent = content || "";

  // Tách nội dung theo dòng mới (\n)
  const lines = (!inline && safeContent.includes('\n')) 
    ? safeContent.split('\n').filter(line => line.trim() !== '') 
    : [safeContent];

  // State quản lý số dòng đang hiển thị
  const [visibleLines, setVisibleLines] = useState(lines.length > 1 && !inline ? 1 : lines.length);

  // Reset khi nội dung thay đổi
  useEffect(() => {
    setVisibleLines(lines.length > 1 && !inline ? 1 : lines.length);
  }, [content, inline]);

  const handleReveal = (e: React.MouseEvent) => {
    if (inline || lines.length <= 1) return;
    e.stopPropagation(); 
    if (visibleLines < lines.length) {
      setVisibleLines(prev => prev + 1);
    }
  };

  const getColorClass = (text: string) => {
    if (customColor) return ''; // If custom color is set, don't use class-based colors
    if (highlightClass) return highlightClass;
    
    // Chọn bảng màu dựa trên props
    let colorPalette = MATH_COLORS;
    if (palette === 'contrast') colorPalette = CONTRAST_COLORS;
    // Blue contrast handles via CSS mostly, but fallback here
    if (palette === 'blue-contrast') return 'text-[#1e40af]'; 

    const index = text.length % colorPalette.length;
    return colorPalette[index];
  };

  useEffect(() => {
    const renderMath = async () => {
      if (typeof window !== 'undefined' && window.MathJax && containerRef.current) {
        try {
          if (window.MathJax.typesetClear) {
            window.MathJax.typesetClear([containerRef.current]);
          }
          if (window.MathJax.typesetPromise) {
            await window.MathJax.typesetPromise([containerRef.current]);
          }
        } catch (err) {
          console.warn('MathJax rendering failed:', err);
        }
      }
    };
    const timer = setTimeout(() => {
        renderMath();
    }, 10); // Slight delay to ensure DOM is ready
    return () => clearTimeout(timer);
  }, [safeContent, visibleLines, palette, customColor]); 

  const processContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-black text-indigo-700 dark:text-indigo-300">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const colorClass = getColorClass(part);
        return (
          <span key={index} className={`font-bold ${colorClass} mx-1 transition-colors duration-300`}>
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const contentKey = `math-${safeContent.length}-${palette}-${customColor}`; 
  // Generate a unique ID for styling this specific instance if using custom color
  // However, simpler to use a shared class strategy controlled by the parent or global style injection.
  // Here we use a scoped style approach.
  
  const containerClass = `math-renderer whitespace-pre-wrap tex2jax_process ${className} ${palette === 'blue-contrast' && !customColor ? 'math-blue-contrast' : ''} ${customColor ? 'math-custom-color' : ''}`;

  return (
    <>
      {palette === 'blue-contrast' && !customColor && (
        <style>{`
          .math-blue-contrast mjx-container,
          .math-blue-contrast mjx-container svg path,
          .math-blue-contrast .mjx-char {
            color: #1e40af !important;
            fill: #1e40af !important;
            stroke: #1e40af !important;
          }
        `}</style>
      )}

      {customColor && (
        <style>{`
          .math-custom-color mjx-container,
          .math-custom-color mjx-container svg path,
          .math-custom-color .mjx-char {
            color: ${customColor} !important;
            fill: ${customColor} !important;
            stroke: ${customColor} !important;
          }
        `}</style>
      )}
      
      {inline ? (
        <span 
          key={contentKey}
          ref={containerRef as React.RefObject<HTMLSpanElement>} 
          className={`${containerClass} inline-block align-middle`}
        >
          {processContent(safeContent.replace(/\\n/g, ' '))}
        </span>
      ) : (
        <div 
          key={contentKey}
          ref={containerRef as React.RefObject<HTMLDivElement>} 
          className={`${containerClass} block my-2 transition-all w-full ${lines.length > 1 ? 'cursor-pointer min-h-full' : ''}`}
          onClick={handleReveal}
          title={visibleLines < lines.length ? "Click để hiện dòng tiếp theo" : ""}
        >
          {lines.map((line, index) => {
             if (index >= visibleLines) return null;
             return (
                <div key={index} className={`mb-3 last:mb-0 animate-fade-in ${index === visibleLines - 1 && index > 0 ? 'bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg px-2 -mx-2 py-1' : ''}`}>
                    {processContent(line)}
                </div>
             );
          })}
        </div>
      )}
    </>
  );
};

export default MathRenderer;
