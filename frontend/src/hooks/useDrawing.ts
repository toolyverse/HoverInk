import { useRef, useCallback, RefObject } from 'react';
import { Tool } from '../types';
import { applyCtx, drawShape } from '../utils/canvasHelpers';

interface UseDrawingOptions {
  canvasRef: RefObject<HTMLCanvasElement>;
  overlayRef: RefObject<HTMLCanvasElement>;
  tool: Tool;
  color: string;
  size: number;
  fill: boolean;
  isClickThrough: boolean;
  pushUndo: () => void;
}

export function useDrawing({
  canvasRef,
  overlayRef,
  tool,
  color,
  size,
  fill,
  isClickThrough,
  pushUndo,
}: UseDrawingOptions) {
  const isDrawingRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const snapRef = useRef<ImageData | null>(null);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;
  const getOvCtx = () => overlayRef.current?.getContext('2d') ?? null;

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (isClickThrough) return;
    const ctx = getCtx();
    const cv = canvasRef.current;
    if (!ctx || !cv) return;
    pushUndo();
    startPos.current = { x: e.clientX, y: e.clientY };
    isDrawingRef.current = true;

    if (tool === 'highlighter') {
      // nothing yet — wait for drag to know width
    } else if (tool === 'pen' || tool === 'eraser') {
      applyCtx(ctx, tool, color, size);
      ctx.beginPath();
      ctx.moveTo(e.clientX, e.clientY);
    } else {
      snapRef.current = ctx.getImageData(0, 0, cv.width, cv.height);
    }
  }, [canvasRef, overlayRef, tool, color, size, isClickThrough, pushUndo]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRef.current || isClickThrough) return;
    const { x: x1, y: y1 } = startPos.current;

    if (tool === 'highlighter') {
      const ov = overlayRef.current;
      const ovCtx = getOvCtx();
      if (!ov || !ovCtx) return;
      const hlH = size * 8;
      ovCtx.clearRect(0, 0, ov.width, ov.height);
      applyCtx(ovCtx, tool, color, size);
      const x2 = e.clientX;
      ovCtx.fillRect(Math.min(x1, x2), y1 - hlH / 2, Math.abs(x2 - x1), hlH);
    } else if (tool === 'pen' || tool === 'eraser') {
      const ctx = getCtx();
      if (!ctx) return;
      applyCtx(ctx, tool, color, size);
      ctx.lineTo(e.clientX, e.clientY);
      ctx.stroke();
    } else {
      const ov = overlayRef.current;
      const ovCtx = getOvCtx();
      if (!ov || !ovCtx) return;
      ovCtx.clearRect(0, 0, ov.width, ov.height);
      applyCtx(ovCtx, tool, color, size);
      drawShape(ovCtx, tool, x1, y1, e.clientX, e.clientY, size, fill);
    }
  }, [canvasRef, overlayRef, tool, color, size, fill, isClickThrough]);

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const ctx = getCtx();
    const ov = overlayRef.current;
    const ovCtx = getOvCtx();

    if (tool === 'highlighter') {
      const { x: x1, y: y1 } = startPos.current;
      const x2 = e.clientX;
      const hlH = size * 8;
      if (ctx) {
        applyCtx(ctx, tool, color, size);
        ctx.fillRect(Math.min(x1, x2), y1 - hlH / 2, Math.abs(x2 - x1), hlH);
      }
      if (ovCtx && ov) ovCtx.clearRect(0, 0, ov.width, ov.height);
    } else if (tool !== 'pen' && tool !== 'eraser') {
      if (ctx && snapRef.current) ctx.putImageData(snapRef.current, 0, 0);
      if (ctx) {
        applyCtx(ctx, tool, color, size);
        drawShape(ctx, tool, startPos.current.x, startPos.current.y, e.clientX, e.clientY, size, fill);
      }
      if (ovCtx && ov) ovCtx.clearRect(0, 0, ov.width, ov.height);
    } else {
      ctx?.closePath();
    }
  }, [canvasRef, overlayRef, tool, color, size, fill]);

  return { onMouseDown, onMouseMove, onMouseUp };
}
