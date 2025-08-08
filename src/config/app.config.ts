// Default application configuration

import type { AppConfig } from '../types/index'

export const defaultAppConfig: AppConfig = {
  branding: {
    name: 'Parking Finder',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
  },
  map: {
    center: {
      lat: 37.7749, // San Francisco default
      lng: -122.4194,
    },
    zoom: 13,
  },
  dataSource: {
    url: '/api/parking-data',
    refreshInterval: 30000, // 30 seconds
  },
}

// Configuration loader function
export const loadAppConfig = async (configUrl: string = '/config.json'): Promise<AppConfig> => {
  try {
    const response = await fetch(configUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    
    const config: AppConfig = await response.json();
    
    // Validate required fields
    if (!config.branding?.name || !config.branding?.primaryColor || !config.branding?.secondaryColor) {
      throw new Error('Invalid configuration: missing required branding fields');
    }
    
    if (!config.map?.center?.lat || !config.map?.center?.lng) {
      throw new Error('Invalid configuration: missing required map center coordinates');
    }
    
    // Merge with defaults to ensure all fields are present
    return {
      ...defaultAppConfig,
      ...config,
      branding: {
        ...defaultAppConfig.branding,
        ...config.branding,
      },
      map: {
        ...defaultAppConfig.map,
        ...config.map,
      },
      dataSource: {
        ...defaultAppConfig.dataSource,
        ...config.dataSource,
      },
    };
  } catch (error) {
    console.warn('Failed to load app configuration, using defaults:', error);
    return defaultAppConfig;
  }
};