import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AutoRefreshService } from './AutoRefreshService';
import { dataFetcher } from './DataFetcher';
import type { ParkingLocation, AppConfig } from '../types';

// Mock the DataFetcher
vi.mock('./DataFetcher', () => ({
  dataFetcher: {
    fetchParkingData: vi.fn(),
    fetchAppConfig: vi.fn(),
  },
}));

const mockDataFetcher = vi.mocked(dataFetcher);

describe('AutoRefreshService', () => {
  let service: AutoRefreshService;
  let mockCallbacks: any;
  let mockParkingData: ParkingLocation[];
  let mockAppConfig: AppConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    service = new AutoRefreshService(1000); // 1 second for testing
    
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

    mockCallbacks = {
      onDataUpdate: vi.fn(),
      onConfigUpdate: vi.fn(),
      onStateChange: vi.fn(),
      onError: vi.fn(),
    };

    mockDataFetcher.fetchParkingData.mockResolvedValue(mockParkingData);
    mockDataFetcher.fetchAppConfig.mockResolvedValue(mockAppConfig);
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default refresh interval', () => {
      const defaultService = new AutoRefreshService();
      expect(defaultService.getState().nextRefresh).toBeNull();
    });

    it('should initialize with custom refresh interval', () => {
      const customService = new AutoRefreshService(2000);
      expect(customService).toBeDefined();
    });
  });

  describe('start', () => {
    it('should perform initial data fetch and schedule next refresh', async () => {
      service.start(mockCallbacks);

      // Wait for initial fetch to complete
      await vi.runOnlyPendingTimersAsync();

      expect(mockDataFetcher.fetchParkingData).toHaveBeenCalled();
      expect(mockDataFetcher.fetchAppConfig).toHaveBeenCalled();
      expect(mockCallbacks.onDataUpdate).toHaveBeenCalledWith(mockParkingData);
      expect(mockCallbacks.onConfigUpdate).toHaveBeenCalledWith(mockAppConfig);
      expect(mockCallbacks.onStateChange).toHaveBeenCalled();
    });

    it('should update state during refresh process', async () => {
      service.start(mockCallbacks);

      // Check that state changes are called
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isRefreshing: true,
          error: null,
        })
      );

      await vi.runOnlyPendingTimersAsync();

      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isRefreshing: false,
          lastRefresh: expect.any(Date),
          nextRefresh: expect.any(Date),
        })
      );
    });

    it('should schedule recurring refreshes', async () => {
      service.start(mockCallbacks);

      // Initial fetch
      await vi.runOnlyPendingTimersAsync();
      const callsAfterStart = mockDataFetcher.fetchParkingData.mock.calls.length;

      // Advance time to trigger next refresh
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();
      
      // Should have made at least one more call
      expect(mockDataFetcher.fetchParkingData.mock.calls.length).toBeGreaterThan(callsAfterStart);
    });
  });

  describe('stop', () => {
    it('should stop the refresh timer', async () => {
      service.start(mockCallbacks);
      await vi.runOnlyPendingTimersAsync();

      const callCountAfterStart = mockDataFetcher.fetchParkingData.mock.calls.length;
      service.stop();

      // Advance time - should not trigger another refresh
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
      expect(mockDataFetcher.fetchParkingData).toHaveBeenCalledTimes(callCountAfterStart);
    });

    it('should update state to clear next refresh time', () => {
      service.start(mockCallbacks);
      service.stop();

      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          nextRefresh: null,
        })
      );
    });
  });

  describe('refresh', () => {
    it('should perform manual refresh', async () => {
      service.start(mockCallbacks);
      await vi.runOnlyPendingTimersAsync();

      // Reset call counts
      vi.clearAllMocks();

      // Perform manual refresh
      await service.refresh();

      expect(mockDataFetcher.fetchParkingData).toHaveBeenCalledTimes(1);
      expect(mockDataFetcher.fetchAppConfig).toHaveBeenCalledTimes(1);
      expect(mockCallbacks.onDataUpdate).toHaveBeenCalledWith(mockParkingData);
      expect(mockCallbacks.onConfigUpdate).toHaveBeenCalledWith(mockAppConfig);
    });

    it('should not perform refresh if already refreshing', async () => {
      // Make fetch hang to simulate ongoing refresh
      mockDataFetcher.fetchParkingData.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 5000))
      );

      service.start(mockCallbacks);

      // Try to refresh while initial fetch is ongoing
      await service.refresh();

      // Should only have one call (the initial one)
      expect(mockDataFetcher.fetchParkingData).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const error = new Error('Network error');
      mockDataFetcher.fetchParkingData.mockRejectedValue(error);

      service.start(mockCallbacks);
      await vi.runOnlyPendingTimersAsync();

      expect(mockCallbacks.onError).toHaveBeenCalledWith('Network error');
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith(
        expect.objectContaining({
          isRefreshing: false,
          error: 'Network error',
        })
      );
    });

    it('should continue scheduling refreshes after errors', async () => {
      mockDataFetcher.fetchParkingData.mockRejectedValueOnce(new Error('Network error'));
      mockDataFetcher.fetchParkingData.mockResolvedValue(mockParkingData);

      service.start(mockCallbacks);
      await vi.runOnlyPendingTimersAsync();

      // First call should fail
      expect(mockCallbacks.onError).toHaveBeenCalledWith('Network error');

      // Advance time to trigger next refresh
      vi.advanceTimersByTime(1000);
      await vi.runOnlyPendingTimersAsync();

      // Second call should succeed
      expect(mockCallbacks.onDataUpdate).toHaveBeenCalledWith(mockParkingData);
    });
  });

  describe('setRefreshInterval', () => {
    it('should update refresh interval', () => {
      service.setRefreshInterval(2000);
      
      service.start(mockCallbacks);
      
      // The next refresh should be scheduled with the new interval
      const state = service.getState();
      expect(state.nextRefresh).toBeDefined();
    });

    it('should restart timer with new interval if already running', async () => {
      service.start(mockCallbacks);
      await vi.runOnlyPendingTimersAsync();

      const callCountAfterStart = mockDataFetcher.fetchParkingData.mock.calls.length;
      service.setRefreshInterval(500);

      // Should trigger refresh sooner with new interval
      vi.advanceTimersByTime(500);
      await vi.runOnlyPendingTimersAsync();
      
      // Should have made at least one more call
      expect(mockDataFetcher.fetchParkingData.mock.calls.length).toBeGreaterThan(callCountAfterStart);
    });
  });

  describe('utility methods', () => {
    it('should return current state', () => {
      const state = service.getState();
      expect(state).toEqual({
        isRefreshing: false,
        lastRefresh: null,
        nextRefresh: null,
        error: null,
      });
    });

    it('should calculate time until next refresh', async () => {
      service.start(mockCallbacks);
      await vi.runOnlyPendingTimersAsync();

      const timeUntilNext = service.getTimeUntilNextRefresh();
      expect(timeUntilNext).toBeGreaterThan(0);
      expect(timeUntilNext).toBeLessThanOrEqual(1000);
    });

    it('should determine if data is fresh', async () => {
      expect(service.isDataFresh()).toBe(false);

      service.start(mockCallbacks);
      await vi.runOnlyPendingTimersAsync();

      expect(service.isDataFresh()).toBe(true);

      // Advance time beyond refresh interval
      vi.advanceTimersByTime(2000);
      expect(service.isDataFresh()).toBe(false);
    });
  });
});