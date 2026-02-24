import { useState } from 'react';

interface ToolBtnProps {
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
}

export function ToolBtn({ active, onClick, title, children }: ToolBtnProps) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            title={title}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: active ? 'rgba(255,255,255,0.17)' : hov ? 'rgba(255,255,255,0.08)' : 'transparent',
                border: `1.5px solid ${active ? 'rgba(255,255,255,0.42)' : 'transparent'}`,
                borderRadius: 8,
                color: active ? '#fff' : 'rgba(255,255,255,0.62)',
                cursor: 'pointer',
                outline: 'none',
                flexShrink: 0,
                transition: 'all 0.12s',
            }}
        >
            {children}
        </button>
    );
}
