// Helper functions for parking-related operations

import type { ParkingLocation, AvailabilityStatus, SearchFilters } from '../types/index'
import { getAvailabilityStatus as getStatus } from './validation'

/**
 * Filter parking locations based on search criteria
 */
export const filterParkingLocations = (
  locations: ParkingLocation[],
  searchTerm: string,
  filters?: SearchFilters
): ParkingLocation[] => {
  let filtered = locations

  // Filter by search term (name, address)
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase()
    filtered = filtered.filter(location =>
      location.name.toLowerCase().includes(term) ||
      location.address.toLowerCase().includes(term)
    )
  }

  // Apply additional filters
  if (filters) {
    if (filters.type) {
      filtered = filtered.filter(location => location.type === filters.type)
    }

    if (filters.hasAvailableSpaces) {
      filtered = filtered.filter(location => location.capacity.available > 0)
    }

    if (filters.availabilityStatus) {
      filtered = filtered.filter(location => {
        const status = getStatus(location)
        return status === filters.availabilityStatus
      })
    }
  }

  return filtered
}

/**
 * Calculate availability status based on capacity
 * Re-export from validation module for convenience
 */
export const getAvailabilityStatus = getStatus

/**
 * Sort parking locations by availability (most available first)
 */
export const sortByAvailability = (locations: ParkingLocation[]): ParkingLocation[] => {
  return [...locations].sort((a, b) => {
    const aRatio = a.capacity.available / a.capacity.total
    const bRatio = b.capacity.available / b.capacity.total
    return bRatio - aRatio
  })
}

/**
 * Sort parking locations by distance from a point (requires coordinates)
 */
export const sortByDistance = (
  locations: ParkingLocation[],
  centerLat: number,
  centerLng: number
): ParkingLocation[] => {
  return [...locations].sort((a, b) => {
    const distanceA = calculateDistance(centerLat, centerLng, a.coordinates.lat, a.coordinates.lng)
    const distanceB = calculateDistance(centerLat, centerLng, b.coordinates.lat, b.coordinates.lng)
    return distanceA - distanceB
  })
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180)
}

/**
 * Format parking rules for display
 */
export const formatParkingRules = (location: ParkingLocation): string[] => {
  const rules: string[] = []
  
  if (location.rules.timeLimit) {
    rules.push(`Time limit: ${location.rules.timeLimit}`)
  }
  
  if (location.rules.cost) {
    rules.push(`Cost: ${location.rules.cost}`)
  }
  
  if (location.rules.hours) {
    rules.push(`Hours: ${location.rules.hours}`)
  }
  
  if (location.rules.restrictions) {
    rules.push(...location.rules.restrictions)
  }
  
  return rules
}

/**
 * Generate directions URL for native map apps
 */
export const generateDirectionsUrl = (location: ParkingLocation): string => {
  const { lat, lng } = location.coordinates
  const destination = encodeURIComponent(`${location.name}, ${location.address}`)
  
  // Universal URL that works on both iOS and Android
  return `https://maps.google.com/maps?daddr=${lat},${lng}&q=${destination}`
}

/**
 * Check if parking location data is stale
 */
export const isDataStale = (location: ParkingLocation, maxAgeMinutes: number = 10): boolean => {
  const lastUpdated = new Date(location.lastUpdated)
  const now = new Date()
  const ageMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60)
  
  return ageMinutes > maxAgeMinutes
}

/**
 * Get color for availability status
 */
export const getAvailabilityColor = (status: AvailabilityStatus): string => {
  switch (status) {
    case 'available':
      return '#28a745' // Green
    case 'limited':
      return '#ffc107' // Yellow
    case 'full':
      return '#dc3545' // Red
    case 'unknown':
    default:
      return '#6c757d' // Gray
  }
}