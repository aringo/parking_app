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
          <div className={styles.dragHandle}></div>
          {onClose && (
            <button 
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close info panel"
            >
              ×
            </button>
          )}
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🅿️</div>
          <h3 className={styles.emptyStateTitle}>Select a Parking Location</h3>
          <p className={styles.emptyStateDescription}>
            Click on any parking marker on the map to view detailed information about 
            capacity, availability, rules, and get directions.
          </p>
          <div className={styles.generalInfo}>
            <h4>General Parking Information</h4>
            <ul>
              <li>Green markers indicate good availability</li>
              <li>Yellow markers indicate limited spaces</li>
              <li>Red markers indicate full or no availability</li>
              <li>Click any marker for detailed information</li>
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
        <div className={styles.dragHandle}></div>
        {onClose && (
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close info panel"
          >
            ×
          </button>
        )}
      </div>
      <div className={styles.header}>
        <h2 className={styles.locationName}>{selectedLocation.name}</h2>
        <div className={styles.locationType}>
          {selectedLocation.type.charAt(0).toUpperCase() + selectedLocation.type.slice(1)}
        </div>
      </div>

      <div className={styles.address}>
        <span className={styles.addressIcon}>📍</span>
        {selectedLocation.address}
      </div>

      <div className={styles.capacitySection}>
        <h3 className={styles.sectionTitle}>Availability</h3>
        <div className={styles.capacityDisplay}>
          <div 
            className={styles.availabilityIndicator}
            style={{ backgroundColor: availabilityColor }}
          >
            <span className={styles.availableCount}>{selectedLocation.capacity.available}</span>
            <span className={styles.availableLabel}>Available</span>
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
        <h3 className={styles.sectionTitle}>Parking Rules</h3>
        <div className={styles.rulesGrid}>
          {selectedLocation.rules.timeLimit && (
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>⏰</span>
              <div>
                <div className={styles.ruleLabel}>Time Limit</div>
                <div className={styles.ruleValue}>{selectedLocation.rules.timeLimit}</div>
              </div>
            </div>
          )}
          
          {selectedLocation.rules.cost && (
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>💰</span>
              <div>
                <div className={styles.ruleLabel}>Cost</div>
                <div className={styles.ruleValue}>{selectedLocation.rules.cost}</div>
              </div>
            </div>
          )}
          
          {selectedLocation.rules.hours && (
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>🕐</span>
              <div>
                <div className={styles.ruleLabel}>Hours</div>
                <div className={styles.ruleValue}>{selectedLocation.rules.hours}</div>
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
          aria-label={`Get directions to ${selectedLocation.name}`}
        >
          <span className={styles.directionsIcon}>🧭</span>
          Get Directions
        </button>
      </div>

      <div className={styles.lastUpdated}>
        Last updated: {formatLastUpdated(selectedLocation.lastUpdated)}
      </div>
    </div>
  );
};

export default InfoPanel;