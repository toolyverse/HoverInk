import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolBtn } from '../ToolBtn';

describe('ToolBtn', () => {
    it('renders children', () => {
        render(<ToolBtn onClick={() => { }} title="Test"><span data-testid="icon">X</span></ToolBtn>);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(<ToolBtn onClick={onClick} title="Test">Click</ToolBtn>);
        fireEvent.click(screen.getByTitle('Test'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('shows active styling when active', () => {
        render(<ToolBtn active onClick={() => { }} title="Active">A</ToolBtn>);
        const btn = screen.getByTitle('Active');
        expect(btn.style.background).toContain('rgba(255');
    });

    it('shows inactive styling when not active', () => {
        render(<ToolBtn active={false} onClick={() => { }} title="Inactive">I</ToolBtn>);
        const btn = screen.getByTitle('Inactive');
        expect(btn.style.background).toBe('transparent');
    });

    it('has correct title attribute', () => {
        render(<ToolBtn onClick={() => { }} title="My Tool">T</ToolBtn>);
        expect(screen.getByTitle('My Tool')).toBeInTheDocument();
    });
});
