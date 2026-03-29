
import React, { useState, useRef, useEffect } from 'react';
import { PolyaData } from '../types';
import MathRenderer from './MathRenderer';
import AnimatedBookTitle from './AnimatedBookTitle';
import { ChevronLeft, ChevronRight, RotateCcw, Maximize, Minimize, Home, Save, Search, Map, Wrench, CheckCircle, FileText, MonitorPlay, ZoomIn, ZoomOut, Globe, X, GripVertical, ChevronDown, ChevronUp, PenTool, Database, Image as ImageIcon, Wand2, Palette, Upload, Type, Trash2, Baseline, Sun, Moon, HelpCircle } from 'lucide-react';

interface PolyaPreviewProps {
  data: PolyaData;
  onReset: () => void;
  onEdit?: () => void;
  onSaveToBank?: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onShowGuide?: () => void;
}

// Presentation Fonts
const PRESENTATION_FONTS = [
  { name: 'Roboto', label: 'Cơ bản (Roboto)', class: 'font-sans' },
  { name: 'Montserrat', label: 'Hiện đại (Montserrat)', class: 'font-montserrat' },
  { name: 'Merriweather', label: 'Trang trọng (Merriweather)', class: 'font-merriweather' },
];

// Text Colors
const TEXT_COLOR_OPTIONS = [
  { id: 'auto', label: 'Tự động', class: '', color: '#94a3b8' },
  { id: 'black', label: 'Đen', class: '!text-black', color: '#000000' },
  { id: 'white', label: 'Trắng', class: '!text-white', color: '#ffffff' },
  { id: 'navy', label: 'Xanh Đậm', class: '!text-blue-900', color: '#1e3a8a' },
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

const PolyaPreview: React.FC<PolyaPreviewProps> = ({ data, onReset, onEdit, onSaveToBank, isDarkMode, onToggleTheme, onShowGuide }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState<'slide' | 'doc'>('slide');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(3.0);
  const [showWebView, setShowWebView] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  
  // Custom Styles State
  const [customMathColor, setCustomMathColor] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [textColorMode, setTextColorMode] = useState('auto');
  
  // BG Library State
  const [savedBackgrounds, setSavedBackgrounds] = useState<SavedBg[]>([]);
  const [newBgName, setNewBgName] = useState('');

  const [currentFont, setCurrentFont] = useState(PRESENTATION_FONTS[0]);
  const bgInputRef = useRef<HTMLInputElement>(null);
  
  // Toolbar Active State
  const [activeMenu, setActiveMenu] = useState<'color' | 'bg' | 'font' | 'text-color' | null>(null);

  // Header Visibility State
  const [showHeader, setShowHeader] = useState(true);
  const headerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [localTopic, setLocalTopic] = useState(data?.title || "");
  const [isEditingTopic, setIsEditingTopic] = useState(false);

  // Web View Resizing State
  const [webSplitRatio, setWebSplitRatio] = useState(50);
  const isDraggingWebRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const steps = data?.steps || [];

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

  // Handle Dragging for Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingWebRef.current) return;
      const newRatio = (e.clientX / window.innerWidth) * 100;
      const clampedRatio = Math.min(80, Math.max(20, newRatio));
      setWebSplitRatio(clampedRatio);
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
      
      if (key === 'w') setShowWebView(prev => !prev);
      if (key === 'f') toggleFullScreen();
      if (key === 's') handleExport();
      if (key === '=' || key === '+') handleZoomIn();
      if (key === '-' || key === '_') handleZoomOut();
      if (key === 'h' && e.altKey) setShowToolbar(prev => !prev); 

      // Open Math Color Menu (Alt + M)
      if (key === 'm' && e.altKey) {
          setActiveMenu('color');
      }
      // Open Text Color Menu (Alt + C)
      if (key === 'c' && e.altKey) {
          setActiveMenu('text-color');
      }

      if (viewMode === 'slide' && steps.length > 0) {
        if (e.key === 'ArrowRight') setCurrentStep(s => Math.min(steps.length - 1, s + 1));
        if (e.key === 'ArrowLeft') setCurrentStep(s => Math.max(0, s - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentStep, steps.length]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true));
    else if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false));
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 8.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.5));

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ type: 'polya', data: { ...data, title: localTopic }, timestamp: Date.now() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Polya_${localTopic}.json`; a.click();
  };

  const getStepIcon = (iconName: string) => {
    switch(iconName) {
      case 'search': return <Search className="w-10 h-10 text-blue-500" />;
      case 'map': return <Map className="w-10 h-10 text-amber-500" />;
      case 'wrench': return <Wrench className="w-10 h-10 text-emerald-500" />;
      case 'check': return <CheckCircle className="w-10 h-10 text-rose-500" />;
      default: return <Search className="w-10 h-10" />;
    }
  };

  const getStepColor = (index: number) => {
    const colors = ['text-blue-700 dark:text-blue-400', 'text-amber-700 dark:text-amber-400', 'text-emerald-700 dark:text-emerald-400', 'text-rose-700 dark:text-rose-400'];
    return colors[index % colors.length];
  };

  if (!steps || steps.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <p className="text-red-500 font-bold mb-4">Không tìm thấy dữ liệu các bước giải.</p>
                <button onClick={onReset} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Quay lại</button>
            </div>
        </div>
    );
  }

  // Styles logic
  const isDarkBg = true; // Modern presets are mostly dark
  const containerStyle: React.CSSProperties = {
    fontFamily: currentFont.name === 'Roboto' ? 'Roboto, sans-serif' : currentFont.name === 'Montserrat' ? 'Montserrat, sans-serif' : 'Merriweather, serif',
    ...(backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', backgroundRepeat: 'no-repeat' } : {})
  };
  
  let textColorClass = 'text-slate-700 dark:text-zinc-300';
  if (backgroundImage) {
      textColorClass = 'text-white drop-shadow-md';
      if (backgroundImage.includes('paper')) {
          textColorClass = 'text-black font-semibold';
      }
  }

  // Override with Custom Text Color if selected
  let finalTextColorClass = textColorClass;
  if (textColorMode !== 'auto') {
      const selected = TEXT_COLOR_OPTIONS.find(o => o.id === textColorMode);
      if (selected) finalTextColorClass = selected.class;
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
            <div className="flex bg-slate-100 dark:bg-zinc-900 p-0.5 rounded-lg">
                <button onClick={() => setViewMode('doc')} className={`p-1 rounded-md ${viewMode === 'doc' ? 'bg-white dark:bg-zinc-800 shadow text-indigo-600' : 'text-slate-400'}`}><FileText className="w-3.5 h-3.5"/></button>
                <button onClick={() => setViewMode('slide')} className={`p-1 rounded-md ${viewMode === 'slide' ? 'bg-white dark:bg-zinc-800 shadow text-indigo-600' : 'text-slate-400'}`}><MonitorPlay className="w-3.5 h-3.5"/></button>
            </div>
            <button onClick={toggleFullScreen} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 relative text-slate-600 dark:text-slate-300">
                {isFullscreen ? <Minimize className="w-4 h-4"/> : <Maximize className="w-4 h-4"/>}
            </button>
        </div>
      </header>

      {/* Main Content Area - Flex Container for Split Screen */}
      <div className="flex flex-grow relative overflow-hidden">
          
          {/* Left Panel: Presentation Content */}
          <main 
            className={`flex flex-col relative transition-all duration-0 overflow-hidden ${viewMode === 'slide' ? '' : 'p-4 md:p-8'} `}
            style={{ 
                width: showWebView ? `${webSplitRatio}%` : '100%',
                maxWidth: showWebView ? 'none' : '',
            }}
          >
             <div className={`transition-all duration-500 h-full flex flex-col ${!showWebView && viewMode !== 'slide' ? 'max-w-6xl mx-auto w-full' : 'w-full'}`}>
               
               {/* Document View */}
               {viewMode === 'doc' ? (
                 <div className={`p-12 rounded-[3rem] shadow-xl border border-slate-100 dark:border-zinc-800 overflow-y-auto h-full ${backgroundImage ? 'bg-white/80 backdrop-blur-sm' : 'bg-white dark:bg-zinc-950'}`} style={{ fontSize: `${zoomLevel * 100}%` }}>
                    <div className="mb-8 pb-6 border-b-2 border-slate-100 dark:border-zinc-800">
                       <h2 className="text-[1.5em] font-black text-indigo-700 dark:text-indigo-400 mb-2 uppercase">{data.title}</h2>
                       <div className={`p-6 rounded-2xl border-l-4 border-slate-400 text-[1em] font-medium italic ${backgroundImage ? 'bg-slate-50 text-black' : 'bg-slate-50 dark:bg-zinc-900 dark:text-zinc-300'}`}>
                          <MathRenderer content={data.problem} customColor={customMathColor} />
                       </div>
                    </div>
                    {steps.map((s, i) => (
                      <div key={i} className="mb-10 last:mb-0">
                         <h3 className={`text-[1.2em] font-black mb-4 uppercase border-b-4 inline-block pb-1 ${getStepColor(i)}`}>{s.stepName}</h3>
                         <div className={`text-[1em] font-medium leading-relaxed pl-4 border-l-2 border-slate-200 dark:border-slate-800 ${finalTextColorClass}`}>
                            <MathRenderer content={s.content} customColor={customMathColor} />
                         </div>
                         {s.keyPoints && s.keyPoints.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                               {s.keyPoints.map((k, ki) => (
                                 <span key={ki} className={`text-[0.7em] font-bold px-3 py-1 rounded-full ${backgroundImage ? 'bg-slate-200 text-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>{k}</span>
                               ))}
                            </div>
                         )}
                      </div>
                    ))}
                 </div>
               ) : (
                 /* Slide View */
                 <div className={`h-full w-full flex flex-col items-center justify-between p-6 md:p-8 transition-all duration-300 ease-out rounded-[2.5rem] shadow-2xl border-4 border-slate-100 dark:border-zinc-800 overflow-hidden ${backgroundImage ? 'bg-white/80 backdrop-blur-sm border-white/50' : 'bg-white dark:bg-zinc-950'}`} style={{ fontSize: `${zoomLevel * 100}%` }}>
                    
                    {/* Problem Statement */}
                    <div className={`w-full shrink-0 mb-4 p-5 rounded-3xl border border-slate-200 dark:border-zinc-800 max-h-[35vh] overflow-y-auto shadow-inner flex flex-col ${backgroundImage ? 'bg-white/90' : 'bg-slate-50 dark:bg-zinc-900'}`}>
                        <div className="text-[0.6em] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Đề bài
                        </div>
                        <div className={`text-[0.8em] font-bold leading-relaxed ${finalTextColorClass}`}>
                            <MathRenderer content={data.problem} customColor={customMathColor} />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-16 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full mb-4 shrink-0"></div>

                    {/* Main Step Content */}
                    <div className="flex-grow w-full flex flex-col overflow-hidden animate-fade-in-up">
                        <div className="flex items-center gap-4 mb-4 shrink-0 justify-center">
                             {getStepIcon(steps[currentStep].icon)}
                             <h2 className={`text-[1.5em] font-black uppercase leading-none ${getStepColor(currentStep)}`}>{steps[currentStep].stepName}</h2>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto custom-scrollbar p-2 w-full">
                           <div className={`text-[1em] font-medium text-left leading-relaxed whitespace-pre-wrap ${finalTextColorClass}`}>
                              <MathRenderer content={steps[currentStep].content} customColor={customMathColor} />
                           </div>

                           {steps[currentStep].keyPoints && steps[currentStep].keyPoints.length > 0 && (
                              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800 w-full">
                                 <h4 className="text-[0.6em] font-black uppercase text-slate-400 mb-3 tracking-widest">Điểm then chốt:</h4>
                                 <div className="flex flex-wrap gap-2">
                                    {steps[currentStep].keyPoints?.map((k, ki) => (
                                        <span key={ki} className={`px-3 py-1.5 rounded-xl text-[0.7em] font-bold border border-slate-200 dark:border-zinc-700 ${backgroundImage ? 'bg-white text-black' : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400'}`}>
                                            {k}
                                        </span>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                    </div>

                    {/* Step Indicators */}
                    <div className="mt-4 flex gap-1.5 shrink-0">
                       {steps.map((_, i) => (
                          <button 
                            key={i} 
                            onClick={() => setCurrentStep(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200 dark:bg-slate-800 hover:bg-indigo-300'}`}
                          />
                       ))}
                    </div>
                 </div>
               )}
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
                    src="https://bang2026.vercel.app/" 
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
                <button onClick={() => setShowWebView(true)} className={`p-2 transition-colors relative ${showWebView ? 'text-teal-400' : 'text-slate-400 hover:text-teal-400'}`}><Globe className="w-5 h-5"/><ShortcutLabel>W</ShortcutLabel></button>
                <div className="w-px h-6 bg-white/20"></div>
                <div className="flex items-center gap-1 bg-black/20 rounded-full px-2 py-0.5">
                    <button onClick={handleZoomOut} className="p-1 text-slate-400 hover:text-white relative"><ZoomOut className="w-4 h-4"/><ShortcutLabel>-</ShortcutLabel></button>
                    <span className="text-xs font-bold text-white min-w-[30px] text-center">{zoomLevel.toFixed(1)}x</span>
                    <button onClick={handleZoomIn} className="p-1 text-slate-400 hover:text-white relative"><ZoomIn className="w-4 h-4"/><ShortcutLabel>+</ShortcutLabel></button>
                </div>
                <div className="w-px h-6 bg-white/20"></div>
                
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

                {/* Text Color Selection */}
                <div className="relative">
                    <button 
                        onClick={() => setActiveMenu(activeMenu === 'text-color' ? null : 'text-color')}
                        className={`p-2 rounded-full transition-colors ${activeMenu === 'text-color' ? 'text-white bg-white/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                        title="Màu chữ (Alt+C)"
                    >
                        <Baseline className="w-5 h-5" />
                        <ShortcutLabel>Alt+C</ShortcutLabel>
                    </button>
                    
                    {activeMenu === 'text-color' && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex bg-slate-800 p-2 rounded-xl shadow-2xl border border-slate-700 flex-col gap-1 min-w-[160px] animate-fade-in-up">
                            {TEXT_COLOR_OPTIONS.map((opt) => (
                                <button 
                                    key={opt.id} 
                                    onClick={() => { setTextColorMode(opt.id); setActiveMenu(null); }}
                                    className={`px-3 py-2 text-left rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${textColorMode === opt.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                >
                                    <span className="w-3 h-3 rounded-full border border-white/20" style={{backgroundColor: opt.color}}></span>
                                    {opt.label}
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
    </div>
  );
};

export default PolyaPreview;
