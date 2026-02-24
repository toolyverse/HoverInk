import { useEffect, useRef, useState, useCallback } from 'react';
import { EventsOn } from '../wailsjs/runtime/runtime';
import './App.css';

// ── Types ────────────────────────────────────────────────────────────────────
type Tool = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'arrow' | 'line';

interface Snapshot {
  data: ImageData;
}

const COLORS = [
  '#FF4444', '#FF8800', '#FFDD00', '#44FF88',
  '#00CCFF', '#4488FF', '#AA44FF', '#FF44AA',
  '#FFFFFF', '#AAAAAA', '#555555', '#000000',
];

const BRUSH_SIZES = [2, 4, 8, 14, 22];

// ── Toolbar Button ────────────────────────────────────────────────────────────
function ToolBtn({
  active, onClick, title, children
}: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 38, height: 38,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
        border: active ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid transparent',
        borderRadius: 8,
        color: active ? '#fff' : 'rgba(255,255,255,0.65)',
        cursor: 'pointer',
        fontSize: 18,
        transition: 'all 0.15s',
        outline: 'none',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icons: Record<string, JSX.Element> = {
  pen: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
  ),
  eraser: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5"/><path d="M6.0 11.0 l7 7"/>
    </svg>
  ),
  rectangle: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/>
    </svg>
  ),
  line: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="20" x2="20" y2="4"/>
    </svg>
  ),
  undo: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/>
    </svg>
  ),
  redo: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/>
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
};

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)', margin: '0 4px', flexShrink: 0 }} />;
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const startPosRef  = useRef({ x: 0, y: 0 });
  const snapshotRef  = useRef<ImageData | null>(null);

  const [isClickThrough, setIsClickThrough] = useState(false);
  const [tool,  setTool]  = useState<Tool>('pen');
  const [color, setColor] = useState('#FF4444');
  const [size,  setSize]  = useState(4);
  const [fill,  setFill]  = useState(false);

  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const getCtx   = () => canvasRef.current?.getContext('2d') ?? null;
  const getOvCtx = () => overlayRef.current?.getContext('2d') ?? null;

  const pushUndo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    undoStack.current.push({ data: ctx.getImageData(0, 0, canvas.width, canvas.height) });
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || undoStack.current.length === 0) return;
    redoStack.current.push({ data: ctx.getImageData(0, 0, canvas.width, canvas.height) });
    const prev = undoStack.current.pop()!;
    ctx.putImageData(prev.data, 0, 0);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || redoStack.current.length === 0) return;
    undoStack.current.push({ data: ctx.getImageData(0, 0, canvas.width, canvas.height) });
    const next = redoStack.current.pop()!;
    ctx.putImageData(next.data, 0, 0);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  }, []);

  const clearAll = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    pushUndo();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [pushUndo]);

  // ── setup ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas  = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    overlay.width  = window.innerWidth;
    overlay.height = window.innerHeight;

    const onResize = () => {
      const ctx = getCtx();
      if (!ctx || !canvas || !overlay) return;
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      overlay.width  = window.innerWidth;
      overlay.height = window.innerHeight;
      ctx.putImageData(img, 0, 0);
    };
    window.addEventListener('resize', onResize);

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);

    EventsOn("modeChanged", (state: boolean) => setIsClickThrough(state));

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, [undo, redo]);

  // ── ctx settings ───────────────────────────────────────────────────────────
  const applyCtx = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size;
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.fillStyle   = color;
    }
  };

  // ── shape drawing ──────────────────────────────────────────────────────────
  const drawShape = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    if (tool === 'rectangle') {
      ctx.rect(x1, y1, x2 - x1, y2 - y1);
      if (fill) ctx.fill();
      ctx.stroke();
    } else if (tool === 'circle') {
      const rx = (x2 - x1) / 2, ry = (y2 - y1) / 2;
      ctx.ellipse(x1 + rx, y1 + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
      if (fill) ctx.fill();
      ctx.stroke();
    } else if (tool === 'line') {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (tool === 'arrow') {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.max(size * 5, 18);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
    }
  };

  // ── mouse ──────────────────────────────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    if (isClickThrough) return;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    pushUndo();
    applyCtx(ctx);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDrawingRef.current = true;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(e.clientX, e.clientY);
    } else {
      snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || isClickThrough) return;
    const { x: x1, y: y1 } = startPosRef.current;
    const x2 = e.clientX, y2 = e.clientY;

    if (tool === 'pen' || tool === 'eraser') {
      const ctx = getCtx();
      if (!ctx) return;
      applyCtx(ctx);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else {
      const ovCtx = getOvCtx();
      const overlay = overlayRef.current;
      if (!ovCtx || !overlay) return;
      ovCtx.clearRect(0, 0, overlay.width, overlay.height);
      applyCtx(ovCtx);
      drawShape(ovCtx, x1, y1, x2, y2);
    }
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const ctx = getCtx();
    const canvas = canvasRef.current;
    const ovCtx = getOvCtx();
    const overlay = overlayRef.current;

    if (ctx && canvas && tool !== 'pen' && tool !== 'eraser') {
      if (snapshotRef.current) ctx.putImageData(snapshotRef.current, 0, 0);
      applyCtx(ctx);
      drawShape(ctx, startPosRef.current.x, startPosRef.current.y, e.clientX, e.clientY);
    } else if (ctx) {
      ctx.closePath();
    }

    if (ovCtx && overlay) ovCtx.clearRect(0, 0, overlay.width, overlay.height);
  };

  const getCursor = () => {
    if (isClickThrough) return 'default';
    if (tool === 'eraser') return 'cell';
    return 'crosshair';
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent', position: 'relative' }}>

      {/* Main drawing canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, display: 'block', background: 'transparent' }} />

      {/* Overlay canvas (shape preview + mouse events) */}
      <canvas
        ref={overlayRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position: 'absolute', inset: 0, display: 'block',
          background: 'transparent',
          cursor: getCursor(),
          pointerEvents: isClickThrough ? 'none' : 'auto',
        }}
      />

      {/* ── Toolbar ── */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '8px 12px',
        background: 'rgba(14, 14, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 18,
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        opacity: isClickThrough ? 0.28 : 1,
        transition: 'opacity 0.3s',
        pointerEvents: isClickThrough ? 'none' : 'auto',
        userSelect: 'none',
      }}>

        {/* Drawing tools */}
        {(['pen', 'eraser', 'line', 'arrow', 'rectangle', 'circle'] as Tool[]).map(t => (
          <ToolBtn key={t} active={tool === t} onClick={() => setTool(t)} title={
            { pen: 'Kalem', eraser: 'Silgi', rectangle: 'Dikdörtgen', circle: 'Daire', arrow: 'Ok', line: 'Çizgi' }[t]
          }>
            {Icons[t]}
          </ToolBtn>
        ))}

        <Divider />

        {/* Fill toggle */}
        <ToolBtn active={fill} onClick={() => setFill(f => !f)} title={fill ? 'Dolu (kapat)' : 'Doldur (şekiller için)'}>
          <svg viewBox="0 0 24 24" width="17" height="17"
            fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
          </svg>
        </ToolBtn>

        <Divider />

        {/* Brush sizes */}
        {BRUSH_SIZES.map(s => (
          <button
            key={s}
            onClick={() => setSize(s)}
            title={`${s}px`}
            style={{
              width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: size === s ? 'rgba(255,255,255,0.13)' : 'transparent',
              border: size === s ? '1.5px solid rgba(255,255,255,0.4)' : '1.5px solid transparent',
              borderRadius: 7, cursor: 'pointer', outline: 'none', flexShrink: 0,
              transition: 'all 0.12s',
            }}
          >
            <div style={{
              width: Math.min(s + 3, 20),
              height: Math.min(s + 3, 20),
              borderRadius: '50%',
              background: color,
              opacity: size === s ? 1 : 0.45,
              transition: 'all 0.12s',
            }} />
          </button>
        ))}

        <Divider />

        {/* Preset colors */}
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            title={c}
            style={{
              width: 18, height: 18,
              borderRadius: '50%',
              background: c,
              border: color === c ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.15)',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: color === c ? `0 0 0 2px ${c}44` : '0 1px 3px rgba(0,0,0,0.4)',
              transition: 'transform 0.1s, box-shadow 0.1s',
              padding: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.25)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ))}

        {/* Custom color */}
        <label title="Özel renk seç" style={{ position: 'relative', width: 24, height: 24, cursor: 'pointer', flexShrink: 0, marginLeft: 2 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)',
            border: '1.5px solid rgba(255,255,255,0.25)',
            boxSizing: 'border-box',
          }} />
          <input
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
          />
        </label>

        <Divider />

        {/* Undo */}
        <ToolBtn active={false} onClick={undo} title="Geri Al (Ctrl+Z)">
          <span style={{ opacity: canUndo ? 1 : 0.28, display: 'flex', transition: 'opacity 0.15s' }}>{Icons.undo}</span>
        </ToolBtn>

        {/* Redo */}
        <ToolBtn active={false} onClick={redo} title="Yinele (Ctrl+Y)">
          <span style={{ opacity: canRedo ? 1 : 0.28, display: 'flex', transition: 'opacity 0.15s' }}>{Icons.redo}</span>
        </ToolBtn>

        {/* Clear */}
        <ToolBtn active={false} onClick={clearAll} title="Tümünü Temizle">
          {Icons.trash}
        </ToolBtn>

        <Divider />

        {/* Mode indicator */}
        <div style={{
          fontSize: 11.5,
          color: isClickThrough ? '#888' : 'rgba(255,255,255,0.85)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          whiteSpace: 'nowrap',
          letterSpacing: 0.2,
          paddingLeft: 2,
        }}>
          {isClickThrough ? '🖱️ Pointer' : '✏️ Draw'}
          <kbd style={{
            marginLeft: 6,
            padding: '1px 5px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 4,
            fontSize: 10,
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.4)',
          }}>ESC</kbd>
        </div>
      </div>
    </div>
  );
}