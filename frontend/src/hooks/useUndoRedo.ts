import { useRef, useState, useCallback, RefObject } from 'react';
import { Snapshot } from '../types';

export function useUndoRedo(canvasRef: RefObject<HTMLCanvasElement>) {
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  const pushUndo = useCallback(() => {
    const ctx = getCtx();
    const cv = canvasRef.current;
    if (!ctx || !cv) return;
    undoStack.current.push({ data: ctx.getImageData(0, 0, cv.width, cv.height) });
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [canvasRef]);

  const undo = useCallback(() => {
    const ctx = getCtx();
    const cv = canvasRef.current;
    if (!ctx || !cv || !undoStack.current.length) return;
    redoStack.current.push({ data: ctx.getImageData(0, 0, cv.width, cv.height) });
    ctx.putImageData(undoStack.current.pop()!.data, 0, 0);
    setCanUndo(undoStack.current.length > 0);
    setCanRedo(true);
  }, [canvasRef]);

  const redo = useCallback(() => {
    const ctx = getCtx();
    const cv = canvasRef.current;
    if (!ctx || !cv || !redoStack.current.length) return;
    undoStack.current.push({ data: ctx.getImageData(0, 0, cv.width, cv.height) });
    ctx.putImageData(redoStack.current.pop()!.data, 0, 0);
    setCanUndo(true);
    setCanRedo(redoStack.current.length > 0);
  }, [canvasRef]);

  const clearAll = useCallback(() => {
    const ctx = getCtx();
    const cv = canvasRef.current;
    if (!ctx || !cv) return;
    pushUndo();
    ctx.clearRect(0, 0, cv.width, cv.height);
  }, [canvasRef, pushUndo]);

  return { pushUndo, undo, redo, clearAll, canUndo, canRedo };
}
