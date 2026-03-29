
import React, { useState, useRef, useEffect } from 'react';
import { SUBJECTS, GRADES, DIFFICULTY_LEVELS, QUESTION_TYPES, SAMPLE_TOPICS, CREATOR_ROLES } from '../constants';
import { ExamConfig, Subject, QuestionType, DifficultyLevel, GenMode, MatrixRow } from '../types';
import { BookOpen, Brain, Sparkles, Layers, ListChecks, Presentation as PresentationIcon, FileText, Upload, Image as ImageIcon, X, Paperclip, Plus, Trash2, Table2, Loader2, Footprints, Target, Download, FileJson, Cloud, CloudUpload, LogIn, Trash, User as UserIcon } from 'lucide-react';
import { db, collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp, User, orderBy } from '../firebase';

interface ConfigFormProps {
  onGenerate: (config: ExamConfig) => void;
  isLoading: boolean;
  onImport: (file: File) => void;
  forcedMode?: GenMode; 
  user?: User | null;
  onLogin?: () => void;
}

const ConfigForm: React.FC<ConfigFormProps> = ({ onGenerate, isLoading, onImport, forcedMode, user, onLogin }) => {
  const [mode, setMode] = useState<GenMode>(forcedMode || 'exam');
  const [subject, setSubject] = useState<Subject | string>(Subject.MATH);
  const [grade, setGrade] = useState<string>(GRADES[11]); 
  const [creatorRole, setCreatorRole] = useState<string>(CREATOR_ROLES[0]);
  
  // Đồng bộ mode nếu forcedMode thay đổi
  useEffect(() => {
    if (forcedMode) setMode(forcedMode);
  }, [forcedMode]);

  // Single Mode State
  const [topic, setTopic] = useState<string>('');
  // New detailed fields
  const [knowledgeObjectives, setKnowledgeObjectives] = useState<string>(''); // Mục tiêu kiến thức
  const [problemReq, setProblemReq] = useState<string>(''); // Yêu cầu đặc biệt về dạng toán
  const [solutionReq, setSolutionReq] = useState<string>(''); // Yêu cầu về lời giải
  const [essayRequirements, setEssayRequirements] = useState<string>(''); // Yêu cầu riêng cho tự luận

  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficultyMode, setDifficultyMode] = useState<'progressive' | 'fixed'>('progressive');
  const [targetLevel, setTargetLevel] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);

  // Matrix Mode State
  const [matrixTitle, setMatrixTitle] = useState<string>('Đề ôn tập học kì');
  const [matrixRows, setMatrixRows] = useState<MatrixRow[]>([
    { topic: '', level: DifficultyLevel.EASY, count: 2, type: QuestionType.MULTIPLE_CHOICE },
    { topic: '', level: DifficultyLevel.MEDIUM, count: 2, type: QuestionType.MULTIPLE_CHOICE },
    { topic: '', level: DifficultyLevel.HARD, count: 1, type: QuestionType.ESSAY },
  ]);
  
  const [cloudMatrices, setCloudMatrices] = useState<any[]>([]);
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [showCloudBank, setShowCloudBank] = useState(false);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{name: string, data: string, mimeType: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resourceInputRef = useRef<HTMLInputElement>(null);

  const suggestedTopics = SAMPLE_TOPICS[subject as Subject] || [];

  const handleAddRow = () => {
    setMatrixRows([...matrixRows, { topic: '', level: DifficultyLevel.MEDIUM, count: 1, type: QuestionType.MULTIPLE_CHOICE }]);
  };

  const handleRemoveRow = (index: number) => {
    if (matrixRows.length > 1) {
      const newRows = [...matrixRows];
      newRows.splice(index, 1);
      setMatrixRows(newRows);
    }
  };

  useEffect(() => {
    if (user && mode === 'matrix') {
      loadCloudMatrices();
    }
  }, [user, mode]);

  const loadCloudMatrices = async () => {
    if (!user) return;
    setIsCloudLoading(true);
    try {
      const q = query(
        collection(db, 'matrices'), 
        where('authorUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCloudMatrices(docs);
    } catch (err) {
      console.error("Failed to load cloud matrices", err);
    } finally {
      setIsCloudLoading(false);
    }
  };

  const saveToCloud = async () => {
    if (!user) {
      onLogin?.();
      return;
    }
    
    setIsCloudLoading(true);
    try {
      await addDoc(collection(db, 'matrices'), {
        title: matrixTitle,
        rows: matrixRows,
        subject,
        grade,
        authorUid: user.uid,
        createdAt: serverTimestamp()
      });
      alert("Đã lưu ma trận lên đám mây!");
      loadCloudMatrices();
    } catch (err) {
      console.error("Save failed", err);
      alert("Lỗi khi lưu lên đám mây.");
    } finally {
      setIsCloudLoading(false);
    }
  };

  const deleteFromCloud = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa ma trận này khỏi đám mây?")) return;
    try {
      await deleteDoc(doc(db, 'matrices', id));
      setCloudMatrices(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleRowChange = (index: number, field: keyof MatrixRow, value: any) => {
    const newRows = [...matrixRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setMatrixRows(newRows);
  };

  const exportMatrix = () => {
    const data = {
      title: matrixTitle,
      rows: matrixRows,
      subject,
      grade,
      mode: 'matrix',
      version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Matrix_${matrixTitle.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importMatrix = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.mode === 'matrix' && data.rows) {
          setMatrixTitle(data.title || 'Đề ôn tập');
          setMatrixRows(data.rows);
          if (data.subject) setSubject(data.subject);
          if (data.grade) setGrade(data.grade);
          alert("Tải ma trận thành công!");
        } else {
          alert("File không đúng định dạng ma trận đề.");
        }
      } catch (err) {
        alert("Lỗi khi đọc file ma trận.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalTopic = '';

    if (mode === 'matrix') {
        finalTopic = matrixTitle;
    } else {
        // Xử lý nội dung topic cho các chế độ đơn lẻ
        if (uploadedFile) {
            finalTopic = "Nội dung từ tài liệu đính kèm";
        } else {
            finalTopic = topic;
            // Gộp các yêu cầu chi tiết vào topic để gửi cho AI
            if (knowledgeObjectives.trim()) {
                finalTopic += `\n[MỤC TIÊU KIẾN THỨC]: ${knowledgeObjectives.trim()}`;
            }
            if (problemReq.trim()) {
                finalTopic += `\n[YÊU CẦU DẠNG TOÁN]: ${problemReq.trim()}`;
            }
            if (solutionReq.trim()) {
                finalTopic += `\n[YÊU CẦU LỜI GIẢI]: ${solutionReq.trim()}`;
            }
        }
    }

    onGenerate({
      mode,
      subject,
      grade,
      topic: finalTopic,
      creatorRole,
      essayRequirements: mode === 'exam' && (questionType === QuestionType.ESSAY || questionType === QuestionType.MIXED) ? essayRequirements : undefined,
      questionType: mode === 'exam' ? questionType : undefined,
      questionCount: mode === 'exam' ? questionCount : undefined,
      difficultyMode: mode === 'exam' ? difficultyMode : undefined,
      targetLevel: mode === 'exam' && difficultyMode === 'fixed' ? targetLevel : undefined,
      matrixRows: mode === 'matrix' ? matrixRows : undefined,
      includeHints: true,
      uploadedFile: uploadedFile ? { data: uploadedFile.data, mimeType: uploadedFile.mimeType } : null
    });
  };

  const handleResourceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        const base64Data = base64String.split(',')[1];
        setUploadedFile({ name: file.name, mimeType: file.type, data: base64Data });
        if (mode !== 'matrix' && !topic) {
          setTopic("Nội dung tài liệu: " + file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearUploadedFile = () => {
    setUploadedFile(null);
    if (mode !== 'matrix' && topic.startsWith("Nội dung tài liệu:")) {
        setTopic("");
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 relative transition-all duration-300">
      
      {/* Ẩn Tab nếu forcedMode được bật */}
      {!forcedMode && (
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 overflow-x-auto">
          <button onClick={() => setMode('exam')} className={`flex-1 min-w-[140px] py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${mode === 'exam' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500'}`}><ListChecks className="w-5 h-5" /> Đơn lẻ</button>
          <button onClick={() => setMode('matrix')} className={`flex-1 min-w-[140px] py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${mode === 'matrix' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500'}`}><Table2 className="w-5 h-5" /> Tổng hợp</button>
          <button onClick={() => setMode('theory')} className={`flex-1 min-w-[140px] py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${mode === 'theory' ? 'border-teal-600 text-teal-700 bg-white' : 'border-transparent text-slate-500'}`}><PresentationIcon className="w-5 h-5" /> Lý thuyết</button>
          <button onClick={() => setMode('polya')} className={`flex-1 min-w-[140px] py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors border-b-2 ${mode === 'polya' ? 'border-orange-600 text-orange-700 bg-white' : 'border-transparent text-slate-500'}`}><Footprints className="w-5 h-5" /> G.Polya</button>
        </div>
      )}

      <div className="p-10 border-b border-slate-50 dark:border-slate-700">
        <h2 className={`text-3xl font-black flex items-center gap-3 ${
            mode === 'exam' ? 'text-blue-700' : mode === 'matrix' ? 'text-indigo-700' : mode === 'theory' ? 'text-teal-700' : 'text-orange-600'
        } dark:text-white`}>
          <Sparkles className="w-8 h-8 text-yellow-500" />
          {mode === 'exam' && 'Cấu hình Đề Chuyên Đề'}
          {mode === 'matrix' && 'Cấu hình Ma Trận Tổng Hợp'}
          {mode === 'theory' && 'Cấu hình Bài Giảng Slide'}
          {mode === 'polya' && 'Giải Toán G.Polya'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">Điền các thông tin cần thiết để AI bắt đầu quá trình sáng tạo.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        {mode !== 'polya' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Môn học</label>
                <select 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-2xl border-slate-200 dark:border-slate-700 border-2 p-4 text-slate-800 dark:text-slate-100 font-black focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 dark:bg-slate-900 transition-all outline-none"
                >
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Khối lớp</label>
                <select 
                  value={grade} 
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full rounded-2xl border-slate-200 dark:border-slate-700 border-2 p-4 text-slate-800 dark:text-slate-100 font-black focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 dark:bg-slate-900 transition-all outline-none"
                >
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <UserIcon className="w-3 h-3"/> Vai trò người ra đề
                </label>
                <select 
                  value={creatorRole} 
                  onChange={(e) => setCreatorRole(e.target.value)}
                  className="w-full rounded-2xl border-slate-200 dark:border-slate-700 border-2 p-4 text-slate-800 dark:text-slate-100 font-black focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 dark:bg-slate-900 transition-all outline-none"
                >
                  {CREATOR_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
          </div>
        )}

        {mode !== 'matrix' && (
            <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2rem] border-2 border-slate-100 dark:border-slate-700 relative">
                    <input type="file" ref={resourceInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleResourceFileChange}/>
                    
                    {!uploadedFile ? (
                        <div className="flex flex-col gap-6">
                            {/* TOPIC INPUT - Cụ thể tên chuyên đề */}
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">
                                  {mode === 'polya' ? 'Nội dung bài toán' : 'Tên Chuyên Đề / Bài Học'}
                                </label>
                                <div className="flex gap-4">
                                    {mode === 'polya' ? (
                                        <textarea
                                          value={topic}
                                          onChange={(e) => setTopic(e.target.value)}
                                          placeholder="Nhập đề bài toán vào đây..."
                                          rows={4}
                                          className="flex-grow rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 border-2 p-4 text-slate-900 dark:text-slate-100 font-bold focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="VD: Sóng ánh sáng, Tích phân hàm ẩn..."
                                            className="flex-grow rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 border-2 p-4 text-slate-900 dark:text-slate-100 font-bold focus:ring-4 focus:ring-indigo-500/20 outline-none"
                                        />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => resourceInputRef.current?.click()}
                                        className="flex-shrink-0 flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-900 rounded-2xl text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 font-black transition-all shadow-sm"
                                    >
                                        <Paperclip className="w-5 h-5" /> <span className="hidden sm:inline">Ảnh/PDF</span>
                                    </button>
                                </div>
                            </div>

                            {/* EXTRA REQUIREMENTS FIELDS */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                        <Target className="w-3 h-3"/> Mục tiêu kiến thức cần đạt
                                    </label>
                                    <textarea 
                                        value={knowledgeObjectives}
                                        onChange={(e) => setKnowledgeObjectives(e.target.value)}
                                        placeholder="VD: Học sinh hiểu định lý Cosin, biết vận dụng tính cạnh tam giác, phân biệt được..."
                                        rows={2}
                                        className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 border-2 p-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                        <Brain className="w-3 h-3"/> Yêu cầu đặc biệt về dạng toán (Tùy chọn)
                                    </label>
                                    <textarea 
                                        value={problemReq}
                                        onChange={(e) => setProblemReq(e.target.value)}
                                        placeholder="VD: Tập trung vào các bài toán thực tế, vận dụng cao, chứa tham số m..."
                                        rows={3}
                                        className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 border-2 p-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                        <Sparkles className="w-3 h-3"/> Yêu cầu về lời giải (Tùy chọn)
                                    </label>
                                    <textarea 
                                        value={solutionReq}
                                        onChange={(e) => setSolutionReq(e.target.value)}
                                        placeholder="VD: Lời giải ngắn gọn, dùng phương pháp ghép trục, giải bằng máy tính Casio..."
                                        rows={3}
                                        className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 border-2 p-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-4 focus:ring-indigo-500/20 outline-none resize-none"
                                    />
                                </div>
                                {(questionType === QuestionType.ESSAY || questionType === QuestionType.MIXED) && (
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 block flex items-center gap-2">
                                            <FileText className="w-3 h-3"/> Yêu cầu riêng cho câu hỏi Tự luận
                                        </label>
                                        <textarea 
                                            value={essayRequirements}
                                            onChange={(e) => setEssayRequirements(e.target.value)}
                                            placeholder="VD: Yêu cầu học sinh trình bày chi tiết các bước, có vẽ hình minh họa, sử dụng ngôn ngữ chuyên môn..."
                                            rows={2}
                                            className="w-full rounded-2xl border-orange-200 dark:border-orange-900/30 bg-orange-50/30 dark:bg-orange-900/10 border-2 p-3 text-sm text-slate-800 dark:text-slate-200 focus:ring-4 focus:ring-orange-500/20 outline-none resize-none"
                                        />
                                    </div>
                                )}
                            </div>

                            {mode !== 'polya' && suggestedTopics.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {suggestedTopics.map(t => (
                                <button key={t} type="button" onClick={() => setTopic(t)} className="text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-400 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 transition-all">
                                    + {t}
                                </button>
                                ))}
                            </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-between bg-white dark:bg-slate-800 border-4 border-indigo-50 dark:border-indigo-900/30 p-4 rounded-2xl shadow-lg animate-fade-in-up">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="bg-indigo-600 p-3 rounded-xl text-white">
                                    {uploadedFile.mimeType.includes('pdf') ? <FileText className="w-6 h-6"/> : <ImageIcon className="w-6 h-6"/>}
                                </div>
                                <span className="font-black text-slate-800 dark:text-white truncate">{uploadedFile.name}</span>
                            </div>
                            <button type="button" onClick={clearUploadedFile} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"><X className="w-6 h-6" /></button>
                        </div>
                    )}
                </div>

                {mode === 'exam' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Loại câu hỏi</label>
                            <select 
                                value={questionType} 
                                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                                className="w-full rounded-2xl border-slate-200 dark:border-slate-700 border-2 p-4 text-slate-800 dark:text-slate-100 font-bold bg-white dark:bg-slate-900 outline-none"
                            >
                                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Số lượng câu</label>
                            <input 
                                type="number" min={1} max={30} value={questionCount} 
                                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                className="w-full rounded-2xl border-slate-200 dark:border-slate-700 border-2 p-4 text-slate-800 dark:text-slate-100 font-bold bg-white dark:bg-slate-900 outline-none"
                            />
                        </div>
                    </div>
                )}
            </div>
        )}

        {mode === 'matrix' && (
            <div className="space-y-8 animate-fade-in">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tiêu đề đề thi</label>
                    <input type="text" value={matrixTitle} onChange={(e) => setMatrixTitle(e.target.value)} className="w-full rounded-2xl border-slate-200 dark:border-slate-700 border-2 p-4 text-slate-800 dark:text-slate-100 font-black outline-none focus:border-indigo-500"/>
                 </div>
                 
                 <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                         <h3 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tighter">Cấu trúc Ma Trận</h3>
                         <div className="flex items-center gap-2">
                             <button 
                                type="button" 
                                onClick={() => setShowCloudBank(!showCloudBank)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${showCloudBank ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400'}`}
                                title="Ngân hàng ma trận đám mây"
                             >
                                <Cloud className="w-4 h-4" /> Cloud Bank
                             </button>
                             <button 
                                type="button" 
                                onClick={saveToCloud}
                                disabled={isCloudLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-all"
                                title="Lưu ma trận lên đám mây (Online)"
                             >
                                {isCloudLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                                Lưu Online
                             </button>
                             <button 
                                type="button" 
                                onClick={exportMatrix}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
                                title="Lưu ma trận về máy (Offline)"
                             >
                                <Download className="w-4 h-4" /> Lưu Offline
                             </button>
                             <label className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer transition-all" title="Tải ma trận từ máy">
                                <FileJson className="w-4 h-4" /> Tải lên
                                <input type="file" className="hidden" accept=".json" onChange={importMatrix} />
                             </label>
                             <span className="text-xs font-black bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg">Tổng: {matrixRows.reduce((acc, row) => acc + (row.count || 0), 0)} câu</span>
                         </div>
                    </div>

                    {showCloudBank && (
                        <div className="mb-8 p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/30 animate-fade-in">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <Cloud className="w-4 h-4" /> Ma trận đã lưu trên mây
                                </h4>
                                {!user && (
                                    <button type="button" onClick={onLogin} className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full flex items-center gap-1">
                                        <LogIn className="w-3 h-3" /> Đăng nhập để đồng bộ
                                    </button>
                                )}
                            </div>
                            
                            {isCloudLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
                            ) : cloudMatrices.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {cloudMatrices.map(m => (
                                        <div 
                                            key={m.id} 
                                            onClick={() => {
                                                setMatrixTitle(m.title);
                                                setMatrixRows(m.rows);
                                                if (m.subject) setSubject(m.subject);
                                                if (m.grade) setGrade(m.grade);
                                                setShowCloudBank(false);
                                            }}
                                            className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 hover:border-indigo-500 cursor-pointer group transition-all"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-slate-800 dark:text-white truncate">{m.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{m.subject} - {m.grade}</p>
                                                </div>
                                                <button onClick={(e) => deleteFromCloud(m.id, e)} className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-xs font-medium">Chưa có ma trận nào được lưu trên đám mây.</div>
                            )}
                        </div>
                    )}

                    <div className="space-y-4">
                        {matrixRows.map((row, idx) => (
                            <div key={idx} className="flex flex-col gap-4 p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 group transition-all hover:scale-[1.01]">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <input type="text" value={row.topic} onChange={(e) => handleRowChange(idx, 'topic', e.target.value)} placeholder="Nhập chuyên đề..." className="w-full text-sm font-bold border-b-2 border-slate-100 focus:border-indigo-500 bg-transparent outline-none py-2"/>
                                    </div>
                                    <select value={row.level} onChange={(e) => handleRowChange(idx, 'level', e.target.value)} className="text-sm font-bold bg-slate-50 dark:bg-slate-900 rounded-xl px-3 border-none outline-none">
                                        {DIFFICULTY_LEVELS.map(l => <option key={l} value={l}>{l.split(' (')[0]}</option>)}
                                    </select>
                                    <select value={row.type} onChange={(e) => handleRowChange(idx, 'type', e.target.value)} className="text-sm font-bold bg-slate-50 dark:bg-slate-900 rounded-xl px-3 border-none outline-none">
                                        {QUESTION_TYPES.filter(t => t !== QuestionType.MIXED).map(t => <option key={t} value={t}>{t.split(' (')[0]}</option>)}
                                    </select>
                                    <input type="number" min={1} max={20} value={row.count} onChange={(e) => handleRowChange(idx, 'count', parseInt(e.target.value) || 1)} className="w-16 text-center font-black bg-indigo-50 dark:bg-slate-900 rounded-xl outline-none"/>
                                    <button type="button" onClick={() => handleRemoveRow(idx)} disabled={matrixRows.length === 1} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                                </div>
                                {row.type === QuestionType.ESSAY && (
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 block">Yêu cầu riêng cho Tự luận</label>
                                        <input 
                                            type="text" 
                                            value={row.essayRequirements || ''} 
                                            onChange={(e) => handleRowChange(idx, 'essayRequirements', e.target.value)} 
                                            placeholder="VD: Trình bày chi tiết, có hình vẽ..."
                                            className="w-full text-xs bg-orange-50/30 dark:bg-orange-900/10 border-none outline-none p-2 rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={handleAddRow} className="mt-8 w-full py-4 border-4 border-dashed border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-black flex items-center justify-center gap-3 transition-all">
                        <Plus className="w-5 h-5" /> THÊM DÒNG MA TRẬN
                    </button>
                 </div>
            </div>
        )}

        <div className="pt-8">
          <button
            type="submit"
            disabled={isLoading || ((mode !== 'matrix' && !topic && !uploadedFile))}
            className={`w-full py-6 rounded-3xl text-white font-black text-xl shadow-2xl transform transition-all flex items-center justify-center gap-4
              ${isLoading 
                ? 'bg-slate-400 cursor-not-allowed' 
                : mode === 'exam' ? 'bg-indigo-600 hover:bg-indigo-700' 
                : mode === 'matrix' ? 'bg-emerald-600 hover:bg-emerald-700' 
                : mode === 'theory' ? 'bg-violet-600 hover:bg-violet-700'
                : 'bg-orange-600 hover:bg-orange-700'
              } hover:-translate-y-1 active:translate-y-0`}
          >
            {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Sparkles className="w-7 h-7" />}
            {isLoading ? 'ĐANG SÁNG TẠO...' : mode === 'exam' ? 'TẠO ĐỀ CHUYÊN ĐỀ' : mode === 'matrix' ? 'TẠO ĐỀ MA TRẬN' : mode === 'theory' ? 'TẠO BÀI GIẢNG SLIDE' : 'GIẢI TOÁN POLYA'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ConfigForm;
