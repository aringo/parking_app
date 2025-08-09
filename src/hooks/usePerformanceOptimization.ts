import { useState, useEffect } from 'react';

interface NetworkInfo {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface PerformanceSettings {
  reduceAnimations: boolean;
  limitMapTiles: boolean;
  reduceImageQuality: boolean;
  enableDataSaver: boolean;
}

export const usePerformanceOptimization = () => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({});
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>({
    reduceAnimations: false,
    limitMapTiles: false,
    reduceImageQuality: false,
    enableDataSaver: false,
  });

  useEffect(() => {
    // Check for Network Information API support
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      const updateNetworkInfo = () => {
        const info: NetworkInfo = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        };
        
        setNetworkInfo(info);
        
        // Adjust performance settings based on network conditions
        const isSlowConnection = info.effectiveType === '2g' || 
                                info.effectiveType === 'slow-2g' ||
                                (info.downlink && info.downlink < 1.5);
        
        // const isHighLatency = info.rtt && info.rtt > 300;
        
        setPerformanceSettings({
          reduceAnimations: isSlowConnection || info.saveData || false,
          limitMapTiles: isSlowConnection || info.saveData || false,
          reduceImageQuality: isSlowConnection || info.saveData || false,
          enableDataSaver: info.saveData || false,
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        connection.removeEventListener('change', updateNetworkInfo);
      };
    } else {
      // Fallback: detect slow connections using other methods
      const detectSlowConnection = () => {
        // Check if user has enabled data saver mode
        const dataSaver = (navigator as any).connection?.saveData;
        
        // Check device memory (if available)
        const deviceMemory = (navigator as any).deviceMemory;
        const isLowMemoryDevice = deviceMemory && deviceMemory <= 2;
        
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        setPerformanceSettings({
          reduceAnimations: prefersReducedMotion || isLowMemoryDevice,
          limitMapTiles: dataSaver || isLowMemoryDevice,
          reduceImageQuality: dataSaver || isLowMemoryDevice,
          enableDataSaver: dataSaver || false,
        });
      };

      detectSlowConnection();
    }
  }, []);

  // Apply performance optimizations to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    if (performanceSettings.reduceAnimations) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
      root.style.setProperty('--transition-duration', '0.2s');
    }
    
    // Apply additional mobile performance optimizations
    if (performanceSettings.limitMapTiles) {
      root.style.setProperty('--map-tile-fade-duration', '0s');
      root.style.setProperty('--map-zoom-animation', 'none');
    } else {
      root.style.setProperty('--map-tile-fade-duration', '0.2s');
      root.style.setProperty('--map-zoom-animation', 'ease');
    }
    
    // Optimize image loading for slow connections
    if (performanceSettings.reduceImageQuality) {
      root.style.setProperty('--image-rendering', 'optimizeSpeed');
    } else {
      root.style.setProperty('--image-rendering', 'optimizeQuality');
    }
  }, [performanceSettings]);

  return {
    networkInfo,
    performanceSettings,
    isSlowConnection: networkInfo.effectiveType === '2g' || 
                     networkInfo.effectiveType === 'slow-2g' ||
                     (networkInfo.downlink && networkInfo.downlink < 1.5),
    isDataSaverEnabled: networkInfo.saveData || false,
  };
};