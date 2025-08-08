import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DataFetcher } from './DataFetcher';
import type { ParkingLocation, AppConfig, ParkingDataResponse, ConfigResponse } from '../types/index';

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

// Mock fetch
global.fetch = vi.fn();

// Test data
const mockParkingLocation: ParkingLocation = {
  id: 'test-1',
  name: 'Test Parking Lot',
  address: '123 Test St',
  coordinates: { lat: 37.7749, lng: -122.4194 },
  capacity: { total: 100, available: 50 },
  rules: { timeLimit: '2 hours', cost: 'Free' },
  type: 'lot',
  lastUpdated: '2024-01-01T12:00:00Z',
};

const mockParkingDataResponse: ParkingDataResponse = {
  locations: [mockParkingLocation],
  lastUpdated: '2024-01-01T12:00:00Z',
  version: '1.0.0',
};

const mockAppConfig: AppConfig = {
  branding: {
    name: 'Test Town Parking',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
  },
  map: {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 13,
  },
  dataSource: {
    url: '/api/parking-data',
    refreshInterval: 30000,
  },
};

const mockConfigResponse: ConfigResponse = {
  config: mockAppConfig,
  version: '1.0.0',
};

describe('DataFetcher', () => {
  let dataFetcher: DataFetcher;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    dataFetcher = new DataFetcher({
      baseUrl: '/test-api',
      timeout: 1000,
      maxRetries: 2,
      retryDelay: 100,
      cacheExpiry: 5000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchParkingData', () => {
    it('should fetch and return parking data successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockParkingDataResponse),
      });

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingDataResponse.locations);
      expect(fetch).toHaveBeenCalledWith('/test-api/parking-data.json', {
        signal: expect.any(AbortSignal),
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'parking_finder_data',
        expect.stringContaining('"data"')
      );
    });

    it('should retry on network failure and eventually succeed', async () => {
      (fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockParkingDataResponse),
        });

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingDataResponse.locations);
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('should fall back to cached data when fetch fails', async () => {
      const cachedData = {
        data: mockParkingDataResponse.locations,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual(mockParkingDataResponse.locations);
      expect(fetch).toHaveBeenCalledTimes(2); // maxRetries
    });

    it('should return empty array when no cached data and fetch fails', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual([]);
    });

    it('should handle invalid data format', async () => {
      const invalidResponse = { invalid: 'data' };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      });

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual([]);
    });

    it('should handle HTTP errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await dataFetcher.fetchParkingData();

      expect(result).toEqual([]);
    });
  });

  describe('fetchAppConfig', () => {
    it('should fetch and return app config successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockConfigResponse),
      });

      const result = await dataFetcher.fetchAppConfig();

      expect(result).toEqual(mockAppConfig);
      expect(fetch).toHaveBeenCalledWith('/test-api/config.json', {
        signal: expect.any(AbortSignal),
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'parking_finder_config',
        expect.stringContaining('"data"')
      );
    });

    it('should fall back to cached config when fetch fails', async () => {
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

    it('should return null when no cached config and fetch fails', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await dataFetcher.fetchAppConfig();

      expect(result).toBeNull();
    });

    it('should handle invalid config format', async () => {
      const invalidResponse = { config: { invalid: 'config' }, version: '1.0.0' };
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      });

      const result = await dataFetcher.fetchAppConfig();

      expect(result).toBeNull();
    });
  });

  describe('caching functionality', () => {
    it('should check cache validity correctly', () => {
      const recentData = {
        data: mockParkingDataResponse.locations,
        timestamp: Date.now() - 1000, // 1 second ago
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(recentData));

      expect(dataFetcher.isCacheValid('parking_finder_data')).toBe(true);
    });

    it('should detect expired cache', () => {
      const oldData = {
        data: mockParkingDataResponse.locations,
        timestamp: Date.now() - 10000, // 10 seconds ago (expired)
        version: '1.0.0',
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldData));

      expect(dataFetcher.isCacheValid('parking_finder_data')).toBe(false);
    });

    it('should clear all cached data', () => {
      dataFetcher.clearCache();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('parking_finder_data');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('parking_finder_config');
    });

    it('should return cache info', () => {
      const parkingData = {
        data: mockParkingDataResponse.locations,
        timestamp: Date.now(),
        version: '1.0.0',
      };

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'parking_finder_data') return JSON.stringify(parkingData);
        return null;
      });

      const cacheInfo = dataFetcher.getCacheInfo();

      expect(cacheInfo.parkingData).toEqual(parkingData);
      expect(cacheInfo.config).toBeNull();
    });

    it('should handle corrupted cache data gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');

      expect(dataFetcher.isCacheValid('parking_finder_data')).toBe(false);
    });
  });

  describe('data validation', () => {
    it('should validate parking location correctly', async () => {
      const validResponse = mockParkingDataResponse;
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validResponse),
      });

      const result = await dataFetcher.fetchParkingData();
      expect(result).toEqual(validResponse.locations);
    });

    it('should reject parking data with missing required fields', async () => {
      const invalidLocation = { ...mockParkingLocation };
      delete (invalidLocation as any).coordinates;

      const invalidResponse = {
        ...mockParkingDataResponse,
        locations: [invalidLocation],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      });

      const result = await dataFetcher.fetchParkingData();
      expect(result).toEqual([]);
    });

    it('should reject parking data with invalid coordinates', async () => {
      const invalidLocation = {
        ...mockParkingLocation,
        coordinates: { lat: 'invalid', lng: -122.4194 },
      };

      const invalidResponse = {
        ...mockParkingDataResponse,
        locations: [invalidLocation],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      });

      const result = await dataFetcher.fetchParkingData();
      expect(result).toEqual([]);
    });

    it('should reject parking data with invalid type', async () => {
      const invalidLocation = {
        ...mockParkingLocation,
        type: 'invalid_type',
      };

      const invalidResponse = {
        ...mockParkingDataResponse,
        locations: [invalidLocation],
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      });

      const result = await dataFetcher.fetchParkingData();
      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle fetch timeout', async () => {
      // Mock a slow response that will timeout
      (fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 2000))
      );

      const result = await dataFetcher.fetchParkingData();
      expect(result).toEqual([]);
    });

    it('should handle localStorage errors gracefully', async () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockParkingDataResponse),
      });

      // Should still return data even if caching fails
      const result = await dataFetcher.fetchParkingData();
      expect(result).toEqual(mockParkingDataResponse.locations);
    });

    it('should handle JSON parsing errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await dataFetcher.fetchParkingData();
      expect(result).toEqual([]);
    });
  });

  describe('retry logic', () => {
    it('should respect maxRetries configuration', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      await dataFetcher.fetchParkingData();

      expect(fetch).toHaveBeenCalledTimes(2); // maxRetries = 2
    });

    it('should wait between retries', async () => {
      const startTime = Date.now();
      (fetch as any).mockRejectedValue(new Error('Network error'));

      await dataFetcher.fetchParkingData();

      const endTime = Date.now();
      const elapsed = endTime - startTime;
      
      // Should have waited at least retryDelay (100ms) between attempts
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });
});