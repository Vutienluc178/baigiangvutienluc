
import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, AlertTriangle, Check, Eye, Code, X } from 'lucide-react';
import { ExamPreview } from './ExamPreview';
import StudyGuidePreview from './StudyGuidePreview';
import PolyaPreview from './PolyaPreview';
import { ExamMatrix, StudyGuideData, PolyaData, ExamConfig } from '../types';

interface LessonEditorProps {
  initialData: any;
  config: ExamConfig;
  mode: 'exam' | 'theory' | 'polya';
  onSave: (data: any) => void;
  onCancel: () => void;
}

const LessonEditor: React.FC<LessonEditorProps> = ({ initialData, config, mode, onSave, onCancel }) => {
  const [jsonContent, setJsonContent] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor'); // Mobile toggle

  // Load initial data
  useEffect(() => {
    if (initialData) {
      setJsonContent(JSON.stringify(initialData, null, 2));
      setParsedData(initialData);
    }
  }, [initialData]);

  // Handle text change
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonContent(value);
    
    try {
      const parsed = JSON.parse(value);
      setParsedData(parsed);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSave = () => {
    if (!error && parsedData) {
      onSave(parsedData);
    }
  };

  const renderPreview = () => {
    if (!parsedData) return null;
    
    // We create a "dummy" onReset/onRegenerate that does nothing in preview mode
    // or simply returns to the editor loop if needed.
    const noOp = () => {};

    if (mode === 'theory') {
      return (
        <StudyGuidePreview 
          role="teacher" 
          config={config} 
          data={parsedData as StudyGuideData} 
          onReset={noOp} 
          onRegenerate={noOp} 
          onUpdateData={(newData) => {
            setParsedData(newData);
            setJsonContent(JSON.stringify(newData, null, 2));
          }}
        />
      );
    }
    if (mode === 'polya') {
      return <PolyaPreview data={parsedData as PolyaData} onReset={noOp} />;
    }
    return (
      <ExamPreview 
        role="teacher" 
        config={config} 
        data={parsedData as ExamMatrix} 
        onReset={noOp} 
        onRegenerate={noOp} 
        onUpdateData={(newData) => {
          setParsedData(newData);
          setJsonContent(JSON.stringify(newData, null, 2));
        }}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-100 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500">
            <X className="w-5 h-5" />
          </button>
          <h2 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tighter">Trình Soạn Thảo</h2>
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-lg text-xs font-bold animate-pulse">
              <AlertTriangle className="w-4 h-4" /> Lỗi cú pháp JSON
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile Tabs */}
          <div className="flex md:hidden bg-slate-100 dark:bg-slate-900 rounded-lg p-1 mr-2">
            <button onClick={() => setActiveTab('editor')} className={`p-2 rounded-md ${activeTab === 'editor' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-400'}`}><Code className="w-4 h-4"/></button>
            <button onClick={() => setActiveTab('preview')} className={`p-2 rounded-md ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-400'}`}><Eye className="w-4 h-4"/></button>
          </div>

          <button 
            onClick={() => {
              const restored = JSON.stringify(initialData, null, 2);
              setJsonContent(restored);
              setParsedData(initialData);
              setError(null);
            }} 
            className="hidden md:flex px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-bold text-xs items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Khôi phục gốc
          </button>
          <button 
            onClick={handleSave} 
            disabled={!!error}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" /> Lưu & Áp dụng
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow flex overflow-hidden">
        {/* Editor Pane */}
        <div className={`w-full md:w-1/2 flex flex-col border-r border-slate-200 dark:border-slate-700 transition-all ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
            <span>Mã nguồn JSON</span>
            <span className="text-slate-300">Nhập LaTeX trong dấu $...$</span>
          </div>
          <textarea
            className="flex-grow w-full p-4 font-mono text-sm bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none resize-none focus:ring-inset focus:ring-2 focus:ring-indigo-500/50"
            value={jsonContent}
            onChange={handleJsonChange}
            spellCheck={false}
          />
        </div>

        {/* Preview Pane */}
        <div className={`w-full md:w-1/2 flex flex-col bg-slate-100 dark:bg-black relative ${activeTab === 'editor' ? 'hidden md:flex' : 'flex'}`}>
           <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="w-full h-full pointer-events-auto transform scale-[0.8] origin-top-left md:scale-100 md:origin-center transition-transform">
                 <div className="h-full w-[125%] md:w-full overflow-y-auto">
                    {parsedData ? renderPreview() : (
                        <div className="flex items-center justify-center h-full text-slate-400 font-bold">Chưa có dữ liệu hợp lệ</div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LessonEditor;
