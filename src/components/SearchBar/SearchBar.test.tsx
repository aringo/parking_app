import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchBar from './SearchBar';
import type { ParkingLocation } from '../../types';

// Mock parking data for testing
const mockParkingData: ParkingLocation[] = [
  {
    id: 'test-1',
    name: 'Main Street Parking',
    address: '123 Main St',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    capacity: { total: 50, available: 25 },
    rules: { timeLimit: '2 hours', cost: 'Free' },
    type: 'street',
    lastUpdated: '2024-01-01T12:00:00Z',
  },
  {
    id: 'test-2',
    name: 'City Hall Lot',
    address: '456 Government Ave',
    coordinates: { lat: 37.7849, lng: -122.4094 },
    capacity: { total: 100, available: 5 },
    rules: { timeLimit: '4 hours', cost: '$2/hour' },
    type: 'lot',
    lastUpdated: '2024-01-01T12:00:00Z',
  },
  {
    id: 'test-3',
    name: 'Downtown Garage',
    address: '789 Business Blvd',
    coordinates: { lat: 37.7649, lng: -122.4294 },
    capacity: { total: 200, available: 0 },
    rules: { timeLimit: 'All day', cost: '$5/hour' },
    type: 'garage',
    lastUpdated: '2024-01-01T12:00:00Z',
  },
];

describe('SearchBar', () => {
  const mockOnSearchResults = vi.fn();
  const mockOnClearSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSearchBar = () => {
    return render(
      <SearchBar
        parkingData={mockParkingData}
        onSearchResults={mockOnSearchResults}
        onClearSearch={mockOnClearSearch}
      />
    );
  };

  describe('Basic Rendering', () => {
    it('renders search input with correct placeholder', () => {
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox', { name: /search parking locations/i });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search parking locations...');
    });

    it('does not show clear button when input is empty', () => {
      renderSearchBar();
      
      const clearButton = screen.queryByRole('button', { name: /clear search/i });
      expect(clearButton).not.toBeInTheDocument();
    });

    it('does not show suggestions when input is empty', () => {
      renderSearchBar();
      
      const suggestionsList = screen.queryByRole('listbox');
      expect(suggestionsList).not.toBeInTheDocument();
    });
  });

  describe('Search Input Functionality', () => {
    it('updates input value when user types', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      expect(searchInput).toHaveValue('Main');
    });

    it('shows clear button when input has value', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('calls onSearchResults when user types', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        expect(mockOnSearchResults).toHaveBeenCalledWith([mockParkingData[0]]);
      });
    });

    it('clears input and calls onClearSearch when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);
      
      expect(searchInput).toHaveValue('');
      expect(mockOnClearSearch).toHaveBeenCalled();
    });
  });

  describe('Search Filtering', () => {
    it('filters by parking location name', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        expect(mockOnSearchResults).toHaveBeenCalledWith([mockParkingData[0]]);
      });
    });

    it('filters by parking location address', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Government');
      
      await waitFor(() => {
        expect(mockOnSearchResults).toHaveBeenCalledWith([mockParkingData[1]]);
      });
    });

    it('filters by parking location type', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'garage');
      
      await waitFor(() => {
        expect(mockOnSearchResults).toHaveBeenCalledWith([mockParkingData[2]]);
      });
    });

    it('returns multiple results for partial matches', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'a'); // Should match multiple locations
      
      await waitFor(() => {
        expect(mockOnSearchResults).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ name: 'Main Street Parking' }),
            expect.objectContaining({ name: 'Downtown Garage' })
          ])
        );
      });
    });

    it('returns empty array for no matches', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(mockOnSearchResults).toHaveBeenCalledWith([]);
      });
    });

    it('is case insensitive', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'MAIN');
      
      await waitFor(() => {
        expect(mockOnSearchResults).toHaveBeenCalledWith([mockParkingData[0]]);
      });
    });
  });

  describe('Search Suggestions', () => {
    it('shows suggestions when user types and focuses input', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        const suggestionsList = screen.getByRole('listbox');
        expect(suggestionsList).toBeInTheDocument();
      });
    });

    it('displays correct suggestion content', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        expect(screen.getByText((content, element) => {
          return element?.textContent === 'Main Street Parking';
        })).toBeInTheDocument();
        expect(screen.getByText((content, element) => {
          return element?.textContent === '123 Main St';
        })).toBeInTheDocument();
        expect(screen.getByText('25/50 available')).toBeInTheDocument();
      });
    });

    it('highlights search term in suggestions', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        const highlightedElements = screen.getAllByText('Main');
        const highlightedSpan = highlightedElements.find(el => 
          el.className.includes('highlight')
        );
        expect(highlightedSpan).toBeInTheDocument();
      });
    });

    it('limits suggestions to 5 items', async () => {
      // Create more than 5 matching items
      const manyLocations = Array.from({ length: 10 }, (_, i) => ({
        ...mockParkingData[0],
        id: `test-${i}`,
        name: `Test Location ${i}`,
      }));
      
      const user = userEvent.setup();
      render(
        <SearchBar
          parkingData={manyLocations}
          onSearchResults={mockOnSearchResults}
          onClearSearch={mockOnClearSearch}
        />
      );
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Test');
      
      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions).toHaveLength(5);
      });
    });

    it('shows no results message when no matches found', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'nonexistent');
      
      await waitFor(() => {
        expect(screen.getByText(/No parking locations found for "nonexistent"/)).toBeInTheDocument();
      });
    });
  });

  describe('Suggestion Interactions', () => {
    it('selects suggestion when clicked', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        const suggestion = screen.getByRole('option');
        expect(suggestion).toBeInTheDocument();
      });
      
      const suggestion = screen.getByRole('option');
      await user.click(suggestion);
      
      expect(searchInput).toHaveValue('Main Street Parking');
      expect(mockOnSearchResults).toHaveBeenCalledWith([mockParkingData[0]]);
    });

    it('hides suggestions after selection', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        const suggestion = screen.getByRole('option');
        expect(suggestion).toBeInTheDocument();
      });
      
      const suggestion = screen.getByRole('option');
      await user.click(suggestion);
      
      await waitFor(() => {
        const suggestionsList = screen.queryByRole('listbox');
        expect(suggestionsList).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates suggestions with arrow keys', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'a'); // Should show multiple suggestions
      
      await waitFor(() => {
        const suggestions = screen.getAllByRole('option');
        expect(suggestions.length).toBeGreaterThan(1);
      });
      
      // Navigate down
      await user.keyboard('{ArrowDown}');
      
      const firstSuggestion = screen.getAllByRole('option')[0];
      expect(firstSuggestion.className).toMatch(/selected/);
    });

    it('selects suggestion with Enter key', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        const suggestion = screen.getByRole('option');
        expect(suggestion).toBeInTheDocument();
      });
      
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      
      expect(searchInput).toHaveValue('Main Street Parking');
    });

    it('closes suggestions with Escape key', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        const suggestionsList = screen.getByRole('listbox');
        expect(suggestionsList).toBeInTheDocument();
      });
      
      await user.keyboard('{Escape}');
      
      await waitFor(() => {
        const suggestionsList = screen.queryByRole('listbox');
        expect(suggestionsList).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      expect(searchInput.getAttribute('aria-label')).toBe('Search parking locations by name, address, or type');
      expect(searchInput).toHaveAttribute('aria-expanded', 'false');
      expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
    });

    it('updates aria-expanded when suggestions are shown', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        expect(searchInput).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('has proper ARIA attributes on suggestions', async () => {
      const user = userEvent.setup();
      renderSearchBar();
      
      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'Main');
      
      await waitFor(() => {
        const suggestionsList = screen.getByRole('listbox');
        expect(suggestionsList).toHaveAttribute('aria-label', 'Search suggestions');
        
        const suggestion = screen.getByRole('option');
        expect(suggestion).toHaveAttribute('aria-selected', 'false');
      });
    });
  });
});