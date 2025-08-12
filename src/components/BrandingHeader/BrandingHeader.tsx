import React from 'react';
import { useBranding } from '../../contexts/BrandingContext';
import styles from './BrandingHeader.module.css';

interface BrandingHeaderProps {
  className?: string;
}

export const BrandingHeader: React.FC<BrandingHeaderProps> = ({ className }) => {
  const { config, isLoading } = useBranding();

  if (isLoading || !config) {
    return (
      <header className={`${styles.header} ${className || ''}`} role="banner">
        <div className={styles.loading} aria-live="polite">
          Loading application...
        </div>
      </header>
    );
  }

  const { branding } = config;

  return (
    <header className={`${styles.header} ${className || ''}`} role="banner">
      <div className={styles.brandingContent}>
        {branding.logo && (
          <img 
            src={branding.logo} 
            alt={`${branding.name} logo`}
            className={styles.logo}
            onError={(e) => {
              // Hide logo if it fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
        <h1 className={styles.title}>
          {branding.name.toLowerCase().includes('parking') 
            ? branding.name 
            : `${branding.name} Parking Finder`}
        </h1>
      </div>
    </header>
  );
};

export default BrandingHeader;