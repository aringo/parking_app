import React from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import type { MapViewProps } from '../../types';
import styles from './MapView.module.css';

// Import Leaflet CSS and configuration
import 'leaflet/dist/leaflet.css';
import './leafletConfig';

const MapView: React.FC<MapViewProps> = () => {
  // Props will be used in future tasks for markers and interactions
  // Default center coordinates (can be overridden by app config)
  const defaultCenter: LatLngExpression = [37.7749, -122.4194];
  const defaultZoom = 13;

  return (
    <div className={styles.mapContainer}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className={styles.map}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Parking markers will be added in future tasks */}
      </MapContainer>
    </div>
  );
};

export default MapView;