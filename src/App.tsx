import { useState } from 'react';
import MapView from './components/MapView';
import InfoPanel from './components/InfoPanel';
import SearchBar from './components/SearchBar';
import type { ParkingLocation } from './types';
import styles from './App.module.css'

function App() {
  // Sample data for testing the parking marker system
  const [parkingData] = useState<ParkingLocation[]>([
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
      name: 'Full Parking Garage',
      address: '789 Business Blvd',
      coordinates: { lat: 37.7649, lng: -122.4294 },
      capacity: { total: 200, available: 0 },
      rules: { timeLimit: 'All day', cost: '$5/hour' },
      type: 'garage',
      lastUpdated: '2024-01-01T12:00:00Z',
    }
  ]);
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [searchResults, setSearchResults] = useState<ParkingLocation[]>([]);

  const handleLocationSelect = (location: ParkingLocation) => {
    setSelectedLocation(location);
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

  return (
    <div className={styles.app}>
      <div className={styles.mapContainer}>
        <div className={styles.searchContainer}>
          <SearchBar
            parkingData={parkingData}
            onSearchResults={handleSearchResults}
            onClearSearch={handleClearSearch}
          />
        </div>
        <MapView
          parkingData={parkingData}
          selectedLocation={selectedLocation}
          searchResults={searchResults}
          onLocationSelect={handleLocationSelect}
        />
      </div>
      <div className={styles.infoPanel}>
        <InfoPanel
          selectedLocation={selectedLocation}
          onDirectionsClick={handleDirectionsClick}
        />
      </div>
    </div>
  )
}

export default App
