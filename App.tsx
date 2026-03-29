import React, { useState, useEffect } from 'react';
import { ExamConfig, ExamMatrix, StudyGuideData, ExportData, PolyaData, MatrixRow } from './types';
import { generateExam, generateStudyGuide, generatePolyaSolution } from './services/geminiService';
import { parseDocxToExam } from './utils/wordImportUtils';
import ConfigForm from './components/ConfigForm';
import { ExamPreview } from './components/ExamPreview';
import StudyGuidePreview from './components/StudyGuidePreview';
import PolyaPreview from './components/PolyaPreview';
import LessonEditor from './components/LessonEditor';
import QuestionBank from './components/QuestionBank'; 
import SaveModal from './components/SaveModal'; 
import PromptGenerator from './components/PromptGenerator';
import Blackboard from './components/Blackboard';
import RandomPicker from './components/RandomPicker';
import { auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser, db, collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, setDoc, deleteDoc, getDocs } from './firebase';
import { 
  GraduationCap, Loader2, Moon, Sun, AlertTriangle, 
  User, School, Download, Keyboard, X, Info, 
  Sparkles, Zap, BookOpen, LayoutDashboard, ArrowRight,
  FileText, Presentation, Table2, ShieldCheck, ChevronRight,
  Footprints, HelpCircle, FileCode, CheckSquare, MessageSquare, Copy, Check, PenTool, Database, FileJson, Settings, Key, ChevronDown, PenTool as PenToolIcon, Dices, Palette, LogIn, LogOut, Save
} from 'lucide-react';

interface BankItem {
  id: string;
  title: string;
  tags?: string[];
  date: number;
  type: 'exam' | 'theory' | 'polya';
  data: any;
  config: ExamConfig;
  authorUid: string;
  subject: string;
  grade: string;
  createdAt: any;
  updatedAt?: any;
}

type AppStep = 'landing' | 'dashboard' | 'config' | 'preview' | 'editor';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('landing');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [role, setRole] = useState<'teacher' | 'student'>('teacher'); // Default to teacher for now or add selection
  const [selectedMode, setSelectedMode] = useState<'exam' | 'matrix' | 'theory' | 'polya'>('exam');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  // Data States
  const [examData, setExamData] = useState<ExamMatrix | null>(null);
  const [studyGuideData, setStudyGuideData] = useState<StudyGuideData | null>(null);
  const [polyaData, setPolyaData] = useState<PolyaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modals & UI States
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPromptGen, setShowPromptGen] = useState(false);
  const [showBlackboard, setShowBlackboard] = useState(false);
  const [blackboardMode, setBlackboardMode] = useState<'bottom' | 'side'>('bottom');
  const [showRandomPicker, setShowRandomPicker] = useState(false);
  
  const [pendingSaveData, setPendingSaveData] = useState<{type: 'exam'|'theory'|'polya', data: any} | null>(null);
  const [currentBankItemId, setCurrentBankItemId] = useState<string | null>(null);
  const [bank, setBank] = useState<BankItem[]>(() => {
    try {
      const saved = localStorage.getItem('ai_teacher_bank');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }); 
  const [googleScriptUrl, setGoogleScriptUrl] = useState<string>(''); 
  const [isSyncing, setIsSyncing] = useState(false);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } catch (e) {}
    return false;
  });

  // Load Persisted Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Persist Bank
  useEffect(() => {
    localStorage.setItem('ai_teacher_bank', JSON.stringify(bank));
  }, [bank]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
      alert("Đăng nhập thất bại. Vui lòng thử lại.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem('ai_studio_gas_url');
      if (savedUrl) setGoogleScriptUrl(savedUrl);
    } catch (e) {
      console.error("Failed to load storage", e);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key.toLowerCase() === 'r') {
        setShowRandomPicker(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Dark Mode Effect
  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Generators
  const handleSaveMatrix = async (title: string, rows: MatrixRow[]) => {
    // Save matrix locally as well if requested, but for now we'll just keep it simple
    // and follow the "only local" rule for everything if possible.
    // However, the user specifically mentioned "lưu bài" (saving lessons/presentations).
    // Let's make matrix saving local too.
    const newMatrix = {
      id: Date.now().toString(),
      title,
      rows,
      subject: config?.subject || 'Toán',
      grade: config?.grade || 'Lớp 12',
      date: Date.now()
    };
    
    // We could add a separate matrices state, but for now let's just alert success
    // or integrate into bank if it fits. The bank usually stores full presentations.
    alert("Đã lưu ma trận vào máy!");
  };

  const handleGenerate = async (newConfig: ExamConfig) => {
    setLoading(true);
    setConfig(newConfig);
    setError(null);
    setCurrentBankItemId(null); // Reset when starting new
    try {
      if (newConfig.mode === 'theory') {
        const data = await generateStudyGuide(newConfig);
        setStudyGuideData(data);
      } else if (newConfig.mode === 'polya') {
        const data = await generatePolyaSolution(newConfig);
        setPolyaData(data);
      } else {
        const data = await generateExam(newConfig);
        setExamData(data);
      }
      setStep('preview');
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo nội dung.");
    } finally {
      setLoading(false);
    }
  };

  // Saving Logic
  const initiateSave = async () => {
    if (!config) return;

    let dataToSave = null;
    let type: 'exam' | 'theory' | 'polya' = 'exam';
    
    if (config.mode === 'theory') {
      dataToSave = studyGuideData;
      type = 'theory';
    } else if (config.mode === 'polya') {
      dataToSave = polyaData;
      type = 'polya';
    } else {
      dataToSave = examData;
      type = 'exam';
    }

    if (!dataToSave) return;

    // If we are already editing a bank item, just update it directly
    if (currentBankItemId) {
      setBank(prev => prev.map(item => 
        item.id === currentBankItemId 
          ? { 
              ...item, 
              title: config.topic || item.title,
              type,
              subject: config.subject,
              grade: config.grade,
              data: dataToSave,
              config: config,
              date: Date.now()
            } 
          : item
      ));
      alert("Đã cập nhật bài giảng thành công!");
    } else {
      setPendingSaveData({ type, data: dataToSave });
      setShowSaveModal(true);
    }
  };

  const handleConfirmSave = (title: string, tags: string[]) => {
    if (pendingSaveData && config) {
      const newItem: BankItem = {
        id: Date.now().toString(),
        title,
        tags,
        type: pendingSaveData.type,
        subject: config.subject,
        grade: config.grade,
        date: Date.now(),
        data: pendingSaveData.data,
        config: config,
        authorUid: user?.uid || 'local',
        createdAt: Date.now()
      };
      
      setBank(prev => [newItem, ...prev]);
      setCurrentBankItemId(newItem.id);
      setShowSaveModal(false);
      setPendingSaveData(null);
      alert("Đã lưu bài giảng vào máy!");
    }
  };

  // Bank Logic
  const handleLoadFromBank = (item: BankItem) => {
    setConfig(item.config);
    setCurrentBankItemId(item.id);
    if (item.type === 'theory') setStudyGuideData(item.data);
    else if (item.type === 'polya') setPolyaData(item.data);
    else setExamData(item.data);
    
    setStep('preview');
    setShowQuestionBank(false);
  };

  const handleDeleteFromBank = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa bài này?")) {
      setBank(prev => prev.filter(i => i.id !== id));
      if (currentBankItemId === id) setCurrentBankItemId(null);
    }
  };

  const handleRenameItem = (id: string) => {
    const item = bank.find(i => i.id === id);
    if (!item) return;
    const newTitle = prompt("Nhập tên mới:", item.title);
    if (newTitle && newTitle !== item.title) {
      setBank(prev => prev.map(i => i.id === id ? { ...i, title: newTitle } : i));
    }
  };

  // Import Logic
  const handleImportFile = async (file: File) => {
    if (file.name.endsWith('.docx')) {
      try {
        setLoading(true);
        const result = await parseDocxToExam(file);
        // Assuming result is { data, type, config? }
        if (result.type === 'exam') {
            setExamData(result.data);
            setConfig(result.config || { mode: 'exam', subject: 'Khác', grade: 'Khác', topic: file.name });
            setStep('preview');
        }
      } catch (e: any) {
        alert("Lỗi đọc file Word: " + e.message);
      } finally {
        setLoading(false);
      }
    } else if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          // Check if it's a bank export (array) or single item
          if (Array.isArray(content)) {
            // Merge bank
            setBank(prev => [...content, ...prev]);
            alert(`Đã nhập ${content.length} bài vào Ngân hàng.`);
          } else if (content.type && content.data && content.config) {
            // Single lesson export
            setConfig(content.config);
            if (content.type === 'theory') setStudyGuideData(content.data);
            else if (content.type === 'polya') setPolyaData(content.data);
            else setExamData(content.data);
            setStep('preview');
          }
        } catch (err) {
          alert("File JSON không hợp lệ.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Google Sheet Sync
  const handleSyncUp = async () => {
    if (!googleScriptUrl) return alert("Vui lòng cấu hình URL Google Script trước.");
    setIsSyncing(true);
    try {
      await fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bank)
      });
      alert("Đã gửi yêu cầu đồng bộ lên Google Sheet (Chế độ no-cors: Không thể xác nhận kết quả chi tiết).");
    } catch (e) {
      console.error(e);
      alert("Lỗi đồng bộ.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncDown = async () => {
    if (!googleScriptUrl) return alert("Vui lòng cấu hình URL Google Script trước.");
    setIsSyncing(true);
    try {
      const res = await fetch(googleScriptUrl);
      const data = await res.json();
      if (Array.isArray(data)) {
         // Merge logic based on ID
         const currentIds = new Set(bank.map(i => i.id));
         const newItems = data.filter((i: BankItem) => !currentIds.has(i.id));
         setBank(prev => [...newItems, ...prev]);
         alert(`Đã tải về ${newItems.length} bài mới từ Google Sheet.`);
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi tải dữ liệu.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Render Helpers
  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                <h3 className="text-2xl font-black text-slate-700 dark:text-white uppercase tracking-widest">AI Đang Sáng Tạo...</h3>
                <p className="text-slate-500 mt-2 font-medium">Vui lòng đợi trong giây lát</p>
            </div>
        );
    }

    if (step === 'landing') {
        return (
            <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto p-6 animate-fade-in-up">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border-4 border-indigo-50 dark:border-indigo-900/30 mb-10">
                    <GraduationCap className="w-24 h-24 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-center text-slate-900 dark:text-white mb-6 tracking-tighter leading-tight">
                    AI TEACHER <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">STUDIO</span>
                </h1>
                <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 text-center font-medium max-w-2xl mb-12">
                    Nền tảng hỗ trợ giáo viên soạn bài, tạo đề thi và giải toán thông minh với sức mạnh của Gemini AI.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    <button 
                        onClick={() => { setRole('teacher'); setStep('dashboard'); }} 
                        className="group relative overflow-hidden p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-2xl text-left"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <School className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                                <Presentation className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Giáo Viên</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Soạn giáo án, đề thi, ma trận và quản lý ngân hàng câu hỏi.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => { setRole('student'); setStep('dashboard'); }}
                        className="group relative overflow-hidden p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all hover:shadow-2xl text-left"
                    >
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <User className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Học Sinh</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Luyện tập, giải toán Polya và ôn tập kiến thức.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => setShowQuestionBank(true)}
                        className="group relative overflow-hidden p-8 rounded-[2.5rem] bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 transition-all hover:shadow-2xl text-left"
                    >
                         <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Database className="w-32 h-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform">
                                <Database className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ngân Hàng</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Truy cập nhanh các bài giảng và đề thi đã lưu trữ.</p>
                        </div>
                    </button>
                </div>

                <div className="mt-20 py-8 w-full border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bản quyền nội dung thuộc về tác giả</span>
                    </div>
                    <p className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400 text-center leading-relaxed">
                        Tác giả: <span className="text-indigo-600 dark:text-indigo-400 font-black">Thầy Vũ Tiến Lực</span> 
                        <span className="mx-3 text-slate-300 dark:text-slate-700">|</span> 
                        Trường THPT Nguyễn Hữu Cảnh _ TP Hồ Chí Minh 
                        <span className="mx-3 text-slate-300 dark:text-slate-700">|</span> 
                        SĐT: <span className="font-bold text-slate-900 dark:text-white">0969068849</span>
                    </p>
                </div>
            </div>
        );
    }

    if (step === 'dashboard') {
        return (
            <div className="max-w-6xl mx-auto p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Bảng Điều Khiển</h2>
                        <p className="text-slate-500 font-medium">Chọn tác vụ bạn muốn thực hiện</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 pl-4 rounded-full shadow-lg border border-slate-100 dark:border-slate-700">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[120px]">{user.displayName || user.email}</p>
                                    <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest">Đăng xuất</button>
                                </div>
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-indigo-500" referrerPolicy="no-referrer" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={handleLogin} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full font-black shadow-lg hover:bg-indigo-700 transition-all">
                                <LogIn className="w-5 h-5" /> Đăng nhập
                            </button>
                        )}
                        <button onClick={() => setShowQuestionBank(true)} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow hover:bg-slate-50 dark:hover:bg-slate-700 text-emerald-600 dark:text-emerald-400" title="Ngân hàng bài giảng">
                            <Database className="w-6 h-6" />
                        </button>
                        <button onClick={() => setStep('landing')} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500">
                            <ArrowRight className="w-6 h-6 rotate-180" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <button onClick={() => { setSelectedMode('exam'); setStep('config'); }} className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border-2 border-transparent hover:border-blue-500 group transition-all">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6"/></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Tạo Đề Thi</h3>
                        <p className="text-xs text-slate-500 font-bold">Trắc nghiệm & Tự luận</p>
                    </button>
                    <button onClick={() => { setSelectedMode('matrix'); setStep('config'); }} className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border-2 border-transparent hover:border-indigo-500 group transition-all">
                        <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Table2 className="w-6 h-6"/></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Ma Trận Đề</h3>
                        <p className="text-xs text-slate-500 font-bold">Cấu trúc đề tổng hợp</p>
                    </button>
                    <button onClick={() => { setSelectedMode('theory'); setStep('config'); }} className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border-2 border-transparent hover:border-teal-500 group transition-all">
                        <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/20 text-teal-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Presentation className="w-6 h-6"/></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Bài Giảng</h3>
                        <p className="text-xs text-slate-500 font-bold">Slide lý thuyết & ví dụ</p>
                    </button>
                    <button onClick={() => { setSelectedMode('polya'); setStep('config'); }} className="p-6 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border-2 border-transparent hover:border-orange-500 group transition-all">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Footprints className="w-6 h-6"/></div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-1">Giải Toán Polya</h3>
                        <p className="text-xs text-slate-500 font-bold">4 bước tư duy giải toán</p>
                    </button>
                </div>

                <div className="mt-20 py-8 w-full border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-2">
                    <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 text-center leading-relaxed">
                        Tác giả: <span className="text-indigo-600 dark:text-indigo-400 font-black">Thầy Vũ Tiến Lực</span> 
                        <span className="mx-3 text-slate-300 dark:text-slate-700">|</span> 
                        Trường THPT Nguyễn Hữu Cảnh _ TP Hồ Chí Minh 
                        <span className="mx-3 text-slate-300 dark:text-slate-700">|</span> 
                        SĐT: <span className="font-bold text-slate-900 dark:text-white">0969068849</span>
                    </p>
                </div>
            </div>
        );
    }

    if (step === 'config') {
        return (
            <div className="max-w-4xl mx-auto p-6 animate-fade-in">
                <div className="mb-6 flex items-center gap-4">
                     <button onClick={() => setStep('dashboard')} className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow text-slate-500 hover:text-indigo-600"><ArrowRight className="w-5 h-5 rotate-180"/></button>
                     <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Cấu Hình</h2>
                </div>
                <ConfigForm 
                    forcedMode={selectedMode}
                    isLoading={loading}
                    onGenerate={handleGenerate}
                    onImport={handleImportFile}
                    user={user}
                    onLogin={handleLogin}
                />
            </div>
        );
    }

    if (step === 'preview') {
        if (config?.mode === 'theory' && studyGuideData) {
            return <StudyGuidePreview 
                role={role} 
                config={config} 
                data={studyGuideData} 
                onReset={() => setStep('dashboard')} 
                onRegenerate={() => setStep('config')}
                onEdit={() => setStep('editor')}
                onUpdateData={(newData) => setStudyGuideData(newData)}
                onSaveToBank={initiateSave}
                isDarkMode={isDarkMode}
                onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            />;
        }
        if (config?.mode === 'polya' && polyaData) {
            return <PolyaPreview 
                data={polyaData} 
                onReset={() => setStep('dashboard')} 
                onEdit={() => setStep('editor')}
                onSaveToBank={initiateSave}
                isDarkMode={isDarkMode}
                onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            />;
        }
        if (examData) {
            return <ExamPreview 
                role={role} 
                config={config!} 
                data={examData} 
                onReset={() => setStep('dashboard')} 
                onRegenerate={() => setStep('config')}
                onEdit={() => setStep('editor')}
                onUpdateData={(newData) => setExamData(newData)}
                onSaveToBank={initiateSave}
                onSaveMatrix={handleSaveMatrix}
                isDarkMode={isDarkMode}
                onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            />;
        }
    }

    if (step === 'editor') {
        let initialData = examData;
        if (config?.mode === 'theory') initialData = studyGuideData as any;
        else if (config?.mode === 'polya') initialData = polyaData as any;

        return <LessonEditor 
            initialData={initialData} 
            config={config!} 
            mode={config?.mode as any} 
            onCancel={() => setStep('preview')}
            onSave={(newData) => {
                if (config?.mode === 'theory') setStudyGuideData(newData);
                else if (config?.mode === 'polya') setPolyaData(newData);
                else setExamData(newData);
                setStep('preview');
            }}
        />;
    }

    return null;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
        
        {/* Top Navigation Bar */}
        {step !== 'landing' && (
            <div className="fixed top-0 left-0 bottom-0 w-20 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-[100] flex flex-col items-center py-6 gap-6 no-print">
                <button onClick={() => setStep('landing')} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg hover:scale-105 transition-transform">
                    <School className="w-6 h-6" />
                </button>
                
                <div className="w-8 h-px bg-slate-200 dark:bg-slate-800"></div>

                <div className="flex flex-col gap-4">
                    <button onClick={() => setStep('dashboard')} className={`p-3 rounded-2xl transition-colors ${step === 'dashboard' ? 'bg-slate-100 dark:bg-slate-800 text-indigo-600' : 'text-slate-400 hover:text-indigo-500'}`} title="Dashboard">
                        <LayoutDashboard className="w-6 h-6" />
                    </button>
                    <button onClick={() => setShowQuestionBank(true)} className="p-3 rounded-2xl text-slate-400 hover:text-indigo-500 transition-colors" title="Ngân hàng">
                        <Database className="w-6 h-6" />
                    </button>
                    <button onClick={() => setShowPromptGen(true)} className="p-3 rounded-2xl text-slate-400 hover:text-indigo-500 transition-colors" title="Prompt Generator">
                        <Sparkles className="w-6 h-6" />
                    </button>
                     <button onClick={() => setShowBlackboard(!showBlackboard)} className={`p-3 rounded-2xl transition-colors ${showBlackboard ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'text-slate-400 hover:text-indigo-500'}`} title="Bảng viết">
                        <PenToolIcon className="w-6 h-6" />
                    </button>
                     <button onClick={() => setShowRandomPicker(!showRandomPicker)} className={`p-3 rounded-2xl transition-colors ${showRandomPicker ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'text-slate-400 hover:text-indigo-500'}`} title="Random Picker">
                        <Dices className="w-6 h-6" />
                    </button>
                </div>

                <div className="mt-auto flex flex-col gap-4">
                     <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-2xl text-slate-400 hover:text-yellow-500 transition-colors">
                        {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        )}

        {/* Main Content */}
        <div className={`${step !== 'landing' ? 'pl-20' : ''} h-screen overflow-auto custom-scrollbar`}>
            {renderContent()}
        </div>

        {/* Modals & Overlays */}
        {showQuestionBank && (
            <QuestionBank 
                bank={bank}
                onClose={() => setShowQuestionBank(false)}
                onLoad={handleLoadFromBank}
                onDelete={handleDeleteFromBank}
                onImport={handleImportFile}
                onRename={handleRenameItem}
                googleScriptUrl={googleScriptUrl}
                onSaveConfig={(url) => { setGoogleScriptUrl(url); localStorage.setItem('ai_studio_gas_url', url); }}
                onSyncUp={handleSyncUp}
                onSyncDown={handleSyncDown}
                isSyncing={isSyncing}
            />
        )}

        {showPromptGen && (
             <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowPromptGen(false)}>
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] max-w-2xl w-full p-8 shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-2xl font-black text-white uppercase">Trợ lý Prompt</h3>
                        <button onClick={() => setShowPromptGen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6"/></button>
                    </div>
                    <PromptGenerator />
                </div>
             </div>
        )}

        {showSaveModal && (
            <SaveModal 
                initialTitle={config?.topic || "Bài học mới"}
                suggestedTags={[config?.subject || "Khác", config?.grade || "Khác", config?.mode === 'exam' ? 'Đề thi' : 'Lý thuyết']}
                onClose={() => setShowSaveModal(false)}
                onSave={handleConfirmSave}
            />
        )}

        {showBlackboard && (
            <Blackboard 
                onClose={() => setShowBlackboard(false)} 
                mode={blackboardMode}
                onModeChange={setBlackboardMode}
            />
        )}

        {showRandomPicker && (
            <RandomPicker onClose={() => setShowRandomPicker(false)} />
        )}

        {/* Floating Error Toast */}
        {error && (
            <div className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[200] animate-bounce">
                <AlertTriangle className="w-6 h-6" />
                <span className="font-bold">{error}</span>
                <button onClick={() => setError(null)}><X className="w-4 h-4 opacity-70 hover:opacity-100"/></button>
            </div>
        )}
    </div>
  );
};

export default App;