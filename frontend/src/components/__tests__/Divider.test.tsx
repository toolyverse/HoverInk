import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Divider } from '../Divider';

describe('Divider', () => {
    it('renders horizontal divider', () => {
        const { container } = render(<Divider isV={false} />);
        const div = container.firstChild as HTMLElement;
        expect(div.style.width).toBe('1px');
        expect(div.style.height).toBe('24px');
    });

    it('renders vertical divider', () => {
        const { container } = render(<Divider isV={true} />);
        const div = container.firstChild as HTMLElement;
        expect(div.style.height).toBe('1px');
        expect(div.style.width).toBe('75%');
    });
});
