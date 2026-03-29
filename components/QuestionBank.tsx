
import React, { useState, useEffect } from 'react';
import { Folder, FileText, Trash2, Upload, Download, X, ChevronRight, ChevronDown, Search, Database, PlayCircle, Settings, Cloud, Copy, Check, HelpCircle, Edit2, Tag, Book, Library } from 'lucide-react';
import { ExamConfig } from '../types';

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

interface QuestionBankProps {
  bank: BankItem[];
  onLoad: (item: BankItem) => void;
  onDelete: (id: string) => void;
  onImport: (file: File) => void;
  onClose: () => void;
  onRename: (id: string) => void;
}

// Cấu trúc cây thư mục ưu tiên THPT và THCS
const GRADE_TREE: Record<string, string[]> = {
  'Trung học Phổ thông (THPT)': ['Lớp 12', 'Lớp 11', 'Lớp 10', 'Ôn thi THPT QG'],
  'Trung học Cơ sở (THCS)': ['Lớp 9', 'Lớp 8', 'Lớp 7', 'Lớp 6'],
  'Tiểu học': ['Lớp 5', 'Lớp 4', 'Lớp 3', 'Lớp 2', 'Lớp 1'],
  'Khác': ['Khác']
};

const GAS_CODE = `function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var data = [];
  // Bỏ qua header row
  for (var i = 1; i < rows.length; i++) {
    try {
      if (rows[i][5]) { // Column F chứa JSON
         var item = JSON.parse(rows[i][5]);
         data.push(item);
      }
    } catch (err) {}
  }
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ID", "Title", "Grade", "Type", "Date", "Data"]);
  }
  var items = JSON.parse(e.postData.contents);
  if (!Array.isArray(items)) items = [items];
  
  items.forEach(function(item) {
    sheet.appendRow([
      item.id, 
      item.title, 
      item.config.grade, 
      item.type, 
      new Date(item.date).toISOString(), 
      JSON.stringify(item)
    ]);
  });
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success'})).setMimeType(ContentService.MimeType.JSON);
}`;

const QuestionBank: React.FC<QuestionBankProps> = ({ 
  bank, onLoad, onDelete, onImport, onClose, onRename 
}) => {
  // State quản lý việc mở rộng/thu gọn các cấp
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Trung học Phổ thông (THPT)', 'Trung học Cơ sở (THCS)']));
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Group items by grade
  const groupedByGrade = bank.reduce((acc, item) => {
    const grade = item.config.grade || 'Khác';
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(item);
    return acc;
  }, {} as Record<string, BankItem[]>);

  // Auto expand when searching
  useEffect(() => {
    if (searchTerm) {
        // Expand everything when searching
        setExpandedCategories(new Set(Object.keys(GRADE_TREE)));
        const allGrades = Object.values(GRADE_TREE).flat();
        setExpandedGrades(new Set(allGrades));
    }
  }, [searchTerm]);

  const toggleCategory = (cat: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(cat)) newSet.delete(cat);
    else newSet.add(cat);
    setExpandedCategories(newSet);
  };

  const toggleGrade = (grade: string) => {
    const newSet = new Set(expandedGrades);
    if (newSet.has(grade)) newSet.delete(grade);
    else newSet.add(grade);
    setExpandedGrades(newSet);
  };

  const handleExportBank = () => {
    const blob = new Blob([JSON.stringify(bank, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Ngan_Hang_AI_Studio_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.json`;
    a.click();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GAS_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const renderBankItem = (item: BankItem) => (
    <div key={item.id} className="group flex items-center justify-between p-3 pl-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors border-b last:border-0 border-slate-50 dark:border-slate-800 cursor-pointer" onClick={() => onLoad(item)}>
        <div className="flex items-center gap-3 overflow-hidden flex-1">
            <div className={`p-2 rounded-lg shrink-0 ${
                item.type === 'exam' ? 'bg-blue-100 text-blue-600' : 
                item.type === 'theory' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
            }`}>
                <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold uppercase ${
                        item.type === 'exam' ? 'text-blue-500' : item.type === 'theory' ? 'text-purple-500' : 'text-orange-500'
                    }`}>
                        {item.type === 'exam' ? 'Đề thi' : item.type === 'theory' ? 'Bài giảng' : 'Polya'}
                    </span>
                    <span className="text-[10px] text-slate-400">• {item.config.subject}</span>
                    <span className="text-[10px] text-slate-400">• {new Date(item.date).toLocaleDateString('vi-VN')}</span>
                    
                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag, tIdx) => (
                                <span key={tIdx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[9px] font-bold text-slate-500">
                                    <Tag className="w-2.5 h-2.5 opacity-50" /> {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
            <button 
                onClick={(e) => { e.stopPropagation(); onLoad(item); }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-lg flex items-center gap-1 font-bold text-[10px] uppercase whitespace-nowrap"
            >
                <PlayCircle className="w-3 h-3" /> DẠY
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onRename(item.id); }}
                className="p-1.5 bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                title="Đổi tên"
            >
                <Edit2 className="w-3 h-3" />
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="p-1.5 bg-white dark:bg-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                title="Xóa"
            >
                <Trash2 className="w-3 h-3" />
            </button>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl border-4 border-indigo-100 dark:border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-3">
                <Database className="w-8 h-8" />
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Ngân hàng bài học</h2>
                    <p className="text-xs font-medium opacity-90">{bank.length} nội dung đã lưu trữ</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6"/></button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-slate-900 shrink-0">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo tên, thẻ tag, môn học..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.json';
                            input.onchange = (e: any) => {
                                if (e.target.files[0]) onImport(e.target.files[0]);
                            };
                            input.click();
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Upload className="w-4 h-4" /> Import JSON
                    </button>
                    <button 
                        onClick={handleExportBank}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export JSON
                    </button>
                </div>
            </div>

            {/* Tree View Content */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-950">
                    {bank.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                            <Database className="w-20 h-20 mb-4" />
                            <p className="font-bold">Ngân hàng trống</p>
                            <p className="text-xs">Lưu bài học từ màn hình xem trước để xem tại đây</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(GRADE_TREE).map(([category, grades]) => {
                                // Kiểm tra xem category này có chứa bài học nào (dựa trên search) hay không
                                const hasItemsInCategory = grades.some(grade => {
                                    const items = groupedByGrade[grade] || [];
                                    if (searchTerm) {
                                        const lowerSearch = searchTerm.toLowerCase();
                                        return items.some(i => 
                                            i.title.toLowerCase().includes(lowerSearch) || 
                                            (i.tags && i.tags.some(t => t.toLowerCase().includes(lowerSearch))) ||
                                            (i.config.subject && i.config.subject.toLowerCase().includes(lowerSearch))
                                        );
                                    }
                                    return items.length > 0;
                                });

                                if (!hasItemsInCategory && !searchTerm) return null; // Ẩn category trống nếu không search

                                const isCatExpanded = expandedCategories.has(category);

                                return (
                                    <div key={category} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                        {/* Category Header */}
                                        <button 
                                            onClick={() => toggleCategory(category)}
                                            className="w-full flex items-center justify-between p-4 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                {isCatExpanded ? <ChevronDown className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-5 h-5 text-slate-500" />}
                                                <Library className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                                <span className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{category}</span>
                                            </div>
                                        </button>

                                        {/* Nested Content */}
                                        {isCatExpanded && (
                                            <div className="border-t border-slate-100 dark:border-slate-800">
                                                {grades.map(grade => {
                                                    const items = groupedByGrade[grade] || [];
                                                    const filteredItems = items.filter(i => {
                                                        if (!searchTerm) return true;
                                                        const lowerSearch = searchTerm.toLowerCase();
                                                        return (
                                                            i.title.toLowerCase().includes(lowerSearch) || 
                                                            (i.tags && i.tags.some(t => t.toLowerCase().includes(lowerSearch))) ||
                                                            (i.config.subject && i.config.subject.toLowerCase().includes(lowerSearch))
                                                        );
                                                    });

                                                    if (filteredItems.length === 0) return null;

                                                    const isGradeExpanded = expandedGrades.has(grade);

                                                    return (
                                                        <div key={grade} className="border-b last:border-0 border-slate-50 dark:border-slate-800/50">
                                                            {/* Grade Header */}
                                                            <button 
                                                                onClick={() => toggleGrade(grade)}
                                                                className="w-full flex items-center justify-between p-3 pl-10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    {isGradeExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                                                    <Folder className="w-5 h-5 text-yellow-500 fill-yellow-100 dark:fill-yellow-900/20" />
                                                                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{grade}</span>
                                                                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500">{filteredItems.length}</span>
                                                                </div>
                                                            </button>

                                                            {/* Lesson Items */}
                                                            {isGradeExpanded && (
                                                                <div className="bg-slate-50/50 dark:bg-black/20 pl-8">
                                                                    {filteredItems.map(renderBankItem)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default QuestionBank;
