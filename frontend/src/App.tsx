import { useRef, useState } from 'react';
import './App.css';
import { Tool, Orientation } from './types';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useDrawing } from './hooks/useDrawing';
import { useToolbarDrag } from './hooks/useToolbarDrag';
import { useCanvasSetup } from './hooks/useCanvasSetup';
import { DrawingCanvas } from './components/DrawingCanvas';
import { Toolbar } from './components/Toolbar';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#FF4444');
  const [size, setSize] = useState(4);
  const [fill, setFill] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');

  const { pushUndo, undo, redo, clearAll, canUndo, canRedo } = useUndoRedo(canvasRef);
  const { isClickThrough } = useCanvasSetup({ canvasRef, overlayRef, undo, redo });
  const { onMouseDown, onMouseMove, onMouseUp } = useDrawing({
    canvasRef, overlayRef, tool, color, size, fill, isClickThrough, pushUndo,
  });
  const { dragPos, handleDragStart, resetDragPos } = useToolbarDrag();

  const handleOrientationToggle = () => {
    resetDragPos();
    setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent', position: 'relative' }}>
      <DrawingCanvas
        canvasRef={canvasRef}
        overlayRef={overlayRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        tool={tool}
        isClickThrough={isClickThrough}
      />
      <Toolbar
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        size={size}
        onSizeChange={setSize}
        fill={fill}
        onFillToggle={() => setFill((f) => !f)}
        orientation={orientation}
        onOrientationToggle={handleOrientationToggle}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onClear={clearAll}
        isClickThrough={isClickThrough}
        dragPos={dragPos}
        onDragStart={handleDragStart}
      />
    </div>
  );
}