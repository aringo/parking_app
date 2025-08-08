import { describe, it, expect } from 'vitest'
import {
  isParkingLocation,
  isAppConfig,
  validateParkingData,
  getAvailabilityStatus,
  isValidCoordinates,
  sanitizeSearchInput,
  isParkingDataResponse,
  isConfigResponse,
  validateParkingLocationFields,
  validateAppConfigFields
} from './validation'
import type { ParkingLocation, AppConfig } from '../types/index'

describe('isParkingLocation', () => {
  const validParkingLocation: ParkingLocation = {
    id: 'test-1',
    name: 'Test Parking',
    address: '123 Main St',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    capacity: { total: 100, available: 50 },
    rules: { timeLimit: '2 hours', cost: 'Free' },
    type: 'lot',
    lastUpdated: '2024-01-01T12:00:00Z'
  }

  it('should return true for valid parking location', () => {
    expect(isParkingLocation(validParkingLocation)).toBe(true)
  })

  it('should return false for null or undefined', () => {
    expect(isParkingLocation(null)).toBe(false)
    expect(isParkingLocation(undefined)).toBe(false)
  })

  it('should return false for missing required fields', () => {
    const invalidLocation = { ...validParkingLocation }
    delete (invalidLocation as any).id
    expect(isParkingLocation(invalidLocation)).toBe(false)
  })

  it('should return false for invalid coordinates', () => {
    const invalidLocation = {
      ...validParkingLocation,
      coordinates: { lat: 'invalid', lng: -74.0060 }
    }
    expect(isParkingLocation(invalidLocation)).toBe(false)
  })

  it('should return false for invalid parking type', () => {
    const invalidLocation = {
      ...validParkingLocation,
      type: 'invalid-type'
    }
    expect(isParkingLocation(invalidLocation)).toBe(false)
  })
})

describe('isAppConfig', () => {
  const validAppConfig: AppConfig = {
    branding: {
      name: 'Test Town',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d'
    },
    map: {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 13
    },
    dataSource: {
      url: 'https://example.com/data.json',
      refreshInterval: 300000
    }
  }

  it('should return true for valid app config', () => {
    expect(isAppConfig(validAppConfig)).toBe(true)
  })

  it('should return false for null or undefined', () => {
    expect(isAppConfig(null)).toBe(false)
    expect(isAppConfig(undefined)).toBe(false)
  })

  it('should return false for missing branding', () => {
    const invalidConfig = { ...validAppConfig }
    delete (invalidConfig as any).branding
    expect(isAppConfig(invalidConfig)).toBe(false)
  })

  it('should return false for invalid map center', () => {
    const invalidConfig = {
      ...validAppConfig,
      map: { ...validAppConfig.map, center: { lat: 'invalid', lng: -74.0060 } }
    }
    expect(isAppConfig(invalidConfig)).toBe(false)
  })
})

describe('validateParkingData', () => {
  const validLocation: ParkingLocation = {
    id: 'test-1',
    name: 'Test Parking',
    address: '123 Main St',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    capacity: { total: 100, available: 50 },
    rules: {},
    type: 'lot',
    lastUpdated: '2024-01-01T12:00:00Z'
  }

  it('should filter out invalid locations', () => {
    const mixedData = [
      validLocation,
      { invalid: 'data' },
      { ...validLocation, id: 'test-2' },
      null
    ]
    
    const result = validateParkingData(mixedData)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('test-1')
    expect(result[1].id).toBe('test-2')
  })

  it('should return empty array for all invalid data', () => {
    const invalidData = [{ invalid: 'data' }, null, undefined]
    const result = validateParkingData(invalidData)
    expect(result).toHaveLength(0)
  })
})

describe('getAvailabilityStatus', () => {
  it('should return "full" when no spaces available', () => {
    const location: ParkingLocation = {
      id: 'test',
      name: 'Test',
      address: 'Test',
      coordinates: { lat: 0, lng: 0 },
      capacity: { total: 100, available: 0 },
      rules: {},
      type: 'lot',
      lastUpdated: '2024-01-01T12:00:00Z'
    }
    expect(getAvailabilityStatus(location)).toBe('full')
  })

  it('should return "limited" when 20% or fewer spaces available', () => {
    const location: ParkingLocation = {
      id: 'test',
      name: 'Test',
      address: 'Test',
      coordinates: { lat: 0, lng: 0 },
      capacity: { total: 100, available: 20 },
      rules: {},
      type: 'lot',
      lastUpdated: '2024-01-01T12:00:00Z'
    }
    expect(getAvailabilityStatus(location)).toBe('limited')
  })

  it('should return "available" when more than 20% spaces available', () => {
    const location: ParkingLocation = {
      id: 'test',
      name: 'Test',
      address: 'Test',
      coordinates: { lat: 0, lng: 0 },
      capacity: { total: 100, available: 50 },
      rules: {},
      type: 'lot',
      lastUpdated: '2024-01-01T12:00:00Z'
    }
    expect(getAvailabilityStatus(location)).toBe('available')
  })
})

describe('isValidCoordinates', () => {
  it('should return true for valid coordinates', () => {
    expect(isValidCoordinates(40.7128, -74.0060)).toBe(true)
    expect(isValidCoordinates(0, 0)).toBe(true)
    expect(isValidCoordinates(90, 180)).toBe(true)
    expect(isValidCoordinates(-90, -180)).toBe(true)
  })

  it('should return false for invalid coordinates', () => {
    expect(isValidCoordinates(91, 0)).toBe(false)
    expect(isValidCoordinates(-91, 0)).toBe(false)
    expect(isValidCoordinates(0, 181)).toBe(false)
    expect(isValidCoordinates(0, -181)).toBe(false)
    expect(isValidCoordinates(NaN, 0)).toBe(false)
    expect(isValidCoordinates(0, NaN)).toBe(false)
  })
})

describe('sanitizeSearchInput', () => {
  it('should trim whitespace and convert to lowercase', () => {
    expect(sanitizeSearchInput('  Test Input  ')).toBe('test input')
  })

  it('should remove special characters', () => {
    expect(sanitizeSearchInput('Test@#$%Input!')).toBe('testinput')
  })

  it('should preserve alphanumeric characters and spaces', () => {
    expect(sanitizeSearchInput('Test 123 Input')).toBe('test 123 input')
  })
})

describe('validateParkingLocationFields', () => {
  const validLocation: ParkingLocation = {
    id: 'test-1',
    name: 'Test Parking',
    address: '123 Main St',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    capacity: { total: 100, available: 50 },
    rules: {},
    type: 'lot',
    lastUpdated: '2024-01-01T12:00:00Z'
  }

  it('should return empty array for valid location', () => {
    const errors = validateParkingLocationFields(validLocation)
    expect(errors).toHaveLength(0)
  })

  it('should return errors for missing required fields', () => {
    const invalidLocation = { ...validLocation }
    delete (invalidLocation as any).id
    delete (invalidLocation as any).name
    
    const errors = validateParkingLocationFields(invalidLocation)
    expect(errors).toContain('ID is required and must be a string')
    expect(errors).toContain('Name is required and must be a string')
  })

  it('should return error for invalid capacity', () => {
    const invalidLocation = {
      ...validLocation,
      capacity: { total: 100, available: 150 } // available > total
    }
    
    const errors = validateParkingLocationFields(invalidLocation)
    expect(errors).toContain('Valid capacity information is required')
  })

  it('should return error for invalid coordinates', () => {
    const invalidLocation = {
      ...validLocation,
      coordinates: { lat: 91, lng: 0 } // invalid latitude
    }
    
    const errors = validateParkingLocationFields(invalidLocation)
    expect(errors).toContain('Valid coordinates are required')
  })
})

describe('validateAppConfigFields', () => {
  const validConfig: AppConfig = {
    branding: {
      name: 'Test Town',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d'
    },
    map: {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 13
    },
    dataSource: {
      url: 'https://example.com/data.json',
      refreshInterval: 300000
    }
  }

  it('should return empty array for valid config', () => {
    const errors = validateAppConfigFields(validConfig)
    expect(errors).toHaveLength(0)
  })

  it('should return errors for missing branding fields', () => {
    const invalidConfig = {
      ...validConfig,
      branding: { ...validConfig.branding }
    }
    delete (invalidConfig.branding as any).name
    delete (invalidConfig.branding as any).primaryColor
    
    const errors = validateAppConfigFields(invalidConfig)
    expect(errors).toContain('Branding name is required')
    expect(errors).toContain('Primary color is required')
  })

  it('should return error for invalid zoom level', () => {
    const invalidConfig = {
      ...validConfig,
      map: { ...validConfig.map, zoom: 25 } // invalid zoom
    }
    
    const errors = validateAppConfigFields(invalidConfig)
    expect(errors).toContain('Valid map zoom level (1-20) is required')
  })

  it('should return error for invalid refresh interval', () => {
    const invalidConfig = {
      ...validConfig,
      dataSource: { ...validConfig.dataSource, refreshInterval: 500 } // too short
    }
    
    const errors = validateAppConfigFields(invalidConfig)
    expect(errors).toContain('Valid refresh interval (minimum 1000ms) is required')
  })
})