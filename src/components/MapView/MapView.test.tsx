import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MapView from './MapView';
import type { ParkingLocation } from '../../types';

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, center, zoom, className, zoomControl, scrollWheelZoom, ...props }: any) => (
    <div 
      data-testid="map-container" 
      data-center={Array.isArray(center) ? center.join(',') : center}
      data-zoom={zoom}
      data-zoom-control={zoomControl}
      data-scroll-wheel-zoom={scrollWheelZoom}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  TileLayer: ({ attribution, url, ...props }: any) => (
    <div 
      data-testid="tile-layer" 
      data-attribution={attribution}
      data-url={url}
      {...props} 
    />
  ),
}));

// Mock leaflet configuration
vi.mock('./leafletConfig', () => ({}));

describe('MapView Component', () => {
  const mockParkingData: ParkingLocation[] = [
    {
      id: '1',
      name: 'Main Street Parking',
      address: '123 Main St',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      capacity: { total: 50, available: 25 },
      rules: { timeLimit: '2 hours', cost: 'Free' },
      type: 'street',
      lastUpdated: '2024-01-01T12:00:00Z',
    },
    {
      id: '2',
      name: 'City Hall Lot',
      address: '456 Government Ave',
      coordinates: { lat: 37.7849, lng: -122.4094 },
      capacity: { total: 100, available: 75 },
      rules: { timeLimit: '4 hours', cost: '$2/hour' },
      type: 'lot',
      lastUpdated: '2024-01-01T12:00:00Z',
    },
  ];

  const mockProps = {
    parkingData: mockParkingData,
    selectedLocation: null,
    searchResults: [],
    onLocationSelect: vi.fn(),
  };

  it('renders the map container', () => {
    render(<MapView {...mockProps} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('renders the tile layer with correct attribution', () => {
    render(<MapView {...mockProps} />);
    
    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toBeInTheDocument();
    // Check that attribution contains the expected content (HTML entities may be decoded)
    const attribution = tileLayer.getAttribute('data-attribution');
    expect(attribution).toContain('OpenStreetMap');
    expect(attribution).toContain('contributors');
    expect(attribution).toContain('https://www.openstreetmap.org/copyright');
  });

  it('renders the tile layer with correct OpenStreetMap URL', () => {
    render(<MapView {...mockProps} />);
    
    const tileLayer = screen.getByTestId('tile-layer');
    expect(tileLayer).toHaveAttribute(
      'data-url',
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    );
  });

  it('sets default center coordinates', () => {
    render(<MapView {...mockProps} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-center', '37.7749,-122.4194');
  });

  it('sets default zoom level', () => {
    render(<MapView {...mockProps} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-zoom', '13');
  });

  it('enables zoom control', () => {
    render(<MapView {...mockProps} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-zoom-control', 'true');
  });

  it('enables scroll wheel zoom', () => {
    render(<MapView {...mockProps} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveAttribute('data-scroll-wheel-zoom', 'true');
  });

  it('applies the correct CSS class to map container', () => {
    render(<MapView {...mockProps} />);
    
    const mapContainer = screen.getByTestId('map-container');
    // CSS Modules transforms class names, so we check if it contains the expected pattern
    expect(mapContainer.className).toMatch(/map/);
  });

  it('renders with empty parking data', () => {
    const emptyProps = {
      ...mockProps,
      parkingData: [],
    };
    
    render(<MapView {...emptyProps} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('renders with selected location', () => {
    const propsWithSelection = {
      ...mockProps,
      selectedLocation: mockParkingData[0],
    };
    
    render(<MapView {...propsWithSelection} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('renders with search results', () => {
    const propsWithSearch = {
      ...mockProps,
      searchResults: [mockParkingData[0]],
    };
    
    render(<MapView {...propsWithSearch} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('has proper responsive container structure', () => {
    const { container } = render(<MapView {...mockProps} />);
    
    const mapWrapper = container.firstChild as HTMLElement;
    // CSS Modules transforms class names, so we check if it contains the expected pattern
    expect(mapWrapper.className).toMatch(/mapContainer/);
  });
});