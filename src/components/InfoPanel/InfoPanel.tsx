import React from 'react';
import type { InfoPanelProps, ParkingLocation } from '../../types';
import styles from './InfoPanel.module.css';

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedLocation, onDirectionsClick, onClose }) => {
  const formatLastUpdated = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const getAvailabilityStatus = (location: ParkingLocation): 'available' | 'limited' | 'full' => {
    const { available, total } = location.capacity;
    const percentage = (available / total) * 100;
    
    if (available === 0) return 'full';
    if (percentage <= 20) return 'limited';
    return 'available';
  };

  const getAvailabilityColor = (status: string): string => {
    switch (status) {
      case 'available': return 'var(--success-color)';
      case 'limited': return 'var(--warning-color)';
      case 'full': return 'var(--error-color)';
      default: return 'var(--secondary-color)';
    }
  };

  const handleDirectionsClick = () => {
    if (selectedLocation) {
      onDirectionsClick(selectedLocation);
    }
  };

  if (!selectedLocation) {
    return (
      <div className={styles.infoPanelContainer}>
        <div className={styles.mobileHeader}>
          <div 
            className={styles.dragHandle}
            aria-label="Drag handle for mobile panel"
            role="button"
            tabIndex={0}
          ></div>
          {onClose && (
            <button 
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close parking information panel"
              type="button"
            >
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon} aria-hidden="true">🅿️</div>
          <h3 className={styles.emptyStateTitle}>Select a Parking Location</h3>
          <p className={styles.emptyStateDescription}>
            Click on any parking marker on the map to view detailed information about 
            capacity, availability, rules, and get directions.
          </p>
          <div className={styles.generalInfo}>
            <h4>General Parking Information</h4>
            <ul>
              <li>Green markers indicate good availability (more than 25% spaces)</li>
              <li>Yellow markers indicate limited spaces (25% or fewer spaces)</li>
              <li>Red markers indicate full or no availability</li>
              <li>Click any marker for detailed information and directions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const availabilityStatus = getAvailabilityStatus(selectedLocation);
  const availabilityColor = getAvailabilityColor(availabilityStatus);

  return (
    <div className={styles.infoPanelContainer}>
      <div className={styles.mobileHeader}>
        <div 
          className={styles.dragHandle}
          aria-label="Drag handle for mobile panel"
          role="button"
          tabIndex={0}
        ></div>
        {onClose && (
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close parking information panel"
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
      <div className={styles.header}>
        <h2 className={styles.locationName} id="location-name">
          {selectedLocation.name}
        </h2>
        <div 
          className={styles.locationType}
          aria-label={`Parking type: ${selectedLocation.type}`}
        >
          {selectedLocation.type.charAt(0).toUpperCase() + selectedLocation.type.slice(1)}
        </div>
      </div>

      <div className={styles.address}>
        <span className={styles.addressIcon} aria-hidden="true">📍</span>
        <span aria-label={`Address: ${selectedLocation.address}`}>
          {selectedLocation.address}
        </span>
      </div>

      <div className={styles.capacitySection}>
        <h3 className={styles.sectionTitle} id="availability-section">Availability</h3>
        <div className={styles.capacityDisplay}>
          <div 
            className={styles.availabilityIndicator}
            style={{ backgroundColor: availabilityColor }}
            role="status"
            aria-label={`${selectedLocation.capacity.available} spaces available out of ${selectedLocation.capacity.total} total spaces. Status: ${availabilityStatus}`}
          >
            <span className={styles.availableCount} aria-hidden="true">
              {selectedLocation.capacity.available}
            </span>
            <span className={styles.availableLabel} aria-hidden="true">Available</span>
          </div>
          <div className={styles.capacityDetails}>
            <div className={styles.capacityRow}>
              <span>Total Spaces:</span>
              <span>{selectedLocation.capacity.total}</span>
            </div>
            <div className={styles.capacityRow}>
              <span>Available:</span>
              <span>{selectedLocation.capacity.available}</span>
            </div>
            {selectedLocation.capacity.reserved && (
              <div className={styles.capacityRow}>
                <span>Reserved:</span>
                <span>{selectedLocation.capacity.reserved}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.rulesSection}>
        <h3 className={styles.sectionTitle} id="rules-section">Parking Rules</h3>
        <div className={styles.rulesGrid} role="list">
          {selectedLocation.rules.timeLimit && (
            <div className={styles.ruleItem} role="listitem">
              <span className={styles.ruleIcon} aria-hidden="true">⏰</span>
              <div>
                <div className={styles.ruleLabel}>Time Limit</div>
                <div className={styles.ruleValue} aria-label={`Time limit: ${selectedLocation.rules.timeLimit}`}>
                  {selectedLocation.rules.timeLimit}
                </div>
              </div>
            </div>
          )}
          
          {selectedLocation.rules.cost && (
            <div className={styles.ruleItem} role="listitem">
              <span className={styles.ruleIcon} aria-hidden="true">💰</span>
              <div>
                <div className={styles.ruleLabel}>Cost</div>
                <div className={styles.ruleValue} aria-label={`Parking cost: ${selectedLocation.rules.cost}`}>
                  {selectedLocation.rules.cost}
                </div>
              </div>
            </div>
          )}
          
          {selectedLocation.rules.hours && (
            <div className={styles.ruleItem} role="listitem">
              <span className={styles.ruleIcon} aria-hidden="true">🕐</span>
              <div>
                <div className={styles.ruleLabel}>Hours</div>
                <div className={styles.ruleValue} aria-label={`Operating hours: ${selectedLocation.rules.hours}`}>
                  {selectedLocation.rules.hours}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {selectedLocation.rules.restrictions && selectedLocation.rules.restrictions.length > 0 && (
          <div className={styles.restrictions}>
            <div className={styles.restrictionsTitle}>Restrictions:</div>
            <ul className={styles.restrictionsList}>
              {selectedLocation.rules.restrictions.map((restriction, index) => (
                <li key={index} className={styles.restrictionItem}>
                  {restriction}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.actionsSection}>
        <button 
          className={styles.directionsButton}
          onClick={handleDirectionsClick}
          aria-label={`Get directions to ${selectedLocation.name} at ${selectedLocation.address}`}
          type="button"
        >
          <span className={styles.directionsIcon} aria-hidden="true">🧭</span>
          Get Directions
        </button>
      </div>

      <div 
        className={styles.lastUpdated}
        role="status"
        aria-label={`Data last updated: ${formatLastUpdated(selectedLocation.lastUpdated)}`}
      >
        Last updated: {formatLastUpdated(selectedLocation.lastUpdated)}
      </div>
    </div>
  );
};

export default InfoPanel;