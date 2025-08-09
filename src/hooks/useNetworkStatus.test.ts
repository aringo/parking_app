import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useNetworkStatus } from './useNetworkStatus';

// Mock navigator.onLine
const mockNavigator = {
  onLine: true,
  connection: null,
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

describe('useNetworkStatus', () => {
  let addEventListener: ReturnType<typeof vi.fn>;
  let removeEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    
    // Mock window event listeners
    window.addEventListener = addEventListener;
    window.removeEventListener = removeEventListener;
    
    // Reset navigator state
    mockNavigator.onLine = true;
    mockNavigator.connection = null;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns initial online status', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSlowConnection).toBe(false);
    expect(result.current.connectionType).toBe(null);
    expect(result.current.effectiveType).toBe(null);
  });

  it('returns initial offline status', () => {
    mockNavigator.onLine = false;

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);
  });

  it('sets up event listeners on mount', () => {
    renderHook(() => useNetworkStatus());

    expect(addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('cleans up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('updates status when going offline', () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    act(() => {
      mockNavigator.onLine = false;
      const offlineHandler = addEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      offlineHandler?.();
    });

    expect(result.current.isOnline).toBe(false);
  });

  it('updates status when going online', () => {
    mockNavigator.onLine = false;
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);

    // Simulate going online
    act(() => {
      mockNavigator.onLine = true;
      const onlineHandler = addEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      onlineHandler?.();
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('detects slow connection based on effectiveType', () => {
    const mockConnection = {
      effectiveType: '2g',
      type: 'cellular',
      downlink: 0.5,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockNavigator.connection = mockConnection;

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isSlowConnection).toBe(true);
    expect(result.current.effectiveType).toBe('2g');
    expect(result.current.connectionType).toBe('cellular');
  });

  it('detects slow connection based on downlink speed', () => {
    const mockConnection = {
      effectiveType: '3g',
      type: 'wifi',
      downlink: 1.0, // Below 1.5 threshold
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockNavigator.connection = mockConnection;

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isSlowConnection).toBe(true);
  });

  it('detects fast connection', () => {
    const mockConnection = {
      effectiveType: '4g',
      type: 'wifi',
      downlink: 10.0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockNavigator.connection = mockConnection;

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isSlowConnection).toBe(false);
    expect(result.current.effectiveType).toBe('4g');
    expect(result.current.connectionType).toBe('wifi');
  });

  it('handles connection change events', () => {
    const mockConnection = {
      effectiveType: '4g',
      type: 'wifi',
      downlink: 10.0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockNavigator.connection = mockConnection;

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isSlowConnection).toBe(false);

    // Simulate connection change to slow connection
    act(() => {
      mockConnection.effectiveType = '2g';
      mockConnection.downlink = 0.5;
      
      const changeHandler = mockConnection.addEventListener.mock.calls.find(
        call => call[0] === 'change'
      )?.[1];
      changeHandler?.();
    });

    expect(result.current.isSlowConnection).toBe(true);
  });

  it('works without connection API support', () => {
    mockNavigator.connection = null;

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSlowConnection).toBe(false);
    expect(result.current.connectionType).toBe(null);
    expect(result.current.effectiveType).toBe(null);
  });

  it('cleans up connection event listeners on unmount', () => {
    const mockConnection = {
      effectiveType: '4g',
      type: 'wifi',
      downlink: 10.0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockNavigator.connection = mockConnection;

    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(mockConnection.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function)
    );
  });
});