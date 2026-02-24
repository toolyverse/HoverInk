import React from 'react';
import { Tool, Orientation } from '../types';
import Icons from './Icons';
import { ToolBtn } from './ToolBtn';
import { Divider } from './Divider';
import { BrushSizePicker } from './BrushSizePicker';
import { ColorPalette } from './ColorPalette';
import { Quit } from '../../wailsjs/runtime/runtime';

interface ToolbarProps {
    tool: Tool;
    onToolChange: (t: Tool) => void;
    color: string;
    onColorChange: (c: string) => void;
    size: number;
    onSizeChange: (s: number) => void;
    fill: boolean;
    onFillToggle: () => void;
    orientation: Orientation;
    onOrientationToggle: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onClear: () => void;
    isClickThrough: boolean;
    dragPos: { x: number; y: number } | null;
    onDragStart: (e: React.MouseEvent) => void;
}

const TOOLS: Tool[] = ['pen', 'highlighter', 'eraser', 'line', 'arrow', 'rectangle', 'circle'];

const TOOL_LABELS: Record<Tool, string> = {
    pen: 'Pen',
    highlighter: 'Highlighter',
    eraser: 'Eraser',
    rectangle: 'Rectangle',
    circle: 'Circle',
    arrow: 'Arrow',
    line: 'Line',
};

export function Toolbar({
    tool, onToolChange,
    color, onColorChange,
    size, onSizeChange,
    fill, onFillToggle,
    orientation, onOrientationToggle,
    canUndo, canRedo, onUndo, onRedo, onClear,
    isClickThrough,
    dragPos, onDragStart,
}: ToolbarProps) {
    const isV = orientation === 'vertical';

    const toolbarPositionStyle: React.CSSProperties = dragPos
        ? { left: dragPos.x, top: dragPos.y, transform: 'none' }
        : isV
            ? { right: 24, top: '50%', transform: 'translateY(-50%)' }
            : { bottom: 24, left: '50%', transform: 'translateX(-50%)' };

    return (
        <div
            data-toolbar=""
            style={{
                position: 'absolute',
                ...toolbarPositionStyle,
                zIndex: 9999,
                display: 'flex',
                flexDirection: isV ? 'column' : 'row',
                alignItems: 'center',
                gap: 2,
                padding: isV ? '10px 7px' : '7px 10px',
                background: 'rgba(12, 12, 16, 0.9)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                opacity: isClickThrough ? 0.2 : 1,
                transition: 'opacity 0.3s',
                pointerEvents: isClickThrough ? 'none' : 'auto',
                userSelect: 'none',
            }}
        >
            {/* Drag handle */}
            <div
                onMouseDown={onDragStart}
                title="Drag to move toolbar"
                style={{
                    cursor: 'grab',
                    color: 'rgba(255,255,255,0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 22,
                    borderRadius: 5,
                    transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                {Icons.drag}
            </div>

            <Divider isV={isV} />

            {/* Drawing tools */}
            {TOOLS.map((t) => (
                <ToolBtn key={t} active={tool === t} onClick={() => onToolChange(t)} title={TOOL_LABELS[t]}>
                    {Icons[t]}
                </ToolBtn>
            ))}

            <Divider isV={isV} />

            {/* Fill toggle */}
            <ToolBtn active={fill} onClick={onFillToggle} title={fill ? 'Fill: On' : 'Fill: Off'}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                </svg>
            </ToolBtn>

            <Divider isV={isV} />

            {/* Brush sizes */}
            <BrushSizePicker size={size} onSizeChange={onSizeChange} color={color} />

            <Divider isV={isV} />

            {/* Colors */}
            <ColorPalette color={color} onColorChange={onColorChange} isVertical={isV} />

            <Divider isV={isV} />

            {/* Undo / Redo / Clear */}
            <ToolBtn active={false} onClick={onUndo} title="Undo (Ctrl+Z)">
                <span style={{ opacity: canUndo ? 1 : 0.22, display: 'flex', transition: 'opacity 0.15s' }}>{Icons.undo}</span>
            </ToolBtn>
            <ToolBtn active={false} onClick={onRedo} title="Redo (Ctrl+Y)">
                <span style={{ opacity: canRedo ? 1 : 0.22, display: 'flex', transition: 'opacity 0.15s' }}>{Icons.redo}</span>
            </ToolBtn>
            <ToolBtn active={false} onClick={onClear} title="Clear all">
                {Icons.trash}
            </ToolBtn>

            <Divider isV={isV} />

            {/* Orientation toggle */}
            <ToolBtn active={false} onClick={onOrientationToggle} title={isV ? 'Switch to horizontal' : 'Switch to vertical'}>
                {isV ? Icons.horizontal : Icons.vertical}
            </ToolBtn>

            {/* ESC mode badge */}
            <div
                style={{
                    fontSize: 10,
                    color: isClickThrough ? '#666' : 'rgba(255,255,255,0.55)',
                    fontFamily: 'system-ui, sans-serif',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    padding: isV ? '0' : '0 1px',
                }}
            >
                {isClickThrough ? '🖱️' : '✏️'}
                <kbd
                    style={{
                        marginLeft: 3,
                        padding: '1px 3px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.11)',
                        borderRadius: 3,
                        fontSize: 8.5,
                        fontFamily: 'monospace',
                        color: 'rgba(255,255,255,0.3)',
                    }}
                >
                    ESC
                </kbd>
            </div>

            <Divider isV={isV} />

            {/* Close */}
            <button
                onClick={() => {
                    try { Quit(); } catch { window.close(); }
                }}
                title="Close application"
                style={{
                    width: 30,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: '1.5px solid transparent',
                    borderRadius: 8,
                    color: 'rgba(255,80,80,0.65)',
                    cursor: 'pointer',
                    outline: 'none',
                    flexShrink: 0,
                    transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,50,50,0.16)';
                    e.currentTarget.style.borderColor = 'rgba(255,80,80,0.38)';
                    e.currentTarget.style.color = '#ff5555';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,80,80,0.65)';
                }}
            >
                {Icons.close}
            </button>
        </div>
    );
}
