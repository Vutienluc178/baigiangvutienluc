
import React, { useState, useEffect, useRef } from 'react';
import { ExamConfig, StudyGuideData, TheorySection } from '../types';
import MathRenderer from './MathRenderer';
import AnimatedBookTitle from './AnimatedBookTitle';
import { EDU_WEBSITES } from '../constants';
import { ChevronLeft, ChevronRight, RotateCcw, FileText, Maximize, Minimize, LayoutGrid, ZoomIn, ZoomOut, Palette, Star, MonitorPlay, BookOpen, School, Save, Globe, GripVertical, ChevronDown, ChevronUp, X, PenTool, Database, Wand2, Home, Image as ImageIcon, Upload, Type, Trash2, Sun, Moon, HelpCircle, Baseline, GalleryHorizontalEnd } from 'lucide-react';

interface StudyGuidePreviewProps {
  role: 'teacher' | 'student';
  config: ExamConfig;
  data: StudyGuideData;
  onReset: () => void;
  onRegenerate: () => void;
  onEdit?: () => void;
  onUpdateData?: (newData: StudyGuideData) => void;
  onSaveToBank?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onShowGuide?: () => void;
}

const SLIDE_THEMES = {
  teal: { 
    name: 'Xanh Ngọc', 
    bg: 'bg-teal-50 dark:bg-zinc-950', 
    primary: 'text-teal-700 dark:text-teal-400', 
    border: 'border-teal-500', 
    highlight: 'text-teal-600 dark:text-teal-300'
  },
  blue: { 
    name: 'Xanh Dương', 
    bg: 'bg-blue-50 dark:bg-zinc-950', 
    primary: 'text-blue-700 dark:text-blue-400', 
    border: 'border-blue-500', 
    highlight: 'text-blue-600 dark:text-blue-300'
  },
  violet: { 
    name: 'Tím', 
    bg: 'bg-violet-50 dark:bg-zinc-950', 
    primary: 'text-violet-700 dark:text-violet-400', 
    border: 'border-violet-500', 
    highlight: 'text-violet-600 dark:text-violet-300'
  }
};

type ThemeKey = keyof typeof SLIDE_THEMES;

// Presentation Fonts
const PRESENTATION_FONTS = [
  { name: 'Roboto', label: 'Cơ bản (Roboto)', class: 'font-sans' },
  { name: 'Montserrat', label: 'Hiện đại (Montserrat)', class: 'font-montserrat' },
  { name: 'Merriweather', label: 'Trang trọng (Merriweather)', class: 'font-merriweather' },
];

// Common Math Colors
const MATH_COLOR_PRESETS = [
  { color: '#1e40af', label: 'Xanh Đậm' }, 
  { color: '#ffffff', label: 'Trắng' },
  { color: '#facc15', label: 'Vàng' }, 
  { color: '#b91c1c', label: 'Đỏ' },   
  { color: '#000000', label: 'Đen' },
];

interface SavedBg {
  id: string;
  name: string;
  data: string;
  date: number;
}

const ShortcutLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded shadow-sm pointer-events-none">{children}</span>
);

const StudyGuidePreview: React.FC<StudyGuidePreviewProps> = ({ role, config, data, onReset, onRegenerate, onEdit, onUpdateData, onSaveToBank, isDarkMode, onToggleTheme, onShowGuide }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(3.0);
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('violet');
  const [showWebView, setShowWebView] = useState(false);
  const [webUrl, setWebUrl] = useState('https://bang2026.vercel.app/');
  const [showEduMenu, setShowEduMenu] = useState(false);
  const [isWebCollapsed, setIsWebCollapsed] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  
  // Custom Styles State
  const [customMathColor, setCustomMathColor] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
  // BG Library State
  const [savedBackgrounds, setSavedBackgrounds] = useState<SavedBg[]>([]);
  const [newBgName, setNewBgName] = useState('');

  const [currentFont, setCurrentFont] = useState(PRESENTATION_FONTS[0]);
  
  // Toolbar Active State
  const [activeMenu, setActiveMenu] = useState<'color' | 'bg' | 'font' | null>(null);

  // Header Visibility State
  const [showHeader, setShowHeader] = useState(true);
  const headerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localTopic, setLocalTopic] = useState(config.topic || "");
  const [isEditingTopic, setIsEditingTopic] = useState(false);

  const bgInputRef = useRef<HTMLInputElement>(null);

  // Web View Resizing State
  const [webSplitRatio, setWebSplitRatio] = useState(50);
  const isDraggingWebRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  
  const warmupSlide = data?.warmup;
  const sections = data?.sections || [];
  
  const hasWarmup = !!warmupSlide;
  const hasTitleSlide = true; // Always show title slide
  const hasCoreKnowledgeSlide = true; // Always show transition slide
  const totalSlides = (hasWarmup ? 1 : 0) + (hasTitleSlide ? 1 : 0) + (hasCoreKnowledgeSlide ? 1 : 0) + sections.length;

  const isTitleSlide = currentSection === 0;
  const isWarmupSlide = hasWarmup && currentSection === 1;
  const isCoreKnowledgeSlide = hasWarmup ? (currentSection === 2) : (currentSection === 1);
  
  const sectionIndex = hasWarmup ? currentSection - 3 : currentSection - 2;
  const currentSectionData = (isWarmupSlide || isTitleSlide || isCoreKnowledgeSlide) ? null : sections[sectionIndex];

  // Load BG Library
  useEffect(() => {
    try {
        const saved = localStorage.getItem('ai_studio_bg_library');
        if (saved) setSavedBackgrounds(JSON.parse(saved));
    } catch (e) {
        console.error("Failed to load bg library", e);
    }
  }, []);

  const saveBgToLibrary = () => {
    if (!backgroundImage || !newBgName.trim()) return;
    try {
        const newItem: SavedBg = {
            id: Date.now().toString(),
            name: newBgName.trim(),
            data: backgroundImage,
            date: Date.now()
        };
        const updated = [newItem, ...savedBackgrounds];
        setSavedBackgrounds(updated);
        localStorage.setItem('ai_studio_bg_library', JSON.stringify(updated));
        setNewBgName('');
    } catch (e) {
        alert("Bộ nhớ đầy, không thể lưu thêm ảnh nền. Hãy xóa bớt ảnh cũ.");
    }
  };

  const deleteBgFromLibrary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedBackgrounds.filter(b => b.id !== id);
    setSavedBackgrounds(updated);
    localStorage.setItem('ai_studio_bg_library', JSON.stringify(updated));
  };

  // Auto-hide header effect
  useEffect(() => {
    if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
    headerTimeoutRef.current = setTimeout(() => {
        setShowHeader(false);
    }, 2000);
    return () => {
        if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
    };
  }, []);

  const handleHeaderMouseEnter = () => {
    if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
    setShowHeader(true);
  };

  const handleHeaderMouseLeave = () => {
    if (headerTimeoutRef.current) clearTimeout(headerTimeoutRef.current);
    headerTimeoutRef.current = setTimeout(() => {
        setShowHeader(false);
    }, 2000);
  };

  // Set default math color based on BG
  useEffect(() => {
    if (backgroundImage && !customMathColor) {
        if (backgroundImage.includes('paper')) {
             setCustomMathColor('#1e40af'); 
        } else {
             setCustomMathColor('#ffffff'); 
        }
    } else if (!backgroundImage && customMathColor === '#ffffff') {
        setCustomMathColor(null); 
    }
  }, [backgroundImage]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBackgroundImage(result);
        // setActiveMenu(null);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const clearBgImage = () => {
    setBackgroundImage(null);
    setActiveMenu(null);
  };

  // Handle Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingWebRef.current) return;
      const newRatio = (e.clientX / window.innerWidth) * 100;
      setWebSplitRatio(Math.min(80, Math.max(20, newRatio)));
    };

    const handleMouseUp = () => {
      if (isDraggingWebRef.current) {
        isDraggingWebRef.current = false;
        document.body.style.cursor = 'default';
        const iframe = document.getElementById('web-view-iframe');
        if (iframe) iframe.style.pointerEvents = 'auto';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResize = () => {
    isDraggingWebRef.current = true;
    document.body.style.cursor = 'col-resize';
    const iframe = document.getElementById('web-view-iframe');
    if (iframe) iframe.style.pointerEvents = 'none';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      
      if (key === 'w') {
        setShowWebView(prev => !prev);
        setIsWebCollapsed(false);
      }
      if (key === 'q') setShowEduMenu(prev => !prev);
      if (key === 'f') toggleFullScreen();
      if (key === 'h' && e.altKey) setShowToolbar(prev => !prev);
      if (key === '=' || key === '+') setZoomLevel(prev => Math.min(prev + 0.2, 8.0));
      if (key === '-' || key === '_') setZoomLevel(prev => Math.max(prev - 0.2, 0.5));
      
      // Open Math Color Menu (Alt + M)
      if (key === 'm' && e.altKey) {
          setActiveMenu('color');
      }

      if (sections.length > 0 || hasWarmup) {
        if (e.key === 'ArrowRight') setCurrentSection(s => Math.min(totalSlides - 1, s + 1));
        if (e.key === 'ArrowLeft') setCurrentSection(s => Math.max(0, s - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSection, totalSlides, hasWarmup]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true));
    else if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false));
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ type: 'theory', config: { ...config, topic: localTopic }, data, timestamp: Date.now() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `StudyGuide_${localTopic}.json`; a.click();
  };

  const theme = SLIDE_THEMES[activeTheme];

  const renderMetaList = (label: string, items?: string[], toneClass?: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="flex flex-wrap items-start gap-2">
        <span className={`text-[0.6em] font-black uppercase tracking-widest ${toneClass || (backgroundImage ? 'text-black' : 'text-slate-500')}`}>{label}:</span>
        <div className="flex flex-wrap gap-2">
          {items.map((item, idx) => (
            <span key={`${label}-${idx}`} className={`text-[0.7em] font-bold px-3 py-1 rounded-full border ${backgroundImage ? 'bg-white/80 text-black border-slate-300' : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700'}`}>
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  };

  if ((!sections || sections.length === 0) && !hasWarmup) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <p className="text-red-500 font-bold mb-4">Không tìm thấy nội dung bài giảng.</p>
                <button onClick={onReset} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Quay lại</button>
            </div>
        </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    fontFamily: currentFont.name === 'Roboto' ? 'Roboto, sans-serif' : currentFont.name === 'Montserrat' ? 'Montserrat, sans-serif' : 'Merriweather, serif',
    ...(backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', backgroundRepeat: 'no-repeat' } : {})
  };
  
  let textColorClass = 'text-slate-900 dark:text-zinc-100';
  if (backgroundImage) {
      textColorClass = 'text-white drop-shadow-md';
      if (backgroundImage.includes('paper')) {
          textColorClass = 'text-black font-bold';
      }
  }

  return (
    <div ref={containerRef} className={`min-h-screen flex flex-col ${!backgroundImage ? 'bg-slate-50 dark:bg-black' : ''} ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`} style={containerStyle}>
      {/* Invisible Hover Trigger Zone */}
      <div 
          className="fixed top-0 left-0 right-0 h-4 z-[60]" 
          onMouseEnter={handleHeaderMouseEnter} 
      />

      {/* Header */}
      <header 
        className={`bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 fixed top-0 left-0 right-0 z-[55] px-2 h-10 flex justify-between items-center no-print transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}
        onMouseEnter={handleHeaderMouseEnter}
        onMouseLeave={handleHeaderMouseLeave}
      >
        <div className="flex items-center gap-2">
            <button onClick={onReset} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg"><Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400"/></button>
            <AnimatedBookTitle 
                title={localTopic} 
                isEditing={isEditingTopic} 
                onEdit={() => setIsEditingTopic(true)} 
                onChange={(e) => setLocalTopic(e.target.value)} 
                onSave={() => setIsEditingTopic(false)} 
            />
        </div>
        <div className="flex items-center gap-1.5">
            {onEdit && (
                <button onClick={onEdit} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg mr-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Chỉnh sửa">
                <PenTool className="w-4 h-4" />
                </button>
            )}
            {onSaveToBank && (
              <button onClick={onSaveToBank} className="p-1.5 bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg mr-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" title="Lưu vào Ngân hàng">
                <Database className="w-4 h-4" />
              </button>
            )}
            <button onClick={handleExport} className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-lg relative"><Save className="w-4 h-4"/><ShortcutLabel>S</ShortcutLabel></button>
            <button onClick={toggleFullScreen} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 relative text-slate-600 dark:text-slate-300">
                {isFullscreen ? <Minimize className="w-4 h-4"/> : <Maximize className="w-4 h-4"/>}
            </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-grow relative overflow-hidden">
          {/* Slide Content */}
          <main 
            className={`flex flex-col relative transition-all duration-0`}
            style={{ 
                width: showWebView ? `${webSplitRatio}%` : '100%',
                maxWidth: showWebView ? 'none' : '',
            }}
          >
             <div className={`h-full w-full flex flex-col items-center justify-between p-6 md:p-8 transition-all duration-300 ease-out rounded-[2.5rem] shadow-2xl border-4 overflow-hidden ${backgroundImage ? 'bg-white/80 backdrop-blur-sm border-white/50' : `${theme.bg} ${theme.border}`}`} style={{ fontSize: `${zoomLevel * 100}%` }}>
                
                 {/* Slide Content */}
                 <div className="w-full flex-grow overflow-y-auto custom-scrollbar flex flex-col gap-8 animate-fade-in-up">
                    {isTitleSlide ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-8">
                             <div className="px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[0.4em] font-black text-indigo-600 uppercase tracking-[0.3em] animate-bounce">
                                Chào mừng bạn đến với bài học
                            </div>
                            <h1 className={`text-[4em] font-black uppercase tracking-tighter leading-none max-w-4xl ${backgroundImage ? 'text-black' : theme.primary}`}>
                                <MathRenderer content={localTopic} customColor={customMathColor} />
                            </h1>
                            <div className="w-24 h-2 bg-indigo-600 rounded-full"></div>
                            <p className={`text-[0.8em] font-bold uppercase tracking-widest ${backgroundImage ? 'text-slate-600' : 'text-slate-500'}`}>
                                Slide {currentSection + 1}/{totalSlides}
                            </p>
                            {hasWarmup && (
                                <button 
                                    onClick={() => setCurrentSection(1)}
                                    className="mt-4 flex items-center gap-2 text-[0.6em] font-black text-indigo-600 dark:text-indigo-400 hover:translate-x-2 transition-transform uppercase tracking-widest group"
                                >
                                    Bắt đầu hoạt động khởi động <ChevronRight className="w-[1.2em] h-[1.2em] group-hover:scale-125 transition-transform" />
                                </button>
                            )}
                        </div>
                    ) : isWarmupSlide ? (
                        <div className="h-full flex flex-col md:flex-row gap-8 items-center">
                            {/* Left Side: Question & Link */}
                            <div className="flex-1 flex flex-col justify-center gap-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[0.4em] font-black text-indigo-600 uppercase tracking-widest">
                                        Khởi động
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[0.4em] font-black text-slate-500 uppercase tracking-widest">
                                        Slide {currentSection + 1}/{totalSlides}
                                    </span>
                                </div>
                                <h2 className={`text-[2.5em] font-black uppercase tracking-tighter leading-tight ${backgroundImage ? 'text-black' : theme.primary}`}>
                                    <MathRenderer content={warmupSlide?.question || "Câu hỏi khởi động..."} customColor={customMathColor} />
                                </h2>
                                <button 
                                    onClick={() => setCurrentSection(2)}
                                    className="flex items-center gap-2 text-[0.8em] font-black text-indigo-600 dark:text-indigo-400 hover:translate-x-2 transition-transform uppercase tracking-widest group"
                                >
                                    Vào nội dung bài học <ChevronRight className="w-[1.2em] h-[1.2em] group-hover:scale-125 transition-transform" />
                                </button>
                            </div>

                            {/* Right Side: Image */}
                            <div className="flex-1 w-full h-full min-h-[300px] relative group">
                                <div className="absolute inset-0 rounded-[2rem] overflow-hidden border-4 border-white/50 shadow-2xl">
                                    {warmupSlide?.imageUrl ? (
                                        <img 
                                            src={warmupSlide.imageUrl} 
                                            alt="Warmup" 
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 gap-4">
                                            <ImageIcon className="w-16 h-16" />
                                            <p className="text-xs font-bold uppercase tracking-widest">Chưa có ảnh minh họa</p>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Image URL Editor (Teacher only) */}
                                {role === 'teacher' && onUpdateData && (
                                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl shadow-xl flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Dán link ảnh vào đây..."
                                                className="flex-1 bg-transparent border-none outline-none text-[0.5em] font-bold text-slate-700 dark:text-slate-200"
                                                defaultValue={warmupSlide?.imageUrl}
                                                onBlur={(e) => {
                                                    const newUrl = e.target.value;
                                                    if (newUrl !== warmupSlide?.imageUrl) {
                                                        const newData = {
                                                            ...data,
                                                            warmup: {
                                                                ...warmupSlide!,
                                                                imageUrl: newUrl
                                                            }
                                                        };
                                                        onUpdateData(newData);
                                                    }
                                                }}
                                            />
                                            <div className="p-1 bg-indigo-600 text-white rounded-lg">
                                                <Globe className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : isTitleSlide ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-8">
                             <div className="px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[0.4em] font-black text-indigo-600 uppercase tracking-[0.3em] animate-bounce">
                                Chủ đề bài học
                            </div>
                            <h1 className={`text-[4em] font-black uppercase tracking-tighter leading-none max-w-4xl ${backgroundImage ? 'text-black' : theme.primary}`}>
                                <MathRenderer content={localTopic} customColor={customMathColor} />
                            </h1>
                            <div className="w-24 h-2 bg-indigo-600 rounded-full"></div>
                            <p className={`text-[0.8em] font-bold uppercase tracking-widest ${backgroundImage ? 'text-slate-600' : 'text-slate-500'}`}>
                                Slide {currentSection + 1}/{totalSlides}
                            </p>
                        </div>
                    ) : isCoreKnowledgeSlide ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-8">
                             <div className="px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-[0.4em] font-black text-emerald-600 uppercase tracking-[0.3em] animate-pulse">
                                Phần 1
                            </div>
                            <h1 className={`text-[4.5em] font-black uppercase tracking-tighter leading-none max-w-4xl ${backgroundImage ? 'text-black' : theme.primary}`}>
                                Kiến thức trọng tâm
                            </h1>
                            <div className="w-32 h-2 bg-emerald-500 rounded-full"></div>
                            <p className={`text-[0.8em] font-bold uppercase tracking-widest ${backgroundImage ? 'text-slate-600' : 'text-slate-500'}`}>
                                Slide {currentSection + 1}/{totalSlides}
                            </p>
                        </div>
                    ) : currentSectionData ? (
                        <>
                            <div className="shrink-0 text-center border-b-2 border-slate-200 dark:border-slate-800 pb-6">
                                <div className="flex justify-center items-center gap-2 mb-2">
                                    <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[0.4em] font-black text-slate-500 uppercase tracking-widest">
                                        Slide {currentSection + 1}/{totalSlides}
                                    </span>
                                    {currentSectionData.differentiationLevel && (
                                        <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-[0.4em] font-black text-amber-600 uppercase tracking-widest">
                                            {currentSectionData.differentiationLevel}
                                        </span>
                                    )}
                                </div>
                                <h2 className={`text-[2em] font-black uppercase tracking-tighter leading-none mb-4 ${backgroundImage ? 'text-black' : theme.primary}`}>
                                    <MathRenderer content={currentSectionData.title} customColor={customMathColor} />
                                </h2>
                                {renderMetaList('Mục tiêu', currentSectionData.objectives)}
                            </div>

                            <div className="flex-grow w-full space-y-8">
                                <div className={`text-[1em] font-medium leading-relaxed whitespace-pre-wrap ${backgroundImage ? 'text-black' : 'dark:text-slate-200'}`}>
                                    <MathRenderer content={currentSectionData.content} customColor={customMathColor} />
                                </div>

                                {currentSectionData.examples && currentSectionData.examples.length > 0 && (
                                    <div className="grid gap-6">
                                        {currentSectionData.examples.map((ex, exi) => (
                                            <div key={exi} className={`p-6 rounded-3xl border border-slate-200 dark:border-slate-800 ${backgroundImage ? 'bg-white/90 shadow-md' : 'bg-white/50 dark:bg-white/5'}`}>
                                                <div className="flex items-center gap-2 mb-2 font-black text-[0.8em] text-amber-600 uppercase tracking-widest">
                                                    <Star className="w-[1em] h-[1em]" /> Ví dụ {exi + 1}
                                                </div>
                                                <div className={`mb-4 text-[0.9em] font-bold ${textColorClass}`}><MathRenderer content={ex.problem} customColor={customMathColor} /></div>
                                                <div className="pl-4 border-l-4 border-emerald-400">
                                                    <div className="text-[0.8em] italic text-emerald-700 dark:text-emerald-400 mb-1 font-bold">Lời giải:</div>
                                                    <div className={`text-[0.8em] ${textColorClass}`}><MathRenderer content={ex.solution} customColor={customMathColor} /></div>
                                                </div>
                                                {ex.explanation && (
                                                    <div className={`mt-4 text-[0.7em] italic p-3 rounded-xl ${backgroundImage ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>
                                                        💡 {ex.explanation}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(currentSectionData.guidingQuestions?.length || currentSectionData.activities?.length) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                        {currentSectionData.guidingQuestions && currentSectionData.guidingQuestions.length > 0 && (
                                            <div className={`p-4 rounded-2xl ${backgroundImage ? 'bg-blue-50/90' : 'bg-blue-50 dark:bg-blue-900/10'}`}>
                                                <h4 className="text-[0.6em] font-black text-blue-600 uppercase mb-2">Câu hỏi gợi mở</h4>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {currentSectionData.guidingQuestions.map((q, i) => (
                                                        <li key={i} className={`text-[0.7em] font-medium ${backgroundImage ? 'text-blue-900' : 'text-blue-900 dark:text-blue-100'}`}><MathRenderer content={q} inline customColor={customMathColor} /></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {currentSectionData.activities && currentSectionData.activities.length > 0 && (
                                            <div className={`p-4 rounded-2xl ${backgroundImage ? 'bg-violet-50/90' : 'bg-violet-50 dark:bg-violet-900/10'}`}>
                                                <h4 className="text-[0.6em] font-black text-violet-600 uppercase mb-2">Hoạt động</h4>
                                                <ul className="list-disc pl-4 space-y-1">
                                                    {currentSectionData.activities.map((a, i) => (
                                                        <li key={i} className={`text-[0.7em] font-medium ${backgroundImage ? 'text-violet-900' : 'text-violet-900 dark:text-violet-100'}`}><MathRenderer content={a} inline customColor={customMathColor} /></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Progress Bar */}
                <div className="w-full mt-4 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0">
                    <div 
                        className={`h-full transition-all duration-300 ${activeTheme === 'teal' ? 'bg-teal-500' : activeTheme === 'blue' ? 'bg-blue-500' : 'bg-violet-500'}`}
                        style={{ width: `${((currentSection + 1) / totalSlides) * 100}%` }}
                    ></div>
                </div>
             </div>
          </main>

          {/* Resizer Handle */}
          {showWebView && (
             <div 
                className="w-2 bg-slate-200 dark:bg-zinc-800 hover:bg-indigo-500 dark:hover:bg-indigo-500 cursor-col-resize flex items-center justify-center z-[110] transition-colors"
                onMouseDown={startResize}
             >
                <GripVertical className="w-4 h-4 text-slate-400" />
             </div>
          )}

          {/* Right Panel: Web View */}
          {showWebView && (
            <div 
                className="h-full bg-white dark:bg-black relative shadow-2xl z-[100]"
                style={{ width: `${100 - webSplitRatio}%` }}
            >
                <button onClick={() => setShowWebView(false)} className="absolute top-2 right-2 z-[160] p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-110"><X className="w-4 h-4"/></button>
                <iframe 
                    id="web-view-iframe"
                    src={webUrl} 
                    className="w-full h-full border-0" 
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write; display-capture"
                    allowFullScreen
                />
            </div>
          )}
      </div>

      {/* Floating Toolbar Area */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center gap-2 no-print">
        {showToolbar ? (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-full p-1.5 flex gap-2 border border-white/10 shadow-xl items-center animate-fade-in-up">
                <button 
                    onClick={() => setShowEduMenu(!showEduMenu)} 
                    className={`p-2 transition-colors relative ${showEduMenu ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`}
                    title="Web Dạy Học (Q)"
                >
                    <GalleryHorizontalEnd className="w-5 h-5"/>
                    <ShortcutLabel>Q</ShortcutLabel>
                </button>
                <button 
                    onClick={() => {
                        setShowWebView(!showWebView);
                        setIsWebCollapsed(false);
                    }} 
                    className={`p-2 transition-colors relative ${showWebView ? 'text-teal-400' : 'text-slate-400 hover:text-teal-400'}`}
                    title="Bảng Web (W)"
                >
                    <Globe className="w-5 h-5"/>
                    <ShortcutLabel>W</ShortcutLabel>
                </button>
                <div className="w-px h-6 bg-white/20"></div>
                <div className="flex items-center gap-1 bg-black/20 rounded-full px-2 py-0.5">
                    <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))} className="p-1 text-slate-400 hover:text-white relative"><ZoomOut className="w-4 h-4"/><ShortcutLabel>-</ShortcutLabel></button>
                    <span className="text-xs font-bold text-white min-w-[30px] text-center">{zoomLevel.toFixed(1)}x</span>
                    <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 8.0))} className="p-1 text-slate-400 hover:text-white relative"><ZoomIn className="w-4 h-4"/><ShortcutLabel>+</ShortcutLabel></button>
                </div>
                <div className="w-px h-6 bg-white/20"></div>
                
                {/* Theme Toggles (Only visible if no bg image) */}
                {!backgroundImage && (
                    <div className="flex gap-1">
                        {(Object.keys(SLIDE_THEMES) as ThemeKey[]).map(t => (
                            <button 
                                key={t}
                                onClick={() => setActiveTheme(t)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${activeTheme === t ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                style={{ backgroundColor: t === 'teal' ? '#14b8a6' : t === 'blue' ? '#3b82f6' : '#8b5cf6' }}
                            />
                        ))}
                    </div>
                )}

                {/* Font Selection */}
                <div className="relative">
                    <button 
                        onClick={() => setActiveMenu(activeMenu === 'font' ? null : 'font')}
                        className={`p-2 rounded-full transition-colors ${activeMenu === 'font' ? 'text-white bg-white/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                        title="Kiểu chữ"
                    >
                        <Type className="w-5 h-5" />
                    </button>
                    
                    {activeMenu === 'font' && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex bg-slate-800 p-2 rounded-xl shadow-2xl border border-slate-700 flex-col gap-1 min-w-[160px] animate-fade-in-up">
                            {PRESENTATION_FONTS.map((font) => (
                                <button 
                                    key={font.name} 
                                    onClick={() => { setCurrentFont(font); setActiveMenu(null); }}
                                    className={`px-3 py-2 text-left rounded-lg text-xs font-bold transition-colors ${currentFont.name === font.name ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    <span className={font.class}>{font.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Math Color Palette with Picker - CLICK TO OPEN */}
                <div className="relative">
                    <button 
                        onClick={() => setActiveMenu(activeMenu === 'color' ? null : 'color')}
                        className={`p-2 rounded-full transition-colors ${activeMenu === 'color' ? 'text-white bg-white/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                        title="Màu công thức (Alt+M)"
                    >
                        <Palette className="w-5 h-5" />
                        <ShortcutLabel>Alt+M</ShortcutLabel>
                    </button>
                    
                    {activeMenu === 'color' && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex bg-slate-800 p-2 rounded-xl shadow-2xl border border-slate-700 flex-col gap-2 animate-fade-in-up">
                            <div className="flex gap-1">
                                {MATH_COLOR_PRESETS.map((c, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => setCustomMathColor(c.color)}
                                        className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform"
                                        style={{ backgroundColor: c.color }}
                                        title={c.label}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                                <input 
                                    type="color" 
                                    value={customMathColor || '#000000'}
                                    onChange={(e) => setCustomMathColor(e.target.value)}
                                    className="w-6 h-6 rounded-full overflow-hidden cursor-pointer border-none p-0"
                                    title="Màu tùy chọn"
                                />
                                <span className="text-[10px] text-slate-400 font-bold uppercase">Tùy chọn</span>
                                {customMathColor && <button onClick={() => setCustomMathColor(null)} className="ml-auto text-[10px] text-red-400 hover:underline">Xóa</button>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Background Image Toggle with Library */}
                <div className="relative">
                    <button 
                        onClick={() => setActiveMenu(activeMenu === 'bg' ? null : 'bg')}
                        className={`p-2 rounded-full transition-colors ${backgroundImage ? 'text-emerald-400 bg-white/10' : activeMenu === 'bg' ? 'text-white bg-white/20' : 'text-slate-400 hover:text-white'}`} 
                        title="Ảnh nền"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                    
                    {activeMenu === 'bg' && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex bg-slate-800 p-3 rounded-xl shadow-2xl border border-slate-700 flex-col gap-3 w-64 animate-fade-in-up">
                            <div className="flex flex-col gap-2">
                                <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                                <button onClick={() => bgInputRef.current?.click()} className="text-left px-3 py-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2 w-full justify-center border border-dashed border-indigo-500/50">
                                    <Upload className="w-3 h-3"/> Tải ảnh lên
                                </button>
                            </div>

                            {/* Save Current BG */}
                            {backgroundImage && (
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newBgName} 
                                        onChange={(e) => setNewBgName(e.target.value)} 
                                        placeholder="Tên ảnh..."
                                        className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500 w-full"
                                    />
                                    <button onClick={saveBgToLibrary} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                        <Save className="w-3 h-3"/>
                                    </button>
                                </div>
                            )}
                            
                            <div className="h-px bg-slate-700 w-full"></div>
                            
                            {/* Library List */}
                            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                                {savedBackgrounds.length === 0 ? (
                                    <div className="text-center text-slate-500 text-[10px] italic py-2">Thư viện trống</div>
                                ) : (
                                    savedBackgrounds.map((bg, idx) => (
                                        <div key={idx} onClick={() => setBackgroundImage(bg.data)} className={`flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg cursor-pointer group ${backgroundImage === bg.data ? 'bg-slate-700 ring-1 ring-emerald-500' : ''}`}>
                                            <div className="w-8 h-8 rounded bg-cover bg-center shrink-0 border border-slate-600" style={{ backgroundImage: `url(${bg.data})` }}></div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-slate-300 truncate">{bg.name}</div>
                                            </div>
                                            <button onClick={(e) => deleteBgFromLibrary(bg.id, e)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 p-1"><Trash2 className="w-3 h-3"/></button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {backgroundImage && (
                                <button onClick={clearBgImage} className="text-left px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors mt-1 w-full text-center border border-red-900/30">
                                    Gỡ bỏ nền
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Theme & Guide (Moved from Header) */}
                <div className="w-px h-6 bg-white/20"></div>
                {onSaveToBank && (
                  <button onClick={onSaveToBank} className="p-2 text-slate-400 hover:text-emerald-400 rounded-full hover:bg-white/10 transition-colors" title="Lưu vào Ngân hàng">
                    <Database className="w-5 h-5"/>
                  </button>
                )}
                <button onClick={onToggleTheme} className="p-2 text-slate-400 hover:text-yellow-400 rounded-full hover:bg-white/10 transition-colors" title="Chế độ Sáng/Tối">
                    {isDarkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
                </button>
                <button onClick={onShowGuide} className="p-2 text-slate-400 hover:text-indigo-400 rounded-full hover:bg-white/10 transition-colors" title="Hướng dẫn">
                    <HelpCircle className="w-5 h-5"/>
                </button>

                <div className="w-px h-6 bg-white/20"></div>
                <button onClick={() => setShowToolbar(false)} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors" title="Ẩn menu">
                    <ChevronDown className="w-5 h-5"/>
                </button>
            </div>
        ) : (
            <button onClick={() => setShowToolbar(true)} className="bg-slate-900/50 hover:bg-slate-900/90 backdrop-blur-md text-white p-2 rounded-full border border-white/10 shadow-lg transition-all hover:scale-110" title="Hiện menu">
                <ChevronUp className="w-6 h-6"/>
            </button>
        )}
      </div>

      {/* Edu Menu Popover */}
      {showEduMenu && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[200] w-[90vw] max-w-4xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center bg-slate-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl">
                        <Globe className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Web Dạy Học & Tài Nguyên Toán Học</h3>
                        <p className="text-xs text-slate-500 dark:text-zinc-400">Chọn một trang web để hiển thị trong bảng phụ</p>
                    </div>
                </div>
                <button onClick={() => setShowEduMenu(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                </button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                {EDU_WEBSITES.map((site) => (
                    <button
                        key={site.id}
                        onClick={() => {
                            setWebUrl(site.url);
                            setShowWebView(true);
                            setIsWebCollapsed(false);
                            setShowEduMenu(false);
                        }}
                        className="group p-4 text-left rounded-2xl border border-slate-100 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all duration-300 flex flex-col gap-2"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-2xl">{site.icon}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <MonitorPlay className="w-4 h-4 text-indigo-600" />
                            </div>
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-tight">
                            {site.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {site.description}
                        </div>
                    </button>
                ))}
            </div>
            <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 text-center text-[10px] text-slate-400 italic border-t border-slate-100 dark:border-zinc-800">
                Mẹo: Nhấn phím <span className="font-bold text-indigo-600">Q</span> để mở nhanh menu này, phím <span className="font-bold text-teal-600">W</span> để ẩn/hiện bảng Web.
            </div>
        </div>
      )}
    </div>
  );
};

export default StudyGuidePreview;
