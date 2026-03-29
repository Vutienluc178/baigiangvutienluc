
import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, History, Dices, Users, LayoutGrid, Sparkles, Trash2, Plus, UserPlus, Settings, Trophy, List, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Participant {
  id: string;
  name: string;
  className: string;
}

interface RandomPickerProps {
  onClose: () => void;
}

const GROUP_NAMES = [
  "Biệt đội Siêu Anh Hùng", "Liên minh Công Lý", "Nhóm Thông Thái", "Hội Những Người Chăm Chỉ",
  "Biệt đội Bứt Phá", "Nhóm Sáng Tạo", "Hội Tốc Độ", "Nhóm Đoàn Kết",
  "Đội Quân Thần Tốc", "Nhóm Tư Duy", "Biệt đội Hiếu Học", "Hội Khám Phá",
  "Nhóm Năng Lượng", "Đội Chinh Phục", "Nhóm Kiên Cường", "Hội Nghị Lực"
];

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
];

const RandomPicker: React.FC<RandomPickerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'spin' | 'group' | 'list'>('spin');
  const [spinMode, setSpinMode] = useState<'wheel' | 'slot'>('wheel');
  
  // Participants State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [bulkClass, setBulkClass] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [maxNumber, setMaxNumber] = useState(48);
  const [selectedClass, setSelectedClass] = useState('Tất cả');

  // Spin State
  const [isSpinning, setIsSpinning] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [winner, setWinner] = useState<Participant | { id: string, name: string, className: string } | null>(null);
  const [history, setHistory] = useState<(Participant | { id: string, name: string, className: string })[]>([]);
  const [rotation, setRotation] = useState(0);
  const [slotIndex, setSlotIndex] = useState(0);

  // Grouping State
  const [numGroups, setNumGroups] = useState(4);
  const [generatedGroups, setGeneratedGroups] = useState<{name: string, members: Participant[]}[] | null>(null);
  const [showFullGroups, setShowFullGroups] = useState(false);

  // Load participants from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lucky_wheel_participants');
    if (saved) {
      try {
        setParticipants(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse participants", e);
      }
    }
  }, []);

  // Save participants to localStorage
  useEffect(() => {
    localStorage.setItem('lucky_wheel_participants', JSON.stringify(participants));
  }, [participants]);

  const handleAddParticipant = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newName.trim()) return;
    const newP: Participant = {
      id: Date.now().toString(),
      name: newName.trim(),
      className: newClass.trim() || 'Lớp'
    };
    setParticipants(prev => [...prev, newP]);
    setNewName('');
    setNewClass('');
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').filter(line => line.trim());
    const newPs: Participant[] = lines.map((line, idx) => ({
      id: (Date.now() + idx).toString(),
      name: line.trim(),
      className: bulkClass.trim() || 'Lớp'
    }));
    setParticipants(prev => [...prev, ...newPs]);
    setBulkText('');
    setBulkClass('');
    setShowBulk(false);
  };

  const handleDeleteParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleClearAll = () => {
    if (confirm("Xóa toàn bộ danh sách?")) {
      setParticipants([]);
    }
  };

  const getActiveList = () => {
    if (participants.length > 0) {
      if (selectedClass === 'Tất cả') return participants;
      return participants.filter(p => p.className === selectedClass);
    }
    return Array.from({ length: maxNumber }, (_, i) => ({
      id: `num-${i + 1}`,
      name: `${i + 1}`,
      className: 'Số thứ tự'
    }));
  };

  const handleSpin = () => {
    const activeList = getActiveList();
    if (isSpinning || activeList.length === 0) return;
    
    setIsSpinning(true);
    setIsZoomed(true);
    setWinner(null);

    if (spinMode === 'wheel') {
      const extraRotations = 5 + Math.random() * 5;
      const newRotation = rotation + extraRotations * 360 + Math.random() * 360;
      setRotation(newRotation);

      setTimeout(() => {
        const finalRotation = newRotation % 360;
        const segmentAngle = 360 / activeList.length;
        const index = Math.floor(((360 - (finalRotation % 360)) % 360) / segmentAngle);
        const winP = activeList[index];
        setWinner(winP);
        setHistory(prev => [winP, ...prev.slice(0, 19)]);
        setIsSpinning(false);
        
        // Keep zoomed for 3 seconds after winner is found
        setTimeout(() => setIsZoomed(false), 3000);

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: COLORS
        });
      }, 4000);
    } else {
      // Slot Mode
      let count = 0;
      const totalSteps = 40 + Math.floor(Math.random() * 20);
      const interval = setInterval(() => {
        setSlotIndex(prev => (prev + 1) % activeList.length);
        count++;
        if (count >= totalSteps) {
          clearInterval(interval);
          const winP = activeList[slotIndex % activeList.length];
          setWinner(winP);
          setHistory(prev => [winP, ...prev.slice(0, 19)]);
          setIsSpinning(false);
          
          // Keep zoomed for 3 seconds after winner is found
          setTimeout(() => setIsZoomed(false), 3000);

          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: COLORS
          });
        }
      }, 50 + (count / totalSteps) * 200);
    }
  };

  const handleCreateGroups = () => {
    const activeList = getActiveList();
    if (activeList.length === 0) return alert("Vui lòng nhập danh sách hoặc thiết lập số lượng!");
    
    const students = [...activeList];
    // Shuffle
    for (let i = students.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [students[i], students[j]] = [students[j], students[i]];
    }

    const groups: {name: string, members: Participant[]}[] = [];
    const names = [...GROUP_NAMES].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(numGroups, students.length); i++) {
      groups.push({ name: names[i % names.length], members: [] });
    }

    students.forEach((s, idx) => {
      groups[idx % groups.length].members.push(s as Participant);
    });

    setGeneratedGroups(groups);
    setShowFullGroups(true);
  };

  const renderWheel = () => {
    const activeList = getActiveList();
    const radius = 150;
    const center = 160;
    const segmentAngle = 360 / Math.max(1, activeList.length);

    return (
      <div className={`relative w-80 h-80 mx-auto transition-transform duration-700 ease-in-out ${isZoomed ? 'scale-[3] z-[200]' : 'scale-100'}`}>
        {/* Close Zoom Button */}
        {isZoomed && !isSpinning && (
          <button 
            onClick={() => setIsZoomed(false)}
            className="absolute -top-10 -right-10 z-[210] p-2 bg-white dark:bg-slate-800 rounded-full shadow-xl border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-all animate-bounce-in"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-8 h-10 bg-red-500 clip-path-triangle shadow-lg border-2 border-white" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
        
        <svg 
          viewBox="0 0 320 320" 
          className="w-full h-full drop-shadow-2xl transition-transform duration-[4000ms] cubic-bezier(0.15, 0, 0.15, 1)"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <circle cx={center} cy={center} r={radius} fill="#f8fafc" stroke="#e2e8f0" strokeWidth="4" />
          {activeList.map((p, i) => {
            const startAngle = i * segmentAngle;
            const endAngle = (i + 1) * segmentAngle;
            const x1 = center + radius * Math.cos((startAngle * Math.PI) / 180);
            const y1 = center + radius * Math.sin((startAngle * Math.PI) / 180);
            const x2 = center + radius * Math.cos((endAngle * Math.PI) / 180);
            const y2 = center + radius * Math.sin((endAngle * Math.PI) / 180);
            const largeArcFlag = segmentAngle > 180 ? 1 : 0;
            const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
            
            return (
              <g key={p.id}>
                <path d={pathData} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth="1" />
                <text
                  x={center + (radius * 0.65) * Math.cos(((startAngle + segmentAngle / 2) * Math.PI) / 180)}
                  y={center + (radius * 0.65) * Math.sin(((startAngle + segmentAngle / 2) * Math.PI) / 180)}
                  fill="white"
                  fontSize={activeList.length > 20 ? "8" : "10"}
                  fontWeight="bold"
                  textAnchor="middle"
                  transform={`rotate(${startAngle + segmentAngle / 2}, ${center + (radius * 0.65) * Math.cos(((startAngle + segmentAngle / 2) * Math.PI) / 180)}, ${center + (radius * 0.65) * Math.sin(((startAngle + segmentAngle / 2) * Math.PI) / 180)})`}
                >
                  {p.name.length > 10 ? p.name.substring(0, 8) + '..' : p.name}
                </text>
              </g>
            );
          })}
          <circle cx={center} cy={center} r="15" fill="white" shadow-lg />
        </svg>
      </div>
    );
  };

  const renderSlot = () => {
    const activeList = getActiveList();
    return (
      <div className={`relative w-full max-w-md mx-auto h-48 bg-slate-900 rounded-[2rem] border-8 border-slate-800 overflow-hidden shadow-inner flex items-center justify-center transition-transform duration-700 ease-in-out ${isZoomed ? 'scale-[3] z-[200]' : 'scale-100'}`}>
        {/* Close Zoom Button */}
        {isZoomed && !isSpinning && (
          <button 
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 z-[210] p-2 bg-white dark:bg-slate-800 rounded-full shadow-xl border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50 transition-all animate-bounce-in"
          >
            <X className="w-6 h-6" />
          </button>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 z-10 pointer-events-none"></div>
        <div className="flex flex-col items-center gap-4 transition-all duration-100">
          {activeList.length > 0 && (
            <div className="text-center animate-pulse">
              <div className="text-5xl font-black text-white uppercase tracking-tighter mb-2">
                {activeList[slotIndex % activeList.length].name}
              </div>
              <div className="text-xl font-bold text-indigo-400">
                {activeList[slotIndex % activeList.length].className}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className={`bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl overflow-hidden relative border-8 border-indigo-100 transition-all duration-500 ${showFullGroups || isZoomed ? 'w-full h-full max-w-none' : 'w-full max-w-2xl'}`}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 flex justify-between items-center text-white">
            <div className="flex items-center gap-4">
                {activeTab === 'spin' ? <Dices className="w-10 h-10" /> : activeTab === 'group' ? <Users className="w-10 h-10" /> : <List className="w-10 h-10" />}
                <h2 className="text-3xl font-black uppercase tracking-tighter">
                    {activeTab === 'spin' ? 'Vòng Quay May Mắn' : activeTab === 'group' ? 'Chia Nhóm Tích Cực' : 'Danh Sách Lớp'}
                </h2>
            </div>
            <div className="flex items-center gap-4">
                {!showFullGroups && (
                    <div className="flex bg-white/20 p-1 rounded-2xl">
                        <button onClick={() => setActiveTab('spin')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'spin' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}>QUAY</button>
                        <button onClick={() => setActiveTab('group')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'group' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}>CHIA NHÓM</button>
                        <button onClick={() => setActiveTab('list')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'list' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}>DANH SÁCH</button>
                    </div>
                )}
                <button onClick={showFullGroups ? () => setShowFullGroups(false) : onClose} className="p-3 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-8 h-8" />
                </button>
            </div>
        </div>

        <div className={`p-10 flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar`}>
            {!showFullGroups ? (
                <>
                    {activeTab === 'list' ? (
                      <div className="flex flex-col gap-6 animate-fade-in">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setShowBulk(!showBulk)} 
                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${showBulk ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
                          >
                            {showBulk ? 'NHẬP TỪNG NGƯỜI' : 'NHẬP HÀNG LOẠT'}
                          </button>
                        </div>

                        {showBulk ? (
                          <div className="flex flex-col gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-4 border-slate-100 dark:border-slate-700">
                            <div className="flex gap-4">
                              <div className="flex-grow flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Danh sách tên (mỗi dòng 1 tên)</label>
                                <textarea 
                                  rows={5}
                                  placeholder="Nguyễn Văn A&#10;Trần Thị B..."
                                  value={bulkText}
                                  onChange={(e) => setBulkText(e.target.value)}
                                  className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none font-bold custom-scrollbar"
                                />
                              </div>
                              <div className="w-32 flex flex-col gap-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Lớp chung</label>
                                <input 
                                  type="text" 
                                  placeholder="Lớp..."
                                  value={bulkClass}
                                  onChange={(e) => setBulkClass(e.target.value)}
                                  className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none font-bold"
                                />
                              </div>
                            </div>
                            <button onClick={handleBulkImport} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                              <Plus className="w-5 h-5" /> THÊM VÀO DANH SÁCH
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleAddParticipant} className="flex gap-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border-4 border-slate-100 dark:border-slate-700">
                            <div className="flex-grow flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Họ và tên</label>
                              <input 
                                type="text" 
                                placeholder="Nhập tên học sinh..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none font-bold"
                              />
                            </div>
                            <div className="w-32 flex flex-col gap-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Lớp</label>
                              <input 
                                type="text" 
                                placeholder="Lớp..."
                                value={newClass}
                                onChange={(e) => setNewClass(e.target.value)}
                                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none font-bold"
                              />
                            </div>
                            <button type="submit" className="mt-6 p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg">
                              <Plus className="w-6 h-6" />
                            </button>
                          </form>
                        )}

                        <div className="flex justify-between items-center">
                          <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                            <Users className="w-6 h-6 text-indigo-600" /> Sĩ số: {participants.length}
                          </h3>
                          <button onClick={handleClearAll} className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> XÓA TẤT CẢ
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto p-2 custom-scrollbar">
                          {participants.map((p, idx) => (
                            <div key={p.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm group hover:border-indigo-200 transition-all animate-fade-in" style={{ animationDelay: `${idx * 20}ms` }}>
                              <div className="flex items-center gap-4">
                                <span className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-black text-slate-500">{idx + 1}</span>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                                  <div className="text-[10px] text-slate-400 font-bold uppercase">{p.className}</div>
                                </div>
                              </div>
                              <button onClick={() => handleDeleteParticipant(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {participants.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-400 italic font-medium">Danh sách trống. Hãy thêm học sinh hoặc sử dụng chế độ quay số mặc định!</div>
                          )}
                        </div>
                      </div>
                    ) : activeTab === 'spin' ? (
                      <div className="flex flex-col gap-8 animate-fade-in">
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-center gap-4">
                            <button 
                              onClick={() => setSpinMode('wheel')} 
                              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${spinMode === 'wheel' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
                            >
                              <RefreshCw className="w-4 h-4" /> Vòng quay cổ điển
                            </button>
                            <button 
                              onClick={() => setSpinMode('slot')} 
                              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${spinMode === 'slot' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}
                            >
                              <LayoutGrid className="w-4 h-4" /> Máy quay số hiện đại
                            </button>
                          </div>

                          {participants.length > 0 && (
                            <div className="flex justify-center items-center gap-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chọn lớp để quay:</label>
                              <select 
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 font-bold text-sm outline-none focus:border-indigo-500"
                              >
                                <option value="Tất cả">Tất cả các lớp</option>
                                {Array.from(new Set(participants.map(p => p.className))).sort().map(cls => (
                                  <option key={cls} value={cls}>{cls}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {participants.length === 0 && (
                          <div className="flex flex-col items-center gap-4 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-800">
                            <div className="flex items-center gap-4">
                              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Chế độ quay số (1 - {maxNumber})</label>
                              <input 
                                type="number" 
                                min="2" max="100"
                                value={maxNumber}
                                onChange={(e) => setMaxNumber(Math.max(2, parseInt(e.target.value) || 2))}
                                className="w-20 text-center font-black text-xl p-2 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 text-indigo-600 outline-none"
                              />
                            </div>
                            <p className="text-[10px] text-indigo-400 italic">Mẹo: Thêm danh sách học sinh ở tab DANH SÁCH để quay theo tên.</p>
                          </div>
                        )}

                        <div className="flex justify-center">
                          {spinMode === 'wheel' ? renderWheel() : renderSlot()}
                        </div>

                        {winner && !isSpinning && (
                          <div className="text-center animate-bounce-in">
                            <div className="inline-flex items-center gap-3 px-6 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full font-black text-sm uppercase tracking-widest mb-4">
                              <Trophy className="w-4 h-4" /> Chúc mừng người chiến thắng!
                            </div>
                            <h3 className="text-6xl font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter mb-2">{winner.name}</h3>
                            <p className="text-2xl font-bold text-slate-500 dark:text-slate-400">{winner.className}</p>
                          </div>
                        )}

                        <button onClick={handleSpin} disabled={isSpinning} className="w-full py-8 rounded-[3rem] bg-indigo-600 text-white font-black text-4xl shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4">
                            {isSpinning ? <RefreshCw className="w-10 h-10 animate-spin" /> : <Play className="w-10 h-10" />}
                            {isSpinning ? 'ĐANG QUAY...' : 'QUAY NGAY'}
                        </button>

                        {history.length > 0 && (
                          <div className="mt-4 pt-6 border-t-4 border-slate-50 dark:border-slate-700">
                              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <History className="w-5 h-5" /> Lịch sử trúng thưởng
                              </h3>
                              <div className="flex flex-wrap gap-3 max-h-32 overflow-y-auto p-2 custom-scrollbar">
                                  {history.map((p, idx) => (
                                      <div key={idx} className="px-4 py-2 flex flex-col items-center rounded-2xl bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-black border-2 border-indigo-200 shadow-sm animate-fade-in">
                                        <span className="text-lg">{p.name}</span>
                                        <span className="text-[8px] uppercase">{p.className}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6 animate-fade-in">
                          <div className="flex items-center justify-center gap-6">
                              <div className="flex flex-col items-center">
                                  <label className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2">Số lượng nhóm</label>
                                  <input 
                                      type="number" 
                                      min="2" max="16"
                                      value={numGroups}
                                      onChange={(e) => setNumGroups(Math.max(2, parseInt(e.target.value) || 2))}
                                      className="w-32 text-center font-black text-5xl p-4 rounded-[2rem] border-4 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-teal-600 dark:text-teal-400 outline-none focus:border-teal-500 transition-all"
                                  />
                              </div>
                          </div>
                          <p className="text-center text-slate-500 font-medium italic">Hệ thống sẽ chia ngẫu nhiên {participants.length || maxNumber} đối tượng vào {numGroups} nhóm.</p>
                          <button onClick={handleCreateGroups} className="w-full py-8 rounded-[3rem] bg-teal-600 text-white font-black text-4xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                              <Users className="w-10 h-10" />
                              CHIA NHÓM NGAY
                          </button>
                      </div>
                    )}
                </>
            ) : (
                /* FULL SCREEN GROUP VIEW */
                <div className="flex-grow flex flex-col animate-fade-in-up">
                    <div className="mb-8 text-center">
                        <h2 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">Kết quả Chia Nhóm</h2>
                        <div className="inline-block px-6 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-full font-black text-xl uppercase tracking-widest">Sĩ số: {participants.length || maxNumber} | Nhóm: {numGroups}</div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4 flex-grow content-start overflow-y-auto custom-scrollbar">
                        {generatedGroups?.map((group, gIdx) => (
                            <div key={gIdx} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border-4 border-slate-200 dark:border-slate-700 shadow-xl flex flex-col animate-fade-in" style={{ animationDelay: `${gIdx * 100}ms` }}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg">{gIdx + 1}</div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-tight">{group.name}</h3>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {group.members.map((m, mIdx) => (
                                        <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                          <span className="text-[10px] font-black text-slate-400">{mIdx + 1}</span>
                                          <div className="font-bold text-slate-700 dark:text-slate-200">{m.name}</div>
                                          <div className="ml-auto text-[8px] font-black text-slate-400 uppercase">{m.className}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="mt-12 flex justify-center pb-10">
                        <button onClick={() => setShowFullGroups(false)} className="px-12 py-5 bg-slate-800 text-white font-black rounded-3xl text-xl hover:bg-slate-700 transition-all shadow-2xl flex items-center gap-3">
                           <LayoutGrid className="w-6 h-6"/> QUAY LẠI THIẾT LẬP
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default RandomPicker;
