import { describe, it, expect } from 'vitest'
import {
  filterParkingLocations,
  getAvailabilityStatus,
  sortByAvailability,
  sortByDistance,
  calculateDistance,
  formatParkingRules,
  generateDirectionsUrl,
  isDataStale,
  getAvailabilityColor
} from './parkingHelpers'
import type { ParkingLocation, SearchFilters } from '../types/index'

const mockLocations: ParkingLocation[] = [
  {
    id: 'lot-1',
    name: 'Main Street Parking',
    address: '123 Main Street',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    capacity: { total: 100, available: 80 },
    rules: { timeLimit: '2 hours', cost: 'Free' },
    type: 'lot',
    lastUpdated: '2024-01-01T12:00:00Z'
  },
  {
    id: 'garage-1',
    name: 'City Center Garage',
    address: '456 Center Ave',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    capacity: { total: 200, available: 10 },
    rules: { cost: '$5/hour', hours: '24/7' },
    type: 'garage',
    lastUpdated: '2024-01-01T12:05:00Z'
  },
  {
    id: 'street-1',
    name: 'Oak Street Parking',
    address: '789 Oak Street',
    coordinates: { lat: 40.7505, lng: -73.9934 },
    capacity: { total: 50, available: 0 },
    rules: { timeLimit: '1 hour', restrictions: ['No parking 2-4 AM'] },
    type: 'street',
    lastUpdated: '2024-01-01T11:55:00Z'
  }
]

describe('filterParkingLocations', () => {
  it('should filter by search term in name', () => {
    const result = filterParkingLocations(mockLocations, 'Main')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('lot-1')
  })

  it('should filter by search term in address', () => {
    const result = filterParkingLocations(mockLocations, 'Center Ave')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('garage-1')
  })

  it('should filter by parking type', () => {
    const filters: SearchFilters = { type: 'garage' }
    const result = filterParkingLocations(mockLocations, '', filters)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('garage')
  })

  it('should filter by available spaces', () => {
    const filters: SearchFilters = { hasAvailableSpaces: true }
    const result = filterParkingLocations(mockLocations, '', filters)
    expect(result).toHaveLength(2)
    expect(result.every(loc => loc.capacity.available > 0)).toBe(true)
  })

  it('should filter by availability status', () => {
    const filters: SearchFilters = { availabilityStatus: 'full' }
    const result = filterParkingLocations(mockLocations, '', filters)
    expect(result).toHaveLength(1)
    expect(result[0].capacity.available).toBe(0)
  })

  it('should combine multiple filters', () => {
    const filters: SearchFilters = { 
      type: 'lot',
      hasAvailableSpaces: true 
    }
    const result = filterParkingLocations(mockLocations, 'Main', filters)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('lot-1')
  })
})

describe('getAvailabilityStatus', () => {
  it('should return "available" for high availability', () => {
    const location = mockLocations[0] // 80/100 = 80%
    expect(getAvailabilityStatus(location)).toBe('available')
  })

  it('should return "limited" for low availability', () => {
    const location = mockLocations[1] // 10/200 = 5%
    expect(getAvailabilityStatus(location)).toBe('limited')
  })

  it('should return "full" for no availability', () => {
    const location = mockLocations[2] // 0/50 = 0%
    expect(getAvailabilityStatus(location)).toBe('full')
  })
})

describe('sortByAvailability', () => {
  it('should sort locations by availability ratio (highest first)', () => {
    const sorted = sortByAvailability(mockLocations)
    
    // lot-1: 80/100 = 80%
    // garage-1: 10/200 = 5%  
    // street-1: 0/50 = 0%
    expect(sorted[0].id).toBe('lot-1')
    expect(sorted[1].id).toBe('garage-1')
    expect(sorted[2].id).toBe('street-1')
  })

  it('should not mutate original array', () => {
    const original = [...mockLocations]
    sortByAvailability(mockLocations)
    expect(mockLocations).toEqual(original)
  })
})

describe('sortByDistance', () => {
  it('should sort locations by distance from center point', () => {
    // Using NYC coordinates as center
    const centerLat = 40.7128
    const centerLng = -74.0060
    
    const sorted = sortByDistance(mockLocations, centerLat, centerLng)
    
    // lot-1 should be closest (same coordinates as center)
    expect(sorted[0].id).toBe('lot-1')
  })

  it('should not mutate original array', () => {
    const original = [...mockLocations]
    sortByDistance(mockLocations, 40.7128, -74.0060)
    expect(mockLocations).toEqual(original)
  })
})

describe('calculateDistance', () => {
  it('should return 0 for same coordinates', () => {
    const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060)
    expect(distance).toBe(0)
  })

  it('should calculate reasonable distance between NYC points', () => {
    // Distance between two points in NYC should be reasonable
    const distance = calculateDistance(40.7128, -74.0060, 40.7589, -73.9851)
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(10) // Should be less than 10km within NYC
  })
})

describe('formatParkingRules', () => {
  it('should format all available rules', () => {
    const location: ParkingLocation = {
      ...mockLocations[0],
      rules: {
        timeLimit: '2 hours',
        cost: '$5/hour',
        hours: '9 AM - 6 PM',
        restrictions: ['No overnight parking', 'Permit required']
      }
    }

    const rules = formatParkingRules(location)
    expect(rules).toContain('Time limit: 2 hours')
    expect(rules).toContain('Cost: $5/hour')
    expect(rules).toContain('Hours: 9 AM - 6 PM')
    expect(rules).toContain('No overnight parking')
    expect(rules).toContain('Permit required')
  })

  it('should handle empty rules', () => {
    const location: ParkingLocation = {
      ...mockLocations[0],
      rules: {}
    }

    const rules = formatParkingRules(location)
    expect(rules).toHaveLength(0)
  })

  it('should handle partial rules', () => {
    const location: ParkingLocation = {
      ...mockLocations[0],
      rules: { timeLimit: '1 hour' }
    }

    const rules = formatParkingRules(location)
    expect(rules).toHaveLength(1)
    expect(rules[0]).toBe('Time limit: 1 hour')
  })
})

describe('generateDirectionsUrl', () => {
  it('should generate valid Google Maps URL', () => {
    const url = generateDirectionsUrl(mockLocations[0])
    
    expect(url).toContain('https://maps.google.com/maps')
    expect(url).toContain('daddr=40.7128,-74.006') // Note: -74.0060 gets truncated to -74.006
    expect(url).toContain(encodeURIComponent('Main Street Parking'))
    expect(url).toContain(encodeURIComponent('123 Main Street'))
  })
})

describe('isDataStale', () => {
  it('should return false for recent data', () => {
    const recentLocation: ParkingLocation = {
      ...mockLocations[0],
      lastUpdated: new Date().toISOString()
    }

    expect(isDataStale(recentLocation, 10)).toBe(false)
  })

  it('should return true for old data', () => {
    const oldDate = new Date()
    oldDate.setMinutes(oldDate.getMinutes() - 15) // 15 minutes ago
    
    const staleLocation: ParkingLocation = {
      ...mockLocations[0],
      lastUpdated: oldDate.toISOString()
    }

    expect(isDataStale(staleLocation, 10)).toBe(true)
  })

  it('should use default max age of 10 minutes', () => {
    const oldDate = new Date()
    oldDate.setMinutes(oldDate.getMinutes() - 15) // 15 minutes ago
    
    const staleLocation: ParkingLocation = {
      ...mockLocations[0],
      lastUpdated: oldDate.toISOString()
    }

    expect(isDataStale(staleLocation)).toBe(true)
  })
})

describe('getAvailabilityColor', () => {
  it('should return correct colors for each status', () => {
    expect(getAvailabilityColor('available')).toBe('#28a745')
    expect(getAvailabilityColor('limited')).toBe('#ffc107')
    expect(getAvailabilityColor('full')).toBe('#dc3545')
    expect(getAvailabilityColor('unknown')).toBe('#6c757d')
  })

  it('should return gray for invalid status', () => {
    expect(getAvailabilityColor('invalid' as any)).toBe('#6c757d')
  })
})