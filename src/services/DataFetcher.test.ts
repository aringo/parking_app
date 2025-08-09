import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataFetcher } from './DataFetcher';
import type { ParkingLocation, AppConfig } from '../types';

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

describe('DataFetcher', () => {
  let dataFetcher: DataFetcher;
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
    vi.clearAllMocks();
    (navigator as any).onLine = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchParkingData', () => {
    it('fetches and caches parking data successfully', async () => {
      const mockResponse = {
        locations: mockParkingData,
        lastUpdated: '2023-01-01T00:00:00Z',
        version: '1.0.0',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingData);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'parking_finder_data',
        expect.stringContaining('"data":')
      );
    });

    it('returns cached data when fetch fails', async () => {
      const cachedData = {
        data: mockParkingData,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingData);
    });

    it('returns cached data when offline', async () => {
      (navigator as any).onLine = false;
      
      const cachedData = {
        data: mockParkingData,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingData);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns stale cached data when offline and no fresh data', async () => {
      (navigator as any).onLine = false;
      
      const staleData = {
        data: mockParkingData,
        timestamp: Date.now() - 86400000 * 2, // 2 days old
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(staleData));

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingData);
    });

    it('returns empty array when no data available offline', async () => {
      (navigator as any).onLine = false;
      localStorageMock.getItem.mockReturnValue(null);

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual([]);
    });

    it('uses valid cached data without network request', async () => {
      const recentData = {
        data: mockParkingData,
        timestamp: Date.now() - 30000, // 30 seconds ago
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(recentData));

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingData);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('retries on fetch failure', async () => {
      (fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            locations: mockParkingData,
            lastUpdated: '2023-01-01T00:00:00Z',
            version: '1.0.0',
          }),
        });

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingData);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('validates parking data format', async () => {
      const invalidResponse = {
        locations: [{ invalid: 'data' }],
        lastUpdated: '2023-01-01T00:00:00Z',
        version: '1.0.0',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      });

      localStorageMock.getItem.mockReturnValue(null);

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual([]);
    });
  });

  describe('fetchAppConfig', () => {
    it('fetches and caches app config successfully', async () => {
      const mockResponse = {
        config: mockAppConfig,
        version: '1.0.0',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await dataFetcher.fetchAppConfig();

      expect(result).toEqual(mockAppConfig);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'parking_finder_config',
        expect.stringContaining('"data":')
      );
    });

    it('returns cached config when fetch fails', async () => {
      const cachedData = {
        data: mockAppConfig,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await dataFetcher.fetchAppConfig();

      expect(result).toEqual(mockAppConfig);
    });

    it('returns cached config when offline', async () => {
      (navigator as any).onLine = false;
      
      const cachedData = {
        data: mockAppConfig,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      const result = await dataFetcher.fetchAppConfig();

      expect(result).toEqual(mockAppConfig);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('returns null when no config available', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));
      localStorageMock.getItem.mockReturnValue(null);

      const result = await dataFetcher.fetchAppConfig();

      expect(result).toBeNull();
    });
  });

  describe('cache management', () => {
    it('checks cache validity correctly', () => {
      const recentData = {
        data: mockParkingData,
        timestamp: Date.now() - 30000, // 30 seconds ago
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(recentData));

      expect(dataFetcher.isCacheValid('test_key')).toBe(true);
    });

    it('detects stale cache', () => {
      const staleData = {
        data: mockParkingData,
        timestamp: Date.now() - 120000, // 2 minutes ago
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(staleData));

      expect(dataFetcher.isCacheValid('test_key')).toBe(false);
    });

    it('uses extended cache validity when offline', () => {
      const oldData = {
        data: mockParkingData,
        timestamp: Date.now() - 3600000, // 1 hour ago
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldData));

      expect(dataFetcher.isCacheValid('test_key', true)).toBe(true);
    });

    it('clears all cached data', () => {
      dataFetcher.clearCache();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('parking_finder_data');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('parking_finder_config');
    });

    it('provides cache info for debugging', () => {
      const parkingData = {
        data: mockParkingData,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      const configData = {
        data: mockAppConfig,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      localStorageMock.getItem
        .mockReturnValueOnce(JSON.stringify(parkingData))
        .mockReturnValueOnce(JSON.stringify(configData));

      const cacheInfo = dataFetcher.getCacheInfo();

      expect(cacheInfo.parkingData).toEqual(parkingData);
      expect(cacheInfo.config).toEqual(configData);
    });
  });

  describe('error handling', () => {
    it('handles fetch timeout', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'AbortError';
      
      (fetch as any).mockRejectedValue(timeoutError);
      localStorageMock.getItem.mockReturnValue(null);

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual([]);
    });

    it('handles HTTP errors', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      localStorageMock.getItem.mockReturnValue(null);

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual([]);
    });

    it('handles malformed JSON in cache', async () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual([]);
    });

    it('handles localStorage errors gracefully', async () => {
      const mockResponse = {
        locations: mockParkingData,
        lastUpdated: '2023-01-01T00:00:00Z',
        version: '1.0.0',
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingData);
      // Should not throw error even if caching fails
    });
  });
});