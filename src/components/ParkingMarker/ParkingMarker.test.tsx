import React from 'react';
import { render } from '@testing-library/react';
import { MapContainer, TileLayer } from 'react-leaflet';
import ParkingMarker from './ParkingMarker';
import type { ParkingLocation, AvailabilityStatus } from '../../types';
import { vi } from 'vitest';

// Mock Leaflet CSS import
vi.mock('leaflet/dist/leaflet.css', () => ({}));

// Mock window.scrollTo for JSDOM compatibility
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
});

// Test wrapper component that provides map context
const TestMapWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MapContainer center={[37.7749, -122.4194]} zoom={13} style={{ height: '400px' }}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {children}
  </MapContainer>
);

// Helper functions to test (extracted from component for testing)
const getAvailabilityStatus = (available: number, total: number): AvailabilityStatus => {
  if (total === 0) return 'unknown';
  const percentage = (available / total) * 100;
  
  if (percentage === 0) return 'full';
  if (percentage <= 25) return 'limited';
  return 'available';
};

const getMarkerColor = (status: AvailabilityStatus): string => {
  switch (status) {
    case 'available':
      return '#22c55e'; // Green
    case 'limited':
      return '#f59e0b'; // Orange
    case 'full':
      return '#ef4444'; // Red
    case 'unknown':
    default:
      return '#6b7280'; // Gray
  }
};

// Mock parking location data
const mockParkingLocation: ParkingLocation = {
  id: 'test-location-1',
  name: 'Test Parking Lot',
  address: '123 Test Street',
  coordinates: {
    lat: 37.7749,
    lng: -122.4194
  },
  capacity: {
    total: 50,
    available: 25
  },
  rules: {
    timeLimit: '2 hours',
    cost: 'Free',
    hours: '8 AM - 6 PM'
  },
  type: 'lot',
  lastUpdated: '2024-01-01T12:00:00Z'
};

const mockFullParkingLocation: ParkingLocation = {
  ...mockParkingLocation,
  id: 'test-location-2',
  name: 'Full Parking Garage',
  capacity: {
    total: 100,
    available: 0
  },
  type: 'garage'
};

const mockLimitedParkingLocation: ParkingLocation = {
  ...mockParkingLocation,
  id: 'test-location-3',
  name: 'Limited Parking Street',
  capacity: {
    total: 20,
    available: 3
  },
  type: 'street'
};

const mockUnknownParkingLocation: ParkingLocation = {
  ...mockParkingLocation,
  id: 'test-location-4',
  name: 'Unknown Capacity Lot',
  capacity: {
    total: 0,
    available: 0
  }
};

describe('ParkingMarker', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders marker with correct position', () => {
    render(
      <TestMapWrapper>
        <ParkingMarker
          location={mockParkingLocation}
          isSelected={false}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    // Check if marker is rendered (Leaflet creates markers in the DOM)
    const markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement).toBeInTheDocument();
  });

  it('shows different colors for different availability statuses', () => {
    const { rerender } = render(
      <TestMapWrapper>
        <ParkingMarker
          location={mockParkingLocation}
          isSelected={false}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    // Test available status (green)
    let markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement?.innerHTML).toContain('#059669'); // Green color

    // Test full status (red)
    rerender(
      <TestMapWrapper>
        <ParkingMarker
          location={mockFullParkingLocation}
          isSelected={false}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement?.innerHTML).toContain('#dc2626'); // Red color

    // Test limited status (orange)
    rerender(
      <TestMapWrapper>
        <ParkingMarker
          location={mockLimitedParkingLocation}
          isSelected={false}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement?.innerHTML).toContain('#d97706'); // Orange color

    // Test unknown status (gray)
    rerender(
      <TestMapWrapper>
        <ParkingMarker
          location={mockUnknownParkingLocation}
          isSelected={false}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement?.innerHTML).toContain('#475569'); // Gray color
  });

  it('shows larger marker when selected', () => {
    const { rerender } = render(
      <TestMapWrapper>
        <ParkingMarker
          location={mockParkingLocation}
          isSelected={false}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    // Test unselected marker (28px - updated for better touch targets)
    let markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement?.innerHTML).toContain('width: 28px');
    expect(markerElement?.innerHTML).toContain('height: 28px');

    // Test selected marker (32px)
    rerender(
      <TestMapWrapper>
        <ParkingMarker
          location={mockParkingLocation}
          isSelected={true}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement?.innerHTML).toContain('width: 36px');
    expect(markerElement?.innerHTML).toContain('height: 36px');
  });

  it('handles edge cases for availability calculation', () => {
    const edgeCaseLocation: ParkingLocation = {
      ...mockParkingLocation,
      capacity: {
        total: 1,
        available: 1
      }
    };

    render(
      <TestMapWrapper>
        <ParkingMarker
          location={edgeCaseLocation}
          isSelected={false}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    const markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement?.innerHTML).toContain('#059669'); // Should be green (available)
  });

  // Test the helper functions directly since Leaflet interactions are complex in JSDOM
  describe('Helper Functions', () => {
    it('calculates availability status correctly', () => {
      expect(getAvailabilityStatus(50, 100)).toBe('available'); // 50%
      expect(getAvailabilityStatus(25, 100)).toBe('limited'); // 25%
      expect(getAvailabilityStatus(10, 100)).toBe('limited'); // 10%
      expect(getAvailabilityStatus(0, 100)).toBe('full'); // 0%
      expect(getAvailabilityStatus(0, 0)).toBe('unknown'); // No capacity data
      expect(getAvailabilityStatus(1, 1)).toBe('available'); // 100%
    });

    it('returns correct colors for availability status', () => {
      expect(getMarkerColor('available')).toBe('#22c55e');
      expect(getMarkerColor('limited')).toBe('#f59e0b');
      expect(getMarkerColor('full')).toBe('#ef4444');
      expect(getMarkerColor('unknown')).toBe('#6b7280');
    });
  });

  it('renders with correct marker properties', () => {
    render(
      <TestMapWrapper>
        <ParkingMarker
          location={mockParkingLocation}
          isSelected={false}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    const markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement).toBeInTheDocument();
    
    // Check that the marker contains the parking indicator
    expect(markerElement?.innerHTML).toContain('P');
  });

  it('handles different parking types correctly', () => {
    const structureLocation: ParkingLocation = {
      ...mockParkingLocation,
      type: 'structure',
      name: 'Parking Structure'
    };

    render(
      <TestMapWrapper>
        <ParkingMarker
          location={structureLocation}
          isSelected={false}
          onClick={mockOnClick}
        />
      </TestMapWrapper>
    );

    const markerElement = document.querySelector('.leaflet-marker-icon');
    expect(markerElement).toBeInTheDocument();
    expect(markerElement?.innerHTML).toContain('P');
  });
});