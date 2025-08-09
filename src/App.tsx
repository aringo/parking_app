import { useState, useEffect } from 'react';
import MapView from './components/MapView';
import InfoPanel from './components/InfoPanel';
import SearchBar from './components/SearchBar';
import { RefreshIndicator } from './components/RefreshIndicator';
import { BrandingHeader } from './components/BrandingHeader';
import { BrandingProvider } from './contexts/BrandingContext';
import ErrorBoundary from './components/ErrorBoundary';
import { useAutoRefresh } from './hooks/useAutoRefresh';
import { usePerformanceOptimization } from './hooks/usePerformanceOptimization';
import { useNetworkStatus } from './hooks/useNetworkStatus';
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

  // Keyboard navigation state
  const [focusedElementId, setFocusedElementId] = useState<string | null>(null);

  // Performance optimization for mobile and slow connections
  const { performanceSettings } = usePerformanceOptimization();
  
  // Network status for offline handling
  const networkStatus = useNetworkStatus();

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

  // Keyboard navigation handlers
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Handle global keyboard shortcuts
    switch (event.key) {
      case 'Escape':
        if (isInfoPanelExpanded) {
          setIsInfoPanelExpanded(false);
          event.preventDefault();
        }
        if (selectedLocation) {
          setSelectedLocation(null);
          event.preventDefault();
        }
        break;
      case 'i':
      case 'I':
        if (event.ctrlKey || event.metaKey) {
          toggleInfoPanel();
          event.preventDefault();
        }
        break;
      case 'r':
      case 'R':
        if (event.ctrlKey || event.metaKey) {
          refresh();
          event.preventDefault();
        }
        break;
      case 'f':
      case 'F':
        if (event.ctrlKey || event.metaKey) {
          // Focus search bar
          const searchInput = document.querySelector('[role="combobox"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            event.preventDefault();
          }
        }
        break;
    }
  };

  return (
    <div 
      className={styles.app}
      onKeyDown={handleKeyDown}
      role="application"
      aria-label="Parking Finder Application"
    >
      {/* Skip link for keyboard navigation */}
      <a 
        href="#main-content" 
        className="skip-link"
        onFocus={() => setFocusedElementId('skip-link')}
        onBlur={() => setFocusedElementId(null)}
      >
        Skip to main content
      </a>
      
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('App header error:', error, errorInfo);
        }}
      >
        <BrandingHeader className={styles.header} />
      </ErrorBoundary>
      
      <main 
        id="main-content" 
        className={styles.mainContent}
        role="main"
        aria-label="Parking map and information"
      >
        <div className={styles.mapContainer}>
          <div className={styles.searchContainer}>
            <ErrorBoundary
              fallback={
                <div className={styles.errorFallback} role="alert">
                  <p>Search unavailable</p>
                </div>
              }
            >
              <SearchBar
                parkingData={parkingData}
                onSearchResults={handleSearchResults}
                onClearSearch={handleClearSearch}
              />
            </ErrorBoundary>
          </div>
          
          <div className={styles.refreshContainer}>
            <ErrorBoundary
              fallback={
                <div className={styles.errorFallback} role="alert">
                  <button 
                    onClick={refresh} 
                    className={styles.simpleRefreshButton}
                    aria-label="Refresh parking data"
                  >
                    Refresh
                  </button>
                </div>
              }
            >
              <RefreshIndicator
                refreshState={refreshState}
                onRefresh={refresh}
                timeUntilNextRefresh={timeUntilNextRefresh}
                isDataFresh={isDataFresh}
              />
            </ErrorBoundary>
          </div>
          
          {/* Network status indicator */}
          {!networkStatus.isOnline && (
            <div 
              className={styles.networkBanner}
              role="status"
              aria-live="polite"
              aria-label="Network status"
            >
              <span className={styles.offlineIcon} aria-hidden="true">📡</span>
              <span>You're offline. Showing cached data.</span>
            </div>
          )}
          
          {refreshState.error && (
            <div 
              className={styles.errorBanner}
              role="alert"
              aria-live="assertive"
              aria-label="Data update error"
            >
              <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
              <span>Failed to update data: {refreshState.error}</span>
              <button 
                onClick={refresh} 
                className={styles.retryButton}
                aria-label="Retry data update"
              >
                Retry
              </button>
            </div>
          )}
          
          <section 
            role="region" 
            aria-label="Interactive parking map"
            aria-describedby="map-instructions"
          >
            <div 
              id="map-instructions" 
              className="sr-only"
              aria-live="polite"
            >
              {parkingData.length > 0 
                ? `Map showing ${parkingData.length} parking locations. Use arrow keys to navigate markers, Enter to select, or use the search bar to find specific locations.`
                : "Loading parking data..."
              }
            </div>
            <MapView
              parkingData={parkingData}
              selectedLocation={selectedLocation}
              searchResults={searchResults}
              onLocationSelect={handleLocationSelect}
              performanceSettings={performanceSettings}
            />
          </section>
        </div>
        
        <div 
          className={`${styles.infoPanel} ${isInfoPanelExpanded ? styles.expanded : ''}`}
          id="info-panel"
          role="complementary"
          aria-label="Parking location information"
        >
          <ErrorBoundary
            fallback={
              <div className={styles.infoPanelError} role="alert">
                <h3>Information unavailable</h3>
                <p>Unable to display parking details.</p>
              </div>
            }
          >
            <InfoPanel
              selectedLocation={selectedLocation}
              onDirectionsClick={handleDirectionsClick}
              onClose={() => setIsInfoPanelExpanded(false)}
            />
          </ErrorBoundary>
        </div>
        
        <button 
          className={styles.mobileToggle}
          onClick={toggleInfoPanel}
          aria-label={isInfoPanelExpanded ? "Close info panel" : "Open info panel"}
          aria-expanded={isInfoPanelExpanded}
          aria-controls="info-panel"
          type="button"
        >
          <span aria-hidden="true">
            {isInfoPanelExpanded ? '×' : 'ℹ'}
          </span>
        </button>
      </main>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Critical app error:', error, errorInfo);
        // Could send to error reporting service here
      }}
    >
      <BrandingProvider>
        <AppContent />
      </BrandingProvider>
    </ErrorBoundary>
  );
}

export default App
