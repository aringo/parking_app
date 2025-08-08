import { describe, it, expect } from 'vitest'
import type { 
  ParkingLocation, 
  AppConfig, 
  ParkingType, 
  AvailabilityStatus,
  SearchFilters,
  ParkingDataResponse,
  ConfigResponse,
  MapViewProps,
  InfoPanelProps,
  SearchBarProps,
  ParkingMarkerProps
} from './index'

describe('Type Definitions', () => {
  describe('ParkingLocation', () => {
    it('should accept valid parking location object', () => {
      const location: ParkingLocation = {
        id: 'test-1',
        name: 'Test Parking Lot',
        address: '123 Main Street, Test City',
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        },
        capacity: {
          total: 100,
          available: 75,
          reserved: 10
        },
        rules: {
          timeLimit: '2 hours',
          cost: '$2/hour',
          restrictions: ['No overnight parking', 'Permit required after 6pm'],
          hours: '6am - 10pm'
        },
        type: 'lot',
        lastUpdated: '2024-01-01T12:00:00Z'
      }

      // Type assertion to ensure it compiles
      expect(location.id).toBe('test-1')
      expect(location.type).toBe('lot')
      expect(location.capacity.total).toBe(100)
    })

    it('should accept minimal parking location object', () => {
      const location: ParkingLocation = {
        id: 'test-2',
        name: 'Minimal Parking',
        address: '456 Side Street',
        coordinates: { lat: 0, lng: 0 },
        capacity: { total: 50, available: 25 },
        rules: {},
        type: 'street',
        lastUpdated: '2024-01-01T12:00:00Z'
      }

      expect(location.rules).toEqual({})
      expect(location.capacity.reserved).toBeUndefined()
    })
  })

  describe('AppConfig', () => {
    it('should accept valid app config object', () => {
      const config: AppConfig = {
        branding: {
          name: 'Test Town Parking',
          logo: 'https://example.com/logo.png',
          primaryColor: '#007bff',
          secondaryColor: '#6c757d',
          backgroundImage: 'https://example.com/bg.jpg',
          customCSS: '.custom { color: red; }'
        },
        map: {
          center: { lat: 40.7128, lng: -74.0060 },
          zoom: 13
        },
        dataSource: {
          url: 'https://example.com/parking-data.json',
          refreshInterval: 300000
        }
      }

      expect(config.branding.name).toBe('Test Town Parking')
      expect(config.map.zoom).toBe(13)
      expect(config.dataSource.refreshInterval).toBe(300000)
    })

    it('should accept minimal app config object', () => {
      const config: AppConfig = {
        branding: {
          name: 'Minimal Town',
          primaryColor: '#000000',
          secondaryColor: '#ffffff'
        },
        map: {
          center: { lat: 0, lng: 0 },
          zoom: 10
        },
        dataSource: {
          url: 'https://example.com/data.json',
          refreshInterval: 60000
        }
      }

      expect(config.branding.logo).toBeUndefined()
      expect(config.branding.backgroundImage).toBeUndefined()
    })
  })

  describe('Utility Types', () => {
    it('should accept valid parking types', () => {
      const types: ParkingType[] = ['street', 'lot', 'structure', 'garage']
      
      types.forEach(type => {
        const location: Partial<ParkingLocation> = { type }
        expect(['street', 'lot', 'structure', 'garage']).toContain(location.type)
      })
    })

    it('should accept valid availability statuses', () => {
      const statuses: AvailabilityStatus[] = ['available', 'limited', 'full', 'unknown']
      
      statuses.forEach(status => {
        expect(['available', 'limited', 'full', 'unknown']).toContain(status)
      })
    })
  })

  describe('SearchFilters', () => {
    it('should accept valid search filters', () => {
      const filters: SearchFilters = {
        type: 'lot',
        availabilityStatus: 'available',
        hasAvailableSpaces: true
      }

      expect(filters.type).toBe('lot')
      expect(filters.availabilityStatus).toBe('available')
      expect(filters.hasAvailableSpaces).toBe(true)
    })

    it('should accept partial search filters', () => {
      const filters: SearchFilters = {
        type: 'garage'
      }

      expect(filters.type).toBe('garage')
      expect(filters.availabilityStatus).toBeUndefined()
    })
  })

  describe('API Response Types', () => {
    it('should accept valid parking data response', () => {
      const response: ParkingDataResponse = {
        locations: [
          {
            id: 'test-1',
            name: 'Test Parking',
            address: '123 Main St',
            coordinates: { lat: 0, lng: 0 },
            capacity: { total: 100, available: 50 },
            rules: {},
            type: 'lot',
            lastUpdated: '2024-01-01T12:00:00Z'
          }
        ],
        lastUpdated: '2024-01-01T12:00:00Z',
        version: '1.0.0'
      }

      expect(response.locations).toHaveLength(1)
      expect(response.version).toBe('1.0.0')
    })

    it('should accept valid config response', () => {
      const response: ConfigResponse = {
        config: {
          branding: {
            name: 'Test Town',
            primaryColor: '#007bff',
            secondaryColor: '#6c757d'
          },
          map: {
            center: { lat: 0, lng: 0 },
            zoom: 13
          },
          dataSource: {
            url: 'https://example.com/data.json',
            refreshInterval: 300000
          }
        },
        version: '1.0.0'
      }

      expect(response.config.branding.name).toBe('Test Town')
      expect(response.version).toBe('1.0.0')
    })
  })

  describe('Component Props Types', () => {
    it('should accept valid MapViewProps', () => {
      const mockLocation: ParkingLocation = {
        id: 'test-1',
        name: 'Test',
        address: 'Test Address',
        coordinates: { lat: 0, lng: 0 },
        capacity: { total: 100, available: 50 },
        rules: {},
        type: 'lot',
        lastUpdated: '2024-01-01T12:00:00Z'
      }

      const props: MapViewProps = {
        parkingData: [mockLocation],
        selectedLocation: mockLocation,
        searchResults: [mockLocation],
        onLocationSelect: (location: ParkingLocation) => {
          expect(location.id).toBe('test-1')
        }
      }

      expect(props.parkingData).toHaveLength(1)
      expect(props.selectedLocation?.id).toBe('test-1')
    })

    it('should accept valid InfoPanelProps', () => {
      const mockLocation: ParkingLocation = {
        id: 'test-1',
        name: 'Test',
        address: 'Test Address',
        coordinates: { lat: 0, lng: 0 },
        capacity: { total: 100, available: 50 },
        rules: {},
        type: 'lot',
        lastUpdated: '2024-01-01T12:00:00Z'
      }

      const props: InfoPanelProps = {
        selectedLocation: mockLocation,
        onDirectionsClick: (location: ParkingLocation) => {
          expect(location.id).toBe('test-1')
        }
      }

      expect(props.selectedLocation?.id).toBe('test-1')
    })

    it('should accept valid SearchBarProps', () => {
      const mockLocation: ParkingLocation = {
        id: 'test-1',
        name: 'Test',
        address: 'Test Address',
        coordinates: { lat: 0, lng: 0 },
        capacity: { total: 100, available: 50 },
        rules: {},
        type: 'lot',
        lastUpdated: '2024-01-01T12:00:00Z'
      }

      const props: SearchBarProps = {
        parkingData: [mockLocation],
        onSearchResults: (results: ParkingLocation[]) => {
          expect(Array.isArray(results)).toBe(true)
        },
        onClearSearch: () => {
          // Clear search callback
        }
      }

      expect(props.parkingData).toHaveLength(1)
    })

    it('should accept valid ParkingMarkerProps', () => {
      const mockLocation: ParkingLocation = {
        id: 'test-1',
        name: 'Test',
        address: 'Test Address',
        coordinates: { lat: 0, lng: 0 },
        capacity: { total: 100, available: 50 },
        rules: {},
        type: 'lot',
        lastUpdated: '2024-01-01T12:00:00Z'
      }

      const props: ParkingMarkerProps = {
        location: mockLocation,
        isSelected: true,
        onClick: (location: ParkingLocation) => {
          expect(location.id).toBe('test-1')
        }
      }

      expect(props.location.id).toBe('test-1')
      expect(props.isSelected).toBe(true)
    })
  })
})