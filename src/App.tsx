import { useState } from 'react';
import MapView from './components/MapView';
import type { ParkingLocation } from './types';
import styles from './App.module.css'

function App() {
  // Basic state for MapView integration - will be expanded in subsequent tasks
  const [parkingData] = useState<ParkingLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [searchResults] = useState<ParkingLocation[]>([]);

  const handleLocationSelect = (location: ParkingLocation) => {
    setSelectedLocation(location);
  };

  return (
    <div className={styles.app}>
      <div className={styles.mapContainer}>
        <div className={styles.searchContainer}>
          {/* SearchBar component will go here */}
          <div>Search functionality placeholder</div>
        </div>
        <MapView
          parkingData={parkingData}
          selectedLocation={selectedLocation}
          searchResults={searchResults}
          onLocationSelect={handleLocationSelect}
        />
      </div>
      <div className={styles.infoPanel}>
        {/* InfoPanel component will go here */}
        <div>Info panel placeholder</div>
      </div>
    </div>
  )
}

export default App
