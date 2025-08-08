import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { usePerformanceOptimization } from './usePerformanceOptimization';

// Mock the navigator object
const mockNavigator = {
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  deviceMemory: 4,
};

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

describe('usePerformanceOptimization', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock navigator
    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
    });
  });

  it('should return default performance settings for good connection', () => {
    const { result } = renderHook(() => usePerformanceOptimization());

    expect(result.current.performanceSettings).toEqual({
      reduceAnimations: false,
      limitMapTiles: false,
      reduceImageQuality: false,
      enableDataSaver: false,
    });
    expect(result.current.isSlowConnection).toBe(false);
    expect(result.current.isDataSaverEnabled).toBe(false);
  });

  it('should detect slow connection and adjust settings', () => {
    // Mock slow connection
    mockNavigator.connection.effectiveType = '2g';
    mockNavigator.connection.downlink = 0.5;

    const { result } = renderHook(() => usePerformanceOptimization());

    expect(result.current.performanceSettings.reduceAnimations).toBe(true);
    expect(result.current.performanceSettings.limitMapTiles).toBe(true);
    expect(result.current.performanceSettings.reduceImageQuality).toBe(true);
    expect(result.current.isSlowConnection).toBe(true);
  });

  it('should detect data saver mode', () => {
    mockNavigator.connection.saveData = true;

    const { result } = renderHook(() => usePerformanceOptimization());

    expect(result.current.performanceSettings.enableDataSaver).toBe(true);
    expect(result.current.isDataSaverEnabled).toBe(true);
  });

  it('should handle missing Network Information API', () => {
    // Remove connection API
    const navigatorWithoutConnection = { ...mockNavigator };
    delete (navigatorWithoutConnection as any).connection;
    
    Object.defineProperty(window, 'navigator', {
      value: navigatorWithoutConnection,
      writable: true,
    });

    const { result } = renderHook(() => usePerformanceOptimization());

    // Should still return valid settings
    expect(result.current.performanceSettings).toBeDefined();
    expect(result.current.networkInfo).toEqual({});
  });

  it('should respect prefers-reduced-motion', () => {
    // Mock prefers-reduced-motion
    mockMatchMedia.mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Remove connection API to test fallback
    const navigatorWithoutConnection = { ...mockNavigator };
    delete (navigatorWithoutConnection as any).connection;
    
    Object.defineProperty(window, 'navigator', {
      value: navigatorWithoutConnection,
      writable: true,
    });

    const { result } = renderHook(() => usePerformanceOptimization());

    expect(result.current.performanceSettings.reduceAnimations).toBe(true);
  });

  it('should detect low memory devices', () => {
    // Mock low memory device
    const lowMemoryNavigator = {
      ...mockNavigator,
      deviceMemory: 1,
    };
    delete (lowMemoryNavigator as any).connection;
    
    Object.defineProperty(window, 'navigator', {
      value: lowMemoryNavigator,
      writable: true,
    });

    const { result } = renderHook(() => usePerformanceOptimization());

    expect(result.current.performanceSettings.reduceAnimations).toBe(true);
    expect(result.current.performanceSettings.limitMapTiles).toBe(true);
  });
});