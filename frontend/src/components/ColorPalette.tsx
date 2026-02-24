import { COLORS } from '../types';

interface ColorPaletteProps {
    color: string;
    onColorChange: (c: string) => void;
    isVertical: boolean;
}

export function ColorPalette({ color, onColorChange, isVertical }: ColorPaletteProps) {
    return (
        <>
            {/* Preset swatches */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: isVertical ? 'repeat(2, 1fr)' : 'repeat(12, 1fr)',
                    gap: 4,
                }}
            >
                {COLORS.map((c) => (
                    <button
                        key={c}
                        onClick={() => onColorChange(c)}
                        title={c}
                        style={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            background: c,
                            padding: 0,
                            border: color === c ? '2.5px solid #fff' : '2px solid rgba(255,255,255,0.1)',
                            outline: 'none',
                            cursor: 'pointer',
                            boxShadow: color === c ? `0 0 0 2px ${c}55` : '0 1px 3px rgba(0,0,0,0.4)',
                            transition: 'transform 0.1s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.3)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    />
                ))}
            </div>

            {/* Custom color picker */}
            <label title="Custom color" style={{ position: 'relative', width: 22, height: 22, cursor: 'pointer', flexShrink: 0 }}>
                <div
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: 6,
                        boxSizing: 'border-box',
                        background: 'conic-gradient(red,yellow,lime,aqua,blue,magenta,red)',
                        border: '1.5px solid rgba(255,255,255,0.2)',
                    }}
                />
                <input
                    type="color"
                    value={color}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
            </label>
        </>
    );
}
