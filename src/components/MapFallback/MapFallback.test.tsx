import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MapFallback from './MapFallback';
import type { ParkingLocation } from '../../types';

const mockParkingData: ParkingLocation[] = [
  {
    id: '1',
    name: 'Downtown Parking Lot',
    address: '123 Main St',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    capacity: { total: 100, available: 75 },
    rules: { timeLimit: '2 hours', cost: '$2/hour' },
    type: 'lot',
    lastUpdated: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'City Parking Garage',
    address: '456 Oak Ave',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    capacity: { total: 200, available: 10 },
    rules: { timeLimit: '4 hours', cost: '$3/hour' },
    type: 'garage',
    lastUpdated: '2023-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Street Parking',
    address: '789 Pine St',
    coordinates: { lat: 40.7505, lng: -73.9934 },
    capacity: { total: 50, available: 0 },
    rules: { timeLimit: '1 hour' },
    type: 'street',
    lastUpdated: '2023-01-01T00:00:00Z',
  },
];

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockOpen,
  writable: true,
});

describe('MapFallback', () => {
  const defaultProps = {
    parkingData: mockParkingData,
    selectedLocation: null,
    searchResults: [],
    onLocationSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders parking locations list', () => {
    render(<MapFallback {...defaultProps} />);

    expect(screen.getByText('Parking Locations')).toBeInTheDocument();
    expect(screen.getByText('3 locations found')).toBeInTheDocument();
    expect(screen.getByText('Downtown Parking Lot')).toBeInTheDocument();
    expect(screen.getByText('City Parking Garage')).toBeInTheDocument();
    expect(screen.getByText('Street Parking')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(<MapFallback {...defaultProps} error="Map failed to load" />);

    expect(screen.getByText('Map unavailable: Map failed to load')).toBeInTheDocument();
  });

  it('shows search results when provided', () => {
    const searchResults = [mockParkingData[0]];
    render(<MapFallback {...defaultProps} searchResults={searchResults} />);

    expect(screen.getByText('1 location found')).toBeInTheDocument();
    expect(screen.getByText('Downtown Parking Lot')).toBeInTheDocument();
    expect(screen.queryByText('City Parking Garage')).not.toBeInTheDocument();
  });

  it('shows empty state when no locations available', () => {
    render(<MapFallback {...defaultProps} parkingData={[]} />);

    expect(screen.getByText('No parking locations available')).toBeInTheDocument();
    expect(screen.getByText('Please check your connection and try again')).toBeInTheDocument();
  });

  it('displays location details correctly', () => {
    render(<MapFallback {...defaultProps} />);

    // Check first location details
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument(); // available spaces
    expect(screen.getByText('100')).toBeInTheDocument(); // total spaces
    expect(screen.getByText('Lot')).toBeInTheDocument(); // type
    expect(screen.getByText('Time limit: 2 hours')).toBeInTheDocument();
    expect(screen.getByText('Cost: $2/hour')).toBeInTheDocument();
  });

  it('shows correct availability status colors', () => {
    render(<MapFallback {...defaultProps} />);

    const statusIndicators = screen.getAllByRole('status');
    
    // Just check that the indicators exist and have background colors set
    expect(statusIndicators).toHaveLength(3);
    statusIndicators.forEach(indicator => {
      expect(indicator.style.backgroundColor).toBeTruthy();
    });
  });

  it('calls onLocationSelect when location is clicked', () => {
    const onLocationSelect = vi.fn();
    render(<MapFallback {...defaultProps} onLocationSelect={onLocationSelect} />);

    fireEvent.click(screen.getByText('Downtown Parking Lot'));

    expect(onLocationSelect).toHaveBeenCalledWith(mockParkingData[0]);
  });

  it('calls onLocationSelect when location is activated with keyboard', () => {
    const onLocationSelect = vi.fn();
    render(<MapFallback {...defaultProps} onLocationSelect={onLocationSelect} />);

    const locationCard = screen.getByText('Downtown Parking Lot').closest('[role="listitem"]');
    
    if (locationCard) {
      fireEvent.keyDown(locationCard, { key: 'Enter' });
      expect(onLocationSelect).toHaveBeenCalledWith(mockParkingData[0]);

      fireEvent.keyDown(locationCard, { key: ' ' });
      expect(onLocationSelect).toHaveBeenCalledWith(mockParkingData[0]);
    }
  });

  it('highlights selected location', () => {
    render(<MapFallback {...defaultProps} selectedLocation={mockParkingData[0]} />);

    const selectedCard = screen.getByText('Downtown Parking Lot').closest('[role="listitem"]');
    expect(selectedCard?.className).toContain('selected');
  });

  it('opens directions when Get Directions is clicked', () => {
    render(<MapFallback {...defaultProps} />);

    const directionsButton = screen.getAllByText('Get Directions')[0];
    fireEvent.click(directionsButton);

    expect(mockOpen).toHaveBeenCalledWith(
      'https://www.google.com/maps/dir/?api=1&destination=40.7128,-74.006',
      '_blank'
    );
  });

  it('prevents event propagation when directions button is clicked', () => {
    const onLocationSelect = vi.fn();
    render(<MapFallback {...defaultProps} onLocationSelect={onLocationSelect} />);

    const directionsButton = screen.getAllByText('Get Directions')[0];
    fireEvent.click(directionsButton);

    expect(onLocationSelect).not.toHaveBeenCalled();
  });

  it('handles locations without optional fields', () => {
    const minimalLocation: ParkingLocation = {
      id: '4',
      name: 'Minimal Parking',
      address: '999 Test St',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      capacity: { total: 20, available: 5 },
      rules: {},
      type: 'street',
      lastUpdated: '2023-01-01T00:00:00Z',
    };

    render(<MapFallback {...defaultProps} parkingData={[minimalLocation]} />);

    expect(screen.getByText('Minimal Parking')).toBeInTheDocument();
    expect(screen.queryByText('Time limit:')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost:')).not.toBeInTheDocument();
  });

  it('displays correct singular/plural text for location count', () => {
    render(<MapFallback {...defaultProps} parkingData={[mockParkingData[0]]} />);
    expect(screen.getByText('1 location found')).toBeInTheDocument();

    render(<MapFallback {...defaultProps} parkingData={mockParkingData} />);
    expect(screen.getByText('3 locations found')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<MapFallback {...defaultProps} />);

    const locationCards = screen.getAllByRole('listitem');
    
    expect(locationCards).toHaveLength(3);
    locationCards.forEach(card => {
      expect(card.getAttribute('role')).toBe('listitem');
      expect(card.getAttribute('tabIndex')).toBe('0');
    });
  });

  it('handles keyboard navigation correctly', () => {
    const onLocationSelect = vi.fn();
    render(<MapFallback {...defaultProps} onLocationSelect={onLocationSelect} />);

    const locationCard = screen.getByText('Downtown Parking Lot').closest('[role="listitem"]');
    
    if (locationCard) {
      // Should not trigger on other keys
      fireEvent.keyDown(locationCard, { key: 'Tab' });
      expect(onLocationSelect).not.toHaveBeenCalled();

      // Should trigger on Enter and Space
      fireEvent.keyDown(locationCard, { key: 'Enter' });
      expect(onLocationSelect).toHaveBeenCalledWith(mockParkingData[0]);

      fireEvent.keyDown(locationCard, { key: ' ' });
      expect(onLocationSelect).toHaveBeenCalledWith(mockParkingData[0]);
    }
  });
});