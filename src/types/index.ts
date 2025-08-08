// Core data interfaces for the Parking Finder application

export interface ParkingLocation {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  capacity: {
    total: number;
    available: number;
    reserved?: number;
  };
  rules: {
    timeLimit?: string;
    cost?: string;
    restrictions?: string[];
    hours?: string;
  };
  type: 'street' | 'lot' | 'structure' | 'garage';
  lastUpdated: string;
}

export interface AppConfig {
  branding: {
    name: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundImage?: string;
    customCSS?: string;
  };
  map: {
    center: {
      lat: number;
      lng: number;
    };
    zoom: number;
  };
  dataSource: {
    url: string;
    refreshInterval: number; // milliseconds
  };
}

// Performance settings interface
export interface PerformanceSettings {
  reduceAnimations: boolean;
  limitMapTiles: boolean;
  reduceImageQuality: boolean;
  enableDataSaver: boolean;
}

// Component prop interfaces
export interface MapViewProps {
  parkingData: ParkingLocation[];
  selectedLocation: ParkingLocation | null;
  searchResults: ParkingLocation[];
  onLocationSelect: (location: ParkingLocation) => void;
  performanceSettings?: PerformanceSettings;
}

export interface InfoPanelProps {
  selectedLocation: ParkingLocation | null;
  onDirectionsClick: (location: ParkingLocation) => void;
  onClose?: () => void;
}

export interface SearchBarProps {
  parkingData: ParkingLocation[];
  onSearchResults: (results: ParkingLocation[]) => void;
  onClearSearch: () => void;
}

export interface ParkingMarkerProps {
  location: ParkingLocation;
  isSelected: boolean;
  onClick: (location: ParkingLocation) => void;
}

// Utility types
export type ParkingType = ParkingLocation['type'];
export type AvailabilityStatus = 'available' | 'limited' | 'full' | 'unknown';

// Search and filter types
export interface SearchFilters {
  type?: ParkingType;
  availabilityStatus?: AvailabilityStatus;
  hasAvailableSpaces?: boolean;
}

// API response types
export interface ParkingDataResponse {
  locations: ParkingLocation[];
  lastUpdated: string;
  version: string;
}

export interface ConfigResponse {
  config: AppConfig;
  version: string;
}