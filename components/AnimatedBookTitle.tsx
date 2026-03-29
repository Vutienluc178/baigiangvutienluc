import React from 'react';
import { PenTool } from 'lucide-react';

interface AnimatedBookTitleProps {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

const AnimatedBookTitle: React.FC<AnimatedBookTitleProps> = ({ title, isEditing, onEdit, onChange, onSave }) => {
  return (
    <div className="relative flex items-center justify-center [perspective:800px] group ml-2" onClick={!isEditing ? onEdit : undefined}>
      {/* Book Container */}
      <div className="relative flex items-center justify-center w-64 h-9 [transform-style:preserve-3d] transition-transform duration-700 group-hover:[transform:rotateX(12deg)]">
        {/* Left Page */}
        <div className="absolute right-1/2 w-32 h-full bg-gradient-to-r from-slate-200 to-white dark:from-slate-700 dark:to-slate-600 rounded-l-md border border-slate-300 dark:border-slate-500 shadow-[-4px_4px_10px_rgba(0,0,0,0.1)] origin-right [transform:rotateY(-15deg)] group-hover:[transform:rotateY(-25deg)] transition-transform duration-500 flex flex-col justify-center px-3 gap-1.5 overflow-hidden">
           <div className="w-full h-[2px] bg-slate-300 dark:bg-slate-500 rounded-full opacity-50"></div>
           <div className="w-3/4 h-[2px] bg-slate-300 dark:bg-slate-500 rounded-full opacity-50"></div>
           <div className="w-full h-[2px] bg-slate-300 dark:bg-slate-500 rounded-full opacity-50"></div>
        </div>
        
        {/* Spine */}
        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-gradient-to-b from-slate-400 to-slate-500 dark:from-slate-800 dark:to-slate-900 z-10 rounded-sm shadow-inner"></div>
        
        {/* Right Page */}
        <div className="absolute left-1/2 w-32 h-full bg-gradient-to-l from-slate-200 to-white dark:from-slate-700 dark:to-slate-600 rounded-r-md border border-slate-300 dark:border-slate-500 shadow-[4px_4px_10px_rgba(0,0,0,0.1)] origin-left [transform:rotateY(15deg)] group-hover:[transform:rotateY(25deg)] transition-transform duration-500 flex flex-col justify-center px-3 gap-1.5 overflow-hidden">
           <div className="w-full h-[2px] bg-slate-300 dark:bg-slate-500 rounded-full opacity-50"></div>
           <div className="w-5/6 h-[2px] bg-slate-300 dark:bg-slate-500 rounded-full opacity-50"></div>
           <div className="w-full h-[2px] bg-slate-300 dark:bg-slate-500 rounded-full opacity-50"></div>
        </div>

        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-20 [transform:translateZ(10px)]">
          {isEditing ? (
            <input 
              autoFocus
              value={title}
              onChange={onChange}
              onBlur={onSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
                e.stopPropagation();
              }}
              className="w-56 text-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-b-2 border-indigo-500 outline-none text-xs font-black uppercase text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded shadow-lg"
            />
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-white/60 dark:bg-black/60 backdrop-blur-sm rounded-md shadow-sm border border-white/40 dark:border-white/10 cursor-text hover:bg-white/80 dark:hover:bg-black/80 transition-colors">
               <span className="text-xs font-black uppercase text-slate-800 dark:text-zinc-100 truncate max-w-[180px] drop-shadow-md">
                 {title}
               </span>
               <PenTool className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnimatedBookTitle;
