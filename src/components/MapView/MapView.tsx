import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { MapViewProps } from '../../types';
import ParkingMarker from '../ParkingMarker';
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
  // Default center coordinates (can be overridden by app config)
  const defaultCenter: LatLngExpression = [37.7749, -122.4194];
  const defaultZoom = 13;

  // Determine which locations to display - search results take precedence
  const locationsToDisplay = searchResults.length > 0 ? searchResults : parkingData;

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className={styles.map}
        zoomControl={true}
        scrollWheelZoom={true}
        touchZoom={true}
        doubleClickZoom={true}
        dragging={true}
        tap={true}
        tapTolerance={20} // Increased for better mobile touch handling
        zoomSnap={performanceSettings?.limitMapTiles ? 1 : 0.5}
        zoomDelta={performanceSettings?.limitMapTiles ? 1 : 0.5}
        wheelPxPerZoomLevel={60}
        preferCanvas={performanceSettings?.limitMapTiles}
        // Additional mobile optimizations
        bounceAtZoomLimits={false}
        maxBoundsViscosity={0.8}
        inertia={true}
        inertiaDeceleration={3000}
        inertiaMaxSpeed={1500}
        worldCopyJump={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
    </div>
  );
};

export default MapView;