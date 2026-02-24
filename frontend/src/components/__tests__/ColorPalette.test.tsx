import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPalette } from '../ColorPalette';
import { COLORS } from '../../types';

describe('ColorPalette', () => {
    it('renders all preset color swatches', () => {
        render(<ColorPalette color="#FF4444" onColorChange={() => { }} isVertical={false} />);
        COLORS.forEach((c) => {
            expect(screen.getByTitle(c)).toBeInTheDocument();
        });
    });

    it('calls onColorChange when a swatch is clicked', () => {
        const onChange = vi.fn();
        render(<ColorPalette color="#FF4444" onColorChange={onChange} isVertical={false} />);
        fireEvent.click(screen.getByTitle('#00CCFF'));
        expect(onChange).toHaveBeenCalledWith('#00CCFF');
    });

    it('highlights the active color swatch', () => {
        render(<ColorPalette color="#44FF88" onColorChange={() => { }} isVertical={false} />);
        const active = screen.getByTitle('#44FF88');
        expect(active.style.border).toContain('2.5px solid');
    });

    it('uses 2-column grid in vertical mode', () => {
        const { container } = render(<ColorPalette color="#FF4444" onColorChange={() => { }} isVertical={true} />);
        const grid = container.querySelector('div');
        expect(grid?.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
    });

    it('uses 12-column grid in horizontal mode', () => {
        const { container } = render(<ColorPalette color="#FF4444" onColorChange={() => { }} isVertical={false} />);
        const grid = container.querySelector('div');
        expect(grid?.style.gridTemplateColumns).toBe('repeat(12, 1fr)');
    });

    it('renders a custom color picker', () => {
        render(<ColorPalette color="#FF4444" onColorChange={() => { }} isVertical={false} />);
        const picker = screen.getByTitle('Custom color');
        expect(picker).toBeInTheDocument();
    });
});
