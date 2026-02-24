import { useRef, useState, useEffect, useCallback } from 'react';

export function useToolbarDrag() {
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const draggingTb = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingTb.current) return;
      setDragPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    };
    const onMouseUp = () => {
      draggingTb.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const tb = e.currentTarget.closest<HTMLElement>('[data-toolbar]');
    if (!tb) return;
    const rect = tb.getBoundingClientRect();
    draggingTb.current = true;
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    setDragPos({ x: rect.left, y: rect.top });
  }, []);

  const resetDragPos = useCallback(() => setDragPos(null), []);

  return { dragPos, handleDragStart, resetDragPos };
}
