import { RefObject } from 'react';
import { Tool } from '../types';

interface DrawingCanvasProps {
    canvasRef: RefObject<HTMLCanvasElement>;
    overlayRef: RefObject<HTMLCanvasElement>;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    tool: Tool;
    isClickThrough: boolean;
}

export function DrawingCanvas({
    canvasRef,
    overlayRef,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    tool,
    isClickThrough,
}: DrawingCanvasProps) {
    const cursor = isClickThrough
        ? 'default'
        : tool === 'eraser'
            ? 'cell'
            : tool === 'highlighter'
                ? 'text'
                : 'crosshair';

    return (
        <>
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', inset: 0, display: 'block', background: 'transparent' }}
            />
            <canvas
                ref={overlayRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'block',
                    background: 'transparent',
                    cursor,
                    pointerEvents: isClickThrough ? 'none' : 'auto',
                }}
            />
        </>
    );
}
