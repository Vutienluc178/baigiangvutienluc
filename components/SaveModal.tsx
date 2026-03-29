
import React, { useState, useEffect } from 'react';
import { X, Save, Tag, Plus } from 'lucide-react';

interface SaveModalProps {
  initialTitle: string;
  suggestedTags: string[];
  onSave: (title: string, tags: string[]) => void;
  onClose: () => void;
}

const SaveModal: React.FC<SaveModalProps> = ({ initialTitle, suggestedTags, onSave, onClose }) => {
  const [title, setTitle] = useState(initialTitle);
  const [tags, setTags] = useState<string[]>(suggestedTags);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-md shadow-2xl border-4 border-indigo-100 dark:border-slate-700 overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="bg-indigo-600 p-6 flex justify-between items-center text-white">
          <h3 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Save className="w-6 h-6" /> Lưu vào Ngân Hàng
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tên bài học</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-bold outline-none focus:border-indigo-500 transition-colors"
              placeholder="Nhập tên bài học..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Thẻ phân loại (Tags)</label>
            <div className="flex gap-2 mb-2">
                <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm font-medium outline-none focus:border-indigo-500"
                    placeholder="VD: Giữa kì, Nâng cao..."
                />
                <button 
                    onClick={handleAddTag}
                    className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-200 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2 min-h-[40px]">
                {tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-600">
                        <Tag className="w-3 h-3 opacity-50" />
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                ))}
                {tags.length === 0 && (
                    <span className="text-xs text-slate-400 italic">Chưa có thẻ nào. Thêm thẻ để tìm kiếm nhanh hơn.</span>
                )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Hủy</button>
            <button 
                onClick={() => onSave(title, tags)}
                disabled={!title.trim()}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg disabled:opacity-50 transition-all transform active:scale-95"
            >
                LƯU BÀI
            </button>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;
