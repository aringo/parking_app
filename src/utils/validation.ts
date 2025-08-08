// Utility functions for data validation and type guards

import type { ParkingLocation, AppConfig, AvailabilityStatus } from '../types/index'

// Type guard for ParkingLocation
export const isParkingLocation = (obj: any): obj is ParkingLocation => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.name === 'string' &&
        typeof obj.address === 'string' &&
        typeof obj.coordinates === 'object' &&
        typeof obj.coordinates.lat === 'number' &&
        typeof obj.coordinates.lng === 'number' &&
        typeof obj.capacity === 'object' &&
        typeof obj.capacity.total === 'number' &&
        typeof obj.capacity.available === 'number' &&
        typeof obj.rules === 'object' &&
        ['street', 'lot', 'structure', 'garage'].includes(obj.type) &&
        typeof obj.lastUpdated === 'string'
    )
}

// Type guard for AppConfig
export const isAppConfig = (obj: any): obj is AppConfig => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.branding === 'object' &&
        typeof obj.branding.name === 'string' &&
        typeof obj.branding.primaryColor === 'string' &&
        typeof obj.branding.secondaryColor === 'string' &&
        typeof obj.map === 'object' &&
        typeof obj.map.center === 'object' &&
        typeof obj.map.center.lat === 'number' &&
        typeof obj.map.center.lng === 'number' &&
        typeof obj.map.zoom === 'number' &&
        typeof obj.dataSource === 'object' &&
        typeof obj.dataSource.url === 'string' &&
        typeof obj.dataSource.refreshInterval === 'number'
    )
}

// Validate array of parking locations
export const validateParkingData = (data: any[]): ParkingLocation[] => {
    return data.filter(isParkingLocation)
}

// Calculate availability status based on capacity
export const getAvailabilityStatus = (location: ParkingLocation): AvailabilityStatus => {
    const { total, available } = location.capacity

    if (available === 0) return 'full'
    if (available / total <= 0.2) return 'limited'
    if (available > 0) return 'available'
    return 'unknown'
}

// Validate coordinates
export const isValidCoordinates = (lat: number, lng: number): boolean => {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    )
}

// Sanitize search input
export const sanitizeSearchInput = (input: string): string => {
    return input.trim().toLowerCase().replace(/[^\w\s]/gi, '')
}

// Validate parking data response
export const isParkingDataResponse = (obj: any): obj is import('../types/index').ParkingDataResponse => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        Array.isArray(obj.locations) &&
        typeof obj.lastUpdated === 'string' &&
        typeof obj.version === 'string'
    )
}

// Validate config response
export const isConfigResponse = (obj: any): obj is import('../types/index').ConfigResponse => {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        isAppConfig(obj.config) &&
        typeof obj.version === 'string'
    )
}

// Validate individual parking location fields
export const validateParkingLocationFields = (location: Partial<ParkingLocation>): string[] => {
    const errors: string[] = []

    if (!location.id || typeof location.id !== 'string') {
        errors.push('ID is required and must be a string')
    }

    if (!location.name || typeof location.name !== 'string') {
        errors.push('Name is required and must be a string')
    }

    if (!location.address || typeof location.address !== 'string') {
        errors.push('Address is required and must be a string')
    }

    if (!location.coordinates || 
        !isValidCoordinates(location.coordinates.lat, location.coordinates.lng)) {
        errors.push('Valid coordinates are required')
    }

    if (!location.capacity || 
        typeof location.capacity.total !== 'number' || 
        typeof location.capacity.available !== 'number' ||
        location.capacity.total < 0 ||
        location.capacity.available < 0 ||
        location.capacity.available > location.capacity.total) {
        errors.push('Valid capacity information is required')
    }

    if (!location.type || !['street', 'lot', 'structure', 'garage'].includes(location.type)) {
        errors.push('Valid parking type is required')
    }

    if (!location.lastUpdated || typeof location.lastUpdated !== 'string') {
        errors.push('Last updated timestamp is required')
    }

    return errors
}

// Validate app config fields
export const validateAppConfigFields = (config: Partial<AppConfig>): string[] => {
    const errors: string[] = []

    if (!config.branding?.name || typeof config.branding.name !== 'string') {
        errors.push('Branding name is required')
    }

    if (!config.branding?.primaryColor || typeof config.branding.primaryColor !== 'string') {
        errors.push('Primary color is required')
    }

    if (!config.branding?.secondaryColor || typeof config.branding.secondaryColor !== 'string') {
        errors.push('Secondary color is required')
    }

    if (!config.map?.center || 
        !isValidCoordinates(config.map.center.lat, config.map.center.lng)) {
        errors.push('Valid map center coordinates are required')
    }

    if (!config.map?.zoom || typeof config.map.zoom !== 'number' || 
        config.map.zoom < 1 || config.map.zoom > 20) {
        errors.push('Valid map zoom level (1-20) is required')
    }

    if (!config.dataSource?.url || typeof config.dataSource.url !== 'string') {
        errors.push('Data source URL is required')
    }

    if (!config.dataSource?.refreshInterval || 
        typeof config.dataSource.refreshInterval !== 'number' ||
        config.dataSource.refreshInterval < 1000) {
        errors.push('Valid refresh interval (minimum 1000ms) is required')
    }

    return errors
}