export type Tool = 'pen' | 'highlighter' | 'eraser' | 'rectangle' | 'circle' | 'arrow' | 'line';
export type Orientation = 'horizontal' | 'vertical';
export interface Snapshot { data: ImageData; }

export const COLORS = [
  '#FF4444', '#FF8800', '#FFDD00', '#44FF88',
  '#00CCFF', '#4488FF', '#AA44FF', '#FF44AA',
  '#FFFFFF', '#AAAAAA', '#555555', '#111111',
];

export const BRUSH_SIZES = [2, 4, 8, 14, 22];
