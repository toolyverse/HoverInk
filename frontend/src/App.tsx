import { useEffect, useRef, useState, useCallback } from 'react';
import { EventsOn, Quit } from '../wailsjs/runtime/runtime';
import './App.css';

// ── Types ─────────────────────────────────────────────────────────────────────
type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'arrow' | 'line';
type Orientation = 'horizontal' | 'vertical';
interface Snapshot { data: ImageData; }

const COLORS = [
  '#FF4444', '#FF8800', '#FFDD00', '#44FF88',
  '#00CCFF', '#4488FF', '#AA44FF', '#FF44AA',
  '#FFFFFF', '#AAAAAA', '#555555', '#111111',
];
const BRUSH_SIZES = [2, 4, 8, 14, 22];

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons: Record<string, JSX.Element> = {
  pen:        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  eraser:     <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/><path d="M6 11l7 7"/></svg>,
  rectangle:  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
  circle:     <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>,
  arrow:      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg>,
  line:       <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="20" x2="20" y2="4"/></svg>,
  undo:       <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>,
  redo:       <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg>,
  trash:      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  horizontal: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="9" width="20" height="6" rx="2"/></svg>,
  vertical:   <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="2" width="6" height="20" rx="2"/></svg>,
  close:      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  drag:       <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><circle cx="7" cy="4"  r="1.4"/><circle cx="13" cy="4"  r="1.4"/><circle cx="7" cy="10" r="1.4"/><circle cx="13" cy="10" r="1.4"/><circle cx="7" cy="16" r="1.4"/><circle cx="13" cy="16" r="1.4"/></svg>,
};

// ── ToolBtn ───────────────────────────────────────────────────────────────────
function ToolBtn({ active, onClick, title, dim = 34, children }: {
  active?: boolean; onClick: () => void; title: string; dim?: number; children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: dim, height: dim, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(255,255,255,0.17)' : hov ? 'rgba(255,255,255,0.08)' : 'transparent',
        border: `1.5px solid ${active ? 'rgba(255,255,255,0.42)' : 'transparent'}`,
        borderRadius: 8, color: active ? '#fff' : 'rgba(255,255,255,0.62)',
        cursor: 'pointer', outline: 'none', flexShrink: 0, transition: 'all 0.12s',
      }}>
      {children}
    </button>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider({ isV }: { isV: boolean }) {
  return <div style={isV
    ? { height: 1, width: '75%', background: 'rgba(255,255,255,0.11)', margin: '2px auto', flexShrink: 0 }
    : { width: 1, height: 24, background: 'rgba(255,255,255,0.11)', margin: '0 2px', flexShrink: 0 }
  } />;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const startPos     = useRef({ x: 0, y: 0 });
  const snapRef      = useRef<ImageData | null>(null);

  // Toolbar drag state
  const [tbPos, setTbPos] = useState<{ x: number; y: number } | null>(null);
  const draggingTb = useRef(false);
  const dragOffset  = useRef({ x: 0, y: 0 });

  const [isClickThrough, setIsClickThrough] = useState(false);
  const [tool,  setTool]        = useState<Tool>('pen');
  const [color, setColor]       = useState('#FF4444');
  const [size,  setSize]        = useState(4);
  const [fill,  setFill]        = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');

  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const getCtx   = () => canvasRef.current?.getContext('2d') ?? null;
  const getOvCtx = () => overlayRef.current?.getContext('2d') ?? null;

  // ── Undo / Redo / Clear ───────────────────────────────────────────────────
  const pushUndo = useCallback(() => {
    const ctx = getCtx(); const cv = canvasRef.current; if (!ctx || !cv) return;
    undoStack.current.push({ data: ctx.getImageData(0, 0, cv.width, cv.height) });
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = []; setCanUndo(true); setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const ctx = getCtx(); const cv = canvasRef.current;
    if (!ctx || !cv || !undoStack.current.length) return;
    redoStack.current.push({ data: ctx.getImageData(0, 0, cv.width, cv.height) });
    ctx.putImageData(undoStack.current.pop()!.data, 0, 0);
    setCanUndo(undoStack.current.length > 0); setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const ctx = getCtx(); const cv = canvasRef.current;
    if (!ctx || !cv || !redoStack.current.length) return;
    undoStack.current.push({ data: ctx.getImageData(0, 0, cv.width, cv.height) });
    ctx.putImageData(redoStack.current.pop()!.data, 0, 0);
    setCanUndo(true); setCanRedo(redoStack.current.length > 0);
  }, []);

  const clearAll = useCallback(() => {
    const ctx = getCtx(); const cv = canvasRef.current; if (!ctx || !cv) return;
    pushUndo(); ctx.clearRect(0, 0, cv.width, cv.height);
  }, [pushUndo]);

  // ── Setup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const cv = canvasRef.current; const ov = overlayRef.current; if (!cv || !ov) return;
    cv.width = ov.width = window.innerWidth;
    cv.height = ov.height = window.innerHeight;

    // Default toolbar position
    setTbPos({ x: window.innerWidth / 2 - 300, y: window.innerHeight - 72 });

    const onResize = () => {
      const ctx = getCtx(); if (!ctx || !cv || !ov) return;
      const img = ctx.getImageData(0, 0, cv.width, cv.height);
      cv.width = ov.width = window.innerWidth;
      cv.height = ov.height = window.innerHeight;
      ctx.putImageData(img, 0, 0);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingTb.current) return;
      setTbPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const onMouseUp = () => { draggingTb.current = false; };

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    EventsOn('modeChanged', (s: boolean) => setIsClickThrough(s));

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [undo, redo]);

  // Reset toolbar position when orientation changes
  useEffect(() => {
    if (orientation === 'vertical') {
      setTbPos({ x: window.innerWidth - 68, y: window.innerHeight / 2 - 220 });
    } else {
      setTbPos({ x: window.innerWidth / 2 - 300, y: window.innerHeight - 72 });
    }
  }, [orientation]);

  // ── Canvas helpers ────────────────────────────────────────────────────────
  const applyCtx = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size;
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color; ctx.fillStyle = color;
    }
  };

  const drawShape = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    if (tool === 'rectangle') {
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      if (fill) ctx.fill(); ctx.stroke();
    } else if (tool === 'circle') {
      const rx = (x2 - x1) / 2, ry = (y2 - y1) / 2;
      ctx.ellipse(x1 + rx, y1 + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
      if (fill) ctx.fill(); ctx.stroke();
    } else if (tool === 'line') {
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    } else if (tool === 'arrow') {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const hl = Math.max(size * 5, 18);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - hl * Math.cos(angle - Math.PI / 7), y2 - hl * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(x2 - hl * Math.cos(angle + Math.PI / 7), y2 - hl * Math.sin(angle + Math.PI / 7));
      ctx.closePath(); ctx.fill();
    }
  };

  // ── Drawing mouse events ──────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (isClickThrough) return;
    const ctx = getCtx(); const cv = canvasRef.current; if (!ctx || !cv) return;
    pushUndo(); applyCtx(ctx);
    startPos.current = { x: e.clientX, y: e.clientY };
    isDrawingRef.current = true;
    if (tool === 'pen' || tool === 'eraser') { ctx.beginPath(); ctx.moveTo(e.clientX, e.clientY); }
    else snapRef.current = ctx.getImageData(0, 0, cv.width, cv.height);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || isClickThrough) return;
    const { x: x1, y: y1 } = startPos.current;
    if (tool === 'pen' || tool === 'eraser') {
      const ctx = getCtx(); if (!ctx) return;
      applyCtx(ctx); ctx.lineTo(e.clientX, e.clientY); ctx.stroke();
    } else {
      const ov = overlayRef.current; const ovCtx = getOvCtx(); if (!ov || !ovCtx) return;
      ovCtx.clearRect(0, 0, ov.width, ov.height);
      applyCtx(ovCtx); drawShape(ovCtx, x1, y1, e.clientX, e.clientY);
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const ctx = getCtx(); const ov = overlayRef.current; const ovCtx = getOvCtx();
    if (ctx && tool !== 'pen' && tool !== 'eraser') {
      if (snapRef.current) ctx.putImageData(snapRef.current, 0, 0);
      applyCtx(ctx); drawShape(ctx, startPos.current.x, startPos.current.y, e.clientX, e.clientY);
    } else ctx?.closePath();
    if (ovCtx && ov) ovCtx.clearRect(0, 0, ov.width, ov.height);
  };

  const handleDragStart = (e: React.MouseEvent) => {
    draggingTb.current = true;
    dragOffset.current = { x: e.clientX - (tbPos?.x ?? 0), y: e.clientY - (tbPos?.y ?? 0) };
    e.preventDefault();
  };

  const isV = orientation === 'vertical';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent', position: 'relative' }}>

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block', background: 'transparent' }} />
      <canvas
        ref={overlayRef}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        style={{
          position: 'absolute', inset: 0, display: 'block', background: 'transparent',
          cursor: isClickThrough ? 'default' : tool === 'eraser' ? 'cell' : 'crosshair',
          pointerEvents: isClickThrough ? 'none' : 'auto',
        }}
      />

      {/* ── Floating Toolbar ───────────────────────────────────────────────── */}
      {tbPos && (
        <div style={{
          position: 'absolute',
          left: tbPos.x,
          top: tbPos.y,
          zIndex: 9999,
          display: 'flex',
          flexDirection: isV ? 'column' : 'row',
          alignItems: 'center',
          gap: 2,
          padding: isV ? '10px 7px' : '7px 10px',
          background: 'rgba(12, 12, 16, 0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
          opacity: isClickThrough ? 0.2 : 1,
          transition: 'opacity 0.3s',
          pointerEvents: isClickThrough ? 'none' : 'auto',
          userSelect: 'none',
        }}>

          {/* Drag handle */}
          <div
            onMouseDown={handleDragStart}
            title="Drag to move toolbar"
            style={{
              cursor: 'grab', color: 'rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 22, borderRadius: 5,
              transition: 'color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.background = 'transparent'; }}
          >
            {Icons.drag}
          </div>

          <Divider isV={isV} />

          {/* Drawing tools */}
          {(['pen', 'eraser', 'line', 'arrow', 'rectangle', 'circle'] as Tool[]).map(t => (
            <ToolBtn key={t} active={tool === t} onClick={() => setTool(t)}
              title={{ pen: 'Pen', eraser: 'Eraser', rectangle: 'Rectangle', circle: 'Circle', arrow: 'Arrow', line: 'Line' }[t]}>
              {Icons[t]}
            </ToolBtn>
          ))}

          <Divider isV={isV} />

          {/* Fill */}
          <ToolBtn active={fill} onClick={() => setFill(f => !f)} title={fill ? 'Fill: On' : 'Fill: Off'}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
            </svg>
          </ToolBtn>

          <Divider isV={isV} />

          {/* Brush sizes */}
          {BRUSH_SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)} title={`${s}px`} style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: size === s ? 'rgba(255,255,255,0.13)' : 'transparent',
              border: `1.5px solid ${size === s ? 'rgba(255,255,255,0.36)' : 'transparent'}`,
              borderRadius: 7, cursor: 'pointer', outline: 'none', flexShrink: 0, transition: 'all 0.12s',
            }}>
              <div style={{
                width: Math.min(s + 3, 20), height: Math.min(s + 3, 20),
                borderRadius: '50%', background: color,
                opacity: size === s ? 1 : 0.38, transition: 'all 0.12s',
              }} />
            </button>
          ))}

          <Divider isV={isV} />

          {/* Colors — wrap in 2 columns when vertical */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isV ? 'repeat(2, 1fr)' : 'repeat(12, 1fr)',
            gap: 4,
          }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} title={c} style={{
                width: 16, height: 16, borderRadius: '50%', background: c, padding: 0,
                border: color === c ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                outline: 'none', cursor: 'pointer',
                boxShadow: color === c ? `0 0 0 2px ${c}55` : '0 1px 3px rgba(0,0,0,0.4)',
                transition: 'transform 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
          </div>

          {/* Custom color */}
          <label title="Custom color" style={{ position: 'relative', width: 22, height: 22, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{
              width: 22, height: 22, borderRadius: 6, boxSizing: 'border-box',
              background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)',
              border: '1.5px solid rgba(255,255,255,0.2)',
            }} />
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
          </label>

          <Divider isV={isV} />

          {/* Undo / Redo / Clear */}
          <ToolBtn active={false} onClick={undo} title="Undo (Ctrl+Z)">
            <span style={{ opacity: canUndo ? 1 : 0.22, display: 'flex', transition: 'opacity 0.15s' }}>{Icons.undo}</span>
          </ToolBtn>
          <ToolBtn active={false} onClick={redo} title="Redo (Ctrl+Y)">
            <span style={{ opacity: canRedo ? 1 : 0.22, display: 'flex', transition: 'opacity 0.15s' }}>{Icons.redo}</span>
          </ToolBtn>
          <ToolBtn active={false} onClick={clearAll} title="Clear all">
            {Icons.trash}
          </ToolBtn>

          <Divider isV={isV} />

          {/* Orientation toggle */}
          <ToolBtn active={false}
            onClick={() => setOrientation(o => o === 'horizontal' ? 'vertical' : 'horizontal')}
            title={isV ? 'Switch to horizontal' : 'Switch to vertical'}>
            {isV ? Icons.horizontal : Icons.vertical}
          </ToolBtn>

          {/* ESC mode badge */}
          <div style={{
            fontSize: 10, color: isClickThrough ? '#666' : 'rgba(255,255,255,0.55)',
            fontFamily: 'system-ui, sans-serif', whiteSpace: 'nowrap', textAlign: 'center',
            padding: isV ? '0' : '0 1px',
          }}>
            {isClickThrough ? '🖱️' : '✏️'}
            <kbd style={{
              marginLeft: 3, padding: '1px 3px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: 3, fontSize: 8.5, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)',
            }}>ESC</kbd>
          </div>

          <Divider isV={isV} />

          {/* Close */}
          <button
            onClick={() => { try { Quit(); } catch { window.close(); } }}
            title="Close application"
            style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1.5px solid transparent', borderRadius: 8,
              color: 'rgba(255,80,80,0.65)', cursor: 'pointer', outline: 'none', flexShrink: 0,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,50,50,0.16)';
              e.currentTarget.style.borderColor = 'rgba(255,80,80,0.38)';
              e.currentTarget.style.color = '#ff5555';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255,80,80,0.65)';
            }}
          >
            {Icons.close}
          </button>
        </div>
      )}
    </div>
  );
}