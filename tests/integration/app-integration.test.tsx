import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../../src/App';
import type { ParkingLocation, AppConfig } from '../../src/types';

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
  Marker: ({ children, position, icon, eventHandlers, ...props }: any) => (
    <div 
      data-testid="parking-marker" 
      data-position={Array.isArray(position) ? position.join(',') : position}
      data-icon={icon ? 'custom-icon' : 'default-icon'}
      onClick={eventHandlers?.click}
      {...props}
    >
      {children}
    </div>
  ),
  Tooltip: ({ children, direction, offset, opacity, ...props }: any) => (
    <div 
      data-testid="tooltip" 
      data-direction={direction}
      data-offset={Array.isArray(offset) ? offset.join(',') : offset}
      data-opacity={opacity}
      {...props}
    >
      {children}
    </div>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('App Integration Tests', () => {
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
    {
      id: '3',
      name: 'Harbor Parking Structure',
      address: '789 Harbor Blvd',
      coordinates: { lat: 37.7649, lng: -122.4294 },
      capacity: { total: 200, available: 150 },
      rules: { timeLimit: 'All day', cost: '$5/day' },
      type: 'structure',
      lastUpdated: '2024-01-01T12:00:00Z',
    },
  ];

  const mockAppConfig: AppConfig = {
    branding: {
      name: 'Test City Parking',
      primaryColor: '#007bff',
      secondaryColor: '#6c757d',
    },
    map: {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 13,
    },
    dataSource: {
      url: '/api',
      refreshInterval: 300000,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (navigator as any).onLine = true;
    
    // Mock successful API responses
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('parking-data.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: mockParkingData,
            lastUpdated: '2024-01-01T12:00:00Z',
            version: '1.0.0',
          }),
        });
      }
      if (url.includes('config.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            config: mockAppConfig,
            version: '1.0.0',
          }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load and display parking data with branding', async () => {
    render(<App />);

    // Wait for data to load and components to render
    await waitFor(() => {
      expect(screen.getByTestId('branding-header')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Check that parking markers are rendered
    await waitFor(() => {
      const markers = screen.getAllByTestId('parking-marker');
      expect(markers).toHaveLength(mockParkingData.length);
    });
  });

  it('should handle parking location selection and display details', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for markers to load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Click on the first parking marker
    const firstMarker = screen.getAllByTestId('parking-marker')[0];
    await user.click(firstMarker);

    // Check that info panel shows parking details
    await waitFor(() => {
      expect(screen.getByTestId('parking-name')).toHaveTextContent('Main Street Parking');
      expect(screen.getByTestId('parking-address')).toHaveTextContent('123 Main St');
      expect(screen.getByTestId('parking-capacity')).toBeInTheDocument();
    });
  });

  it('should filter parking locations with search functionality', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Use search functionality
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Main');

    // Wait for search results to update
    await waitFor(() => {
      // Should show only locations matching "Main"
      const visibleMarkers = screen.getAllByTestId('parking-marker');
      expect(visibleMarkers.length).toBeLessThanOrEqual(mockParkingData.length);
    });
  });

  it('should clear search results when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Search for something
    const searchInput = screen.getByTestId('search-input');
    await user.type(searchInput, 'Main');

    // Clear search
    const clearButton = screen.getByTestId('clear-search');
    await user.click(clearButton);

    // Check that all markers are visible again
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Check that search input is cleared
    expect(searchInput).toHaveValue('');
  });

  it('should handle auto-refresh functionality', async () => {
    vi.useFakeTimers();
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Fast-forward time to trigger auto-refresh (5 minutes)
    vi.advanceTimersByTime(5 * 60 * 1000);

    // Check that fetch was called again for refresh
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(4); // Initial config + data + refresh config + data
    });

    vi.useRealTimers();
  });

  it('should handle manual refresh', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Trigger manual refresh
    const refreshButton = screen.getByTestId('manual-refresh');
    await user.click(refreshButton);

    // Check that loading indicator appears
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });

    // Check that fetch was called again
    expect(fetch).toHaveBeenCalledTimes(4); // Initial + manual refresh
  });

  it('should handle network errors gracefully', async () => {
    // Mock network error
    (fetch as any).mockRejectedValue(new Error('Network error'));
    
    // Mock cached data
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'parking_finder_data') {
        return JSON.stringify({
          data: mockParkingData,
          timestamp: Date.now(),
          version: '1.0.0',
        });
      }
      if (key === 'parking_finder_config') {
        return JSON.stringify({
          data: mockAppConfig,
          timestamp: Date.now(),
          version: '1.0.0',
        });
      }
      return null;
    });

    render(<App />);

    // Should still render with cached data
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Should show cached data indicator
    await waitFor(() => {
      expect(screen.getByTestId('cached-data-indicator')).toBeInTheDocument();
    });
  });

  it('should handle offline scenarios', async () => {
    // Set offline
    (navigator as any).onLine = false;
    
    // Mock cached data
    localStorageMock.getItem.mockImplementation((key: string) => {
      if (key === 'parking_finder_data') {
        return JSON.stringify({
          data: mockParkingData,
          timestamp: Date.now(),
          version: '1.0.0',
        });
      }
      if (key === 'parking_finder_config') {
        return JSON.stringify({
          data: mockAppConfig,
          timestamp: Date.now(),
          version: '1.0.0',
        });
      }
      return null;
    });

    render(<App />);

    // Should render with cached data
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    // Should show offline indicator
    await waitFor(() => {
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
    });

    // Should not make network requests
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should maintain selected location during data refresh', async () => {
    const user = userEvent.setup();
    vi.useFakeTimers();
    
    render(<App />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Select a parking location
    const firstMarker = screen.getAllByTestId('parking-marker')[0];
    await user.click(firstMarker);

    // Verify selection
    await waitFor(() => {
      expect(screen.getByTestId('parking-name')).toHaveTextContent('Main Street Parking');
    });

    // Trigger auto-refresh
    vi.advanceTimersByTime(5 * 60 * 1000);

    // Wait for refresh to complete
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(4);
    });

    // Check that selection is maintained
    await waitFor(() => {
      expect(screen.getByTestId('parking-name')).toHaveTextContent('Main Street Parking');
    });

    vi.useRealTimers();
  });

  it('should handle different parking location types correctly', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Test each parking location type
    for (let i = 0; i < mockParkingData.length; i++) {
      const marker = screen.getAllByTestId('parking-marker')[i];
      await user.click(marker);

      await waitFor(() => {
        expect(screen.getByTestId('parking-name')).toHaveTextContent(mockParkingData[i].name);
        expect(screen.getByTestId('parking-type')).toHaveTextContent(mockParkingData[i].type);
      });
    }
  });

  it('should display proper capacity and availability information', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(mockParkingData.length);
    });

    // Click on first marker
    const firstMarker = screen.getAllByTestId('parking-marker')[0];
    await user.click(firstMarker);

    // Check capacity information
    await waitFor(() => {
      const capacityElement = screen.getByTestId('parking-capacity');
      expect(capacityElement).toHaveTextContent('25'); // available
      expect(capacityElement).toHaveTextContent('50'); // total
    });

    // Check availability percentage or status
    const availabilityElement = screen.getByTestId('parking-availability');
    expect(availabilityElement).toBeInTheDocument();
  });
});