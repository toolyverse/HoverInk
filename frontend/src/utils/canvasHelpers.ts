import { Tool } from '../types';

/**
 * Configure a canvas 2D context for the active tool.
 */
export function applyCtx(
  ctx: CanvasRenderingContext2D,
  tool: Tool,
  color: string,
  size: number,
): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = tool === 'eraser' ? size * 4 : tool === 'highlighter' ? size * 8 : size;

  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = 'rgba(0,0,0,1)';
  } else if (tool === 'highlighter') {
    ctx.globalCompositeOperation = 'source-over';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const rgba = `rgba(${r},${g},${b},0.25)`;
    ctx.strokeStyle = rgba;
    ctx.fillStyle = rgba;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
  }
}

/**
 * Draw a shape (rectangle, circle, line, arrow) between two points.
 */
export function drawShape(
  ctx: CanvasRenderingContext2D,
  tool: Tool,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number,
  fill: boolean,
): void {
  ctx.beginPath();

  if (tool === 'rectangle') {
    ctx.rect(x1, y1, x2 - x1, y2 - y1);
    if (fill) ctx.fill();
    ctx.stroke();
  } else if (tool === 'circle') {
    const rx = (x2 - x1) / 2;
    const ry = (y2 - y1) / 2;
    ctx.ellipse(x1 + rx, y1 + ry, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2);
    if (fill) ctx.fill();
    ctx.stroke();
  } else if (tool === 'line') {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  } else if (tool === 'arrow') {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const hl = Math.max(size * 5, 18);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(angle - Math.PI / 7), y2 - hl * Math.sin(angle - Math.PI / 7));
    ctx.lineTo(x2 - hl * Math.cos(angle + Math.PI / 7), y2 - hl * Math.sin(angle + Math.PI / 7));
    ctx.closePath();
    ctx.fill();
  }
}
