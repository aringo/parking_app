import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataFetcher } from '../../src/services/DataFetcher';
import { AutoRefreshService } from '../../src/services/AutoRefreshService';
import type { ParkingLocation, AppConfig } from '../../src/types';

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('Data Service Integration Tests', () => {
  let dataFetcher: DataFetcher;
  let autoRefreshService: AutoRefreshService;

  const mockParkingData: ParkingLocation[] = [
    {
      id: '1',
      name: 'Test Parking',
      address: '123 Test St',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      capacity: { total: 100, available: 50 },
      rules: { timeLimit: '2 hours' },
      type: 'lot',
      lastUpdated: '2023-01-01T00:00:00Z',
    },
  ];

  const mockAppConfig: AppConfig = {
    branding: {
      name: 'Test City',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
    },
    map: {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 13,
    },
    dataSource: {
      url: '/api',
      refreshInterval: 300000,
    },
  };

  beforeEach(() => {
    dataFetcher = new DataFetcher({
      baseUrl: '/api',
      timeout: 5000,
      maxRetries: 2,
      retryDelay: 100,
      cacheExpiry: 60000,
      offlineCacheExpiry: 86400000,
    });

    autoRefreshService = new AutoRefreshService(
      () => dataFetcher.fetchParkingData(),
      300000 // 5 minutes
    );

    vi.clearAllMocks();
    (navigator as any).onLine = true;
  });

  afterEach(() => {
    autoRefreshService.stop();
    vi.restoreAllMocks();
  });

  it('should integrate DataFetcher with AutoRefreshService', async () => {
    vi.useFakeTimers();

    // Mock successful API response
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        locations: mockParkingData,
        lastUpdated: '2023-01-01T00:00:00Z',
        version: '1.0.0',
      }),
    });

    // Start auto-refresh
    const onDataUpdate = vi.fn();
    autoRefreshService.start({
      onDataUpdate,
      onConfigUpdate: vi.fn(),
      onStateChange: vi.fn(),
      onError: vi.fn(),
    });

    // Initial fetch should happen immediately
    await vi.runOnlyPendingTimersAsync();
    expect(onDataUpdate).toHaveBeenCalledWith(mockParkingData);

    // Fast-forward 5 minutes
    vi.advanceTimersByTime(300000);
    await vi.runOnlyPendingTimersAsync();

    // Should have refreshed again
    expect(onDataUpdate).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('should handle network failures during auto-refresh with cached data', async () => {
    vi.useFakeTimers();

    // Set up cached data
    const cachedData = {
      data: mockParkingData,
      timestamp: Date.now(),
      version: '1.0.0',
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

    // Mock network failure
    (fetch as any).mockRejectedValue(new Error('Network error'));

    const onDataUpdate = vi.fn();
    const onError = vi.fn();

    autoRefreshService.start({
      onDataUpdate,
      onConfigUpdate: vi.fn(),
      onStateChange: vi.fn(),
      onError,
    });

    // Should use cached data when network fails
    await vi.runOnlyPendingTimersAsync();
    expect(onDataUpdate).toHaveBeenCalledWith(mockParkingData);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));

    vi.useRealTimers();
  });

  it('should handle offline/online transitions', async () => {
    vi.useFakeTimers();

    // Start online with successful response
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        locations: mockParkingData,
        lastUpdated: '2023-01-01T00:00:00Z',
        version: '1.0.0',
      }),
    });

    const onDataUpdate = vi.fn();
    autoRefreshService.start({
      onDataUpdate,
      onConfigUpdate: vi.fn(),
      onStateChange: vi.fn(),
      onError: vi.fn(),
    });

    // Initial fetch
    await vi.runOnlyPendingTimersAsync();
    expect(onDataUpdate).toHaveBeenCalledWith(mockParkingData);

    // Go offline
    (navigator as any).onLine = false;

    // Set up cached data for offline use
    const cachedData = {
      data: mockParkingData,
      timestamp: Date.now(),
      version: '1.0.0',
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

    // Fast-forward to next refresh
    vi.advanceTimersByTime(300000);
    await vi.runOnlyPendingTimersAsync();

    // Should use cached data when offline
    expect(onDataUpdate).toHaveBeenCalledTimes(2);
    expect(onDataUpdate).toHaveBeenLastCalledWith(mockParkingData);

    // Go back online
    (navigator as any).onLine = true;

    // Fast-forward to next refresh
    vi.advanceTimersByTime(300000);
    await vi.runOnlyPendingTimersAsync();

    // Should fetch fresh data when back online
    expect(fetch).toHaveBeenCalledTimes(2); // Initial + after coming back online
    expect(onDataUpdate).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('should handle data validation during refresh cycles', async () => {
    vi.useFakeTimers();

    // Mock responses with valid and invalid data
    let callCount = 0;
    (fetch as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call - valid data
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: mockParkingData,
            lastUpdated: '2023-01-01T00:00:00Z',
            version: '1.0.0',
          }),
        });
      } else {
        // Second call - invalid data
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: [{ invalid: 'data' }],
            lastUpdated: '2023-01-01T00:00:00Z',
            version: '1.0.0',
          }),
        });
      }
    });

    const onDataUpdate = vi.fn();
    const onError = vi.fn();

    autoRefreshService.start({
      onDataUpdate,
      onConfigUpdate: vi.fn(),
      onStateChange: vi.fn(),
      onError,
    });

    // First refresh - should succeed
    await vi.runOnlyPendingTimersAsync();
    expect(onDataUpdate).toHaveBeenCalledWith(mockParkingData);

    // Second refresh - should handle invalid data
    vi.advanceTimersByTime(300000);
    await vi.runOnlyPendingTimersAsync();

    // Should have called error handler for invalid data
    expect(onError).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should coordinate config and data fetching', async () => {
    // Mock both config and data endpoints
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('config.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            config: mockAppConfig,
            version: '1.0.0',
          }),
        });
      }
      if (url.includes('parking-data.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: mockParkingData,
            lastUpdated: '2023-01-01T00:00:00Z',
            version: '1.0.0',
          }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    // Fetch both config and data
    const [config, data] = await Promise.all([
      dataFetcher.fetchAppConfig(),
      dataFetcher.fetchParkingData(),
    ]);

    expect(config).toEqual(mockAppConfig);
    expect(data).toEqual(mockParkingData);

    // Both should be cached
    expect(localStorageMock.setItem).toHaveBeenCalledTimes(2);
  });

  it('should handle cache expiry and refresh logic', async () => {
    // Set up expired cache
    const expiredData = {
      data: mockParkingData,
      timestamp: Date.now() - 120000, // 2 minutes ago (expired)
      version: '1.0.0',
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));

    // Mock fresh data response
    const freshData = [...mockParkingData, {
      id: '2',
      name: 'New Parking',
      address: '456 New St',
      coordinates: { lat: 40.7228, lng: -74.0160 },
      capacity: { total: 75, available: 30 },
      rules: { timeLimit: '3 hours' },
      type: 'street',
      lastUpdated: '2023-01-01T01:00:00Z',
    }];

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        locations: freshData,
        lastUpdated: '2023-01-01T01:00:00Z',
        version: '1.0.0',
      }),
    });

    // Fetch should get fresh data due to expired cache
    const result = await dataFetcher.fetchParkingData();

    expect(result).toEqual(freshData);
    expect(fetch).toHaveBeenCalled();
  });

  it('should handle concurrent refresh requests', async () => {
    (fetch as any).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: mockParkingData,
            lastUpdated: '2023-01-01T00:00:00Z',
            version: '1.0.0',
          }),
        }), 100)
      )
    );

    // Start multiple concurrent requests
    const promises = [
      dataFetcher.fetchParkingData(),
      dataFetcher.fetchParkingData(),
      dataFetcher.fetchParkingData(),
    ];

    const results = await Promise.all(promises);

    // All should return the same data
    results.forEach(result => {
      expect(result).toEqual(mockParkingData);
    });

    // Should only make one actual network request due to deduplication
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should maintain data consistency during rapid updates', async () => {
    vi.useFakeTimers();

    let updateCount = 0;
    (fetch as any).mockImplementation(() => {
      updateCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          locations: mockParkingData.map(location => ({
            ...location,
            capacity: {
              ...location.capacity,
              available: location.capacity.available - updateCount,
            },
          })),
          lastUpdated: new Date().toISOString(),
          version: '1.0.0',
        }),
      });
    });

    const dataUpdates: ParkingLocation[][] = [];
    const onDataUpdate = (data: ParkingLocation[]) => {
      dataUpdates.push([...data]);
    };

    autoRefreshService.start({
      onDataUpdate,
      onConfigUpdate: vi.fn(),
      onStateChange: vi.fn(),
      onError: vi.fn(),
    });

    // Trigger multiple rapid updates
    for (let i = 0; i < 5; i++) {
      await vi.runOnlyPendingTimersAsync();
      vi.advanceTimersByTime(300000);
    }

    // Should have consistent data updates
    expect(dataUpdates.length).toBeGreaterThan(0);
    
    // Each update should have decreasing availability
    for (let i = 1; i < dataUpdates.length; i++) {
      const prevAvailable = dataUpdates[i - 1][0].capacity.available;
      const currentAvailable = dataUpdates[i][0].capacity.available;
      expect(currentAvailable).toBeLessThan(prevAvailable);
    }

    vi.useRealTimers();
  });
});