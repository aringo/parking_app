import React from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import { DivIcon } from 'leaflet';
import type { ParkingMarkerProps, AvailabilityStatus } from '../../types';
import styles from './ParkingMarker.module.css';

// Helper function to determine availability status
const getAvailabilityStatus = (available: number, total: number): AvailabilityStatus => {
  if (total === 0) return 'unknown';
  const percentage = (available / total) * 100;
  
  if (percentage === 0) return 'full';
  if (percentage <= 25) return 'limited';
  return 'available';
};

// Helper function to get marker color based on availability
const getMarkerColor = (status: AvailabilityStatus): string => {
  switch (status) {
    case 'available':
      return '#059669'; // WCAG AA compliant green
    case 'limited':
      return '#d97706'; // WCAG AA compliant orange
    case 'full':
      return '#dc2626'; // WCAG AA compliant red
    case 'unknown':
    default:
      return '#475569'; // WCAG AA compliant gray
  }
};

// Create custom marker icon
const createCustomIcon = (status: AvailabilityStatus, isSelected: boolean): DivIcon => {
  const color = getMarkerColor(status);
  const size = isSelected ? 36 : 28; // Larger for better touch targets
  const borderWidth = isSelected ? 3 : 2;
  
  return new DivIcon({
    html: `
      <div class="${styles.markerIcon}" style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border: ${borderWidth}px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.1s ease;
      ">
        <div class="${styles.markerInner}">P</div>
      </div>
    `,
    className: styles.customMarker,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

const ParkingMarker: React.FC<ParkingMarkerProps> = ({
  location,
  isSelected,
  onClick
}) => {
  const availabilityStatus = getAvailabilityStatus(
    location.capacity.available,
    location.capacity.total
  );
  
  const customIcon = createCustomIcon(availabilityStatus, isSelected);
  
  const handleClick = () => {
    onClick(location);
  };

  // Format tooltip content
  const getTooltipContent = () => {
    const { available, total } = location.capacity;
    const statusText = availabilityStatus.charAt(0).toUpperCase() + availabilityStatus.slice(1);
    
    return (
      <div className={styles.tooltip}>
        <div className={styles.tooltipTitle}>{location.name}</div>
        <div className={styles.tooltipInfo}>
          <div>Available: {available}/{total}</div>
          <div>Status: {statusText}</div>
          {location.type && (
            <div>Type: {location.type.charAt(0).toUpperCase() + location.type.slice(1)}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Marker
      position={[location.coordinates.lat, location.coordinates.lng]}
      icon={customIcon}
      eventHandlers={{
        click: handleClick,
        keydown: (e: any) => {
          if (e.originalEvent.key === 'Enter' || e.originalEvent.key === ' ') {
            e.originalEvent.preventDefault();
            handleClick();
          }
        }
      }}
      aria-label={`${location.name} parking location. ${location.capacity.available} of ${location.capacity.total} spaces available. Status: ${availabilityStatus}. Click for details.`}
      role="button"
      tabIndex={0}
    >
      <Tooltip 
        direction="top" 
        offset={[0, -10]} 
        opacity={0.9}
        aria-hidden="true"
      >
        {getTooltipContent()}
      </Tooltip>
    </Marker>
  );
};

export default ParkingMarker;