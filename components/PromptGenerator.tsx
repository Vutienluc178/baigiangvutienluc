
import React, { useState } from 'react';
import { Copy, Check, FileText, Presentation, Footprints, Wand2 } from 'lucide-react';
import { SUBJECTS, GRADES } from '../constants';

const PromptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('Lớp 11');
  const [mode, setMode] = useState<'exam' | 'theory' | 'polya'>('exam');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(getPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPrompt = () => {
    const topicText = topic.trim() || "[NỘI DUNG BÀI TẬP / CHỦ ĐỀ]";
    
    if (mode === 'exam') {
        return `VAI TRÒ: Bạn là một TỔ TRƯỞNG CHUYÊN MÔN TOÁN XUẤT SẮC CÓ 20 NĂM KINH NGHIỆM.
Phong cách: Chặt chẽ về bản chất nhưng CỰC KỲ NGẮN GỌN, XÚC TÍCH trong trình bày.

NHIỆM VỤ: Soạn một chuyên đề luyện tập môn ${subject} lớp ${grade}.
CHỦ ĐỀ/NỘI DUNG: "${topicText}"
SỐ LƯỢNG: 5 câu.
DẠNG: Trắc nghiệm (4 chọn 1).

YÊU CẦU CẤU TRÚC JSON (BẮT BUỘC):
1. keyConcepts (Kiến thức trọng tâm): Tóm tắt công thức và định lý quan trọng nhất.
2. questions (Danh sách câu hỏi):
   - NỘI DUNG CÂU HỎI: Rõ ràng, số liệu tính toán ra kết quả đẹp.
   - OPTIONS: Mảng 4 phương án A, B, C, D nhiễu thông minh.
   - CORRECT_ANSWER: Chỉ ghi ký tự đáp án đúng (A/B/C/D).
   - SOLUTION (Lời giải chi tiết):
     + YÊU CẦU CỐT LÕI: Lời giải phải NGẮN GỌN, XÚC TÍCH.
     + BẮT BUỘC dùng ký tự \\n để ngắt dòng giữa các bước giải.
     + SỬ DỤNG LATEX: Mọi công thức phải đặt trong $...$. Escape backslash kép (\\\\).

TRẢ VỀ JSON KHỚP SCHEMA SAU:
{
  "summary": "Tóm tắt...",
  "keyConcepts": "Nội dung...",
  "questions": [
    {
      "id": 1,
      "content": "Câu hỏi...",
      "type": "Trắc nghiệm (4 chọn 1)",
      "difficulty": "Nhận biết/Thông hiểu/Vận dụng",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "solution": "Lời giải...",
      "hints": ["Gợi ý 1..."]
    }
  ]
}`;
    } else if (mode === 'theory') {
        return `Bạn là chuyên gia sư phạm và thiết kế bài giảng điện tử.
Hãy soạn một bài giảng slide (Study Guide) chi tiết cho:
Môn: ${subject}
Lớp: ${grade}
Chủ đề: "${topicText}"

YÊU CẦU NỘI DUNG:
1. Tổng quan bài học hấp dẫn.
2. Mục tiêu và Năng lực cần đạt rõ ràng (theo định hướng GDPT 2018).
3. Các phần (sections) tương ứng với các slide:
   - Mỗi section có tiêu đề, nội dung chính (Content).
   - Ví dụ minh họa (Examples) có lời giải chi tiết.
   - Câu hỏi gợi mở (Guiding Questions).
   - Hoạt động (Activities) đề xuất.

QUY TẮC ĐỊNH DẠNG:
- LaTeX: Dùng $...$ cho công thức toán. Escape backslash (\\\\).
- Content & Solution: Sử dụng ký tự \\n để ngắt dòng.

TRẢ VỀ JSON KHỚP SCHEMA:
{
  "topic": "${topicText}",
  "overview": "Tổng quan...",
  "objectives": ["Mục tiêu 1", "Mục tiêu 2"],
  "sections": [
    {
      "title": "Tiêu đề phần 1",
      "content": "Nội dung...",
      "examples": [{ "problem": "Ví dụ...", "solution": "Lời giải...", "explanation": "Giải thích..." }],
      "guidingQuestions": ["Câu hỏi..."],
      "activities": ["Hoạt động..."]
    }
  ]
}`;
    } else {
        return `Bạn là giáo sư toán học lỗi lạc, áp dụng phương pháp George Polya.
Hãy phân tích bài toán sau theo 4 bước Polya.

BÀI TOÁN: "${topicText}"

YÊU CẦU ĐẦU RA (JSON):
Trả về JSON duy nhất với cấu trúc:
{
  "title": "Tên ngắn gọn",
  "problem": "Nội dung bài toán (LaTeX $...$)",
  "steps": [
    {
      "stepName": "Bước 1: Tìm hiểu đề bài",
      "icon": "search",
      "content": "Phân tích giả thiết, kết luận... (Dùng \\n xuống dòng)",
      "keyPoints": ["Ý chính..."]
    },
    {
      "stepName": "Bước 2: Xây dựng chương trình giải",
      "icon": "map",
      "content": "Tìm mối liên hệ, lập kế hoạch...",
      "keyPoints": ["Định lý sử dụng..."]
    },
    {
      "stepName": "Bước 3: Thực hiện chương trình giải",
      "icon": "wrench",
      "content": "Trình bày lời giải chi tiết...",
      "keyPoints": []
    },
    {
      "stepName": "Bước 4: Kiểm tra và khai thác",
      "icon": "check",
      "content": "Kiểm tra kết quả, mở rộng bài toán...",
      "keyPoints": ["Cách khác..."]
    }
  ]
}`;
    }
  };

  return (
    <div className="space-y-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800">
            <h3 className="text-xl font-black text-indigo-700 dark:text-indigo-400 mb-6 flex items-center gap-2">
                <Wand2 className="w-6 h-6"/> Công Cụ Tạo Prompt Tự Động
            </h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Nội dung bài tập / Chủ đề</label>
                    <textarea 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Nhập nội dung bài tập, đề bài hoặc tên chuyên đề..."
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-4 focus:ring-indigo-500/20 outline-none min-h-[120px] text-slate-800 dark:text-slate-100"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Môn học</label>
                        <select 
                            value={subject} 
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 font-bold"
                        >
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Lớp</label>
                        <select 
                            value={grade} 
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-800 dark:text-slate-100 font-bold"
                        >
                            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Chọn chức năng</label>
                    <div className="grid grid-cols-3 gap-2">
                        <button 
                            onClick={() => setMode('exam')}
                            className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${mode === 'exam' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'border-transparent bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <FileText className="w-6 h-6"/> Tạo Đề Thi
                        </button>
                        <button 
                            onClick={() => setMode('theory')}
                            className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${mode === 'theory' ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' : 'border-transparent bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Presentation className="w-6 h-6"/> Soạn Bài Giảng
                        </button>
                        <button 
                            onClick={() => setMode('polya')}
                            className={`p-3 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${mode === 'polya' ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' : 'border-transparent bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <Footprints className="w-6 h-6"/> Giải G.Polya
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {/* Result Area */}
        <div className="relative">
            <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Prompt đã tạo (Copy & Paste vào ChatGPT/Gemini)</label>
                <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-colors ${copied ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300'}`}
                >
                    {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                    {copied ? 'Đã sao chép' : 'Sao chép Prompt'}
                </button>
            </div>
            <pre className="w-full h-96 p-6 rounded-3xl bg-slate-950 text-slate-300 text-xs font-mono overflow-auto border border-slate-700 custom-scrollbar whitespace-pre-wrap leading-relaxed shadow-inner">
                {getPrompt()}
            </pre>
        </div>
    </div>
  );
};

export default PromptGenerator;
