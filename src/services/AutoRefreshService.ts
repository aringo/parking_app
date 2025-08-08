import { dataFetcher } from './DataFetcher';
import type { ParkingLocation, AppConfig } from '../types';

export interface RefreshState {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  error: string | null;
}

export interface RefreshCallbacks {
  onDataUpdate: (data: ParkingLocation[]) => void;
  onConfigUpdate: (config: AppConfig | null) => void;
  onStateChange: (state: RefreshState) => void;
  onError: (error: string) => void;
}

export class AutoRefreshService {
  private refreshInterval: number = 5 * 60 * 1000; // 5 minutes default
  private timerId: number | null = null;
  private callbacks: RefreshCallbacks | null = null;
  private state: RefreshState = {
    isRefreshing: false,
    lastRefresh: null,
    nextRefresh: null,
    error: null,
  };

  constructor(refreshInterval?: number) {
    if (refreshInterval) {
      this.refreshInterval = refreshInterval;
    }
  }

  /**
   * Start the auto-refresh timer
   */
  start(callbacks: RefreshCallbacks): void {
    this.callbacks = callbacks;
    
    // Perform initial data fetch
    this.performRefresh();
    
    // Set up recurring refresh
    this.scheduleNextRefresh();
  }

  /**
   * Stop the auto-refresh timer
   */
  stop(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    
    this.updateState({
      nextRefresh: null,
    });
  }

  /**
   * Manually trigger a refresh
   */
  async refresh(): Promise<void> {
    if (this.state.isRefreshing) {
      console.warn('Refresh already in progress, skipping manual refresh');
      return;
    }

    await this.performRefresh();
  }

  /**
   * Update the refresh interval
   */
  setRefreshInterval(intervalMs: number): void {
    this.refreshInterval = intervalMs;
    
    // Restart timer with new interval if currently running
    if (this.timerId) {
      this.stop();
      this.scheduleNextRefresh();
    }
  }

  /**
   * Get current refresh state
   */
  getState(): RefreshState {
    return { ...this.state };
  }

  /**
   * Get time until next refresh in milliseconds
   */
  getTimeUntilNextRefresh(): number {
    if (!this.state.nextRefresh) return 0;
    return Math.max(0, this.state.nextRefresh.getTime() - Date.now());
  }

  /**
   * Check if data is considered fresh (within refresh interval)
   */
  isDataFresh(): boolean {
    if (!this.state.lastRefresh) return false;
    const age = Date.now() - this.state.lastRefresh.getTime();
    return age < this.refreshInterval;
  }

  /**
   * Perform the actual data refresh
   */
  private async performRefresh(): Promise<void> {
    if (!this.callbacks) {
      console.warn('No callbacks registered for refresh service');
      return;
    }

    this.updateState({
      isRefreshing: true,
      error: null,
    });

    try {
      // Fetch both parking data and config in parallel
      const [parkingData, appConfig] = await Promise.all([
        dataFetcher.fetchParkingData(),
        dataFetcher.fetchAppConfig(),
      ]);

      // Update callbacks with new data
      this.callbacks.onDataUpdate(parkingData);
      this.callbacks.onConfigUpdate(appConfig);

      this.updateState({
        isRefreshing: false,
        lastRefresh: new Date(),
        error: null,
      });

      // Schedule next refresh
      this.scheduleNextRefresh();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown refresh error';
      
      this.updateState({
        isRefreshing: false,
        error: errorMessage,
      });

      this.callbacks.onError(errorMessage);

      // Still schedule next refresh even if this one failed
      this.scheduleNextRefresh();
    }
  }

  /**
   * Schedule the next refresh
   */
  private scheduleNextRefresh(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    const nextRefreshTime = new Date(Date.now() + this.refreshInterval);
    
    this.updateState({
      nextRefresh: nextRefreshTime,
    });

    this.timerId = window.setTimeout(() => {
      this.performRefresh();
    }, this.refreshInterval);
  }

  /**
   * Update internal state and notify callbacks
   */
  private updateState(updates: Partial<RefreshState>): void {
    this.state = { ...this.state, ...updates };
    
    if (this.callbacks) {
      this.callbacks.onStateChange(this.state);
    }
  }
}

// Export a default instance
export const autoRefreshService = new AutoRefreshService();