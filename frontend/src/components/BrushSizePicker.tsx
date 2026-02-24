import { BRUSH_SIZES } from '../types';

interface BrushSizePickerProps {
    size: number;
    onSizeChange: (s: number) => void;
    color: string;
}

export function BrushSizePicker({ size, onSizeChange, color }: BrushSizePickerProps) {
    return (
        <>
            {BRUSH_SIZES.map((s) => (
                <button
                    key={s}
                    onClick={() => onSizeChange(s)}
                    title={`${s}px`}
                    style={{
                        width: 30,
                        height: 30,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: size === s ? 'rgba(255,255,255,0.13)' : 'transparent',
                        border: `1.5px solid ${size === s ? 'rgba(255,255,255,0.36)' : 'transparent'}`,
                        borderRadius: 7,
                        cursor: 'pointer',
                        outline: 'none',
                        flexShrink: 0,
                        transition: 'all 0.12s',
                    }}
                >
                    <div
                        style={{
                            width: Math.min(s + 3, 20),
                            height: Math.min(s + 3, 20),
                            borderRadius: '50%',
                            background: color,
                            opacity: size === s ? 1 : 0.38,
                            transition: 'all 0.12s',
                        }}
                    />
                </button>
            ))}
        </>
    );
}
