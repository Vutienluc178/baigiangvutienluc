
import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { X, Eraser, Undo, Trash2, Minus, Circle, PenTool, Type, ChevronDown, ChevronUp, Grid3X3, Square, Triangle, ChevronRight, ChevronLeft, PanelBottom, Image as ImageIcon, Save, Upload, List, AlertCircle, BoxSelect, MousePointer2, Lock, Unlock, ArrowUpRight } from 'lucide-react';

interface BlackboardProps {
  onClose: () => void;
  mode: 'bottom' | 'side' | 'overlay';
  onModeChange: (mode: 'bottom' | 'side' | 'overlay') => void;
}

type ToolType = 'pen' | 'eraser' | 'line' | 'dashed-line' | 'circle' | 'ellipse' | 'rectangle' | 'triangle' | 'parallelogram' | 'arrow' | 'text';
type ColorType = '#ffffff' | '#facc15' | '#fef9c3' | '#f43f5e' | '#4ade80' | '#60a5fa';

interface SavedBoardImage {
  id: string;
  name: string;
  data: string;
  date: number;
}

const Blackboard: React.FC<BlackboardProps> = ({ onClose, mode, onModeChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const isDrawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const snapshotRef = useRef<ImageData | null>(null);
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<ColorType>('#ffffff');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isGridMode, setIsGridMode] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{mathX: number, mathY: number} | null>(null);
  const [textInput, setTextInput] = useState<{ x: number; y: number; text: string } | null>(null);

  // Image Management State
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [savedImages, setSavedImages] = useState<SavedBoardImage[]>([]);
  const [newImageName, setNewImageName] = useState('');
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
        const saved = localStorage.getItem('ai_studio_bg_library');
        if (saved) setSavedImages(JSON.parse(saved));
    } catch (e) {
        console.error("Failed to load saved images", e);
    }
  }, []);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number, grid: boolean) => {
    if (mode === 'overlay') {
      ctx.clearRect(0, 0, width, height);
    } else {
      ctx.fillStyle = '#000000'; // Màu đen
      ctx.fillRect(0, 0, width, height);
    }

    if (grid) {
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const gridSize = 40;

      ctx.save();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = centerX; x < width; x += gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let x = centerX; x > 0; x -= gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
      for (let y = centerY; y < height; y += gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      for (let y = centerY; y > 0; y -= gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
      ctx.lineTo(width - 10, centerY - 5); ctx.moveTo(width, centerY); ctx.lineTo(width - 10, centerY + 5);
      ctx.moveTo(centerX, height); ctx.lineTo(centerX, 0);
      ctx.lineTo(centerX - 5, 10); ctx.moveTo(centerX, 0); ctx.lineTo(centerX + 5, 10);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px sans-serif';
      ctx.fillText('x', width - 20, centerY - 10);
      ctx.fillText('y', centerX + 10, 20);
      ctx.fillText('O', centerX - 20, centerY + 20);
      ctx.restore();
    }
  };

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    const resizeCanvas = () => {
      if (!canvas || !ctx || !container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (canvas.width === width && canvas.height === height) return;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) tempCtx.drawImage(canvas, 0, 0);
      canvas.width = width;
      canvas.height = height;
      drawBackground(ctx, width, height, isGridMode);
      if (tempCanvas.width > 0) ctx.drawImage(tempCanvas, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    resizeCanvas();
    if (ctx) {
       const data = ctx.getImageData(0,0,1,1).data;
       if (data[3] === 0) drawBackground(ctx, canvas.width, canvas.height, isGridMode);
    }
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isGridMode, mode, isCollapsed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
       ctx.strokeStyle = tool === 'eraser' ? '#000000' : color; // Màu tẩy là đen
       ctx.lineWidth = tool === 'eraser' ? 30 : 3;
       ctx.lineCap = 'round';
       ctx.lineJoin = 'round';
       ctx.setLineDash(tool === 'dashed-line' ? [10, 10] : []);
    }
  }, [tool, color]);

  useEffect(() => { if (textInput && inputRef.current) inputRef.current.focus(); }, [textInput]);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev, imageData].slice(-20));
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    const previousState = newHistory.pop();
    setHistory(newHistory);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && previousState) ctx.putImageData(previousState, 0, 0);
    else if (canvas && ctx && newHistory.length === 0) {
        if (mode === 'overlay') ctx.clearRect(0, 0, canvas.width, canvas.height);
        else drawBackground(ctx, canvas.width, canvas.height, isGridMode);
    }
  };

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      saveToHistory();
      drawBackground(ctx, canvas.width, canvas.height, isGridMode);
      setTextInput(null);
    }
  };

  const toggleGrid = () => {
    const newMode = !isGridMode;
    setIsGridMode(newMode);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
       saveToHistory();
       drawBackground(ctx, canvas.width, canvas.height, newMode);
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleTextCommit = () => {
    if (!textInput || !textInput.text.trim()) { setTextInput(null); return; }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
        saveToHistory();
        ctx.save();
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = color;
        ctx.textBaseline = 'top'; 
        ctx.fillText(textInput.text, textInput.x, textInput.y);
        ctx.restore();
    }
    setTextInput(null);
  };

  const renderImageOnCanvas = (base64Data: string) => {
    const img = new Image();
    img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            saveToHistory();
            const canvasWidth = canvas.width;
            const scale = canvasWidth / img.width;
            const drawHeight = img.height * scale;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, canvasWidth, drawHeight);
        }
    };
    img.src = base64Data;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        // Render Immediately
        renderImageOnCanvas(base64);

        // Save if name is present
        if (newImageName.trim()) {
            try {
                const newItem: SavedBoardImage = {
                    id: Date.now().toString(),
                    name: newImageName.trim(),
                    data: base64,
                    date: Date.now()
                };
                const updated = [newItem, ...savedImages];
                setSavedImages(updated);
                localStorage.setItem('ai_studio_bg_library', JSON.stringify(updated));
                setNewImageName(''); // Reset input
                setStorageError(null);
            } catch (err) {
                setStorageError("Bộ nhớ đầy! Không thể lưu ảnh mới.");
            }
        }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteSavedImage = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = savedImages.filter(img => img.id !== id);
      setSavedImages(updated);
      localStorage.setItem('ai_studio_bg_library', JSON.stringify(updated));
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCollapsed) return;
    const { x, y } = getCoordinates(e);
    if (tool === 'text') {
        if (textInput) handleTextCommit();
        else setTextInput({ x, y, text: '' });
        return;
    }
    if (textInput) { handleTextCommit(); return; }
    isDrawingRef.current = true;
    startPosRef.current = { x, y };
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = (tool === 'eraser' && mode !== 'overlay') ? '#000000' : color; 
      if (tool === 'eraser' && mode === 'overlay') {
          ctx.globalCompositeOperation = 'destination-out';
      } else {
          ctx.globalCompositeOperation = 'source-over';
      }
      ctx.lineWidth = tool === 'eraser' ? 30 : 3;
    }
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLocked) return;
    const { x, y } = getCoordinates(e);
    if (isGridMode && canvasRef.current) {
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        setCursorCoords({ mathX: Math.round((x - centerX) / 40 * 10) / 10, mathY: Math.round(-(y - centerY) / 40 * 10) / 10 });
    } else { setCursorCoords(null); }
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      if (tool === 'pen' || tool === 'eraser') {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        const snapshot = snapshotRef.current;
        const startPos = startPosRef.current;
        if (snapshot && startPos) {
          ctx.putImageData(snapshot, 0, 0);
          ctx.beginPath();
          ctx.setLineDash([]);
          if (tool === 'line' || tool === 'dashed-line') {
             if (tool === 'dashed-line') ctx.setLineDash([10, 10]);
             ctx.moveTo(startPos.x, startPos.y); ctx.lineTo(x, y);
          } else if (tool === 'circle') {
             ctx.arc(startPos.x, startPos.y, Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2)), 0, 2 * Math.PI);
          } else if (tool === 'ellipse') {
             ctx.ellipse(startPos.x, startPos.y, Math.abs(x - startPos.x), Math.abs(y - startPos.y), 0, 0, 2 * Math.PI);
          } else if (tool === 'rectangle') {
             ctx.rect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
          } else if (tool === 'triangle') {
             ctx.moveTo(startPos.x + (x - startPos.x) / 2, startPos.y); ctx.lineTo(startPos.x, y); ctx.lineTo(x, y); ctx.closePath();
          } else if (tool === 'parallelogram') {
             const offset = (x - startPos.x) * 0.25;
             ctx.moveTo(startPos.x + offset, startPos.y);
             ctx.lineTo(x + offset, startPos.y);
             ctx.lineTo(x, y);
             ctx.lineTo(startPos.x, y);
             ctx.closePath();
          } else if (tool === 'arrow') {
             const headlen = 15;
             const angle = Math.atan2(y - startPos.y, x - startPos.x);
             ctx.moveTo(startPos.x, startPos.y);
             ctx.lineTo(x, y);
             ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
             ctx.moveTo(x, y);
             ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
          }
          ctx.stroke();
        }
      }
    }
  };

  const stopDrawing = () => { if (isDrawingRef.current) { isDrawingRef.current = false; saveToHistory(); } };

  const containerProps = mode === 'side' ? {
        className: `fixed top-0 right-0 bottom-0 z-[100] bg-black border-l-4 border-slate-700 shadow-2xl touch-none transition-transform duration-300 ease-in-out ${isCollapsed ? 'translate-x-[calc(100%-30px)]' : 'translate-x-0'}`,
        style: { width: '50vw' }
      } : mode === 'bottom' ? {
        className: `fixed bottom-0 left-0 right-0 z-[100] bg-black border-t-4 border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] touch-none transition-transform duration-300 ease-in-out ${isCollapsed ? 'translate-y-[calc(100%-30px)]' : 'translate-y-0'}`,
        style: { height: '70vh' }
      } : {
        className: `fixed inset-0 z-[300] bg-transparent touch-none pointer-events-none`,
        style: { width: '100vw', height: '100vh' }
      };

  return (
    <div ref={containerRef} className={containerProps.className} style={containerProps.style}>
      {/* Tiny Grab Handle */}
      {mode === 'overlay' ? null : mode === 'bottom' ? (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white flex items-center gap-1 px-3 py-1 rounded-t-lg border-t border-x border-slate-600 cursor-pointer pointer-events-auto" onClick={() => setIsCollapsed(!isCollapsed)}>
            <span className="text-[10px] font-bold uppercase">Bảng</span>
            {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      ) : (
         <div className="absolute top-1/2 -left-6 -translate-y-1/2 bg-slate-800 text-white flex flex-col items-center gap-1 px-1 py-3 rounded-l-lg border-l border-y border-slate-600 cursor-pointer pointer-events-auto" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span className="text-[10px] font-bold uppercase [writing-mode:vertical-rl] rotate-180">Bảng</span>
        </div>
      )}
      
      {isGridMode && cursorCoords && !isCollapsed && <div className="absolute top-2 left-2 bg-slate-900/80 text-indigo-300 px-2 py-1 rounded border border-slate-700 text-xs font-mono pointer-events-none">({cursorCoords.mathX}; {cursorCoords.mathY})</div>}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={handleMouseMove} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={handleMouseMove} onTouchEnd={stopDrawing} className={`cursor-crosshair block w-full h-full ${isLocked ? 'pointer-events-none' : 'pointer-events-auto'}`} />
      {textInput && !isCollapsed && <input ref={inputRef} type="text" value={textInput.text} onChange={(e) => setTextInput({ ...textInput, text: e.target.value })} onBlur={handleTextCommit} onKeyDown={(e) => { if (e.key === 'Enter') handleTextCommit(); }} autoFocus className="absolute bg-transparent border border-dashed border-white/50 outline-none p-0 m-0 z-[110] pointer-events-auto" style={{ left: textInput.x, top: textInput.y, color: color, font: 'bold 24px sans-serif' }} />}

      {/* Image Manager Popover */}
      {showImageMenu && !isCollapsed && (
          <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-slate-900 border border-slate-700 w-64 rounded-xl shadow-2xl p-3 z-[130] flex flex-col gap-3 animate-fade-in pointer-events-auto">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                  <span className="text-xs font-bold text-white uppercase flex items-center gap-2"><ImageIcon className="w-3 h-3"/> Thư viện ảnh</span>
                  <button onClick={() => setShowImageMenu(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
              </div>

              <div className="flex flex-col gap-2">
                  <input 
                    type="text" 
                    value={newImageName}
                    onChange={(e) => setNewImageName(e.target.value)}
                    placeholder="Nhập tên bảng..."
                    className="bg-slate-800 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-indigo-500"
                  />
                  <button 
                    onClick={() => imageInputRef.current?.click()} 
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Upload className="w-3 h-3"/> Tải lên & Lưu
                  </button>
                  {storageError && <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {storageError}</span>}
              </div>

              <div className="h-px bg-slate-700 w-full"></div>

              <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {savedImages.length === 0 ? (
                      <div className="text-center text-slate-500 text-[10px] italic py-2">Chưa có ảnh nào lưu</div>
                  ) : (
                      savedImages.map(img => (
                          <div key={img.id} onClick={() => { renderImageOnCanvas(img.data); setShowImageMenu(false); }} className="flex items-center gap-2 p-2 hover:bg-slate-800 rounded-lg cursor-pointer group">
                              <img src={img.data} className="w-8 h-8 object-cover rounded border border-slate-600" />
                              <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-slate-300 truncate">{img.name}</div>
                                  <div className="text-[9px] text-slate-500">{new Date(img.date).toLocaleDateString()}</div>
                              </div>
                              <button onClick={(e) => handleDeleteSavedImage(img.id, e)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-3 h-3"/></button>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* Tiny Toolbar */}
      {!isCollapsed && (
        <div className={`absolute ${mode === 'overlay' ? 'right-4 bottom-24' : 'right-2 top-1/2 -translate-y-1/2'} bg-slate-900/90 backdrop-blur-xl border border-white/10 p-1 rounded-lg shadow-xl flex flex-col items-center gap-1 z-[120] pointer-events-auto`}>
          <button 
            onClick={() => setIsLocked(!isLocked)} 
            className={`p-1 rounded transition-colors ${isLocked ? 'bg-amber-500 text-white animate-pulse' : 'text-slate-400 hover:bg-white/10'}`}
            title={isLocked ? "Đang điều khiển Slide (Mở khóa để vẽ)" : "Đang vẽ (Khóa để điều khiển Slide)"}
          >
            {isLocked ? <MousePointer2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
          <div className="h-px w-full bg-white/20"></div>
          <button onClick={() => onModeChange(mode === 'bottom' ? 'side' : mode === 'side' ? 'overlay' : 'bottom')} className="p-1 rounded hover:bg-white/10 text-yellow-400" title="Chuyển chế độ"><PanelBottom className="w-4 h-4" /></button>
          <div className="h-px w-full bg-white/20"></div>
          {['#ffffff', '#facc15', '#fef9c3', '#f43f5e', '#4ade80', '#60a5fa'].map((c) => (
              <button key={c} onClick={() => { setColor(c as ColorType); if (tool === 'eraser') setTool('pen'); }} className={`w-4 h-4 rounded-full border-2 ${color === c && tool !== 'eraser' ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
          ))}
          <div className="h-px w-full bg-white/20"></div>
          {[
            { t: 'pen', i: PenTool }, { t: 'eraser', i: Eraser }, { t: 'text', i: Type }, 
            { t: 'line', i: Minus }, { t: 'dashed-line', i: Minus, d: true },
            { t: 'arrow', i: ArrowUpRight },
            { t: 'circle', i: Circle }, { t: 'ellipse', i: Circle, e: true },
            { t: 'rectangle', i: Square }, { t: 'parallelogram', i: BoxSelect },
            { t: 'triangle', i: Triangle }
          ].map((item: any) => (
             <button 
                key={item.t} 
                onClick={() => setTool(item.t as any)} 
                className={`p-1 rounded relative ${tool === item.t ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title={item.t}
             >
                <item.i className={`w-4 h-4 ${item.e ? 'scale-x-150' : ''}`} />
                {item.d && <div className="absolute inset-0 flex items-center justify-center opacity-50"><div className="w-full h-px border-t border-dashed border-white"></div></div>}
             </button>
          ))}
          
          <div className="relative">
             <button onClick={() => setShowImageMenu(!showImageMenu)} className={`p-1 rounded ${showImageMenu ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}><ImageIcon className="w-4 h-4" /></button>
          </div>
          
          <div className="h-px w-full bg-white/20"></div>
          <button onClick={toggleGrid} className={`p-1 rounded ${isGridMode ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={undo} className="p-1 text-slate-400 hover:text-white"><Undo className="w-4 h-4" /></button>
          <button onClick={clearBoard} className="p-1 text-red-400 hover:text-white"><Trash2 className="w-4 h-4" /></button>
          <button onClick={onClose} className="p-1 mt-1 text-slate-500 hover:text-red-500"><X className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
};

export default Blackboard;
