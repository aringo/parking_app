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
      <div className={`${styles.header} ${className || ''}`}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const { branding } = config;

  return (
    <div className={`${styles.header} ${className || ''}`}>
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
        <h1 className={styles.title}>{branding.name}</h1>
      </div>
    </div>
  );
};

export default BrandingHeader;