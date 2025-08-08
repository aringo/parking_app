import type { ParkingLocation, AppConfig, ParkingDataResponse, ConfigResponse } from '../types/index';

export interface DataFetcherConfig {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  cacheExpiry: number; // milliseconds
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  version: string;
}

export class DataFetcher {
  private config: DataFetcherConfig;
  private readonly PARKING_DATA_KEY = 'parking_finder_data';
  private readonly CONFIG_DATA_KEY = 'parking_finder_config';

  constructor(config: Partial<DataFetcherConfig> = {}) {
    this.config = {
      baseUrl: '/api',
      timeout: 10000, // 10 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      cacheExpiry: 5 * 60 * 1000, // 5 minutes
      ...config,
    };
  }

  /**
   * Fetch parking data with caching and retry logic
   */
  async fetchParkingData(): Promise<ParkingLocation[]> {
    const cacheKey = this.PARKING_DATA_KEY;
    
    try {
      // Try to fetch fresh data
      const response = await this.fetchWithRetry<ParkingDataResponse>('/parking-data.json');
      
      if (this.validateParkingData(response)) {
        // Cache the successful response
        this.setCachedData(cacheKey, {
          data: response.locations,
          timestamp: Date.now(),
          version: response.version,
        });
        
        return response.locations;
      } else {
        throw new Error('Invalid parking data format');
      }
    } catch (error) {
      console.warn('Failed to fetch parking data:', error);
      
      // Fall back to cached data
      const cachedData = this.getCachedData<ParkingLocation[]>(cacheKey);
      if (cachedData) {
        console.info('Using cached parking data from', new Date(cachedData.timestamp));
        return cachedData.data;
      }
      
      // If no cached data available, return empty array
      console.error('No cached parking data available');
      return [];
    }
  }

  /**
   * Fetch app configuration with caching and retry logic
   */
  async fetchAppConfig(): Promise<AppConfig | null> {
    const cacheKey = this.CONFIG_DATA_KEY;
    
    try {
      // Try to fetch fresh config
      const response = await this.fetchWithRetry<ConfigResponse>('/config.json');
      
      if (this.validateAppConfig(response)) {
        // Cache the successful response
        this.setCachedData(cacheKey, {
          data: response.config,
          timestamp: Date.now(),
          version: response.version,
        });
        
        return response.config;
      } else {
        throw new Error('Invalid app config format');
      }
    } catch (error) {
      console.warn('Failed to fetch app config:', error);
      
      // Fall back to cached config
      const cachedData = this.getCachedData<AppConfig>(cacheKey);
      if (cachedData) {
        console.info('Using cached app config from', new Date(cachedData.timestamp));
        return cachedData.data;
      }
      
      // If no cached config available, return null (will use defaults)
      console.error('No cached app config available');
      return null;
    }
  }

  /**
   * Check if cached data is still valid
   */
  isCacheValid(cacheKey: string): boolean {
    const cachedData = this.getCachedData(cacheKey);
    if (!cachedData) return false;
    
    const age = Date.now() - cachedData.timestamp;
    return age < this.config.cacheExpiry;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    localStorage.removeItem(this.PARKING_DATA_KEY);
    localStorage.removeItem(this.CONFIG_DATA_KEY);
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): { parkingData: CachedData<any> | null; config: CachedData<any> | null } {
    return {
      parkingData: this.getCachedData(this.PARKING_DATA_KEY),
      config: this.getCachedData(this.CONFIG_DATA_KEY),
    };
  }

  /**
   * Fetch data with retry logic and timeout
   */
  private async fetchWithRetry<T>(endpoint: string): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data as T;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.maxRetries) {
          console.warn(`Fetch attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms:`, lastError.message);
          await this.delay(this.config.retryDelay);
        }
      }
    }

    throw new Error(`Failed to fetch ${endpoint} after ${this.config.maxRetries} attempts: ${lastError!.message}`);
  }

  /**
   * Validate parking data response
   */
  private validateParkingData(response: any): response is ParkingDataResponse {
    if (!response || typeof response !== 'object') return false;
    if (!Array.isArray(response.locations)) return false;
    if (typeof response.lastUpdated !== 'string') return false;
    if (typeof response.version !== 'string') return false;

    // Validate each parking location
    return response.locations.every((location: any) => this.validateParkingLocation(location));
  }

  /**
   * Validate individual parking location
   */
  private validateParkingLocation(location: any): location is ParkingLocation {
    if (!location || typeof location !== 'object') return false;
    
    const required = ['id', 'name', 'address', 'coordinates', 'capacity', 'rules', 'type', 'lastUpdated'];
    if (!required.every(field => field in location)) return false;

    // Validate coordinates
    if (!location.coordinates || 
        typeof location.coordinates.lat !== 'number' || 
        typeof location.coordinates.lng !== 'number') return false;

    // Validate capacity
    if (!location.capacity || 
        typeof location.capacity.total !== 'number' || 
        typeof location.capacity.available !== 'number') return false;

    // Validate type
    const validTypes = ['street', 'lot', 'structure', 'garage'];
    if (!validTypes.includes(location.type)) return false;

    return true;
  }

  /**
   * Validate app config response
   */
  private validateAppConfig(response: any): response is ConfigResponse {
    if (!response || typeof response !== 'object') return false;
    if (!response.config || typeof response.config !== 'object') return false;
    if (typeof response.version !== 'string') return false;

    const config = response.config;
    
    // Validate required branding fields
    if (!config.branding || 
        typeof config.branding.name !== 'string' ||
        typeof config.branding.primaryColor !== 'string' ||
        typeof config.branding.secondaryColor !== 'string') return false;

    // Validate map config
    if (!config.map || 
        typeof config.map.center?.lat !== 'number' ||
        typeof config.map.center?.lng !== 'number' ||
        typeof config.map.zoom !== 'number') return false;

    // Validate data source config
    if (!config.dataSource ||
        typeof config.dataSource.url !== 'string' ||
        typeof config.dataSource.refreshInterval !== 'number') return false;

    return true;
  }

  /**
   * Get cached data from localStorage
   */
  private getCachedData<T>(key: string): CachedData<T> | null {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const parsed = JSON.parse(cached) as CachedData<T>;
      
      // Validate cache structure
      if (!parsed.data || typeof parsed.timestamp !== 'number' || typeof parsed.version !== 'string') {
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn(`Failed to parse cached data for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set cached data in localStorage
   */
  private setCachedData<T>(key: string, data: CachedData<T>): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to cache data for ${key}:`, error);
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export a default instance
export const dataFetcher = new DataFetcher();