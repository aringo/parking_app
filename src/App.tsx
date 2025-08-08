import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import InfoPanel from './components/InfoPanel';
import SearchBar from './components/SearchBar';
import { RefreshIndicator } from './components/RefreshIndicator';
import { BrandingHeader } from './components/BrandingHeader';
import { BrandingProvider } from './contexts/BrandingContext';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization';
import type { ParkingLocation } from './types';
import styles from './App.module.css'

function AppContent() {
  // Use auto-refresh hook to manage parking data
  const {
    parkingData,
    refreshState,
    refresh,
    isDataFresh,
    timeUntilNextRefresh,
  } = useAutoRefresh({
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    autoStart: true,
  });

  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [searchResults, setSearchResults] = useState<ParkingLocation[]>([]);
  const [isInfoPanelExpanded, setIsInfoPanelExpanded] = useState(false);

  // Performance optimization for mobile and slow connections
  const { performanceSettings, isSlowConnection } = usePerformanceOptimization();

  // Preserve selected location during refresh if it still exists in new data
  useEffect(() => {
    if (selectedLocation && parkingData.length > 0) {
      const updatedLocation = parkingData.find(loc => loc.id === selectedLocation.id);
      if (updatedLocation) {
        setSelectedLocation(updatedLocation);
      } else {
        // Location no longer exists, clear selection
        setSelectedLocation(null);
      }
    }
  }, [parkingData, selectedLocation]);

  // Clear search results if they no longer exist in updated data
  useEffect(() => {
    if (searchResults.length > 0 && parkingData.length > 0) {
      const validResults = searchResults.filter(result => 
        parkingData.some(loc => loc.id === result.id)
      );
      if (validResults.length !== searchResults.length) {
        setSearchResults(validResults);
      }
    }
  }, [parkingData, searchResults]);

  const handleLocationSelect = (location: ParkingLocation) => {
    setSelectedLocation(location);
    // Auto-expand info panel on mobile when location is selected
    setIsInfoPanelExpanded(true);
  };

  const handleSearchResults = (results: ParkingLocation[]) => {
    setSearchResults(results);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
  };

  const handleDirectionsClick = (location: ParkingLocation) => {
    const { lat, lng } = location.coordinates;
    
    // Create URLs for different mapping services
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const appleMapsUrl = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
    
    // Detect user agent to provide the most appropriate mapping service
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    let defaultUrl = googleMapsUrl;
    
    if (isIOS) {
      defaultUrl = appleMapsUrl;
    }
    
    // Try to open the native app, fallback to web version
    try {
      window.open(defaultUrl, '_blank');
    } catch (error) {
      // Fallback to Google Maps web if native app fails
      window.open(googleMapsUrl, '_blank');
    }
  };

  const toggleInfoPanel = () => {
    setIsInfoPanelExpanded(!isInfoPanelExpanded);
  };

  return (
    <div className={styles.app}>
      <BrandingHeader className={styles.header} />
      <div className={styles.mainContent}>
        <div className={styles.mapContainer}>
          <div className={styles.searchContainer}>
            <SearchBar
              parkingData={parkingData}
              onSearchResults={handleSearchResults}
              onClearSearch={handleClearSearch}
            />
          </div>
          <div className={styles.refreshContainer}>
            <RefreshIndicator
              refreshState={refreshState}
              onRefresh={refresh}
              timeUntilNextRefresh={timeUntilNextRefresh}
              isDataFresh={isDataFresh}
            />
          </div>
          <MapView
            parkingData={parkingData}
            selectedLocation={selectedLocation}
            searchResults={searchResults}
            onLocationSelect={handleLocationSelect}
            performanceSettings={performanceSettings}
          />
        </div>
        <div className={`${styles.infoPanel} ${isInfoPanelExpanded ? styles.expanded : ''}`}>
          <InfoPanel
            selectedLocation={selectedLocation}
            onDirectionsClick={handleDirectionsClick}
            onClose={() => setIsInfoPanelExpanded(false)}
          />
        </div>
        <button 
          className={styles.mobileToggle}
          onClick={toggleInfoPanel}
          aria-label={isInfoPanelExpanded ? "Close info panel" : "Open info panel"}
        >
          {isInfoPanelExpanded ? '×' : 'ℹ'}
        </button>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrandingProvider>
      <AppContent />
    </BrandingProvider>
  );
}

export default App
