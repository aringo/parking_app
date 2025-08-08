import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { AppConfig } from '../types';

interface BrandingContextType {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  reloadConfig: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

interface BrandingProviderProps {
  children: ReactNode;
  configUrl?: string;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ 
  children, 
  configUrl = '/config.json' 
}) => {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`Failed to load configuration: ${response.status}`);
      }
      
      const configData: AppConfig = await response.json();
      setConfig(configData);
      
      // Apply branding to CSS custom properties
      applyBrandingToCSSProperties(configData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error loading configuration';
      setError(errorMessage);
      console.error('Failed to load branding configuration:', err);
      
      // Load default configuration as fallback
      const { defaultAppConfig } = await import('../config/app.config');
      setConfig(defaultAppConfig);
      applyBrandingToCSSProperties(defaultAppConfig);
    } finally {
      setIsLoading(false);
    }
  };

  const applyBrandingToCSSProperties = (config: AppConfig) => {
    const root = document.documentElement;
    const { branding } = config;
    
    // Apply color scheme
    root.style.setProperty('--primary-color', branding.primaryColor);
    root.style.setProperty('--secondary-color', branding.secondaryColor);
    
    // Apply background image if provided
    if (branding.backgroundImage) {
      root.style.setProperty('--background-image', `url(${branding.backgroundImage})`);
      document.body.style.backgroundImage = `url(${branding.backgroundImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      root.style.removeProperty('--background-image');
      document.body.style.backgroundImage = '';
    }
    
    // Apply custom CSS if provided
    if (branding.customCSS) {
      let customStyleElement = document.getElementById('custom-branding-css');
      if (!customStyleElement) {
        customStyleElement = document.createElement('style');
        customStyleElement.id = 'custom-branding-css';
        document.head.appendChild(customStyleElement);
      }
      customStyleElement.textContent = branding.customCSS;
    }
    
    // Update document title with town name
    document.title = `${branding.name} - Parking Finder`;
  };

  useEffect(() => {
    loadConfig();
  }, [configUrl]);

  const reloadConfig = async () => {
    await loadConfig();
  };

  const value: BrandingContextType = {
    config,
    isLoading,
    error,
    reloadConfig,
  };

  return (
    <BrandingContext.Provider value={value}>
      {children}
    </BrandingContext.Provider>
  );
};