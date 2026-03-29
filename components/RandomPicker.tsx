
import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, History, Dices, Users, LayoutGrid, Sparkles, Trash2, Plus, Minus, UserPlus, Settings, Trophy, List, Play } from 'lucide-react';
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
  "Biệt Đội Cơm Thêm", "Hội Thánh Lầy Lớp Mình", "Nhóm Học Không Hay Quậy Không Ai Bằng", "Biệt Đội Siêu Nhân Giao Bài",
  "Hội Những Người Khốn Khổ Vì Deadline", "Nhóm Vừa Học Vừa Run", "Biệt Đội Thoát Xác Giờ Kiểm Tra", "Hội Thánh Ăn Vụng Cuối Lớp",
  "Nhóm Chuyên Gia Chém Gió", "Biệt Đội Cú Đêm Luyện Game", "Hội Những Người Yêu Sách Nấu Ăn", "Nhóm Thích Đi Trễ",
  "Biệt Đội Siêu Quậy 12A1", "Hội Thánh Nhọ Của Năm", "Nhóm Học Hết Mình Chơi Nhiệt Tình", "Biệt Đội Giải Cứu Thế Giới",
  "Hội Những Người Mơ Mộng", "Nhóm Thích Ăn Hơn Học", "Biệt Đội Siêu Hài Hước", "Hội Thánh Cười Không Lý Do",
  "Nhóm Đùa Với Tử Thần", "Biệt Đội Siêu Ngầu Tự Phong", "Hội Khoe Của Người Khác", "Nhóm Thánh Tự Sướng",
  "Biệt Đội Đỉnh Cao Của Sự Lười", "Hội Học Giả Vờ", "Nhóm Làm Việc Nghĩ Về Đồ Ăn", "Biệt Đội Siêu Chăm Ngủ",
  "Hội Giúp Đỡ Nhắc Bài", "Nhóm Chia Sẻ Copy Bài", "Biệt Đội Tốt Bụng Dễ Dụ", "Hội Yêu Đơn Phương Crush",
  "Nhóm Thương Hại Bản Thân", "Biệt Đội Nhớ Dai Nợ Cũ", "Hội Quên Sạch Kiến Thức", "Nhóm Nhớ Người Yêu Đồ Ăn",
  "Biệt Đội Sợ Mẹ", "Hội Ghét Cả Thế Giới", "Nhóm Yêu Màu Tím Mực Tím", "Biệt Đội Ghét Sến",
  "Hội Yêu Cây Cỏ Thích Trốn Học", "Nhóm Ghét Muỗi", "Biệt Đội Yêu Đời Dù Điểm Kém", "Hội Thương Người Nghèo Kiến Thức",
  "Nhóm Ghét Giàu Bài Tập", "Biệt Đội Yêu Bản Thân", "Hội Thương Cha Mẹ Nên Phải Học", "Nhóm Ghét Kiểm Tra",
  "Biệt Đội Yêu Bạn Lúc Có Đồ Ăn", "Hội Thương Động Vật", "Nhóm Sợ Gián", "Biệt Đội Yêu Thiên Nhiên",
  "Hội Thương Cây Cối", "Nhóm Ghét Rác Thải", "Biệt Đội Yêu Hòa Bình", "Hội Thương Trẻ Em",
  "Nhóm Ghét Chiến Tranh", "Biệt Đội Yêu Tự Do Lúc Tan Trường", "Hội Thương Người Già", "Nhóm Ghét Méc Cô",
  "Biệt Đội Yêu Sự Thật", "Hội Chân Thành", "Nhóm Ghét Phản Bội", "Biệt Đội Chung Thủy Với Tiệm Nét",
  "Hội Bao Dung Cho Mượn Vở", "Nhóm Ghét Ích Kỷ", "Biệt Đội Khiêm Tốn Dù Học Giỏi", "Hội Tự Tin Dù Không Biết Gì",
  "Nhóm Ghét Kiêu Ngạo", "Biệt Đội Dũng Cảm Lên Bảng", "Hội Kiên Trì Chờ Chuông", "Nhóm Ghét Hèn Nhát",
  "Biệt Đội Sáng Tạo Cách Trốn Học", "Hội Thông Minh Đột Xuất", "Nhóm Ghét Ngu Ngốc", "Biệt Đội Hài Hước",
  "Hội Vui Vẻ", "Nhóm Ghét Buồn Bã", "Biệt Đội Hạnh Phúc", "Hội Bình Yên Giờ Ra Chơi",
  "Nhóm Ghét Ồn Ào Lúc Đang Ngủ", "Biệt Đội Tĩnh Lặng Giờ Kiểm Tra", "Hội Đơn Giản", "Nhóm Ghét Phức Tạp",
  "Biệt Đội Hiện Đại", "Hội Cổ Điển", "Nhóm Ghét Lạc Hậu", "Biệt Đội Tiến Bộ",
  "Hội Phát Triển", "Nhóm Ghét Trì Trệ", "Biệt Đội Thành Công", "Hội Thất Bại Là Mẹ Thành Công",
  "Nhóm Ghét Lười Biếng Nói Thế Thôi", "Biệt Đội Chăm Chỉ Đột Xuất", "Hội Đoàn Kết Khi Quay Cóp", "Nhóm Ghét Chia Rẽ",
  "Biệt Đội Tôn Trọng", "Hội Lắng Nghe Lời Cô Giảng", "Nhóm Ghét Vô Tâm", "Biệt Đội Siêu Cấp Vip Pro"
];

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
];

const GROUP_THEMES = [
  { text: 'text-blue-400', border: 'border-blue-500/50', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]', bg: 'bg-blue-500/10' },
  { text: 'text-emerald-400', border: 'border-emerald-500/50', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]', bg: 'bg-emerald-500/10' },
  { text: 'text-amber-400', border: 'border-amber-500/50', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]', bg: 'bg-amber-500/10' },
  { text: 'text-rose-400', border: 'border-rose-500/50', glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]', bg: 'bg-rose-500/10' },
  { text: 'text-cyan-400', border: 'border-cyan-500/50', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]', bg: 'bg-cyan-500/10' },
  { text: 'text-violet-400', border: 'border-violet-500/50', glow: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]', bg: 'bg-violet-500/10' },
  { text: 'text-orange-400', border: 'border-orange-500/50', glow: 'shadow-[0_0_30px_rgba(249,115,22,0.3)]', bg: 'bg-orange-500/10' },
  { text: 'text-teal-400', border: 'border-teal-500/50', glow: 'shadow-[0_0_30px_rgba(20,184,166,0.3)]', bg: 'bg-teal-500/10' },
  { text: 'text-indigo-400', border: 'border-indigo-500/50', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.3)]', bg: 'bg-indigo-500/10' },
  { text: 'text-pink-400', border: 'border-pink-500/50', glow: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]', bg: 'bg-pink-500/10' },
  { text: 'text-lime-400', border: 'border-lime-500/50', glow: 'shadow-[0_0_30px_rgba(132,204,22,0.3)]', bg: 'bg-lime-500/10' },
  { text: 'text-yellow-400', border: 'border-yellow-500/50', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.3)]', bg: 'bg-yellow-500/10' },
  { text: 'text-purple-400', border: 'border-purple-500/50', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]', bg: 'bg-purple-500/10' },
  { text: 'text-red-400', border: 'border-red-500/50', glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]', bg: 'bg-red-500/10' },
  { text: 'text-sky-400', border: 'border-sky-500/50', glow: 'shadow-[0_0_30px_rgba(14,165,233,0.3)]', bg: 'bg-sky-500/10' },
  { text: 'text-green-400', border: 'border-green-500/50', glow: 'shadow-[0_0_30px_rgba(34,197,94,0.3)]', bg: 'bg-green-500/10' }
];

const RandomPicker: React.FC<RandomPickerProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'spin' | 'group' | 'list'>('spin');
  const [spinMode, setSpinMode] = useState<'wheel' | 'slot'>('wheel');
  
  const [spinLeftMode, setSpinLeftMode] = useState<'list' | 'edit'>('list');
  
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
  const [winner, setWinner] = useState<Participant | { id: string, name: string, className: string } | null>(null);
  const [currentCandidate, setCurrentCandidate] = useState<Participant | { id: string, name: string, className: string } | null>(null);
  const [history, setHistory] = useState<(Participant | { id: string, name: string, className: string })[]>([]);
  const [rotation, setRotation] = useState(0);
  const [slotIndex, setSlotIndex] = useState(0);

  // Grouping State
  const [numGroups, setNumGroups] = useState(4);
  const [generatedGroups, setGeneratedGroups] = useState<{name: string, members: Participant[]}[] | null>(null);
  const [showFullGroups, setShowFullGroups] = useState(false);
  const [groupFontSize, setGroupFontSize] = useState(24);

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
    setWinner(null);
    setCurrentCandidate(null);

    if (spinMode === 'wheel') {
      // Dramatic JS-driven Wheel Spin with variable speed and suspenseful ending
      const startTime = performance.now();
      const duration = 9000 + Math.random() * 3000; // Longer duration for more drama
      const startRotation = rotation;
      const extraRotations = 12 + Math.random() * 8;
      const totalRotationToSpin = extraRotations * 360 + Math.random() * 360;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        let easedProgress;
        if (progress < 0.15) {
          // Phase 1: Acceleration
          easedProgress = Math.pow(progress / 0.15, 2) * 0.1;
        } else if (progress < 0.7) {
          // Phase 2: Variable speed (slow/fast pulses to see names)
          const base = 0.1 + ((progress - 0.15) / 0.55) * 0.65;
          // Pulse effect: sin wave that modulates speed
          const pulse = Math.sin(progress * 25) * 0.02;
          easedProgress = base + pulse;
        } else if (progress < 0.9) {
          // Phase 3: Deep deceleration (The "Fake-out" stop)
          const p = (progress - 0.7) / 0.2;
          // We want it to reach near 0.95 progress and stay there for a bit
          easedProgress = 0.75 + (1 - Math.pow(1 - p, 2)) * 0.2;
        } else {
          // Phase 4: Final slow crawl to the winner
          const p = (progress - 0.9) / 0.1;
          easedProgress = 0.95 + p * 0.05;
        }
        
        const currentRotation = startRotation + easedProgress * totalRotationToSpin;
        setRotation(currentRotation);
        
        // Update current candidate for live preview
        const finalRotation = currentRotation % 360;
        const segmentAngle = 360 / activeList.length;
        const index = Math.floor(((360 - (finalRotation % 360)) % 360) / segmentAngle);
        setCurrentCandidate(activeList[index]);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Finish
          const winP = activeList[index];
          setWinner(winP);
          setHistory(prev => [winP, ...prev.slice(0, 19)]);
          setIsSpinning(false);
          setCurrentCandidate(null);

          confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.5 },
            colors: COLORS
          });
        }
      };
      requestAnimationFrame(animate);
    } else {
      // Dramatic Slot Mode with variable speed and suspenseful ending
      let count = 0;
      const totalSteps = 80 + Math.floor(Math.random() * 40);
      
      const runStep = () => {
        setSlotIndex(prev => {
          const next = (prev + 1) % activeList.length;
          setCurrentCandidate(activeList[next]);
          return next;
        });
        
        count++;
        
        if (count < totalSteps) {
          let delay;
          const progress = count / totalSteps;
          
          if (progress < 0.15) {
            // Phase 1: Acceleration
            delay = Math.max(30, 200 - (progress * 1000));
          } else if (progress < 0.7) {
            // Phase 2: Variable speed (pulses)
            const isSlow = Math.floor(count / 5) % 2 === 0;
            delay = isSlow ? 150 : 40;
          } else if (progress < 0.9) {
            // Phase 3: Deep deceleration (Fake-out stop)
            const p = (progress - 0.7) / 0.2;
            delay = 200 + Math.pow(p * 5, 2) * 150; // Delay increases up to ~4000ms
          } else {
            // Phase 4: Final slow steps
            delay = 400 + (count % 3) * 100;
          }
          
          setTimeout(runStep, delay);
        } else {
          // Finished
          // We need the latest index here. Since we're in a timeout, we can't easily get it from state.
          // But we can use the currentIdx we captured in the last setSlotIndex call.
          // Actually, it's better to just use a ref for the index during the spin.
          setTimeout(() => {
            setSlotIndex(prev => {
              const winP = activeList[prev % activeList.length];
              setWinner(winP);
              setHistory(historyPrev => [winP, ...historyPrev.slice(0, 19)]);
              setIsSpinning(false);
              setCurrentCandidate(null);

              confetti({
                particleCount: 200,
                spread: 90,
                origin: { y: 0.5 },
                colors: COLORS
              });
              return prev;
            });
          }, 100);
        }
      };
      
      runStep();
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
    const names = [...GROUP_NAMES];
    // Shuffle names
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }

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
      <div className="relative w-64 h-64 mx-auto">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20 w-8 h-10 bg-red-500 clip-path-triangle shadow-lg border-2 border-white" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
        
        <svg 
          viewBox="0 0 320 320" 
          className="w-full h-full drop-shadow-2xl wheel-svg"
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
      <div className="relative w-full max-w-sm mx-auto h-36 bg-slate-900 rounded-[2rem] border-8 border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
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
    <div className="fixed inset-0 z-[150] bg-[#0f172a] flex items-center justify-center animate-fade-in overflow-hidden">
      <div className={`bg-slate-900 shadow-2xl relative transition-all duration-500 flex flex-col ${showFullGroups ? 'w-full h-full' : 'w-full max-w-4xl h-[90vh] rounded-[3rem] border-8 border-indigo-100/10 overflow-hidden'}`}>
        
        {/* Main Close Button - Always visible and not cut off */}
        <button 
            onClick={showFullGroups ? () => setShowFullGroups(false) : onClose} 
            className="absolute top-8 right-8 z-[300] p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/20 shadow-2xl group"
        >
            <X className="w-10 h-10 group-hover:rotate-90 transition-transform" />
        </button>

        {/* Header - Compact & Minimalist */}
        {!showFullGroups && (
            <div className="bg-indigo-600 px-6 py-3 flex justify-between items-center text-white shrink-0 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Dices className="w-6 h-6" />
                    <h2 className="text-xl font-black uppercase tracking-tight leading-none">
                        QUAY MAY MẮN
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setActiveTab('spin')} 
                      className={`px-4 py-2 rounded-xl font-black text-sm transition-all uppercase ${activeTab === 'spin' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}
                    >
                      QUAY
                    </button>
                    <button 
                      onClick={() => setActiveTab('group')} 
                      className={`px-4 py-2 rounded-xl font-black text-sm transition-all uppercase ${activeTab === 'group' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}
                    >
                      CHIA NHÓM
                    </button>
                    <button 
                      onClick={() => setActiveTab('list')} 
                      className={`px-4 py-2 rounded-xl font-black text-sm transition-all uppercase ${activeTab === 'list' ? 'bg-white text-indigo-600 shadow-lg' : 'text-white hover:bg-white/10'}`}
                    >
                      DANH SÁCH
                    </button>
                </div>
            </div>
        )}

        <div className={`flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar bg-slate-900 ${!showFullGroups ? 'p-6' : ''}`}>
            {!showFullGroups ? (
                <>
                    {activeTab === 'list' ? (
                      <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto w-full">
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
                      <div className="flex flex-col lg:flex-row gap-8 animate-fade-in h-full overflow-hidden">
                        {/* LEFT: TEXT INTERFACE & LIST */}
                        <div className="w-full lg:w-1/3 flex flex-col gap-4 bg-slate-800/30 p-6 rounded-[2rem] border border-slate-700/50 overflow-hidden">
                          <div className="flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-black text-slate-300 uppercase tracking-tighter flex items-center gap-2">
                              {spinLeftMode === 'list' ? <List className="w-5 h-5 text-indigo-500" /> : <RefreshCw className="w-5 h-5 text-indigo-500" />}
                              {spinLeftMode === 'list' ? 'Danh sách' : 'Sửa văn bản'}
                            </h3>
                            <button 
                              onClick={() => {
                                if (spinLeftMode === 'list') {
                                  setBulkText(getActiveList().map(p => p.name).join('\n'));
                                  setSpinLeftMode('edit');
                                } else {
                                  // Save
                                  const lines = bulkText.split('\n').filter(l => l.trim());
                                  const newPs: Participant[] = lines.map((l, idx) => ({
                                    id: (Date.now() + idx).toString(),
                                    name: l.trim(),
                                    className: bulkClass.trim() || 'Lớp'
                                  }));
                                  setParticipants(newPs);
                                  setSpinLeftMode('list');
                                }
                              }}
                              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                              {spinLeftMode === 'list' ? 'Sửa nhanh' : 'Lưu lại'}
                            </button>
                          </div>

                          <div className="flex-grow flex flex-col gap-4 overflow-hidden">
                            {spinLeftMode === 'list' ? (
                              <>
                                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                  {getActiveList().map((p, idx) => (
                                    <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-700/50 transition-colors">
                                      <span className="w-6 h-6 flex items-center justify-center bg-slate-700 rounded-lg text-[10px] font-black text-slate-400">{idx + 1}</span>
                                      <span className="font-bold text-slate-200 text-sm truncate">{p.name}</span>
                                    </div>
                                  ))}
                                  {getActiveList().length === 0 && (
                                    <div className="text-center py-12 text-slate-500 italic text-sm">Danh sách trống</div>
                                  )}
                                </div>

                                <div className="shrink-0 pt-4 border-t border-slate-700/50 space-y-4">
                                  <div className="flex items-center justify-between gap-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lọc theo lớp</label>
                                    <select 
                                      value={selectedClass}
                                      onChange={(e) => setSelectedClass(e.target.value)}
                                      className="px-3 py-1.5 rounded-xl bg-slate-700 border border-slate-600 font-bold text-xs outline-none focus:border-indigo-500 text-slate-200"
                                    >
                                      <option value="Tất cả">Tất cả</option>
                                      {Array.from(new Set(participants.map(p => p.className))).sort().map(cls => (
                                        <option key={cls} value={cls}>{cls}</option>
                                      ))}
                                    </select>
                                  </div>

                                  {participants.length === 0 && (
                                    <div className="flex items-center justify-between gap-2">
                                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Số lượng (1-{maxNumber})</label>
                                      <input 
                                        type="number" 
                                        min="2" max="100"
                                        value={maxNumber}
                                        onChange={(e) => setMaxNumber(Math.max(2, parseInt(e.target.value) || 2))}
                                        className="w-16 text-center font-black text-sm p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-indigo-400 outline-none"
                                      />
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col gap-4 h-full">
                                <textarea 
                                  value={bulkText}
                                  onChange={(e) => setBulkText(e.target.value)}
                                  placeholder="Nhập danh sách tên, mỗi dòng 1 tên..."
                                  className="flex-grow p-4 rounded-2xl bg-slate-900/50 border-2 border-slate-700 focus:border-indigo-500 outline-none font-bold text-slate-200 custom-scrollbar resize-none"
                                />
                                <div className="flex flex-col gap-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Lớp chung</label>
                                  <input 
                                    type="text" 
                                    placeholder="Lớp..."
                                    value={bulkClass}
                                    onChange={(e) => setBulkClass(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-slate-900/50 border-2 border-slate-700 focus:border-indigo-500 outline-none font-bold text-slate-200"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* RIGHT: SPIN AREA */}
                        <div className="flex-grow flex flex-col gap-6 items-center justify-center relative">
                          {/* LIVE PREVIEW SCREEN */}
                          <div className={`w-full max-w-xl h-24 bg-slate-900/80 backdrop-blur-xl rounded-[2rem] border-4 transition-all duration-300 flex flex-col items-center justify-center overflow-hidden relative group ${isSpinning ? 'border-indigo-500 shadow-[0_0_50px_rgba(99,102,241,0.4)]' : 'border-slate-800 shadow-2xl'}`}>
                            <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-indigo-500/10 opacity-50 ${isSpinning ? 'animate-pulse' : ''}`}></div>
                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent ${isSpinning ? 'opacity-100' : 'opacity-0'}`}></div>
                            
                            {currentCandidate ? (
                              <div className="text-center animate-bounce-in">
                                <div className="text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">
                                  {currentCandidate.name}
                                </div>
                                <div className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                                  {currentCandidate.className}
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-600 font-black text-lg uppercase tracking-[0.3em] flex items-center gap-3">
                                {isSpinning ? (
                                  <>
                                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                                    <span>ĐANG LỌC...</span>
                                  </>
                                ) : (
                                  <span>SẴN SÀNG</span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex justify-center gap-4 shrink-0">
                            <button 
                              onClick={() => setSpinMode('wheel')} 
                              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${spinMode === 'wheel' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                            >
                              <RefreshCw className="w-4 h-4" /> Vòng quay
                            </button>
                            <button 
                              onClick={() => setSpinMode('slot')} 
                              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${spinMode === 'slot' ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}
                            >
                              <LayoutGrid className="w-4 h-4" /> Máy quay số
                            </button>
                          </div>

                          <div className="flex-grow flex items-center justify-center w-full">
                            {spinMode === 'wheel' ? renderWheel() : renderSlot()}
                          </div>

                          <div className="w-full max-w-sm shrink-0">
                            <button 
                              onClick={handleSpin} 
                              disabled={isSpinning} 
                              className="w-full py-4 rounded-[2rem] bg-indigo-600 text-white font-black text-xl shadow-2xl active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-4 border-b-8 border-indigo-800"
                            >
                                {isSpinning ? <RefreshCw className="w-8 h-8 animate-spin" /> : <Play className="w-8 h-8" />}
                                {isSpinning ? 'ĐANG QUAY...' : 'QUAY NGAY'}
                            </button>
                          </div>

                          {/* WINNER MODAL */}
                          {winner && !isSpinning && (
                            <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
                              <div className="relative max-w-2xl w-full bg-slate-900 border-4 border-amber-500/50 rounded-[4rem] p-12 text-center shadow-[0_0_100px_rgba(245,158,11,0.3)] animate-bounce-in overflow-hidden">
                                {/* Decorative elements */}
                                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                                <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                                
                                <button 
                                  onClick={() => setWinner(null)}
                                  className="absolute top-8 right-8 p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full transition-all"
                                >
                                  <X className="w-6 h-6" />
                                </button>

                                <div className="inline-flex items-center gap-3 px-8 py-3 bg-amber-500/20 text-amber-400 rounded-full font-black text-lg uppercase tracking-[0.2em] mb-8 border border-amber-500/30">
                                  <Trophy className="w-6 h-6" /> NGƯỜI CHIẾN THẮNG
                                </div>
                                
                                <div className="space-y-4">
                                  <h3 className="text-8xl font-black text-white uppercase tracking-tighter drop-shadow-[0_10px_20px_rgba(255,255,255,0.2)]">
                                    {winner.name}
                                  </h3>
                                  <p className="text-3xl font-black text-indigo-400 uppercase tracking-widest">
                                    {winner.className}
                                  </p>
                                </div>

                                <div className="mt-12 grid grid-cols-2 gap-4">
                                  <button 
                                    onClick={() => setWinner(null)}
                                    className="py-4 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-700 transition-all"
                                  >
                                    Đóng
                                  </button>
                                  <button 
                                    onClick={() => { setWinner(null); handleSpin(); }}
                                    className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                                  >
                                    Quay tiếp
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {history.length > 0 && (
                            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 overflow-x-auto custom-scrollbar pb-2">
                                <div className="shrink-0 flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-700/50">
                                  <History className="w-3 h-3" /> Lịch sử:
                                </div>
                                {history.map((p, idx) => (
                                    <div key={idx} className="shrink-0 px-3 py-1.5 flex flex-col items-center rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 font-black text-[10px] animate-fade-in">
                                      <span>{p.name}</span>
                                    </div>
                                ))}
                            </div>
                          )}
                        </div>
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
                <div className="flex-grow flex flex-col animate-fade-in-up h-full bg-[#0f172a] p-6 overflow-hidden relative">
                    <div className="mb-6 flex items-center justify-between shrink-0">
                        <h2 className="text-6xl font-black text-[#f97316] uppercase tracking-tighter drop-shadow-[0_5px_10px_rgba(249,115,22,0.4)]">
                            KẾT QUẢ CHIA NHÓM
                        </h2>
                        
                        <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-2xl border border-slate-700">
                            <span className="text-slate-400 font-black text-sm uppercase mr-2">Cỡ chữ:</span>
                            <button 
                                onClick={() => setGroupFontSize(prev => Math.max(8, prev - 2))}
                                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <div className="w-12 text-center text-2xl font-black text-white">{groupFontSize}</div>
                            <button 
                                onClick={() => setGroupFontSize(prev => Math.min(100, prev + 2))}
                                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 flex-grow items-start content-start overflow-y-auto custom-scrollbar pb-32 pr-2">
                        {generatedGroups?.map((group, gIdx) => {
                            const theme = GROUP_THEMES[gIdx % GROUP_THEMES.length];
                            return (
                                <div 
                                    key={gIdx} 
                                    className={`bg-slate-900/90 backdrop-blur-xl p-4 rounded-[2rem] border-2 ${theme.border} shadow-xl ${theme.glow} flex flex-col animate-fade-in transition-all hover:scale-[1.02] h-fit`}
                                    style={{ animationDelay: `${gIdx * 50}ms` }}
                                >
                                    <div className="flex items-center justify-between mb-4 border-b border-slate-700/50 pb-3 shrink-0">
                                        <h3 className={`text-lg font-black ${theme.text} uppercase tracking-tight leading-tight pr-2 break-words`}>
                                            {group.name}
                                        </h3>
                                        <div className={`w-8 h-8 shrink-0 ${theme.bg} ${theme.text} rounded-full flex items-center justify-center font-black text-sm border ${theme.border}`}>
                                            {group.members.length}
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 content-start pr-1">
                                        {group.members.map((m) => (
                                            <div 
                                                key={m.id} 
                                                className="px-3 py-1.5 bg-slate-800/90 rounded-xl border border-slate-700 shadow-md flex items-center justify-center min-w-[40px]"
                                            >
                                                <div 
                                                    className="font-black text-white tracking-tighter leading-none"
                                                    style={{ fontSize: `${groupFontSize}px` }}
                                                >
                                                    {m.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/90 to-transparent flex justify-center items-center z-50">
                        <button 
                            onClick={() => setShowFullGroups(false)}
                            className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-2xl transition-all border-2 border-slate-600 uppercase tracking-widest shadow-xl backdrop-blur-md active:scale-95 flex items-center gap-4 group"
                        >
                            <LayoutGrid className="w-8 h-8 group-hover:rotate-90 transition-transform duration-500"/> 
                            QUAY LẠI THIẾT LẬP
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
