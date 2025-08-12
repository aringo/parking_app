import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { MapViewProps } from '../../types';
import ParkingMarker from '../ParkingMarker';
import MapFallback from '../MapFallback';
import ErrorBoundary from '../ErrorBoundary';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import styles from './MapView.module.css';

// Import Leaflet CSS and configuration
import 'leaflet/dist/leaflet.css';
import './leafletConfig';

const MapView: React.FC<MapViewProps> = ({
  parkingData,
  selectedLocation,
  searchResults,
  onLocationSelect,
  performanceSettings
}) => {
  const [mapError, setMapError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const networkStatus = useNetworkStatus();

  // Default center coordinates (can be overridden by app config)
  const defaultCenter: LatLngExpression = [37.7749, -122.4194];
  const defaultZoom = 13;

  // Determine which locations to display - search results take precedence
  const locationsToDisplay = searchResults.length > 0 ? searchResults : parkingData;

  // Handle map loading errors
  useEffect(() => {
    const handleMapError = (error: Event) => {
      console.error('Map loading error:', error);
      setMapError('Failed to load map tiles');
      setShowFallback(true);
    };

    // Listen for tile loading errors
    // const handleTileError = () => {
    //   if (!networkStatus.isOnline) {
    //     setMapError('No internet connection');
    //     setShowFallback(true);
    //   } else {
    //     setMapError('Map tiles failed to load');
    //     // Don't immediately show fallback for tile errors, give it a chance to recover
    //     setTimeout(() => {
    //       setShowFallback(true);
    //     }, 5000);
    //   }
    // };

    // Add global error listeners
    window.addEventListener('error', handleMapError);
    
    return () => {
      window.removeEventListener('error', handleMapError);
    };
  }, [networkStatus.isOnline]);

  // Show fallback if offline and no cached tiles
  useEffect(() => {
    if (!networkStatus.isOnline && parkingData.length > 0) {
      setMapError('You are offline');
      setShowFallback(true);
    } else if (networkStatus.isOnline && mapError === 'You are offline') {
      setMapError(null);
      setShowFallback(false);
    }
  }, [networkStatus.isOnline, parkingData.length, mapError]);

  // Render fallback UI if map failed or offline
  if (showFallback || (!networkStatus.isOnline && parkingData.length > 0)) {
    return (
      <div className={styles.mapContainer}>
        <MapFallback
          parkingData={parkingData}
          selectedLocation={selectedLocation}
          searchResults={searchResults}
          onLocationSelect={onLocationSelect}
          error={mapError || undefined}
        />
      </div>
    );
  }

  // Show loading state if no data and online
  if (parkingData.length === 0 && networkStatus.isOnline) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.loadingState} role="status" aria-live="polite">
          <div className={styles.loadingSpinner} aria-hidden="true" />
          <p>Loading parking data...</p>
        </div>
      </div>
    );
  }

  // Show offline message if no data and offline
  if (parkingData.length === 0 && !networkStatus.isOnline) {
    return (
      <div className={styles.mapContainer}>
        <div className={styles.offlineState} role="alert">
          <div className={styles.offlineIcon} aria-hidden="true">📡</div>
          <h3>You're offline</h3>
          <p>Please check your internet connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      <ErrorBoundary
        fallback={
          <MapFallback
            parkingData={parkingData}
            selectedLocation={selectedLocation}
            searchResults={searchResults}
            onLocationSelect={onLocationSelect}
            error="Map component crashed"
          />
        }
        onError={(error) => {
          console.error('Map component error:', error);
          setMapError(`Map error: ${error.message}`);
        }}
      >
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className={styles.map}
          zoomControl={true}
          scrollWheelZoom={true}
          touchZoom={true}
          doubleClickZoom={true}
          dragging={true}
          zoomSnap={performanceSettings?.limitMapTiles ? 1 : 0.5}
          zoomDelta={performanceSettings?.limitMapTiles ? 1 : 0.5}
          wheelPxPerZoomLevel={60}
          preferCanvas={performanceSettings?.limitMapTiles}
          bounceAtZoomLimits={false}
          maxBoundsViscosity={0.8}
          inertia={true}
          inertiaDeceleration={performanceSettings?.limitMapTiles ? 2000 : 3000}
          inertiaMaxSpeed={performanceSettings?.limitMapTiles ? 1000 : 1500}
          worldCopyJump={false}
          fadeAnimation={!performanceSettings?.reduceAnimations}
          markerZoomAnimation={!performanceSettings?.reduceAnimations}
          zoomAnimation={!performanceSettings?.reduceAnimations}
          keyboard={true}
          boxZoom={false}

          aria-label="Interactive parking map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            errorTileUrl="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNHB4IiBmaWxsPSIjNmM3NTdkIj5UaWxlIE5vdCBBdmFpbGFibGU8L3RleHQ+PC9zdmc+"

          />
          {locationsToDisplay.map((location) => (
            <ParkingMarker
              key={location.id}
              location={location}
              isSelected={selectedLocation?.id === location.id}
              onClick={onLocationSelect}
            />
          ))}
        </MapContainer>
      </ErrorBoundary>
      
      {/* Network status indicator */}
      {!networkStatus.isOnline && (
        <div className={styles.networkStatus} role="status" aria-live="polite">
          <span className={styles.offlineIndicator}>
            <span aria-hidden="true">📡</span> Offline
          </span>
        </div>
      )}
      
      {networkStatus.isSlowConnection && (
        <div className={styles.networkStatus} role="status" aria-live="polite">
          <span className={styles.slowConnectionIndicator}>
            <span aria-hidden="true">🐌</span> Slow connection
          </span>
        </div>
      )}
    </div>
  );
};

export default MapView;