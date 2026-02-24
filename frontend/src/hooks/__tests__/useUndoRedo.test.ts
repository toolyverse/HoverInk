import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';

function createMockCanvas(): HTMLCanvasElement {
  const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 } as unknown as ImageData;
  const ctx = {
    getImageData: vi.fn(() => imageData),
    putImageData: vi.fn(),
    clearRect: vi.fn(),
  };
  return {
    width: 100,
    height: 100,
    getContext: vi.fn(() => ctx),
  } as unknown as HTMLCanvasElement;
}

describe('useUndoRedo', () => {
  let canvasEl: HTMLCanvasElement;

  beforeEach(() => {
    canvasEl = createMockCanvas();
  });

  it('starts with canUndo and canRedo as false', () => {
    const ref = { current: canvasEl };
    const { result } = renderHook(() => useUndoRedo(ref));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('pushUndo enables canUndo', () => {
    const ref = { current: canvasEl };
    const { result } = renderHook(() => useUndoRedo(ref));
    act(() => result.current.pushUndo());
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo after pushUndo enables canRedo and disables canUndo', () => {
    const ref = { current: canvasEl };
    const { result } = renderHook(() => useUndoRedo(ref));
    act(() => result.current.pushUndo());
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo after undo re-enables canUndo', () => {
    const ref = { current: canvasEl };
    const { result } = renderHook(() => useUndoRedo(ref));
    act(() => result.current.pushUndo());
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('clearAll pushes undo and clears canvas', () => {
    const ref = { current: canvasEl };
    const { result } = renderHook(() => useUndoRedo(ref));
    act(() => result.current.clearAll());
    const ctx = canvasEl.getContext('2d')!;
    expect(ctx.clearRect).toHaveBeenCalledWith(0, 0, 100, 100);
    expect(result.current.canUndo).toBe(true);
  });

  it('undo does nothing when stack is empty', () => {
    const ref = { current: canvasEl };
    const { result } = renderHook(() => useUndoRedo(ref));
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('redo does nothing when stack is empty', () => {
    const ref = { current: canvasEl };
    const { result } = renderHook(() => useUndoRedo(ref));
    act(() => result.current.redo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });
});
