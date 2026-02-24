interface DividerProps {
    isV: boolean;
}

export function Divider({ isV }: DividerProps) {
    return (
        <div
            style={
                isV
                    ? { height: 1, width: '75%', background: 'rgba(255,255,255,0.11)', margin: '2px auto', flexShrink: 0 }
                    : { width: 1, height: 24, background: 'rgba(255,255,255,0.11)', margin: '0 2px', flexShrink: 0 }
            }
        />
    );
}
