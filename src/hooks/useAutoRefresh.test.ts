import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoRefresh } from './useAutoRefresh';
import { autoRefreshService } from '../services/AutoRefreshService';
import type { ParkingLocation, AppConfig } from '../types';

// Mock the AutoRefreshService
vi.mock('../services/AutoRefreshService', () => ({
  autoRefreshService: {
    start: vi.fn(),
    stop: vi.fn(),
    refresh: vi.fn(),
    setRefreshInterval: vi.fn(),
    getState: vi.fn(),
    getTimeUntilNextRefresh: vi.fn(),
    isDataFresh: vi.fn(),
  },
}));

const mockAutoRefreshService = vi.mocked(autoRefreshService);

describe('useAutoRefresh', () => {
  let mockParkingData: ParkingLocation[];
  let mockAppConfig: AppConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockParkingData = [
      {
        id: 'test-1',
        name: 'Test Parking',
        address: '123 Test St',
        coordinates: { lat: 37.7749, lng: -122.4194 },
        capacity: { total: 50, available: 25 },
        rules: { timeLimit: '2 hours', cost: 'Free' },
        type: 'street',
        lastUpdated: '2024-01-01T12:00:00Z',
      },
    ];

    mockAppConfig = {
      branding: {
        name: 'Test Town',
        primaryColor: '#007bff',
        secondaryColor: '#6c757d',
      },
      map: {
        center: { lat: 37.7749, lng: -122.4194 },
        zoom: 13,
      },
      dataSource: {
        url: '/api',
        refreshInterval: 300000,
      },
    };

    mockAutoRefreshService.getState.mockReturnValue({
      isRefreshing: false,
      lastRefresh: null,
      nextRefresh: null,
      error: null,
    });

    mockAutoRefreshService.getTimeUntilNextRefresh.mockReturnValue(0);
    mockAutoRefreshService.isDataFresh.mockReturnValue(true);
    mockAutoRefreshService.refresh.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useAutoRefresh());

      expect(result.current.parkingData).toEqual([]);
      expect(result.current.appConfig).toBeNull();
      expect(result.current.refreshState).toBeDefined();
      expect(mockAutoRefreshService.start).toHaveBeenCalled();
    });

    it('should set custom refresh interval', () => {
      renderHook(() => useAutoRefresh({ refreshInterval: 10000 }));

      expect(mockAutoRefreshService.setRefreshInterval).toHaveBeenCalledWith(10000);
    });

    it('should not auto-start when autoStart is false', () => {
      renderHook(() => useAutoRefresh({ autoStart: false }));

      expect(mockAutoRefreshService.start).not.toHaveBeenCalled();
    });
  });

  describe('data updates', () => {
    it('should update parking data when callback is triggered', () => {
      const { result } = renderHook(() => useAutoRefresh());

      // Get the callbacks passed to the service
      const startCall = mockAutoRefreshService.start.mock.calls[0];
      const callbacks = startCall[0];

      // Simulate data update
      act(() => {
        callbacks.onDataUpdate(mockParkingData);
      });

      expect(result.current.parkingData).toEqual(mockParkingData);
    });

    it('should update app config when callback is triggered', () => {
      const { result } = renderHook(() => useAutoRefresh());

      const startCall = mockAutoRefreshService.start.mock.calls[0];
      const callbacks = startCall[0];

      act(() => {
        callbacks.onConfigUpdate(mockAppConfig);
      });

      expect(result.current.appConfig).toEqual(mockAppConfig);
    });

    it('should update refresh state when callback is triggered', () => {
      const { result } = renderHook(() => useAutoRefresh());

      const startCall = mockAutoRefreshService.start.mock.calls[0];
      const callbacks = startCall[0];

      const newState = {
        isRefreshing: true,
        lastRefresh: new Date(),
        nextRefresh: new Date(),
        error: null,
      };

      act(() => {
        callbacks.onStateChange(newState);
      });

      expect(result.current.refreshState).toEqual(newState);
    });
  });

  describe('manual refresh', () => {
    it('should call service refresh method', async () => {
      const { result } = renderHook(() => useAutoRefresh());

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockAutoRefreshService.refresh).toHaveBeenCalled();
    });
  });

  describe('start and stop', () => {
    it('should start service when start is called', () => {
      const { result } = renderHook(() => useAutoRefresh({ autoStart: false }));

      act(() => {
        result.current.start();
      });

      expect(mockAutoRefreshService.start).toHaveBeenCalled();
    });

    it('should stop service when stop is called', () => {
      const { result } = renderHook(() => useAutoRefresh());

      act(() => {
        result.current.stop();
      });

      expect(mockAutoRefreshService.stop).toHaveBeenCalled();
    });

    it('should not start multiple times', () => {
      const { result } = renderHook(() => useAutoRefresh());

      act(() => {
        result.current.start();
        result.current.start();
      });

      // Should only be called once during initialization
      expect(mockAutoRefreshService.start).toHaveBeenCalledTimes(1);
    });
  });

  describe('time until next refresh', () => {
    it('should update time until next refresh periodically', () => {
      mockAutoRefreshService.getTimeUntilNextRefresh
        .mockReturnValueOnce(60000)
        .mockReturnValueOnce(59000);

      const { result } = renderHook(() => useAutoRefresh());

      expect(result.current.timeUntilNextRefresh).toBe(60000);

      // Advance timer by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeUntilNextRefresh).toBe(59000);
    });
  });

  describe('cleanup', () => {
    it('should stop service on unmount', () => {
      const { unmount } = renderHook(() => useAutoRefresh());

      unmount();

      expect(mockAutoRefreshService.stop).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors from service', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useAutoRefresh());

      const startCall = mockAutoRefreshService.start.mock.calls[0];
      const callbacks = startCall[0];

      act(() => {
        callbacks.onError('Test error');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Auto-refresh error:', 'Test error');
      
      consoleSpy.mockRestore();
    });
  });
});