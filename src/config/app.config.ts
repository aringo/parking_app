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
export const loadAppConfig = async (): Promise<AppConfig> => {
  try {
    // In a real implementation, this would fetch from a server or local storage
    // For now, return the default configuration
    return defaultAppConfig
  } catch (error) {
    console.warn('Failed to load app configuration, using defaults:', error)
    return defaultAppConfig
  }
}