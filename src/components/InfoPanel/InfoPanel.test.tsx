import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InfoPanel from './InfoPanel';
import type { ParkingLocation } from '../../types';

// Mock data for testing
const mockParkingLocation: ParkingLocation = {
  id: 'test-location-1',
  name: 'Test Parking Lot',
  address: '123 Test Street, Test City',
  coordinates: { lat: 37.7749, lng: -122.4194 },
  capacity: { total: 100, available: 25, reserved: 10 },
  rules: {
    timeLimit: '2 hours',
    cost: '$2/hour',
    hours: '8 AM - 6 PM',
    restrictions: ['No overnight parking', 'Permit required on weekends']
  },
  type: 'lot',
  lastUpdated: '2024-01-01T12:00:00Z'
};

const mockParkingLocationFull: ParkingLocation = {
  id: 'test-location-2',
  name: 'Full Parking Garage',
  address: '456 Full Street, Test City',
  coordinates: { lat: 37.7849, lng: -122.4094 },
  capacity: { total: 50, available: 0 },
  rules: {
    timeLimit: '4 hours',
    cost: 'Free'
  },
  type: 'garage',
  lastUpdated: '2024-01-01T11:30:00Z'
};

const mockParkingLocationLimited: ParkingLocation = {
  id: 'test-location-3',
  name: 'Limited Street Parking',
  address: '789 Limited Ave, Test City',
  coordinates: { lat: 37.7649, lng: -122.4294 },
  capacity: { total: 20, available: 3 },
  rules: {
    cost: 'Free',
    hours: '24/7'
  },
  type: 'street',
  lastUpdated: '2024-01-01T12:15:00Z'
};

const mockOnDirectionsClick = vi.fn();

// Mock window.open for directions testing
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen
});

describe('InfoPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Empty State', () => {
    it('renders empty state when no location is selected', () => {
      render(<InfoPanel selectedLocation={null} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('Select a Parking Location')).toBeInTheDocument();
      expect(screen.getByText(/Click on any parking marker/)).toBeInTheDocument();
      expect(screen.getByText('General Parking Information')).toBeInTheDocument();
      expect(screen.getByText('Green markers indicate good availability')).toBeInTheDocument();
    });

    it('displays parking legend in empty state', () => {
      render(<InfoPanel selectedLocation={null} onDirectionsClick={mockOnDirectionsClick} />);
      
      const legendItems = [
        'Green markers indicate good availability',
        'Yellow markers indicate limited spaces',
        'Red markers indicate full or no availability',
        'Click any marker for detailed information'
      ];

      legendItems.forEach(item => {
        expect(screen.getByText(item)).toBeInTheDocument();
      });
    });
  });

  describe('Location Details Display', () => {
    it('renders location name and type correctly', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('Test Parking Lot')).toBeInTheDocument();
      expect(screen.getByText('Lot')).toBeInTheDocument();
    });

    it('displays address with location icon', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('123 Test Street, Test City')).toBeInTheDocument();
      expect(screen.getByText('📍')).toBeInTheDocument();
    });

    it('shows capacity information correctly', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getAllByText('25')).toHaveLength(2); // Available count appears twice
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Total Spaces:')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument(); // Total capacity
      expect(screen.getByText('Reserved:')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // Reserved spaces
    });

    it('displays parking rules correctly', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('Time Limit')).toBeInTheDocument();
      expect(screen.getByText('2 hours')).toBeInTheDocument();
      expect(screen.getByText('Cost')).toBeInTheDocument();
      expect(screen.getByText('$2/hour')).toBeInTheDocument();
      expect(screen.getByText('Hours')).toBeInTheDocument();
      expect(screen.getByText('8 AM - 6 PM')).toBeInTheDocument();
    });

    it('shows restrictions when present', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('Restrictions:')).toBeInTheDocument();
      expect(screen.getByText('No overnight parking')).toBeInTheDocument();
      expect(screen.getByText('Permit required on weekends')).toBeInTheDocument();
    });

    it('handles missing optional fields gracefully', () => {
      const locationWithoutOptionalFields: ParkingLocation = {
        ...mockParkingLocation,
        capacity: { total: 50, available: 20 }, // No reserved
        rules: { cost: 'Free' } // Only cost, no other rules
      };

      render(<InfoPanel selectedLocation={locationWithoutOptionalFields} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.queryByText('Reserved:')).not.toBeInTheDocument();
      expect(screen.queryByText('Time Limit')).not.toBeInTheDocument();
      expect(screen.queryByText('Restrictions:')).not.toBeInTheDocument();
    });
  });

  describe('Availability Status', () => {
    it('shows available status for good availability', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      const availabilityIndicator = screen.getByText('Available').closest('div');
      expect(availabilityIndicator).toHaveStyle({ backgroundColor: 'var(--success-color)' });
    });

    it('shows limited status for low availability', () => {
      render(<InfoPanel selectedLocation={mockParkingLocationLimited} onDirectionsClick={mockOnDirectionsClick} />);
      
      const availabilityIndicator = screen.getByText('Available').closest('div');
      expect(availabilityIndicator).toHaveStyle({ backgroundColor: 'var(--warning-color)' });
    });

    it('shows full status when no spaces available', () => {
      render(<InfoPanel selectedLocation={mockParkingLocationFull} onDirectionsClick={mockOnDirectionsClick} />);
      
      const availabilityIndicator = screen.getByText('Available').closest('div');
      expect(availabilityIndicator).toHaveStyle({ backgroundColor: 'var(--error-color)' });
    });
  });

  describe('Directions Functionality', () => {
    it('renders directions button', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      const directionsButton = screen.getByRole('button', { name: /get directions to test parking lot/i });
      expect(directionsButton).toBeInTheDocument();
      expect(directionsButton).toHaveTextContent('Get Directions');
    });

    it('calls onDirectionsClick when directions button is clicked', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      const directionsButton = screen.getByRole('button', { name: /get directions/i });
      fireEvent.click(directionsButton);
      
      expect(mockOnDirectionsClick).toHaveBeenCalledWith(mockParkingLocation);
      expect(mockOnDirectionsClick).toHaveBeenCalledTimes(1);
    });

    it('has proper accessibility attributes for directions button', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      const directionsButton = screen.getByRole('button', { name: /get directions to test parking lot/i });
      expect(directionsButton).toHaveAttribute('aria-label', 'Get directions to Test Parking Lot');
    });
  });

  describe('Last Updated Display', () => {
    it('shows "just now" for very recent updates', () => {
      const recentLocation: ParkingLocation = {
        ...mockParkingLocation,
        lastUpdated: '2024-01-01T12:30:00Z' // Same as mocked current time
      };

      render(<InfoPanel selectedLocation={recentLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('Last updated: Just now')).toBeInTheDocument();
    });

    it('shows minutes ago for recent updates', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('Last updated: 30 minutes ago')).toBeInTheDocument();
    });

    it('shows hours ago for older updates', () => {
      const olderLocation: ParkingLocation = {
        ...mockParkingLocation,
        lastUpdated: '2024-01-01T10:30:00Z' // 2 hours ago
      };

      render(<InfoPanel selectedLocation={olderLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('Last updated: 2 hours ago')).toBeInTheDocument();
    });

    it('shows date for very old updates', () => {
      const veryOldLocation: ParkingLocation = {
        ...mockParkingLocation,
        lastUpdated: '2023-12-30T12:30:00Z' // 2 days ago
      };

      render(<InfoPanel selectedLocation={veryOldLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText(/Last updated: 12\/30\/2023/)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies correct CSS classes for responsive design', () => {
      // This test verifies the CSS classes are applied correctly
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      const container = screen.getByText('Test Parking Lot').closest('div');
      const parentElement = container?.parentElement;
      expect(parentElement?.className).toMatch(/infoPanelContainer/);
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByRole('heading', { level: 2, name: 'Test Parking Lot' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Availability' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Parking Rules' })).toBeInTheDocument();
    });

    it('provides meaningful button labels', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Get directions to Test Parking Lot');
    });

    it('uses semantic HTML structure', () => {
      render(<InfoPanel selectedLocation={mockParkingLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getAllByRole('heading')).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('handles zero capacity gracefully', () => {
      const zeroCapacityLocation: ParkingLocation = {
        ...mockParkingLocation,
        capacity: { total: 0, available: 0 }
      };

      render(<InfoPanel selectedLocation={zeroCapacityLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getAllByText('0')).toHaveLength(3); // Appears in indicator and capacity details
    });

    it('handles empty rules object', () => {
      const noRulesLocation: ParkingLocation = {
        ...mockParkingLocation,
        rules: {}
      };

      render(<InfoPanel selectedLocation={noRulesLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.getByText('Parking Rules')).toBeInTheDocument();
      expect(screen.queryByText('Time Limit')).not.toBeInTheDocument();
    });

    it('handles empty restrictions array', () => {
      const noRestrictionsLocation: ParkingLocation = {
        ...mockParkingLocation,
        rules: {
          ...mockParkingLocation.rules,
          restrictions: []
        }
      };

      render(<InfoPanel selectedLocation={noRestrictionsLocation} onDirectionsClick={mockOnDirectionsClick} />);
      
      expect(screen.queryByText('Restrictions:')).not.toBeInTheDocument();
    });
  });
});