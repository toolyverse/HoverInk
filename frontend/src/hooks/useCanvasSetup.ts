import { useEffect, useState, useCallback, RefObject } from 'react';
import { EventsOn } from '../../wailsjs/runtime/runtime';

interface UseCanvasSetupOptions {
  canvasRef: RefObject<HTMLCanvasElement>;
  overlayRef: RefObject<HTMLCanvasElement>;
  undo: () => void;
  redo: () => void;
}

export function useCanvasSetup({ canvasRef, overlayRef, undo, redo }: UseCanvasSetupOptions) {
  const [isClickThrough, setIsClickThrough] = useState(false);

  // Canvas init + resize — run once on mount
  useEffect(() => {
    const cv = canvasRef.current;
    const ov = overlayRef.current;
    if (!cv || !ov) return;
    cv.width = ov.width = window.innerWidth;
    cv.height = ov.height = window.innerHeight;

    const onResize = () => {
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const img = ctx.getImageData(0, 0, cv.width, cv.height);
      cv.width = ov.width = window.innerWidth;
      cv.height = ov.height = window.innerHeight;
      ctx.putImageData(img, 0, 0);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wails modeChanged event — must NOT return cancel as cleanup because
  // React 18 StrictMode double-mounts effects, and Wails EventsOn may not
  // re-register correctly after unsubscribe. Original code never cleaned this up.
  useEffect(() => {
    EventsOn('modeChanged', (s: boolean) => setIsClickThrough(s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts — must track undo/redo refs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return { isClickThrough };
}
