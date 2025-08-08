import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RefreshIndicator } from './RefreshIndicator';
import type { RefreshState } from '../../services/AutoRefreshService';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return 'less than a minute ago';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    return 'some time ago';
  }),
}));

describe('RefreshIndicator', () => {
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onRefresh: mockOnRefresh,
    timeUntilNextRefresh: 60000, // 1 minute
    isDataFresh: true,
  };

  describe('rendering', () => {
    it('should render with fresh data state', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(Date.now() - 30000), // 30 seconds ago
        nextRefresh: new Date(Date.now() + 60000), // 1 minute from now
        error: null,
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
        />
      );

      expect(screen.getByText(/Updated.*less than a minute ago/)).toBeInTheDocument();
      expect(screen.getByText(/Next update in 1m 0s/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /refresh parking data/i })).toBeInTheDocument();
    });

    it('should render refreshing state', () => {
      const refreshState: RefreshState = {
        isRefreshing: true,
        lastRefresh: new Date(Date.now() - 30000),
        nextRefresh: new Date(Date.now() + 60000),
        error: null,
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
        />
      );

      expect(screen.getByText('Updating...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should render error state', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(Date.now() - 30000),
        nextRefresh: new Date(Date.now() + 60000),
        error: 'Network error',
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
        />
      );

      expect(screen.getByText('Update failed')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('should render no data state', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: null,
        nextRefresh: null,
        error: null,
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
        />
      );

      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  describe('time formatting', () => {
    it('should format time until refresh correctly', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + 125000), // 2 minutes 5 seconds
        error: null,
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
          timeUntilNextRefresh={125000}
        />
      );

      expect(screen.getByText(/Next update in 2m 5s/)).toBeInTheDocument();
    });

    it('should show seconds only when less than a minute', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + 30000), // 30 seconds
        error: null,
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
          timeUntilNextRefresh={30000}
        />
      );

      expect(screen.getByText(/Next update in 30s/)).toBeInTheDocument();
    });

    it('should show "Now" when time is zero or negative', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(),
        nextRefresh: new Date(),
        error: null,
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
          timeUntilNextRefresh={0}
        />
      );

      expect(screen.getByText(/Next update in Now/)).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onRefresh when refresh button is clicked', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + 60000),
        error: null,
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
        />
      );

      const refreshButton = screen.getByRole('button', { name: /refresh parking data/i });
      fireEvent.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalledTimes(1);
    });

    it('should not call onRefresh when button is disabled during refresh', () => {
      const refreshState: RefreshState = {
        isRefreshing: true,
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + 60000),
        error: null,
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
        />
      );

      const refreshButton = screen.getByRole('button');
      fireEvent.click(refreshButton);

      expect(mockOnRefresh).not.toHaveBeenCalled();
    });
  });

  describe('visual states', () => {
    it('should apply fresh state class when data is fresh', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + 60000),
        error: null,
      };

      const { container } = render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
          isDataFresh={true}
        />
      );

      const indicator = container.firstChild as HTMLElement;
      expect(indicator.className).toContain('fresh');
    });

    it('should apply stale state class when data is not fresh', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(Date.now() - 600000), // 10 minutes ago
        nextRefresh: new Date(Date.now() + 60000),
        error: null,
      };

      const { container } = render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
          isDataFresh={false}
        />
      );

      const indicator = container.firstChild as HTMLElement;
      expect(indicator.className).toContain('stale');
    });

    it('should apply error state class when there is an error', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + 60000),
        error: 'Network error',
      };

      const { container } = render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
        />
      );

      const indicator = container.firstChild as HTMLElement;
      expect(indicator.className).toContain('error');
    });

    it('should apply refreshing state class when refreshing', () => {
      const refreshState: RefreshState = {
        isRefreshing: true,
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + 60000),
        error: null,
      };

      const { container } = render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
        />
      );

      const indicator = container.firstChild as HTMLElement;
      expect(indicator.className).toContain('refreshing');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      const refreshState: RefreshState = {
        isRefreshing: false,
        lastRefresh: new Date(),
        nextRefresh: new Date(Date.now() + 60000),
        error: null,
      };

      render(
        <RefreshIndicator
          {...defaultProps}
          refreshState={refreshState}
        />
      );

      const refreshButton = screen.getByRole('button', { name: /refresh parking data/i });
      expect(refreshButton).toHaveAttribute('aria-label', 'Refresh parking data');
      expect(refreshButton).toHaveAttribute('title', 'Refresh parking data now');
    });
  });
});