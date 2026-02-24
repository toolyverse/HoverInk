import { vi } from 'vitest';

// Mock for wailsjs/runtime/runtime
export const EventsOn = vi.fn();
export const EventsOff = vi.fn();
export const Quit = vi.fn();
