import React from 'react';
import type { ParkingLocation } from '../../types';
import styles from './MapFallback.module.css';

interface MapFallbackProps {
  parkingData: ParkingLocation[];
  selectedLocation: ParkingLocation | null;
  searchResults: ParkingLocation[];
  onLocationSelect: (location: ParkingLocation) => void;
  error?: string;
}

const MapFallback: React.FC<MapFallbackProps> = ({
  parkingData,
  selectedLocation,
  searchResults,
  onLocationSelect,
  error
}) => {
  // Determine which locations to display - search results take precedence
  const locationsToDisplay = searchResults.length > 0 ? searchResults : parkingData;

  const getAvailabilityStatus = (location: ParkingLocation) => {
    const { available, total } = location.capacity;
    const percentage = (available / total) * 100;
    
    if (percentage === 0) return 'full';
    if (percentage < 25) return 'limited';
    return 'available';
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return '#059669'; // WCAG AA compliant green
      case 'limited': return '#d97706'; // WCAG AA compliant orange
      case 'full': return '#dc2626'; // WCAG AA compliant red
      default: return '#475569'; // WCAG AA compliant gray
    }
  };

  const handleDirectionsClick = (location: ParkingLocation) => {
    const { lat, lng } = location.coordinates;
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  return (
    <div className={styles.mapFallback} role="region" aria-label="Parking locations list">
      <div className={styles.header}>
        <h3 className={styles.title}>Parking Locations</h3>
        {error && (
          <div className={styles.errorMessage} role="alert">
            <span className={styles.errorIcon} aria-hidden="true">⚠️</span>
            Map unavailable: {error}
          </div>
        )}
        <p className={styles.subtitle} aria-live="polite">
          {locationsToDisplay.length} location{locationsToDisplay.length !== 1 ? 's' : ''} found
        </p>
      </div>

      <div className={styles.locationsList} role="list">
        {locationsToDisplay.length === 0 ? (
          <div className={styles.emptyState} role="status">
            <p>No parking locations available</p>
            <p className={styles.emptySubtext}>
              Please check your connection and try again
            </p>
          </div>
        ) : (
          locationsToDisplay.map((location) => {
            const status = getAvailabilityStatus(location);
            const isSelected = selectedLocation?.id === location.id;
            
            return (
              <div
                key={location.id}
                className={`${styles.locationCard} ${isSelected ? styles.selected : ''}`}
                onClick={() => onLocationSelect(location)}
                role="listitem"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onLocationSelect(location);
                  }
                }}
                aria-label={`${location.name} parking location. ${location.capacity.available} of ${location.capacity.total} spaces available. Status: ${status}. Click for details.`}
              >
                <div className={styles.locationHeader}>
                  <h4 className={styles.locationName}>{location.name}</h4>
                  <div 
                    className={styles.statusIndicator}
                    style={{ backgroundColor: getAvailabilityColor(status) }}
                    aria-label={`Status: ${status}. ${location.capacity.available} of ${location.capacity.total} spaces available`}
                    role="status"
                  />
                </div>
                
                <p className={styles.locationAddress}>{location.address}</p>
                
                <div className={styles.locationDetails}>
                  <div className={styles.capacity}>
                    <span className={styles.available}>{location.capacity.available}</span>
                    <span className={styles.separator}>/</span>
                    <span className={styles.total}>{location.capacity.total}</span>
                    <span className={styles.label}>spaces</span>
                  </div>
                  
                  <div className={styles.type}>
                    {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                  </div>
                </div>

                {location.rules.timeLimit && (
                  <div className={styles.timeLimit}>
                    Time limit: {location.rules.timeLimit}
                  </div>
                )}

                {location.rules.cost && (
                  <div className={styles.cost}>
                    Cost: {location.rules.cost}
                  </div>
                )}

                <div className={styles.actions}>
                  <button
                    className={styles.directionsButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectionsClick(location);
                    }}
                    type="button"
                    aria-label={`Get directions to ${location.name} at ${location.address}`}
                  >
                    Get Directions
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MapFallback;