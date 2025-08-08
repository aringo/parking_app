import { useEffect, useState, useCallback, useRef } from 'react';
import { autoRefreshService, type RefreshState } from '../services/AutoRefreshService';
import type { ParkingLocation, AppConfig } from '../types';

export interface UseAutoRefreshOptions {
  refreshInterval?: number;
  autoStart?: boolean;
}

export interface UseAutoRefreshReturn {
  parkingData: ParkingLocation[];
  appConfig: AppConfig | null;
  refreshState: RefreshState;
  refresh: () => Promise<void>;
  start: () => void;
  stop: () => void;
  isDataFresh: boolean;
  timeUntilNextRefresh: number;
}

export function useAutoRefresh(options: UseAutoRefreshOptions = {}): UseAutoRefreshReturn {
  const { refreshInterval, autoStart = true } = options;
  
  const [parkingData, setParkingData] = useState<ParkingLocation[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [refreshState, setRefreshState] = useState<RefreshState>(autoRefreshService.getState());
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState(0);
  
  const isStartedRef = useRef(false);


  // Update time until next refresh every second
  useEffect(() => {
    const updateTimer = () => {
      setTimeUntilNextRefresh(autoRefreshService.getTimeUntilNextRefresh());
    };

    updateTimer(); // Initial update
    
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [refreshState.nextRefresh]);

  // Set up refresh interval if provided
  useEffect(() => {
    if (refreshInterval) {
      autoRefreshService.setRefreshInterval(refreshInterval);
    }
  }, [refreshInterval]);

  const handleDataUpdate = useCallback((data: ParkingLocation[]) => {
    setParkingData(data);
  }, []);

  const handleConfigUpdate = useCallback((config: AppConfig | null) => {
    setAppConfig(config);
  }, []);

  const handleStateChange = useCallback((state: RefreshState) => {
    setRefreshState(state);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('Auto-refresh error:', error);
    // Error is already included in the state, so we don't need to do anything else here
  }, []);

  const start = useCallback(() => {
    if (isStartedRef.current) return;
    
    autoRefreshService.start({
      onDataUpdate: handleDataUpdate,
      onConfigUpdate: handleConfigUpdate,
      onStateChange: handleStateChange,
      onError: handleError,
    });
    
    isStartedRef.current = true;
  }, [handleDataUpdate, handleConfigUpdate, handleStateChange, handleError]);

  const stop = useCallback(() => {
    if (!isStartedRef.current) return;
    
    autoRefreshService.stop();
    isStartedRef.current = false;
  }, []);

  const refresh = useCallback(async () => {
    await autoRefreshService.refresh();
  }, []);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !isStartedRef.current) {
      start();
    }

    // Cleanup on unmount
    return () => {
      if (isStartedRef.current) {
        stop();
      }
    };
  }, [autoStart, start, stop]);

  return {
    parkingData,
    appConfig,
    refreshState,
    refresh,
    start,
    stop,
    isDataFresh: autoRefreshService.isDataFresh(),
    timeUntilNextRefresh,
  };
}