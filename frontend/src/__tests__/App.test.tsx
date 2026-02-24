import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the wailsjs runtime before importing App
vi.mock('../../wailsjs/runtime/runtime', () => ({
    EventsOn: vi.fn(),
    Quit: vi.fn(),
}));

import App from '../App';

describe('App (integration)', () => {
    it('renders without crashing', () => {
        render(<App />);
    });

    it('renders the toolbar with drawing tool buttons', () => {
        render(<App />);
        expect(screen.getByTitle('Pen')).toBeInTheDocument();
        expect(screen.getByTitle('Highlighter')).toBeInTheDocument();
        expect(screen.getByTitle('Eraser')).toBeInTheDocument();
        expect(screen.getByTitle('Line')).toBeInTheDocument();
        expect(screen.getByTitle('Arrow')).toBeInTheDocument();
        expect(screen.getByTitle('Rectangle')).toBeInTheDocument();
        expect(screen.getByTitle('Circle')).toBeInTheDocument();
    });

    it('renders undo/redo/clear buttons', () => {
        render(<App />);
        expect(screen.getByTitle('Undo (Ctrl+Z)')).toBeInTheDocument();
        expect(screen.getByTitle('Redo (Ctrl+Y)')).toBeInTheDocument();
        expect(screen.getByTitle('Clear all')).toBeInTheDocument();
    });

    it('renders the fill toggle', () => {
        render(<App />);
        expect(screen.getByTitle('Fill: Off')).toBeInTheDocument();
    });

    it('toggles fill on click', () => {
        render(<App />);
        const fillBtn = screen.getByTitle('Fill: Off');
        fireEvent.click(fillBtn);
        expect(screen.getByTitle('Fill: On')).toBeInTheDocument();
    });

    it('renders orientation toggle', () => {
        render(<App />);
        expect(screen.getByTitle('Switch to vertical')).toBeInTheDocument();
    });

    it('renders close button', () => {
        render(<App />);
        expect(screen.getByTitle('Close application')).toBeInTheDocument();
    });

    it('renders brush size buttons', () => {
        render(<App />);
        expect(screen.getByTitle('2px')).toBeInTheDocument();
        expect(screen.getByTitle('4px')).toBeInTheDocument();
        expect(screen.getByTitle('8px')).toBeInTheDocument();
        expect(screen.getByTitle('14px')).toBeInTheDocument();
        expect(screen.getByTitle('22px')).toBeInTheDocument();
    });
});
