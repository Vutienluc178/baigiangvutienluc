
import React, { useState, useRef, useEffect } from 'react';
import { ExamConfig, ExamMatrix, Question, QuestionType, MatrixRow } from '../types';
import { EDU_WEBSITES } from '../constants';
import MathRenderer from './MathRenderer';
import RandomPicker from './RandomPicker';
import Blackboard from './Blackboard';
import AnimatedBookTitle from './AnimatedBookTitle';
import { ChevronLeft, ChevronRight, Maximize, Minimize, ZoomIn, ZoomOut, MonitorPlay, CheckCircle, ListChecks, School, Eye, Lightbulb, HelpCircle, Save, Home, Volume2, FileOutput, Globe, GripVertical, GripHorizontal, ChevronDown, ChevronUp, X, Trophy, GraduationCap, PenTool, Database, Target, Palette, Image as ImageIcon, Upload, Type, BookOpen, GalleryHorizontalEnd, PanelRightClose, PanelRightOpen, Baseline, Trash2, Sun, Moon, CloudUpload, Loader2, RotateCw, Sparkles, Keyboard, Wand2 } from 'lucide-react';
import { exportExamToWord, exportExamToLatex2 } from '../utils/docxUtils';

const BalloonEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let balloons: any[] = [];
    let animationFrameId: number;
    const popSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');

    const createBalloon = () => {
      const size = Math.random() * 40 + 30;
      balloons.push({
        x: Math.random() * canvas.width,
        y: canvas.height + size,
        size,
        speed: Math.random() * 2 + 1,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        popped: false,
        popTime: 0
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      balloons.forEach((b, i) => {
        if (!b.popped) {
          b.y -= b.speed;
          
          // Draw balloon
          ctx.beginPath();
          ctx.fillStyle = b.color;
          ctx.ellipse(b.x, b.y, b.size * 0.8, b.size, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // String
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(255,255,255,0.5)';
          ctx.moveTo(b.x, b.y + b.size);
          ctx.lineTo(b.x, b.y + b.size + 20);
          ctx.stroke();

          // Random pop
          if (b.y < canvas.height * 0.3 && Math.random() < 0.01) {
            b.popped = true;
            b.popTime = Date.now();
            (popSound.cloneNode() as HTMLAudioElement).play().catch(() => {});
          }
        } else {
          // Pop effect
          const elapsed = Date.now() - b.popTime;
          if (elapsed < 200) {
            ctx.beginPath();
            ctx.strokeStyle = b.color;
            for(let j=0; j<8; j++) {
              const angle = (j / 8) * Math.PI * 2;
              ctx.moveTo(b.x + Math.cos(angle) * 10, b.y + Math.sin(angle) * 10);
              ctx.lineTo(b.x + Math.cos(angle) * 30, b.y + Math.sin(angle) * 30);
            }
            ctx.stroke();
          }
        }
      });

      balloons = balloons.filter(b => b.y > -b.size && (!b.popped || Date.now() - b.popTime < 200));

      if (Math.random() < 0.1) createBalloon();

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

const Fireworks = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    let animationFrameId: number;

    const createFirework = (x: number, y: number) => {
      const count = 80;
      const hue = Math.random() * 360;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          hue
        });
      }
    };

    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles = particles.filter(p => p.alpha > 0);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.alpha -= 0.015;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = `hsl(${p.hue}, 100%, 60%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      if (Math.random() < 0.08) {
        createFirework(Math.random() * canvas.width, Math.random() * canvas.height * 0.6);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

const SunflowerEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let flowers: any[] = [];
    let animationFrameId: number;

    const createFlower = () => {
      const maxSize = Math.random() * 60 + 40;
      flowers.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 0,
        maxSize,
        growth: Math.random() * 2 + 1,
        rotation: Math.random() * Math.PI * 2,
        petals: Math.floor(Math.random() * 4) + 8,
        alpha: 1
      });
    };

    const drawFlower = (f: any) => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);
      ctx.globalAlpha = f.alpha;

      // Petals
      ctx.fillStyle = '#fbbf24'; // amber-400
      for (let i = 0; i < f.petals; i++) {
        ctx.beginPath();
        ctx.rotate((Math.PI * 2) / f.petals);
        ctx.ellipse(f.size * 0.8, 0, f.size * 0.6, f.size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Center
      ctx.beginPath();
      ctx.fillStyle = '#78350f'; // amber-900
      ctx.arc(0, 0, f.size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      flowers.forEach((f, i) => {
        if (f.size < f.maxSize) {
          f.size += f.growth;
        } else {
          f.alpha -= 0.005;
        }
        drawFlower(f);
      });

      flowers = flowers.filter(f => f.alpha > 0);

      if (Math.random() < 0.05) createFlower();

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

const BirdsEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let birds: any[] = [];
    let animationFrameId: number;

    const createBird = () => {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      birds.push({
        x: side === 'left' ? -50 : canvas.width + 50,
        y: Math.random() * canvas.height * 0.8 + canvas.height * 0.1,
        size: Math.random() * 10 + 5,
        speedX: side === 'left' ? Math.random() * 3 + 2 : -(Math.random() * 3 + 2),
        speedY: (Math.random() - 0.5) * 1,
        wingAngle: 0,
        wingSpeed: Math.random() * 0.2 + 0.1
      });
    };

    const drawBird = (b: any) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      const wingY = Math.sin(b.wingAngle) * b.size;
      ctx.moveTo(-b.size, wingY);
      ctx.lineTo(0, 0);
      ctx.lineTo(b.size, wingY);
      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      birds.forEach(b => {
        b.x += b.speedX;
        b.y += b.speedY;
        b.wingAngle += b.wingSpeed;
        
        // Perspective effect: move towards horizon (center-ish)
        const targetX = canvas.width / 2;
        const targetY = canvas.height / 2;
        b.x += (targetX - b.x) * 0.005;
        b.y += (targetY - b.y) * 0.005;
        b.size *= 0.995; // Shrink as they fly away

        drawBird(b);
      });

      birds = birds.filter(b => b.size > 0.5 && b.x > -100 && b.x < canvas.width + 100);

      if (Math.random() < 0.03) createBird();

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

const SolarSystemEffect = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: any[] = [];
    let planets: any[] = [];
    let animationFrameId: number;

    const createStars = () => {
      for (let i = 0; i < 200; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5,
          opacity: Math.random()
        });
      }
    };

    const initPlanets = () => {
      const colors = ['#94a3b8', '#fbbf24', '#38bdf8', '#f87171', '#fb923c', '#eab308', '#2dd4bf', '#818cf8'];
      for (let i = 0; i < 8; i++) {
        planets.push({
          distance: 100 + i * 50,
          angle: Math.random() * Math.PI * 2,
          speed: (0.02 / (i + 1)) * 0.5,
          size: 5 + Math.random() * 10,
          color: colors[i % colors.length]
        });
      }
    };

    const animate = () => {
      ctx.fillStyle = '#020617'; // Very dark blue/black
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      ctx.fillStyle = 'white';
      stars.forEach(s => {
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        s.opacity += (Math.random() - 0.5) * 0.05;
        if (s.opacity < 0) s.opacity = 0;
        if (s.opacity > 1) s.opacity = 1;
      });
      ctx.globalAlpha = 1;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Draw Sun
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
      gradient.addColorStop(0, '#fef08a');
      gradient.addColorStop(0.5, '#facc15');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50, 0, Math.PI * 2);
      ctx.fill();

      // Draw Planets
      planets.forEach(p => {
        p.angle += p.speed;
        const x = centerX + Math.cos(p.angle) * p.distance;
        const y = centerY + Math.sin(p.angle) * p.distance;

        // Orbit line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, p.distance, 0, Math.PI * 2);
        ctx.stroke();

        // Planet
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = [];
      createStars();
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    initPlanets();
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};

interface ExamPreviewProps {
  role: 'teacher' | 'student';
  config: ExamConfig;
  data: ExamMatrix;
  onReset: () => void;
  onRegenerate: () => void;
  onEdit?: () => void;
  onSaveToBank?: () => void;
  onSaveMatrix?: (title: string, rows: MatrixRow[]) => void;
  onUpdateData?: (newData: ExamMatrix) => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onShowGuide?: () => void;
}

const OPTION_THEMES = [
  { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-300 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-100', labelBg: 'bg-blue-600 text-white' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-100', labelBg: 'bg-emerald-600 text-white' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-100', labelBg: 'bg-amber-600 text-white' },
  { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-300 dark:border-rose-800', text: 'text-rose-900 dark:text-rose-100', labelBg: 'bg-rose-600 text-white' }
];

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

// Transition Effects
const TRANSITIONS = [
  { id: 'slide', label: 'Trượt (Slide)', class: 'animate-slide-in-right' },
  { id: 'fade', label: 'Mờ dần (Fade)', class: 'animate-fade-in' },
  { id: 'zoom', label: 'Phóng to (Zoom)', class: 'animate-zoom-in' },
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

export const ExamPreview: React.FC<ExamPreviewProps> = ({ role, config, data, onReset, onRegenerate, onEdit, onSaveToBank, onSaveMatrix, onUpdateData, isDarkMode, onToggleTheme, onShowGuide }) => {
  const [questions, setQuestions] = useState<Question[]>(data?.questions || []);
  const [showAnswersGlobal, setShowAnswersGlobal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'slide'>(role === 'teacher' ? 'slide' : 'list');
  // currentSlide: -4 = Intro, -3 = Title, -2 = Warmup, -1 = Key Concepts (if exists), 0+ = Questions
  const [currentSlide, setCurrentSlide] = useState(-4);
  const [zoomLevel, setZoomLevel] = useState(3.0);
  const [showGuide, setShowGuide] = useState(false);
  
  // Styles State
  const [customMathColor, setCustomMathColor] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  
  // BG Library State
  const [savedBackgrounds, setSavedBackgrounds] = useState<SavedBg[]>([]);
  const [newBgName, setNewBgName] = useState('');
  const [exportFileName, setExportFileName] = useState<string>(`De_Thi_${config.subject}_${config.topic}`.replace(/\s+/g, '_'));
  const [editableKeyConcepts, setEditableKeyConcepts] = useState(data?.keyConcepts || "");
  const [isEditingKeyConcepts, setIsEditingKeyConcepts] = useState(false);

  const [editableIntroText, setEditableIntroText] = useState("Chào mừng các em đến tiết học hôm nay");
  const [isEditingIntro, setIsEditingIntro] = useState(false);
  
  const [editableThankYouText, setEditableThankYouText] = useState("Cám ơn các em học sinh đã theo dõi bài học");
  const [isEditingThankYou, setIsEditingThankYou] = useState(false);

  const [editableTopic, setEditableTopic] = useState(config.topic || "");
  const [editableSubject, setEditableSubject] = useState(config.subject || "");
  const [editableGrade, setEditableGrade] = useState(config.grade || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  const [currentFont, setCurrentFont] = useState(PRESENTATION_FONTS[0]);
  const [currentTransition, setCurrentTransition] = useState(TRANSITIONS[0]);
  const [textColorMode, setTextColorMode] = useState('auto'); // auto, black, white, navy
  
  // Toolbar Active State
  const [activeMenu, setActiveMenu] = useState<'color' | 'bg' | 'font' | 'transition' | 'text-color' | null>(null);
  
  // Header Visibility State
  const [showHeader, setShowHeader] = useState(true);
  const headerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [isStarted, setIsStarted] = useState(role === 'teacher');
  const [studentName, setStudentName] = useState('');
  const [showToolbar, setShowToolbar] = useState(true);
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [introEffect, setIntroEffect] = useState<number>(0);
  const [titleMode, setTitleMode] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [webUrl, setWebUrl] = useState('https://bang2026.vercel.app/');
  const [showEduMenu, setShowEduMenu] = useState(false);
  const [isWebCollapsed, setIsWebCollapsed] = useState(false); // New state for collapse
  const [optionLayout, setOptionLayout] = useState<'grid' | 'stack'>('grid');

  const [showRandomPicker, setShowRandomPicker] = useState(false);
  const [showBlackboard, setShowBlackboard] = useState(false);
  const [blackboardMode, setBlackboardMode] = useState<'bottom' | 'side' | 'overlay'>('overlay');

  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  
  const [webSplitRatio, setWebSplitRatio] = useState(50);
  const isDraggingWebRef = useRef(false);
  const [verticalSplitRatio, setVerticalSplitRatio] = useState(35);
  const isDraggingVerticalRef = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Load BG Library
  useEffect(() => {
    try {
        const saved = localStorage.getItem('ai_studio_bg_library');
        if (saved) setSavedBackgrounds(JSON.parse(saved));
    } catch (e) {
        console.error("Failed to load bg library", e);
    }
  }, []);

  useEffect(() => {
    if (data?.keyConcepts) {
        setEditableKeyConcepts(data.keyConcepts);
    }
  }, [data?.keyConcepts]);

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
        // setActiveMenu(null); // Keep menu open to allow saving
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const clearBgImage = () => {
    setBackgroundImage(null);
    setActiveMenu(null);
  };

  const hasExamMeta = !!(
    data?.objectives?.length ||
    data?.competencies?.length ||
    data?.differentiation?.basic?.length ||
    data?.differentiation?.advanced?.length ||
    data?.differentiation?.application?.length
  );

  const renderExamMeta = (compact?: boolean) => {
    if (!hasExamMeta) return null;
    const textSize = compact ? 'text-[0.55em]' : 'text-[0.7em]';
    const chipSize = compact ? 'text-[0.55em]' : 'text-[0.7em]';
    return (
      <div className={`w-full mt-6 p-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 ${textSize}`}>
        {data.objectives && data.objectives.length > 0 && (
          <div className="mb-3">
            <div className="font-black uppercase tracking-widest text-indigo-600 mb-2">Mục tiêu</div>
            <div className="flex flex-wrap gap-2">
              {data.objectives.map((item, idx) => (
                <span key={`obj-${idx}`} className={`bg-white dark:bg-zinc-950 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-700 font-bold ${chipSize}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
        {data.competencies && data.competencies.length > 0 && (
          <div className="mb-3">
            <div className="font-black uppercase tracking-widest text-emerald-600 mb-2">Năng lực</div>
            <div className="flex flex-wrap gap-2">
              {data.competencies.map((item, idx) => (
                <span key={`comp-${idx}`} className={`bg-white dark:bg-zinc-950 px-3 py-1 rounded-full border border-slate-200 dark:border-zinc-700 font-bold ${chipSize}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingWebRef.current) {
        const newRatio = (e.clientX / window.innerWidth) * 100;
        setWebSplitRatio(Math.min(80, Math.max(20, newRatio)));
      }
      if (isDraggingVerticalRef.current) {
        const newRatio = (e.clientY / window.innerHeight) * 100;
        setVerticalSplitRatio(Math.min(90, Math.max(10, newRatio)));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingWebRef.current) {
        isDraggingWebRef.current = false;
        document.body.style.cursor = 'default';
        const iframe = document.getElementById('web-view-iframe');
        if (iframe) iframe.style.pointerEvents = 'auto';
      }
      if (isDraggingVerticalRef.current) {
        isDraggingVerticalRef.current = false;
        document.body.style.cursor = 'default';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizeWeb = () => {
    isDraggingWebRef.current = true;
    document.body.style.cursor = 'col-resize';
    const iframe = document.getElementById('web-view-iframe');
    if (iframe) iframe.style.pointerEvents = 'none';
  };

  const startResizeVertical = () => {
    isDraggingVerticalRef.current = true;
    document.body.style.cursor = 'row-resize';
  };

  const playTick = (freq = 800, type: 'tick' | 'alarm' = 'tick') => {
    try {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;

      if (type === 'alarm') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {
      console.warn("Audio error", e);
    }
  };

  const playFeedback = (isCorrect: boolean) => {
    try {
        const ctx = initAudio();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (isCorrect) {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
            osc.frequency.exponentialRampToValueAtTime(1500, now + 0.3);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
            
            osc.start(now);
            osc.stop(now + 0.6);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(100, now + 0.3);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            
            osc.start(now);
            osc.stop(now + 0.3);
        }
    } catch (e) {
        console.warn("Audio error", e);
    }
  };

  const getCorrectIndex = (q: Question) => {
    const correctLetter = q.correctAnswer.trim().charAt(0).toUpperCase();
    const index = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
    return index !== -1 ? index : 0; 
  };

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timer !== null && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev === null || prev <= 0) {
            setIsTimerRunning(false);
            return 0;
          }
          const next = prev - 1;
          
          if (next <= 3 && next > 0) {
             playTick(1500, 'alarm');
          } else if (next <= 10 && next > 3) {
             playTick(next % 2 === 0 ? 1000 : 800, 'tick');
          }
          
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer !== null]);

  // RESET LOGIC WHEN SLIDE CHANGES
  useEffect(() => {
    // Stop Timer
    setTimer(null);
    setIsTimerRunning(false);
    
    // Reset Answers Visibility
    setShowAnswersGlobal(false);
    if (!isSubmitted) {
        setRevealedAnswers(new Set());
        setRevealedHints(new Set());
    }
  }, [currentSlide, isSubmitted]);

  useEffect(() => {
    if (userAnswers[currentSlide] !== undefined && isTimerRunning) {
      setTimer(null);
      setIsTimerRunning(false);
    }
  }, [userAnswers[currentSlide]]);

  useEffect(() => {
    if (currentSlide === -4) {
      setIntroEffect(Math.floor(Math.random() * 5));
    }
  }, [currentSlide]);

  useEffect(() => {
    if (!isStarted) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      
      if (['1', '2', '3', '4', '5'].includes(key)) {
        const minutes = parseInt(key);
        setTimer(minutes * 60);
        setIsTimerRunning(true);
      }
      
      if (key === 'a' && role === 'teacher') setShowAnswersGlobal(prev => !prev);
      if (key === 'w') {
          if (showWebView && isWebCollapsed) {
              setIsWebCollapsed(false); // Restore if collapsed
          } else {
              setShowWebView(prev => !prev);
              setIsWebCollapsed(false); // Reset collapse when opening/closing
          }
      }
      if (key === 'f') toggleFullScreen();
      if (key === 's') handleExport();
      if (key === 'h' && viewMode === 'slide' && currentSlide >= 0) toggleRevealHint(currentSlide);
      if (key === 'h' && e.altKey) setShowToolbar(prev => !prev); 
      if (key === 'v') readAloud();
      if (key === '=' || key === '+') handleZoomIn();
      if (key === '-' || key === '_') handleZoomOut();
      if (key === 'l') setOptionLayout(prev => (prev === 'grid' ? 'stack' : 'grid'));
      
      if (key === 'q') {
          setShowEduMenu(prev => !prev);
          setActiveMenu(null);
      }
      
      // New Shortcuts
      if (key === 'k') setShowRandomPicker(prev => !prev);
      if (key === 'b') {
          setShowBlackboard(true);
          setBlackboardMode('overlay');
      }
      if (key === 't') {
          setTimer(prev => prev === null ? 60 : null);
          setIsTimerRunning(prev => prev === null);
      }
      if (key === '9') setCurrentSlide(-1);
      if (key === '0') setCurrentSlide(questions.length);
      
      // Cycle Text Color Shortcut (Alt + C)
      if (key === 'c' && e.altKey) {
          setActiveMenu('text-color');
      }
      
      // Open Math Color Menu (Alt + M)
      if (key === 'm' && e.altKey) {
          setActiveMenu('color');
      }

      if (viewMode === 'slide' && questions.length > 0) {
        if (e.key === 'ArrowRight') {
            setCurrentSlide(s => {
                const next = s + 1;
                return next <= questions.length ? next : s;
            });
        }
        if (e.key === 'ArrowLeft') {
            setCurrentSlide(s => {
                const prev = s - 1;
                return Math.max(-4, prev); 
            });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, role, viewMode, questions.length, currentSlide, data.keyConcepts, showWebView, isWebCollapsed, textColorMode]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true));
    else if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false));
  };

  const handleWordExportEquation = async () => {
    try {
      await exportExamToWord(data, config.subject as string, config.grade, 'equation', exportFileName);
    } catch (e) {
      console.error(e);
      alert("Lỗi xuất Word Equation. Vui lòng thử lại.");
    }
  };

  const handleWordExportStudentEquation = async () => {
    try {
      await exportExamToWord(data, config.subject as string, config.grade, 'student_equation', exportFileName ? `${exportFileName}_HS` : undefined);
    } catch (e) {
      console.error(e);
      alert("Lỗi xuất Word HS (Equation). Vui lòng thử lại.");
    }
  };

  const handleWordExportStudentEquationV3 = async () => {
    try {
      await exportExamToWord(data, config.subject as string, config.grade, 'student_equation_v3', exportFileName ? `${exportFileName}_3NoiDung` : undefined);
    } catch (e) {
      console.error(e);
      alert("Lỗi xuất Word 3 nội dung (Equation). Vui lòng thử lại.");
    }
  };

  const handleWordExportLatex = async () => {
    try {
      await exportExamToWord(data, config.subject as string, config.grade, 'latex', exportFileName);
    } catch (e) {
      console.error(e);
      alert("Lỗi xuất Word LaTeX. Vui lòng thử lại.");
    }
  };

  const handleLatexExport2 = () => {
    try {
      exportExamToLatex2(data, config.subject as string, exportFileName);
    } catch (e) {
      console.error(e);
      alert("Lỗi xuất LaTeX dạng 2. Vui lòng thử lại.");
    }
  };

  const readAloud = () => {
    if (currentSlide < 0 || !questions[currentSlide]) return;
    const q = questions[currentSlide];
    let textToRead = q.content.replace(/\$([^$]+)\$/g, (match, formula) => {
        const cleanFormula = formula.trim();
        return cleanFormula.length < 6 ? cleanFormula : "[công thức]"; 
    });
    
    textToRead = textToRead.replace(/\*\*/g, "");
    
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const calculateScore = () => {
    let rawScore = 0;
    questions.forEach((q, idx) => {
      const userAns = userAnswers[idx];
      if (userAns === undefined) return;
      if (q.type === QuestionType.MULTIPLE_CHOICE || q.type.includes('4 chọn 1')) {
        const correctLetter = q.correctAnswer.trim().charAt(0).toUpperCase();
        if (['A', 'B', 'C', 'D'][userAns] === correctLetter) rawScore += 1;
      } else if (q.type === QuestionType.TRUE_FALSE || q.type.includes('Đúng/Sai')) {
        const correctStr = q.correctAnswer.toLowerCase();
        let subCorrect = 0;
        [0, 1, 2, 3].forEach(i => {
           const label = ['a', 'b', 'c', 'd'][i];
           const isCorrectTrue = correctStr.includes(`${label}: đúng`) || correctStr.includes(`${label}: đ`);
           if (userAnswers[idx]?.[i] === isCorrectTrue) subCorrect++;
        });
        if (subCorrect === 4) rawScore += 1;
      } else if (q.type === QuestionType.ESSAY || q.type.includes('Tự luận')) {
        if (userAns.toString().trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) rawScore += 1;
      }
    });
    return ((rawScore / questions.length) * 10).toFixed(1);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 8.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));

  const toggleRevealAnswer = (idx: number) => setRevealedAnswers(prev => {
    const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n;
  });
  const toggleRevealHint = (idx: number) => setRevealedHints(prev => {
    const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n;
  });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ type: 'exam', config, data, timestamp: Date.now() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${exportFileName}.json`; a.click();
  };

  const isDarkBg = true; 
  
  const fontStyle = { fontFamily: currentFont.name === 'Roboto' ? 'Roboto, sans-serif' : currentFont.name === 'Montserrat' ? 'Montserrat, sans-serif' : 'Merriweather, serif' };
  const bgStyle = (viewMode === 'slide' && backgroundImage) 
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', backgroundRepeat: 'no-repeat' } 
    : {};
    
  const combinedStyle = { ...fontStyle, ...bgStyle };
  const hasBgImageActive = viewMode === 'slide' && !!backgroundImage;
    
  // Determined base Text Color Class
  let textColorClass = 'text-slate-900 dark:text-zinc-100';
  if (backgroundImage) {
      textColorClass = 'text-white drop-shadow-md';
      if (backgroundImage.includes('paper')) {
          textColorClass = 'text-slate-900 font-bold';
      }
  }

  // Override with Custom Text Color if selected
  let finalTextColorClass = textColorClass;
  if (textColorMode !== 'auto') {
      const selected = TEXT_COLOR_OPTIONS.find(o => o.id === textColorMode);
      if (selected) finalTextColorClass = selected.class;
  }
  
    const handleSaveMatrix = () => {
        if (!config.matrixRows || config.mode !== 'matrix') return;
        const title = prompt("Nhập tên ma trận để lưu:", config.subject + " - " + config.grade);
        if (title && onSaveMatrix) {
            setIsSavingMatrix(true);
            onSaveMatrix(title, config.matrixRows);
            setTimeout(() => setIsSavingMatrix(false), 1000);
        }
    };

    const renderQuestionCard = (q: Question, idx: number, isSlide: boolean) => {
    if (!q) return null;
    const isEditing = editingQuestionIndex === idx;
    const zoomStyle: React.CSSProperties = { 
      fontSize: `${zoomLevel}rem`,
      transition: 'font-size 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    };
    const userAns = userAnswers[idx];
    const hasChosen = userAns !== undefined;
    const isAnswerVisible = (showAnswersGlobal || isSubmitted || revealedAnswers.has(idx)); // Logic check modified: if Global or Submitted, it's visible.
    const isHintVisible = revealedHints.has(idx);
    
    const correctIndex = getCorrectIndex(q);

    // Robust Type Checking
    const typeStr = (q.type || "").toString().toLowerCase();
    const hasOptions = Array.isArray(q.options) && q.options.length > 0;
    
    // Check if it's explicitly True/False
    const isTF = typeStr.includes('đúng/sai') || typeStr.includes('true/false');
    
    // Check if it's Essay
    const isEssay = typeStr.includes('tự luận') || typeStr.includes('essay');

    // MCQ if it has options and isn't T/F (and isn't explicitly essay)
    // This handles cases where type might be just "Trắc nghiệm" or "Multiple Choice" or even undefined/weird but options exist.
    const isMCQ = !isTF && !isEssay && (
        typeStr.includes('trắc nghiệm') || 
        typeStr.includes('multiple') || 
        typeStr.includes('4 chọn 1') ||
        hasOptions
    );

    const handleSaveQuestion = () => {
        setEditingQuestionIndex(null);
    };

    // Slide Mode Answer View (Split Screen)
    if (isSlide && isAnswerVisible && (hasChosen || showAnswersGlobal)) {
      return (
        <div className="flex flex-col h-full w-full overflow-hidden relative" style={zoomStyle}>
          <div 
            style={{ height: `${verticalSplitRatio}%` }} 
            className={`border-b-4 border-emerald-500/30 overflow-y-auto p-6 md:px-12 shadow-md z-10 shrink-0 ${hasBgImageActive ? 'bg-white/90 backdrop-blur-sm' : 'bg-white dark:bg-zinc-950'}`}
          >
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">{idx + 1}</span>
                 <span className="text-[0.4em] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-900 text-slate-500 whitespace-nowrap">{q.difficulty}</span>
                 {role === 'teacher' && (
                    <button 
                        onClick={() => setEditingQuestionIndex(isEditing ? null : idx)} 
                        className={`p-1.5 rounded-full transition-all ${isEditing ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200'}`}
                        title={isEditing ? "Lưu" : "Sửa câu hỏi"}
                    >
                        {isEditing ? <CheckCircle className="w-4 h-4" /> : <PenTool className="w-4 h-4" />}
                    </button>
                 )}
               </div>
             </div>
             
             <div className={`text-[0.8em] font-bold mb-4 w-full leading-normal ${finalTextColorClass}`}>
                {isEditing ? (
                    <textarea 
                        value={q.content}
                        onChange={(e) => {
                            const newQs = [...questions];
                            newQs[idx] = { ...newQs[idx], content: e.target.value };
                            setQuestions(newQs);
                        }}
                        className="w-full bg-zinc-900/10 dark:bg-white/10 p-4 rounded-xl border border-indigo-500/30 outline-none font-sans font-bold"
                        rows={3}
                    />
                ) : (
                    <MathRenderer content={q.content} customColor={customMathColor} />
                )}
             </div>

             <div className="grid gap-2 grid-cols-2">
                 {isMCQ && q.options?.map((o, oi) => {
                    const isSelected = userAns === oi;
                    const isCorrect = oi === correctIndex;
                    let colorClass = hasBgImageActive ? "bg-slate-100 text-slate-800" : "bg-slate-50 dark:bg-zinc-900 text-slate-600";
                    
                    if (isCorrect) colorClass = "bg-emerald-100 text-emerald-800 font-bold border-emerald-300";
                    else if (isSelected) colorClass = "bg-red-100 text-red-800 border-red-300";

                    return (
                        <div key={oi} className={`p-2 rounded-lg border text-[0.6em] flex items-start gap-2 ${colorClass}`}>
                            <span className="font-black">{['A','B','C','D'][oi]}.</span>
                            {isEditing ? (
                                <input 
                                    value={o.replace(/^[A-D][\.\)\s]+/, '')}
                                    onChange={(e) => {
                                        const newQs = [...questions];
                                        const newOpts = [...(newQs[idx].options || [])];
                                        newOpts[oi] = e.target.value;
                                        newQs[idx] = { ...newQs[idx], options: newOpts };
                                        setQuestions(newQs);
                                    }}
                                    className="flex-1 bg-transparent outline-none font-sans font-bold"
                                />
                            ) : (
                                <MathRenderer content={o.replace(/^[A-D][\.\)\s]+/, '')} inline customColor={customMathColor} />
                            )}
                        </div>
                    );
                 })}
             </div>
          </div>

          <div 
            className="h-3 bg-slate-100 dark:bg-zinc-800 hover:bg-indigo-500 dark:hover:bg-indigo-500 cursor-row-resize flex items-center justify-center z-50 transition-colors shadow-sm"
            onMouseDown={startResizeVertical}
          >
            <GripHorizontal className="w-4 h-4 text-slate-400" />
          </div>

          {/* ANSWER SECTION: BLACK BACKGROUND, WHITE TEXT, YELLOW MATH */}
          <div 
            style={{ height: `calc(${100 - verticalSplitRatio}% - 12px)` }} 
            className="flex flex-col relative animate-fade-in-up bg-black"
          >
              <div className="sticky top-0 py-3 px-6 z-20 flex justify-between items-center border-b border-white/20 shrink-0 bg-black/90 backdrop-blur-md">
                  {/* ICON ONLY HEADER FOR SOLUTION */}
                  <div className="flex items-center gap-4">
                      <CheckCircle className="w-8 h-8 text-emerald-500 drop-shadow-md" />
                      <span className="text-[0.6em] font-black text-white/90 uppercase tracking-widest">
                        Đáp án: <span className="text-yellow-400 text-[1.2em]">{q.correctAnswer}</span>
                      </span>
                  </div>
                  
                  <button onClick={() => toggleRevealAnswer(idx)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/50 hover:text-red-400 transition-colors shadow-sm">
                      <X className="w-5 h-5" />
                  </button>
              </div>
              
              <div className="flex-grow overflow-y-auto w-full px-6 py-6 pb-10">
                  <div className="w-full h-full border-2 border-yellow-500/30 rounded-2xl p-6 bg-white/5 shadow-inner">
                      <div className="text-[0.8em] font-medium leading-relaxed w-full text-white">
                          {isEditing ? (
                              <textarea 
                                  value={q.solution}
                                  onChange={(e) => {
                                      const newQs = [...questions];
                                      newQs[idx] = { ...newQs[idx], solution: e.target.value };
                                      setQuestions(newQs);
                                  }}
                                  className="w-full bg-white/10 text-white p-4 rounded-xl border border-yellow-500/30 outline-none font-sans font-bold"
                                  rows={5}
                              />
                          ) : (
                              <MathRenderer content={q.solution} customColor="#facc15" />
                          )}
                      </div>
                  </div>
              </div>
          </div>
        </div>
      );
    }

    // Normal Card View (List or Slide Question Phase)
    return (
      <div className={`flex flex-col ${isSlide ? 'pt-2 pb-16 px-6 md:px-12 items-start justify-start w-full overflow-y-auto' : 'p-6 rounded-3xl mb-8 border border-slate-200 dark:border-slate-800 shadow-xl'} ${!hasBgImageActive ? 'bg-white dark:bg-zinc-950' : ''}`} style={zoomStyle}>
        <div className="w-full flex flex-col items-start">
            <div className={`flex items-center justify-between w-full mb-4 no-print border-b pb-2 ${hasBgImageActive ? 'border-black/10' : 'border-slate-100 dark:border-zinc-800'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md flex-shrink-0">{idx + 1}</span>
                  <span className="text-[0.4em] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-slate-100 dark:bg-zinc-900 text-slate-500 whitespace-nowrap">{q.difficulty}</span>
                  {q.differentiation && (
                    <span className="text-[0.4em] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 whitespace-nowrap">
                      {q.differentiation}
                    </span>
                  )}
                  {isSlide && <button onClick={readAloud} className="p-1.5 bg-slate-50 dark:bg-zinc-900 rounded-lg hover:text-indigo-600 transition-colors relative" title="Đọc (V)"><Volume2 className="w-5 h-5" /><ShortcutLabel>V</ShortcutLabel></button>}
                  {role === 'teacher' && (
                    <button 
                        onClick={() => setEditingQuestionIndex(isEditing ? null : idx)} 
                        className={`p-1.5 rounded-full transition-all ${isEditing ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200'}`}
                        title={isEditing ? "Lưu" : "Sửa câu hỏi"}
                    >
                        {isEditing ? <CheckCircle className="w-5 h-5" /> : <PenTool className="w-5 h-5" />}
                    </button>
                  )}
                </div>
                {q.hints && q.hints.length > 0 && (
                  <button onClick={() => toggleRevealHint(idx)} className={`p-1.5 rounded-lg transition-all relative ${isHintVisible ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 dark:bg-zinc-900 text-slate-400 dark:text-zinc-500'}`} title="Gợi ý (H)">
                      <Lightbulb className="w-5 h-5" />
                      {isSlide && <ShortcutLabel>H</ShortcutLabel>}
                  </button>
                )}
            </div>

            <div className={`text-[1em] font-bold mb-6 w-full leading-normal ${finalTextColorClass}`}>
                {isEditing ? (
                    <textarea 
                        value={q.content}
                        onChange={(e) => {
                            const newQs = [...questions];
                            newQs[idx] = { ...newQs[idx], content: e.target.value };
                            setQuestions(newQs);
                        }}
                        className="w-full bg-zinc-900/10 dark:bg-white/10 p-4 rounded-xl border border-indigo-500/30 outline-none font-sans font-bold"
                        rows={3}
                    />
                ) : (
                    <MathRenderer content={q.content} customColor={customMathColor} />
                )}
            </div>

            {isHintVisible && q.hints && q.hints.length > 0 && (
              <div className={`w-full mb-6 p-4 border-l-4 border-amber-300 rounded-r-xl max-h-96 overflow-y-auto custom-scrollbar ${hasBgImageActive ? 'bg-amber-50/90' : 'bg-amber-50 dark:bg-amber-900/10'}`}>
                <h5 className="text-amber-700 font-bold text-[0.6em] uppercase mb-2 flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Gợi ý:</h5>
                <ul className="space-y-2 pl-4 list-disc">
                  {q.hints.map((hint, hIdx) => (
                    <li key={hIdx} className={`text-[0.6em] font-semibold ${hasBgImageActive ? 'text-amber-900' : 'text-amber-900 dark:text-amber-100'}`}><MathRenderer content={hint} inline customColor={customMathColor} /></li>
                  ))}
                </ul>
              </div>
            )}

            <div className={`w-full grid gap-4 ${optionLayout === 'stack' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {isMCQ && q.options?.map((o, oi) => {
                    const isSelected = userAns === oi;
                    const isCorrect = oi === correctIndex;
                    // Nếu chế độ xem đáp án global được bật, hoặc đã nộp bài, hoặc câu này được reveal riêng -> isRevealed = true
                    const isRevealed = showAnswersGlobal || isSubmitted || revealedAnswers.has(idx);

                    // Ensure theme doesn't crash if options exceed themes length
                    const theme = OPTION_THEMES[oi % OPTION_THEMES.length];
                    
                    let buttonClass = `${theme.bg} ${theme.border} ${theme.text} hover:border-indigo-400`;
                    let labelClass = `${theme.labelBg}`;
                    let textClass = hasBgImageActive ? 'text-black' : 'dark:text-zinc-100';

                    // Logic hiển thị màu sắc:
                    // 1. Nếu đang hiển thị đáp án (isRevealed) VÀ đây là đáp án đúng -> Màu XANH (Luôn hiển thị)
                    // 2. Nếu người dùng chọn ô này:
                    //    a. Nếu đúng -> Màu XANH (Trùng với case 1, nhưng cần xử lý cho tương tác tức thì)
                    //    b. Nếu sai -> Màu ĐỎ
                    
                    if (isRevealed && isCorrect) {
                        buttonClass = 'bg-emerald-600 border-emerald-600 text-white scale-[1.02] shadow-xl';
                        labelClass = 'bg-white text-emerald-600';
                        textClass = 'text-white';
                    } else if (isSelected) {
                        if (isCorrect) {
                            buttonClass = 'bg-emerald-600 border-emerald-600 text-white scale-[1.02] shadow-xl';
                            labelClass = 'bg-white text-emerald-600';
                            textClass = 'text-white';
                        } else {
                            buttonClass = 'bg-red-600 border-red-600 text-white scale-[1.02] shadow-xl';
                            labelClass = 'bg-white text-red-600';
                            textClass = 'text-white';
                        }
                    } else if (hasBgImageActive) {
                        // Override for bg image mode to ensure readability
                        buttonClass = "bg-white/80 border-slate-300 hover:border-indigo-400 text-black";
                    }

                    return (
                        <button 
                            key={oi} 
                            disabled={isEditing}
                            onClick={() => {
                                if (!isSubmitted) {
                                    setUserAnswers(prev => ({ ...prev, [idx]: oi }));
                                    playFeedback(oi === correctIndex);
                                }
                            }} 
                            className={`group flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${buttonClass} ${isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                            <span className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center font-bold text-[0.6em] ${labelClass}`}>{['A','B','C','D'][oi]}.</span>
                            <div className={`text-[0.8em] pt-0.5 font-bold flex-1 ${textClass}`}>
                                {isEditing ? (
                                    <input 
                                        value={o.replace(/^[A-D][\.\)\s]+/, '')}
                                        onChange={(e) => {
                                            const newQs = [...questions];
                                            const newOpts = [...(newQs[idx].options || [])];
                                            newOpts[oi] = e.target.value;
                                            newQs[idx] = { ...newQs[idx], options: newOpts };
                                            setQuestions(newQs);
                                        }}
                                        className="w-full bg-transparent outline-none font-sans font-bold"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <MathRenderer content={o.replace(/^[A-D][\.\)\s]+/, '')} inline customColor={customMathColor} />
                                )}
                            </div>
                        </button>
                    );
                })}

                {isTF && q.options?.map((o, oi) => (
                    <div key={oi} className={`flex flex-col p-4 rounded-2xl border ${hasBgImageActive ? 'bg-white/90 border-slate-300' : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-700'}`}>
                        <div className={`text-[0.7em] font-bold mb-3 flex gap-2 ${hasBgImageActive ? 'text-black' : 'dark:text-zinc-200'}`}>
                            <span className="text-indigo-600 font-black">{['a','b','c','d'][oi]})</span>
                            {isEditing ? (
                                <input 
                                    value={o.replace(/^[a-d][).]\s*/, '')}
                                    onChange={(e) => {
                                        const newQs = [...questions];
                                        const newOpts = [...(newQs[idx].options || [])];
                                        newOpts[oi] = e.target.value;
                                        newQs[idx] = { ...newQs[idx], options: newOpts };
                                        setQuestions(newQs);
                                    }}
                                    className="flex-1 bg-transparent outline-none font-sans font-bold"
                                />
                            ) : (
                                <MathRenderer content={o.replace(/^[a-d][).]\s*/, '')} inline customColor={customMathColor} />
                            )}
                        </div>
                        <div className="flex gap-2">
                           <button disabled={isEditing} onClick={() => !isSubmitted && setUserAnswers(p => ({...p, [idx]: {...(p[idx]||{}), [oi]: true}}))} className={`flex-1 py-2 rounded-xl font-black text-[0.5em] border transition-all ${userAns?.[oi] === true ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white dark:bg-zinc-800 text-emerald-600 border-emerald-200'}`}>ĐÚNG</button>
                           <button disabled={isEditing} onClick={() => !isSubmitted && setUserAnswers(p => ({...p, [idx]: {...(p[idx]||{}), [oi]: false}}))} className={`flex-1 py-2 rounded-xl font-black text-[0.5em] border transition-all ${userAns?.[oi] === false ? 'bg-red-600 border-red-600 text-white' : 'bg-white dark:bg-zinc-800 text-red-600 border-red-200'}`}>SAI</button>
                        </div>
                    </div>
                ))}
            </div>

            {isAnswerVisible ? (
                <div className={`mt-6 p-6 rounded-3xl border border-emerald-200 w-full relative animate-fade-in ${hasBgImageActive ? 'bg-emerald-50/95' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                    <button onClick={() => toggleRevealAnswer(idx)} className="absolute top-2 right-2 p-1 hover:bg-emerald-100 rounded-full no-print"><X className="w-5 h-5 text-emerald-600" /></button>
                    <h4 className="text-[0.7em] font-black text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6" /> Đáp án: 
                        {isEditing ? (
                            <input 
                                value={q.correctAnswer}
                                onChange={(e) => {
                                    const newQs = [...questions];
                                    newQs[idx] = { ...newQs[idx], correctAnswer: e.target.value };
                                    setQuestions(newQs);
                                }}
                                className="bg-transparent outline-none font-sans font-bold border-b border-emerald-300"
                            />
                        ) : (
                            <MathRenderer content={q.correctAnswer} inline customColor={customMathColor} />
                        )}
                    </h4>
                    <div className={`text-[0.6em] font-bold leading-relaxed border-t border-emerald-100 pt-2 max-h-64 overflow-y-auto custom-scrollbar pr-2 ${hasBgImageActive ? 'text-emerald-900' : 'dark:text-emerald-100'}`}>
                        {isEditing ? (
                            <textarea 
                                value={q.solution}
                                onChange={(e) => {
                                    const newQs = [...questions];
                                    newQs[idx] = { ...newQs[idx], solution: e.target.value };
                                    setQuestions(newQs);
                                }}
                                className="w-full bg-transparent outline-none font-sans font-bold"
                                rows={4}
                            />
                        ) : (
                            <MathRenderer content={q.solution} customColor={customMathColor} />
                        )}
                    </div>
                </div>
            ) : hasChosen && (
              <button onClick={() => toggleRevealAnswer(idx)} className="mt-6 w-full py-3 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-slate-400 hover:text-indigo-600 no-print">
                  <Eye className="w-5 h-5" />
                  <span className="text-[0.6em] font-black uppercase">Xem Lời giải (A)</span>
              </button>
            )}
        </div>
      </div>
    );
  };

  const renderWarmupSlide = () => {
    const warmup = data.warmup;
    return (
        <div className="flex flex-col w-full h-full text-left bg-white dark:bg-black" style={{fontSize: `${zoomLevel}rem`}}>
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-center p-12 md:p-24 relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

                {/* Left Side: Question & Link */}
                <div className="flex-1 flex flex-col justify-center gap-8 z-10">
                    <div className="flex items-center gap-3">
                        <span className="px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-[0.4em] font-black text-indigo-600 uppercase tracking-[0.2em]">
                            Hoạt động khởi động
                        </span>
                        <span className="px-4 py-2 rounded-full bg-slate-100 dark:bg-zinc-800 text-[0.4em] font-black text-slate-500 uppercase tracking-widest">
                            Slide {currentSlide === -2 ? 2 : 0}
                        </span>
                    </div>
                    <h2 className={`text-[2.2em] font-black uppercase tracking-tighter leading-tight ${backgroundImage ? 'text-black' : 'text-slate-900 dark:text-white'}`}>
                        <MathRenderer content={warmup?.question || "Câu hỏi khởi động..."} customColor={customMathColor} />
                    </h2>
                    <button 
                        onClick={() => setCurrentSlide(data.keyConcepts ? -1 : 0)}
                        className="flex items-center gap-3 text-[0.7em] font-black text-indigo-600 dark:text-indigo-400 hover:translate-x-4 transition-all uppercase tracking-[0.2em] group"
                    >
                        Vào nội dung bài học <ChevronRight className="w-[1.2em] h-[1.2em] group-hover:scale-125 transition-transform" />
                    </button>
                </div>

                {/* Right Side: Image */}
                <div className="flex-1 w-full h-full min-h-[400px] relative group z-10">
                    <div className="absolute inset-0 rounded-[3rem] overflow-hidden border-8 border-white dark:border-zinc-800 shadow-2xl">
                        {warmup?.imageUrl ? (
                            <img 
                                src={warmup.imageUrl} 
                                alt="Warmup" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-zinc-900 flex flex-col items-center justify-center text-slate-400 gap-6">
                                <ImageIcon className="w-24 h-24 opacity-20" />
                                <p className="text-[0.5em] font-black uppercase tracking-[0.3em] opacity-40">Chưa có ảnh minh họa</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Image URL Editor (Teacher only) */}
                    {role === 'teacher' && onUpdateData && (
                        <div className="absolute bottom-8 left-8 right-8 opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex gap-3 border border-indigo-500/20">
                                <input 
                                    type="text" 
                                    placeholder="Dán link ảnh minh họa vào đây..."
                                    className="flex-1 bg-transparent border-none outline-none text-[0.4em] font-bold text-slate-700 dark:text-slate-200"
                                    defaultValue={warmup?.imageUrl}
                                    onBlur={(e) => {
                                        const newUrl = e.target.value;
                                        if (newUrl !== warmup?.imageUrl) {
                                            const newData = {
                                                ...data,
                                                warmup: {
                                                    ...warmup!,
                                                    imageUrl: newUrl
                                                }
                                            };
                                            onUpdateData(newData);
                                        }
                                    }}
                                />
                                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                                    <Globe className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
  };

  const renderKeyConceptsSlide = () => (
    <div className="flex flex-col w-full h-full text-left bg-[#050505]" style={{fontSize: `${zoomLevel}rem`}}>
        <div className="w-full h-full flex flex-col overflow-hidden relative">
            
            {/* Header - Ultra Minimalist & Elegant */}
            <div className="w-full px-12 py-10 flex justify-between items-center shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <div className="w-1 h-10 bg-indigo-500/80 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.4)]"></div>
                    <h2 className="text-[1.2em] font-bold uppercase tracking-[0.4em] text-white/90">
                        Kiến thức trọng tâm
                    </h2>
                    {role === 'teacher' && (
                        <button 
                            onClick={() => setIsEditingKeyConcepts(!isEditingKeyConcepts)} 
                            className={`p-3 rounded-full transition-all ${isEditingKeyConcepts ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}
                            title={isEditingKeyConcepts ? "Lưu" : "Sửa nội dung"}
                        >
                            {isEditingKeyConcepts ? <CheckCircle className="w-6 h-6" /> : <PenTool className="w-6 h-6" />}
                        </button>
                    )}
                </div>
                
                <button 
                    onClick={() => setCurrentSlide(0)} 
                    className="group flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-all text-[0.45em] font-medium uppercase tracking-[0.2em] border border-white/10 shadow-2xl"
                >
                    BẮT ĐẦU LUYỆN TẬP <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-indigo-400" />
                </button>
            </div>
            
            {/* Content - Maximized Space */}
            <div className="flex-grow overflow-y-auto custom-scrollbar px-12 md:px-24 py-4 w-full">
                <div className="w-full text-[1.1em] font-bold leading-[1.8] text-zinc-200 selection:bg-indigo-500/30 font-sans">
                    {isEditingKeyConcepts ? (
                        <textarea
                            value={editableKeyConcepts}
                            onChange={(e) => setEditableKeyConcepts(e.target.value)}
                            className="w-full h-[60vh] bg-zinc-900/50 text-white p-8 rounded-3xl border border-indigo-500/30 focus:border-indigo-500 outline-none font-sans font-bold text-[0.8em] leading-relaxed resize-none"
                            placeholder="Nhập kiến thức trọng tâm tại đây..."
                        />
                    ) : (
                        <MathRenderer content={editableKeyConcepts || "Không có nội dung."} customColor="#facc15" />
                    )}
                </div>
                
                {/* Footer spacer */}
                <div className="h-48"></div>
            </div>

            {/* Subtle Ambient Light */}
            <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
        </div>
    </div>
  );

  const renderIntroSlide = () => {
    return (
      <div 
        className="flex-grow flex flex-col items-center justify-center relative overflow-hidden bg-black text-white p-8 cursor-pointer"
        onClick={() => !isEditingIntro && setCurrentSlide(-3)}
      >
        {introEffect === 0 && <BalloonEffect />}
        {introEffect === 1 && <Fireworks />}
        {introEffect === 2 && <SunflowerEffect />}
        {introEffect === 3 && <BirdsEffect />}
        {introEffect === 4 && <SolarSystemEffect />}
        <div className="z-10 text-center space-y-8 max-w-6xl relative">
          {role === 'teacher' && (
            <button 
                onClick={(e) => { e.stopPropagation(); setIsEditingIntro(!isEditingIntro); }} 
                className={`absolute -top-16 right-0 p-3 rounded-full transition-all ${isEditingIntro ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}
                title={isEditingIntro ? "Lưu" : "Sửa nội dung"}
            >
                {isEditingIntro ? <CheckCircle className="w-6 h-6" /> : <PenTool className="w-6 h-6" />}
            </button>
          )}
          {isEditingIntro ? (
            <textarea 
                value={editableIntroText}
                onChange={(e) => setEditableIntroText(e.target.value)}
                className="w-full bg-white/10 text-white p-8 rounded-3xl border border-indigo-500/30 outline-none font-sans font-bold text-[4rem] text-center leading-tight"
                rows={2}
                onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h1 className="text-[6rem] md:text-[8rem] font-black leading-tight animate-rainbow drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              {editableIntroText}
            </h1>
          )}
          <p className="text-[1.5rem] font-bold text-white/40 uppercase tracking-[0.5em] animate-pulse">Click để bắt đầu</p>
        </div>
      </div>
    );
  };

  const renderGuideModal = () => {
    if (!showGuideModal) return null;
    
    const shortcuts = [
      { key: 'K', desc: 'Vòng quay may mắn' },
      { key: 'B', desc: 'Bút viết (Overlay)' },
      { key: 'T', desc: 'Tắt/Mở đồng hồ' },
      { key: '9', desc: 'Kiến thức trọng tâm' },
      { key: '0', desc: 'Slide Cảm ơn' },
      { key: 'F', desc: 'Toàn màn hình' },
      { key: 'S', desc: 'Xuất file Word' },
      { key: 'A', desc: 'Hiện đáp án (GV)' },
      { key: 'W', desc: 'Mở trình duyệt Web' },
      { key: 'H', desc: 'Hiện gợi ý' },
      { key: 'L', desc: 'Đổi bố cục đáp án' },
      { key: '+/-', desc: 'Phóng to/Thu nhỏ' },
      { key: '←/→', desc: 'Chuyển Slide' },
      { key: 'Alt+C', desc: 'Đổi màu chữ' },
      { key: 'Alt+M', desc: 'Đổi màu Math' },
      { key: 'Alt+H', desc: 'Ẩn/Hiện Menu' },
    ];

    return (
      <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowGuideModal(false)}>
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-2xl w-full p-8 shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-6 shrink-0">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
              <Keyboard className="w-8 h-8 text-indigo-500" />
              Hướng dẫn phím tắt
            </h3>
            <button onClick={() => setShowGuideModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{s.desc}</span>
                  <kbd className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded shadow-sm text-indigo-600 dark:text-indigo-400 font-black text-sm min-w-[30px] text-center">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/30">
              <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                <strong>Mẹo:</strong> Bạn có thể di chuột lên các nút công cụ để xem phím tắt tương ứng được hiển thị ở góc trên bên phải của nút.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderThankYouSlide = () => {
    return (
      <div className="flex-grow flex flex-col items-center justify-center relative overflow-hidden bg-black text-white p-8">
        <Fireworks />
        <div className="z-10 text-center space-y-8 max-w-6xl relative">
          {role === 'teacher' && (
            <button 
                onClick={() => setIsEditingThankYou(!isEditingThankYou)} 
                className={`absolute -top-16 right-0 p-3 rounded-full transition-all ${isEditingThankYou ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}
                title={isEditingThankYou ? "Lưu" : "Sửa nội dung"}
            >
                {isEditingThankYou ? <CheckCircle className="w-6 h-6" /> : <PenTool className="w-6 h-6" />}
            </button>
          )}
          {isEditingThankYou ? (
            <textarea 
                value={editableThankYouText}
                onChange={(e) => setEditableThankYouText(e.target.value)}
                className="w-full bg-white/10 text-white p-8 rounded-3xl border border-indigo-500/30 outline-none font-sans font-bold text-[4rem] text-center leading-tight"
                rows={2}
            />
          ) : (
            <h1 className="text-[6rem] md:text-[8rem] font-black leading-tight animate-rainbow drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              {editableThankYouText}
            </h1>
          )}
          <div className="flex justify-center gap-12 mt-12">
            <Trophy className="w-32 h-32 text-amber-400 animate-bounce" />
            <GraduationCap className="w-32 h-32 text-indigo-400 animate-bounce [animation-delay:200ms]" />
            <CheckCircle className="w-32 h-32 text-emerald-400 animate-bounce [animation-delay:400ms]" />
          </div>
        </div>
      </div>
    );
  };

  const renderTitleSlide = () => {
    const titleContent = isEditingTitle ? (
        <input 
            value={editableTopic}
            onChange={(e) => setEditableTopic(e.target.value)}
            className="w-full bg-transparent text-center text-[1.8em] font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-6 leading-none border-b-2 border-indigo-500 outline-none font-sans"
        />
    ) : (
        <h1 className={`text-[1.8em] font-black uppercase tracking-tighter mb-6 leading-none text-center text-justify ${titleMode === 1 ? 'animate-color-glow' : titleMode === 2 ? 'animate-gradient-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500' : titleMode === 3 ? 'animate-pulse-glow text-white' : titleMode === 4 ? 'animate-neon-flicker text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
            {editableTopic}
        </h1>
    );

    const metaContent = isEditingTitle ? (
        <div className="flex justify-center gap-2 text-[0.8em] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            <input 
                value={editableSubject}
                onChange={(e) => setEditableSubject(e.target.value)}
                className="bg-transparent text-right border-b border-slate-300 outline-none font-sans"
            />
            <span>•</span>
            <input 
                value={editableGrade}
                onChange={(e) => setEditableGrade(e.target.value)}
                className="bg-transparent text-left border-b border-slate-300 outline-none font-sans"
            />
        </div>
    ) : (
        <p className={`text-[0.8em] font-bold uppercase tracking-widest ${titleMode >= 1 ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
            {editableSubject} • {editableGrade}
        </p>
    );

    const renderModeContent = () => {
        switch(titleMode) {
            case 1: // Neon Glow
                return (
                    <div className="p-12 rounded-[4rem] border-8 shadow-2xl animate-fade-in-up bg-black/80 backdrop-blur-md border-pink-500/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-pink-900/20 animate-pulse"></div>
                        <div className="flex justify-center mb-6 relative z-10">
                            <GraduationCap className="w-[3em] h-[3em] text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.8)] animate-bounce" />
                        </div>
                        <div className="relative z-10">{titleContent}</div>
                        <div className="w-48 h-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mx-auto mb-8 opacity-80 shadow-[0_0_10px_#ec4899]"></div>
                        <div className="relative z-10">{metaContent}</div>
                    </div>
                );
            case 2: // Cosmic Hologram
                return (
                    <div className="p-12 rounded-[4rem] border-8 shadow-2xl animate-fade-in-up bg-indigo-950/90 backdrop-blur-xl border-indigo-500/30 relative overflow-hidden">
                        <div className="absolute top-10 left-10 animate-float-icon opacity-50"><Globe className="w-16 h-16 text-blue-400" /></div>
                        <div className="absolute bottom-10 right-10 animate-float-icon opacity-50" style={{animationDelay: '1s'}}><Wand2 className="w-16 h-16 text-purple-400" /></div>
                        <div className="flex justify-center mb-6 relative z-10">
                            <GraduationCap className="w-[3em] h-[3em] text-indigo-400 drop-shadow-[0_0_15px_rgba(129,140,248,0.8)]" />
                        </div>
                        <div className="relative z-10">{titleContent}</div>
                        <div className="w-48 h-3 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mx-auto mb-8 opacity-80 shadow-[0_0_10px_#818cf8]"></div>
                        <div className="relative z-10">{metaContent}</div>
                    </div>
                );
            case 3: // Typewriter Spotlight
                return (
                    <div className="p-12 rounded-[4rem] border-8 shadow-2xl animate-fade-in-up bg-slate-900/95 backdrop-blur-md border-amber-500/30 relative overflow-hidden">
                        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.15),transparent_50%)] animate-pulse-glow"></div>
                        <div className="flex justify-center mb-6 relative z-10">
                            <GraduationCap className="w-[3em] h-[3em] text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
                        </div>
                        <div className="relative z-10">{titleContent}</div>
                        <div className="w-48 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mx-auto mb-8 opacity-80 shadow-[0_0_10px_#fbbf24]"></div>
                        <div className="relative z-10">{metaContent}</div>
                    </div>
                );
            case 4: // Cinematic Pulse
                return (
                    <div className="p-12 rounded-[4rem] border-8 shadow-2xl animate-fade-in-up bg-zinc-950/95 backdrop-blur-md border-cyan-500/40 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(6,182,212,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-gradient-text"></div>
                        <div className="flex justify-center mb-6 relative z-10">
                            <GraduationCap className="w-[3em] h-[3em] text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                        </div>
                        <div className="relative z-10">{titleContent}</div>
                        <div className="w-48 h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full mx-auto mb-8 opacity-80 shadow-[0_0_10px_#06b6d4]"></div>
                        <div className="relative z-10">{metaContent}</div>
                    </div>
                );
            default: // Mode 0: Default
                return (
                    <div className={`p-12 rounded-[4rem] border-8 shadow-2xl animate-fade-in-up ${hasBgImageActive ? 'bg-white/90 backdrop-blur-sm border-indigo-200' : 'bg-slate-50 dark:bg-zinc-900 border-indigo-100 dark:border-zinc-800'}`}>
                        <div className="flex justify-center mb-6">
                            <GraduationCap className="w-[3em] h-[3em] text-indigo-600 dark:text-indigo-400 drop-shadow-xl" />
                        </div>
                        {titleContent}
                        <div className="w-48 h-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full mx-auto mb-8 opacity-80"></div>
                        {metaContent}
                    </div>
                );
        }
    };

    return (
        <div className={`flex flex-col items-center justify-center pt-2 pb-16 px-6 md:px-12 w-full h-full text-center ${!hasBgImageActive && titleMode === 0 ? 'bg-white dark:bg-zinc-950' : titleMode > 0 ? 'bg-black/90' : ''}`} style={{fontSize: `${zoomLevel}rem`}}>
            <div className="max-w-5xl w-full flex flex-col gap-10 relative">
                {role === 'teacher' && (
                    <>
                        <button 
                            onClick={() => setTitleMode(prev => (prev + 1) % 5)} 
                            className={`absolute -top-10 -left-10 p-3 rounded-full transition-all bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 hover:scale-110 z-20`}
                            title="Đổi hiệu ứng"
                        >
                            <Wand2 className="w-6 h-6" />
                        </button>
                        <button 
                            onClick={() => setIsEditingTitle(!isEditingTitle)} 
                            className={`absolute -top-10 -right-10 p-3 rounded-full transition-all z-20 ${isEditingTitle ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200'}`}
                            title={isEditingTitle ? "Lưu" : "Sửa nội dung"}
                        >
                            {isEditingTitle ? <CheckCircle className="w-6 h-6" /> : <PenTool className="w-6 h-6" />}
                        </button>
                    </>
                )}
                
                {renderModeContent()}

                <div className="mt-6 flex justify-center gap-4 relative z-10">
                    <span className={`px-6 py-2 rounded-full border text-[0.5em] font-bold shadow-sm ${titleMode > 0 ? 'bg-white/10 border-white/20 text-white/80' : 'bg-white dark:bg-black border-slate-200 dark:border-slate-800 text-slate-500'}`}>
                        {questions.length} Câu hỏi
                    </span>
                    <span className={`px-6 py-2 rounded-full border text-[0.5em] font-bold shadow-sm ${titleMode > 0 ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'}`}>
                        Chế độ Luyện Tập
                    </span>
                </div>

                <div className="flex justify-center relative z-10">
                    <button 
                        onClick={() => setCurrentSlide(-2)} 
                        className={`px-12 py-6 rounded-full font-black text-[0.8em] hover:scale-105 active:scale-95 transition-all shadow-2xl animate-bounce ${titleMode === 1 ? 'bg-pink-600 hover:bg-pink-700 text-white' : titleMode === 2 ? 'bg-indigo-500 hover:bg-indigo-600 text-white' : titleMode === 3 ? 'bg-amber-500 hover:bg-amber-600 text-white' : titleMode === 4 ? 'bg-cyan-600 hover:bg-cyan-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                    >
                        BẮT ĐẦU NGAY
                    </button>
                </div>
            </div>
        </div>
    );
  };

  if (!isStarted) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-2xl max-w-lg w-full text-center border-4 border-indigo-100 animate-fade-in-up">
            <School className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
            <h2 className="text-4xl font-black mb-4 dark:text-white uppercase tracking-tighter leading-none">{config.topic}</h2>
            <p className="text-xl text-slate-500 font-bold mb-10 italic">{config.subject} - {config.grade}</p>
            <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Nhập tên..." className="w-full p-6 rounded-2xl bg-slate-100 dark:bg-slate-900 text-center text-2xl font-black mb-8 border-2 border-transparent focus:border-indigo-600 outline-none" />
            <button onClick={() => { setIsStarted(true); if(role === 'student') setViewMode('list'); }} disabled={!studentName.trim()} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-2xl shadow-xl disabled:opacity-50 hover:bg-indigo-700 active:scale-95 transition-all uppercase">VÀO LÀM BÀI</button>
        </div>
    </div>
  );

  if (!questions || questions.length === 0) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                <p className="text-red-500 font-bold mb-4">Không tìm thấy dữ liệu câu hỏi.</p>
                <button onClick={onReset} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Quay lại</button>
            </div>
        </div>
    );
  }

  return (
    <div ref={containerRef} className={`min-h-screen flex flex-col ${!hasBgImageActive ? 'bg-slate-50 dark:bg-black' : ''} ${isFullscreen ? 'fixed inset-0 z-[100]' : ''}`} style={combinedStyle}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in-right {
            animation: slideInRight 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          }
          @keyframes zoomIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-zoom-in {
            animation: zoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          @keyframes color-change-glow {
            0% { text-shadow: 0 0 10px #ff0055, 0 0 20px #ff0055, 0 0 30px #ff0055; color: #fff; }
            25% { text-shadow: 0 0 10px #00ffaa, 0 0 20px #00ffaa, 0 0 30px #00ffaa; color: #fff; }
            50% { text-shadow: 0 0 10px #5500ff, 0 0 20px #5500ff, 0 0 30px #5500ff; color: #fff; }
            75% { text-shadow: 0 0 10px #ffaa00, 0 0 20px #ffaa00, 0 0 30px #ffaa00; color: #fff; }
            100% { text-shadow: 0 0 10px #ff0055, 0 0 20px #ff0055, 0 0 30px #ff0055; color: #fff; }
          }
          .animate-color-glow {
            animation: color-change-glow 4s infinite alternate;
          }
          @keyframes float-icon {
            0% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(10deg); }
            100% { transform: translateY(0px) rotate(0deg); }
          }
          .animate-float-icon {
            animation: float-icon 6s ease-in-out infinite;
          }
          @keyframes pulse-glow {
            0% { text-shadow: 0 0 10px rgba(255,255,255,0.5); transform: scale(1); }
            50% { text-shadow: 0 0 30px rgba(255,255,255,1), 0 0 50px rgba(255,255,255,0.8); transform: scale(1.02); }
            100% { text-shadow: 0 0 10px rgba(255,255,255,0.5); transform: scale(1); }
          }
          .animate-pulse-glow {
            animation: pulse-glow 3s infinite ease-in-out;
          }
          @keyframes neon-flicker {
            0%, 19%, 21%, 23%, 25%, 54%, 56%, 100% { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #0ff, 0 0 40px #0ff, 0 0 80px #0ff; }
            20%, 24%, 55% { text-shadow: none; }
          }
          .animate-neon-flicker {
            animation: neon-flicker 2s infinite alternate;
          }
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient-text {
            background-size: 200% auto;
            animation: gradient-shift 3s linear infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}</style>

        {/* Invisible Hover Trigger Zone */}
        <div 
            className="fixed top-0 left-0 right-0 h-4 z-[60]" 
            onMouseEnter={handleHeaderMouseEnter} 
        />

        {/* Compact Header */}
        <header 
            className={`bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 fixed top-0 left-0 right-0 z-[55] px-2 h-10 flex justify-between items-center no-print shadow-sm transition-transform duration-300 ${showHeader ? 'translate-y-0' : '-translate-y-full'}`}
            onMouseEnter={handleHeaderMouseEnter}
            onMouseLeave={handleHeaderMouseLeave}
        >
            <div className="flex items-center gap-2">
                <button onClick={onReset} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg" title="Home"><Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400"/></button>
                <AnimatedBookTitle 
                    title={editableTopic} 
                    isEditing={isEditingTitle} 
                    onEdit={() => setIsEditingTitle(true)} 
                    onChange={(e) => setEditableTopic(e.target.value)} 
                    onSave={() => setIsEditingTitle(false)} 
                />
            </div>
            <div className="flex items-center gap-1">
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
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg px-2 py-0.5 mr-2 border border-slate-200 dark:border-zinc-700">
                    <Type className="w-3 h-3 text-slate-400" />
                    <input 
                        type="text" 
                        value={exportFileName} 
                        onChange={(e) => setExportFileName(e.target.value)}
                        placeholder="Tên file..."
                        className="bg-transparent border-none outline-none text-[10px] w-24 dark:text-zinc-200 font-bold"
                        title="Đặt tên file khi tải về"
                    />
                </div>
                <div className="flex gap-1 mr-2">
                    <button onClick={handleWordExportEquation} className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700" title="Tải Word (Equation)"><FileOutput className="w-3.5 h-3.5" /></button>
                    <button onClick={handleWordExportStudentEquation} className="p-1 bg-teal-600 text-white rounded-md hover:bg-teal-700" title="Tải Word HS (Equation)"><FileOutput className="w-3.5 h-3.5" /></button>
                    <button onClick={handleWordExportStudentEquationV3} className="p-1 bg-purple-600 text-white rounded-md hover:bg-purple-700" title="Tải Word 3 nội dung (Equation)"><FileOutput className="w-3.5 h-3.5" /></button>
                    <button onClick={handleWordExportLatex} className="p-1 bg-amber-600 text-white rounded-md hover:bg-amber-700" title="Tải Word (Latex)"><FileOutput className="w-3.5 h-3.5" /></button>
                    <button onClick={handleLatexExport2} className="p-1 bg-pink-600 text-white rounded-md hover:bg-pink-700" title="Tải Latex 2 (Màu hồng)"><FileOutput className="w-3.5 h-3.5" /></button>
                </div>
                <button onClick={handleExport} className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-lg relative" title="Save"><Save className="w-4 h-4"/><ShortcutLabel>S</ShortcutLabel></button>
                <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-lg p-0.5">
                    <button onClick={() => { setViewMode('list'); setCurrentSlide(0); }} className={`p-1 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 shadow text-indigo-600' : 'text-slate-400'}`}><ListChecks className="w-3.5 h-3.5"/></button>
                    <button onClick={() => { setViewMode('slide'); setCurrentSlide(-3); }} className={`p-1 rounded-md ${viewMode === 'slide' ? 'bg-white dark:bg-zinc-800 shadow text-indigo-600' : 'text-slate-400'}`}><MonitorPlay className="w-3.5 h-3.5"/></button>
                </div>
                <button onClick={() => setOptionLayout(prev => (prev === 'grid' ? 'stack' : 'grid'))} className={`p-1.5 rounded-lg relative ${optionLayout === 'stack' ? 'text-amber-600 bg-amber-50 dark:bg-zinc-800' : 'text-slate-400'}`} title="Chế độ xuống dòng">
                  <ListChecks className="w-4 h-4" />
                  <ShortcutLabel>L</ShortcutLabel>
                </button>
                {role === 'teacher' && <button onClick={() => setShowAnswersGlobal(!showAnswersGlobal)} className={`p-1.5 rounded-lg relative ${showAnswersGlobal ? 'text-indigo-600 bg-indigo-50 dark:bg-zinc-800' : 'text-slate-400'}`} title="Show Answers"><Eye className="w-4 h-4" /><ShortcutLabel>A</ShortcutLabel></button>}
                {!isSubmitted && <button onClick={() => { setIsSubmitted(true); setShowScoreModal(true); setIsTimerRunning(false); }} className="px-2.5 py-1 bg-emerald-600 text-white font-black rounded-lg text-[10px] hover:bg-emerald-700">NỘP</button>}
                <button onClick={toggleFullScreen} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-300" title="Fullscreen">{isFullscreen ? <Minimize className="w-4 h-4"/> : <Maximize className="w-4 h-4"/>}</button>
            </div>
        </header>

        {/* Main Content Area - Split Screen */}
        <div className="flex flex-grow relative overflow-hidden">
            <main 
                className={`flex flex-col relative transition-all duration-0 ${viewMode === 'slide' ? '' : 'p-4 pt-12 md:p-8 md:pt-16 bg-slate-50 dark:bg-black'} `}
                style={{ 
                    width: showWebView && !isWebCollapsed ? `${webSplitRatio}%` : '100%',
                    maxWidth: showWebView && !isWebCollapsed ? 'none' : '',
                }}
            >
                <div className={`transition-all duration-500 h-full flex flex-col ${!showWebView && viewMode !== 'slide' ? 'max-w-5xl mx-auto w-full' : 'w-full'}`}>
                    {viewMode === 'list' 
                      ? (
                        <>
                          {renderExamMeta(false)}
                          {questions.map((q, i) => renderQuestionCard(q, i, false))}
                        </>
                      )
                      : (
                        <div key={currentSlide} className={`w-full h-full flex flex-col ${currentTransition.class}`}>
                            {currentSlide === -4
                                ? renderIntroSlide()
                                : currentSlide === -3
                                    ? renderTitleSlide() 
                                    : currentSlide === -2
                                        ? renderWarmupSlide()
                                        : (currentSlide === -1 && data.keyConcepts)
                                            ? renderKeyConceptsSlide()
                                            : currentSlide === questions.length
                                                ? renderThankYouSlide()
                                                : renderQuestionCard(questions[currentSlide], currentSlide, true)
                            }
                        </div>
                      )
                    }
                    
                    {/* Timer Display Bottom Left - HUGE SIZE */}
                    {viewMode === 'slide' && timer !== null && (
                      <div className="fixed bottom-8 left-8 z-[200] pointer-events-none">
                        <div className={`px-12 py-4 rounded-[3rem] font-black text-[8rem] leading-none border-8 shadow-2xl backdrop-blur-3xl transition-colors duration-200 ${timer <= 10 ? 'bg-red-600 border-white text-white animate-pulse' : 'bg-white/90 dark:bg-zinc-800/90 border-indigo-600 text-indigo-600 dark:text-indigo-400'}`}>
                            {Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}
                        </div>
                      </div>
                    )}
                </div>
            </main>

            {/* Resizer Handle - Hide when collapsed */}
            {showWebView && !isWebCollapsed && (
                <div 
                    className="w-2 bg-slate-200 dark:bg-zinc-800 hover:bg-indigo-500 dark:hover:bg-indigo-500 cursor-col-resize flex items-center justify-center z-[110] transition-colors"
                    onMouseDown={startResizeWeb}
                >
                    <GripVertical className="w-4 h-4 text-slate-400" />
                </div>
            )}

            {/* Right Panel: Web View */}
            {showWebView && (
                <div 
                    className="h-full bg-white dark:bg-black relative shadow-2xl z-[100] transition-all duration-300 ease-in-out"
                    style={{ 
                        width: isWebCollapsed ? '0px' : `${100 - webSplitRatio}%`,
                        visibility: isWebCollapsed ? 'hidden' : 'visible'
                    }}
                >
                    <div className="absolute top-2 right-2 z-[160] flex gap-1">
                        <button onClick={() => setIsWebCollapsed(true)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full shadow-lg transition-transform hover:scale-110" title="Thu gọn"><ChevronRight className="w-4 h-4"/></button>
                        <button onClick={() => { setShowWebView(false); setIsWebCollapsed(false); }} className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-110" title="Đóng"><X className="w-4 h-4"/></button>
                    </div>
                    <iframe 
                        id="web-view-iframe"
                        src={webUrl} 
                        className="w-full h-full border-0" 
                        allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write; display-capture"
                        allowFullScreen
                    />
                </div>
            )}

            {/* Restore Trigger when collapsed */}
            {showWebView && isWebCollapsed && (
                <button
                    onClick={() => setIsWebCollapsed(false)}
                    className="fixed right-0 top-1/2 -translate-y-1/2 z-[160] bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-l-xl shadow-lg transition-transform hover:scale-110 animate-fade-in-right"
                    title="Mở rộng Web"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}
        </div>

        {/* Floating Toolbar Area */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[150] flex flex-col items-center gap-2 no-print">
            {showToolbar ? (
                <div className="bg-slate-900/90 backdrop-blur-md rounded-full p-1.5 flex gap-2 border border-white/10 shadow-xl items-center animate-fade-in-up">
                    {config.mode === 'matrix' && config.matrixRows && (
                        <>
                            <div className="w-px h-6 bg-white/20"></div>
                            <button 
                                onClick={handleSaveMatrix} 
                                disabled={isSavingMatrix}
                                className={`p-2 transition-colors ${isSavingMatrix ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}
                                title="Lưu ma trận đề này"
                            >
                                {isSavingMatrix ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudUpload className="w-5 h-5"/>}
                            </button>
                        </>
                    )}
                    <button onClick={() => setShowWebView(true)} className={`p-2 transition-colors relative ${showWebView ? 'text-teal-400' : 'text-slate-400 hover:text-teal-400'}`} title="Mở Web (W)"><Globe className="w-5 h-5"/><ShortcutLabel>W</ShortcutLabel></button>
                    <button onClick={() => setShowEduMenu(prev => !prev)} className={`p-2 transition-colors relative ${showEduMenu ? 'text-indigo-400' : 'text-slate-400 hover:text-indigo-400'}`} title="Web dạy học (Q)"><GalleryHorizontalEnd className="w-5 h-5"/><ShortcutLabel>Q</ShortcutLabel></button>
                    <div className="w-px h-6 bg-white/20"></div>
                    <div className="flex items-center gap-1 bg-black/20 rounded-full px-2 py-0.5">
                        <button onClick={handleZoomOut} className="p-1 text-slate-400 hover:text-white relative"><ZoomOut className="w-4 h-4"/><ShortcutLabel>-</ShortcutLabel></button>
                        <span className="text-xs font-bold text-white min-w-[30px] text-center">{zoomLevel.toFixed(1)}x</span>
                        <button onClick={handleZoomIn} className="p-1 text-slate-400 hover:text-white relative"><ZoomIn className="w-4 h-4"/><ShortcutLabel>+</ShortcutLabel></button>
                    </div>
                    <div className="w-px h-6 bg-white/20"></div>
                    
                    {/* Tool Menu */}
                    <div className="relative">
                        <button 
                            onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
                            className={`p-2 rounded-full transition-colors ${activeMenu === 'tools' ? 'text-white bg-white/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                            title="Công cụ giảng dạy"
                        >
                            <Sparkles className="w-5 h-5" />
                        </button>
                        
                        {activeMenu === 'tools' && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex bg-slate-800 p-2 rounded-xl shadow-2xl border border-slate-700 flex-col gap-1 min-w-[200px] animate-fade-in-up">
                                <button 
                                    onClick={() => { setShowRandomPicker(true); setActiveMenu(null); }}
                                    className="px-3 py-2 text-left rounded-lg text-xs font-bold transition-colors text-slate-300 hover:bg-slate-700 flex items-center gap-3"
                                >
                                    <RotateCw className="w-4 h-4 text-amber-400" /> Vòng quay may mắn
                                </button>
                                <button 
                                    onClick={() => { setShowBlackboard(true); setBlackboardMode('overlay'); setActiveMenu(null); }}
                                    className="px-3 py-2 text-left rounded-lg text-xs font-bold transition-colors text-slate-300 hover:bg-slate-700 flex items-center gap-3"
                                >
                                    <PenTool className="w-4 h-4 text-indigo-400" /> Viết trên màn hình
                                </button>
                                <button 
                                    onClick={() => { setShowBlackboard(true); setBlackboardMode('side'); setActiveMenu(null); }}
                                    className="px-3 py-2 text-left rounded-lg text-xs font-bold transition-colors text-slate-300 hover:bg-slate-700 flex items-center gap-3"
                                >
                                    <PanelRightOpen className="w-4 h-4 text-emerald-400" /> Mở bảng phụ (Cạnh)
                                </button>
                            </div>
                        )}
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

                    {/* Transition Effect Selection */}
                    <div className="relative">
                        <button 
                            onClick={() => setActiveMenu(activeMenu === 'transition' ? null : 'transition')}
                            className={`p-2 rounded-full transition-colors ${activeMenu === 'transition' ? 'text-white bg-white/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                            title="Hiệu ứng chuyển cảnh"
                        >
                            <GalleryHorizontalEnd className="w-5 h-5" />
                        </button>
                        
                        {activeMenu === 'transition' && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 flex bg-slate-800 p-2 rounded-xl shadow-2xl border border-slate-700 flex-col gap-1 min-w-[160px] animate-fade-in-up">
                                {TRANSITIONS.map((trans) => (
                                    <button 
                                        key={trans.id} 
                                        onClick={() => { setCurrentTransition(trans); setActiveMenu(null); }}
                                        className={`px-3 py-2 text-left rounded-lg text-xs font-bold transition-colors ${currentTransition.id === trans.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
                                    >
                                        {trans.label}
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
                    <button onClick={() => setShowGuideModal(true)} className="p-2 text-slate-400 hover:text-indigo-400 rounded-full hover:bg-white/10 transition-colors" title="Hướng dẫn">
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

        {renderGuideModal()}

        {showScoreModal && (
            <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 animate-fade-in">
                <div className="bg-white dark:bg-slate-800 p-16 rounded-[4rem] max-w-lg w-full text-center shadow-2xl border-t-8 border-indigo-600">
                    <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-6 animate-bounce" />
                    <h2 className="text-8xl font-black text-indigo-600 dark:text-indigo-400 mb-4 tracking-tighter">{calculateScore()}/10</h2>
                    <p className="text-2xl text-slate-500 font-black uppercase mb-10">Xuất sắc, {studentName}!</p>
                    <button onClick={() => { setShowScoreModal(false); setShowAnswersGlobal(true); setViewMode('list'); }} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-2xl hover:bg-indigo-700 transition-all uppercase">XEM BÀI GIẢI</button>
                </div>
            </div>
        )}

        {/* Overlays */}
        {showRandomPicker && (
            <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                <RandomPicker onClose={() => setShowRandomPicker(false)} />
            </div>
        )}

        {showBlackboard && (
            <Blackboard 
                onClose={() => setShowBlackboard(false)} 
                mode={blackboardMode} 
                onModeChange={setBlackboardMode} 
            />
        )}

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
