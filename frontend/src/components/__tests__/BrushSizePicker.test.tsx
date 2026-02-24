import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrushSizePicker } from '../BrushSizePicker';
import { BRUSH_SIZES } from '../../types';

describe('BrushSizePicker', () => {
    it('renders a button for each brush size', () => {
        render(<BrushSizePicker size={4} onSizeChange={() => { }} color="#FF0000" />);
        BRUSH_SIZES.forEach((s) => {
            expect(screen.getByTitle(`${s}px`)).toBeInTheDocument();
        });
    });

    it('calls onSizeChange when a size button is clicked', () => {
        const onChange = vi.fn();
        render(<BrushSizePicker size={4} onSizeChange={onChange} color="#FF0000" />);
        fireEvent.click(screen.getByTitle('14px'));
        expect(onChange).toHaveBeenCalledWith(14);
    });

    it('highlights the active size button', () => {
        render(<BrushSizePicker size={8} onSizeChange={() => { }} color="#FF0000" />);
        const active = screen.getByTitle('8px');
        expect(active.style.background).toContain('rgba(255');
    });

    it('shows inactive styling for non-selected sizes', () => {
        render(<BrushSizePicker size={8} onSizeChange={() => { }} color="#FF0000" />);
        const inactive = screen.getByTitle('2px');
        expect(inactive.style.background).toBe('transparent');
    });
});
