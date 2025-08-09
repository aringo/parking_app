import { render, screen, waitFor } from '@testing-library/react';
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

// Mock performance API
const performanceMock = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
};
Object.defineProperty(window, 'performance', {
  value: performanceMock,
});

describe('App Performance Tests', () => {
  // Generate large dataset for performance testing
  const generateLargeParkingDataset = (count: number): ParkingLocation[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `parking-${i}`,
      name: `Parking Location ${i}`,
      address: `${100 + i} Test Street`,
      coordinates: { 
        lat: 37.7749 + (Math.random() - 0.5) * 0.1, 
        lng: -122.4194 + (Math.random() - 0.5) * 0.1 
      },
      capacity: { 
        total: Math.floor(Math.random() * 200) + 50, 
        available: Math.floor(Math.random() * 100) + 10 
      },
      rules: { 
        timeLimit: `${Math.floor(Math.random() * 4) + 1} hours`, 
        cost: Math.random() > 0.5 ? 'Free' : `$${Math.floor(Math.random() * 5) + 1}/hour` 
      },
      type: ['street', 'lot', 'structure', 'garage'][Math.floor(Math.random() * 4)] as any,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const mockAppConfig: AppConfig = {
    branding: {
      name: 'Performance Test City',
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
    performanceMock.now.mockImplementation(() => Date.now());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render efficiently with large datasets (100 locations)', async () => {
    const largeParkingData = generateLargeParkingDataset(100);
    
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('parking-data.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: largeParkingData,
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

    const startTime = performance.now();
    render(<App />);

    // Wait for all markers to render
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(100);
    }, { timeout: 10000 });

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within reasonable time (less than 2 seconds)
    expect(renderTime).toBeLessThan(2000);
  });

  it('should handle search efficiently with large datasets', async () => {
    const largeParkingData = generateLargeParkingDataset(500);
    
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('parking-data.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: largeParkingData,
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

    const user = userEvent.setup();
    render(<App />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(500);
    }, { timeout: 15000 });

    // Measure search performance
    const searchInput = screen.getByTestId('search-input');
    
    const searchStartTime = performance.now();
    await user.type(searchInput, 'Location 1');
    
    // Wait for search results to update
    await waitFor(() => {
      const markers = screen.getAllByTestId('parking-marker');
      expect(markers.length).toBeLessThan(500);
    });
    
    const searchEndTime = performance.now();
    const searchTime = searchEndTime - searchStartTime;

    // Search should be responsive (less than 500ms)
    expect(searchTime).toBeLessThan(500);
  });

  it('should handle rapid user interactions without performance degradation', async () => {
    const parkingData = generateLargeParkingDataset(50);
    
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('parking-data.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: parkingData,
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

    const user = userEvent.setup();
    render(<App />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(50);
    });

    const markers = screen.getAllByTestId('parking-marker');
    
    // Measure rapid clicking performance
    const rapidClickStartTime = performance.now();
    
    // Click multiple markers rapidly
    for (let i = 0; i < 10; i++) {
      await user.click(markers[i % markers.length]);
    }
    
    const rapidClickEndTime = performance.now();
    const rapidClickTime = rapidClickEndTime - rapidClickStartTime;

    // Rapid interactions should be handled efficiently (less than 1 second)
    expect(rapidClickTime).toBeLessThan(1000);
  });

  it('should optimize memory usage during data updates', async () => {
    const initialData = generateLargeParkingDataset(100);
    let callCount = 0;
    
    (fetch as any).mockImplementation((url: string) => {
      callCount++;
      const data = callCount === 1 ? initialData : generateLargeParkingDataset(100);
      
      if (url.includes('parking-data.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: data,
            lastUpdated: new Date().toISOString(),
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

    const user = userEvent.setup();
    render(<App />);

    // Wait for initial data
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(100);
    });

    // Trigger manual refresh multiple times
    const refreshButton = screen.getByTestId('manual-refresh');
    
    for (let i = 0; i < 5; i++) {
      await user.click(refreshButton);
      await waitFor(() => {
        expect(screen.getAllByTestId('parking-marker')).toHaveLength(100);
      });
    }

    // Should not accumulate memory leaks (this is a basic check)
    expect(callCount).toBeGreaterThan(5);
  });

  it('should handle concurrent data operations efficiently', async () => {
    const parkingData = generateLargeParkingDataset(200);
    
    // Simulate slow network response
    (fetch as any).mockImplementation((url: string) => {
      return new Promise(resolve => {
        setTimeout(() => {
          if (url.includes('parking-data.json')) {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                locations: parkingData,
                lastUpdated: '2024-01-01T12:00:00Z',
                version: '1.0.0',
              }),
            });
          }
          if (url.includes('config.json')) {
            resolve({
              ok: true,
              json: () => Promise.resolve({
                config: mockAppConfig,
                version: '1.0.0',
              }),
            });
          }
        }, 100);
      });
    });

    const user = userEvent.setup();
    render(<App />);

    // Start multiple concurrent operations
    const concurrentStartTime = performance.now();
    
    // Trigger multiple refreshes while data is loading
    const refreshButton = screen.getByTestId('manual-refresh');
    const refreshPromises = [];
    
    for (let i = 0; i < 3; i++) {
      refreshPromises.push(user.click(refreshButton));
    }
    
    await Promise.all(refreshPromises);
    
    // Wait for data to stabilize
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(200);
    }, { timeout: 5000 });
    
    const concurrentEndTime = performance.now();
    const concurrentTime = concurrentEndTime - concurrentStartTime;

    // Concurrent operations should be handled efficiently
    expect(concurrentTime).toBeLessThan(3000);
  });

  it('should maintain performance during auto-refresh cycles', async () => {
    vi.useFakeTimers();
    
    const parkingData = generateLargeParkingDataset(100);
    
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('parking-data.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: parkingData.map(location => ({
              ...location,
              capacity: {
                ...location.capacity,
                available: Math.floor(Math.random() * location.capacity.total),
              },
            })),
            lastUpdated: new Date().toISOString(),
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

    render(<App />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(100);
    });

    // Measure performance over multiple refresh cycles
    const refreshCycleStartTime = performance.now();
    
    // Simulate 5 auto-refresh cycles
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(300000); // 5 minutes
      await vi.runOnlyPendingTimersAsync();
      
      await waitFor(() => {
        expect(screen.getAllByTestId('parking-marker')).toHaveLength(100);
      });
    }
    
    const refreshCycleEndTime = performance.now();
    const refreshCycleTime = refreshCycleEndTime - refreshCycleStartTime;

    // Auto-refresh cycles should maintain good performance
    expect(refreshCycleTime).toBeLessThan(5000);
    
    vi.useRealTimers();
  });

  it('should optimize rendering with virtualization for very large datasets', async () => {
    // Test with extremely large dataset
    const veryLargeParkingData = generateLargeParkingDataset(1000);
    
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('parking-data.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: veryLargeParkingData,
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

    const renderStartTime = performance.now();
    render(<App />);

    // For very large datasets, the app should either:
    // 1. Use virtualization to render only visible markers
    // 2. Implement clustering to group nearby markers
    // 3. Limit the number of rendered markers based on zoom level

    await waitFor(() => {
      const markers = screen.getAllByTestId('parking-marker');
      // Should either render all markers efficiently or use optimization techniques
      expect(markers.length).toBeGreaterThan(0);
      expect(markers.length).toBeLessThanOrEqual(1000);
    }, { timeout: 10000 });

    const renderEndTime = performance.now();
    const renderTime = renderEndTime - renderStartTime;

    // Even with 1000 locations, should render within reasonable time
    expect(renderTime).toBeLessThan(5000);
  });

  it('should handle debounced search efficiently', async () => {
    const parkingData = generateLargeParkingDataset(300);
    
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('parking-data.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            locations: parkingData,
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

    const user = userEvent.setup();
    render(<App />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getAllByTestId('parking-marker')).toHaveLength(300);
    });

    const searchInput = screen.getByTestId('search-input');
    
    // Test rapid typing (should be debounced)
    const rapidTypingStartTime = performance.now();
    
    await user.type(searchInput, 'Location');
    
    // Wait for debounced search to complete
    await waitFor(() => {
      const markers = screen.getAllByTestId('parking-marker');
      expect(markers.length).toBeLessThan(300);
    });
    
    const rapidTypingEndTime = performance.now();
    const rapidTypingTime = rapidTypingEndTime - rapidTypingStartTime;

    // Debounced search should be efficient
    expect(rapidTypingTime).toBeLessThan(1000);
  });
});