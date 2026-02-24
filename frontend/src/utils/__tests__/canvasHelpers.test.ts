import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyCtx, drawShape } from '../canvasHelpers';

function createMockCtx(): CanvasRenderingContext2D {
  return {
    lineCap: '',
    lineJoin: '',
    lineWidth: 0,
    globalCompositeOperation: '',
    strokeStyle: '',
    fillStyle: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    rect: vi.fn(),
    ellipse: vi.fn(),
    closePath: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('applyCtx', () => {
  let ctx: CanvasRenderingContext2D;
  beforeEach(() => { ctx = createMockCtx(); });

  it('sets pen defaults', () => {
    applyCtx(ctx, 'pen', '#FF0000', 4);
    expect(ctx.lineCap).toBe('round');
    expect(ctx.lineJoin).toBe('round');
    expect(ctx.lineWidth).toBe(4);
    expect(ctx.globalCompositeOperation).toBe('source-over');
    expect(ctx.strokeStyle).toBe('#FF0000');
    expect(ctx.fillStyle).toBe('#FF0000');
  });

  it('sets eraser to destination-out with 4x size', () => {
    applyCtx(ctx, 'eraser', '#FFFFFF', 8);
    expect(ctx.lineWidth).toBe(32); // 8 * 4
    expect(ctx.globalCompositeOperation).toBe('destination-out');
    expect(ctx.strokeStyle).toBe('rgba(0,0,0,1)');
  });

  it('sets highlighter with 0.25 alpha and 8x size', () => {
    applyCtx(ctx, 'highlighter', '#FF4444', 4);
    expect(ctx.lineWidth).toBe(32); // 4 * 8
    expect(ctx.globalCompositeOperation).toBe('source-over');
    expect(ctx.strokeStyle).toBe('rgba(255,68,68,0.25)');
    expect(ctx.fillStyle).toBe('rgba(255,68,68,0.25)');
    expect(ctx.lineCap).toBe('butt');
    expect(ctx.lineJoin).toBe('miter');
  });

  it('sets line tool same as pen', () => {
    applyCtx(ctx, 'line', '#00FF00', 2);
    expect(ctx.lineWidth).toBe(2);
    expect(ctx.globalCompositeOperation).toBe('source-over');
    expect(ctx.strokeStyle).toBe('#00FF00');
  });
});

describe('drawShape', () => {
  let ctx: CanvasRenderingContext2D;
  beforeEach(() => { ctx = createMockCtx(); });

  it('draws a rectangle without fill', () => {
    drawShape(ctx, 'rectangle', 10, 20, 100, 80, 4, false);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalledWith(10, 20, 90, 60);
    expect(ctx.fill).not.toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('draws a rectangle with fill', () => {
    drawShape(ctx, 'rectangle', 0, 0, 50, 50, 4, true);
    expect(ctx.rect).toHaveBeenCalledWith(0, 0, 50, 50);
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('draws a circle', () => {
    drawShape(ctx, 'circle', 0, 0, 100, 100, 4, false);
    expect(ctx.ellipse).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('draws a line', () => {
    drawShape(ctx, 'line', 5, 5, 50, 50, 4, false);
    expect(ctx.moveTo).toHaveBeenCalledWith(5, 5);
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 50);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('draws an arrow with arrowhead', () => {
    drawShape(ctx, 'arrow', 0, 0, 100, 100, 4, false);
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(100, 100);
    expect(ctx.closePath).toHaveBeenCalled();
    expect(ctx.fill).toHaveBeenCalled();
  });

  it('does nothing for pen tool', () => {
    drawShape(ctx, 'pen', 0, 0, 10, 10, 4, false);
    expect(ctx.rect).not.toHaveBeenCalled();
    expect(ctx.ellipse).not.toHaveBeenCalled();
    // beginPath is always called, but no shape methods
  });
});
