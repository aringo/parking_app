/**
 * Data processing functions for parking locations and app configuration
 */

/**
 * Update parking locations JSON file
 */
function updateParkingLocations(newData) {
  try {
    // Get existing parking data
    let parkingLocations = getCurrentParkingData();
    
    // Generate unique ID for new location
    const locationId = generateLocationId(newData.name, newData.address);
    
    // Create parking location object
    const parkingLocation = {
      id: locationId,
      name: newData.name,
      address: newData.address,
      coordinates: {
        lat: newData.lat,
        lng: newData.lng
      },
      capacity: {
        total: newData.totalCapacity,
        available: newData.availableSpaces || newData.totalCapacity,
        reserved: newData.reservedSpaces || 0
      },
      rules: {
        timeLimit: newData.timeLimit || null,
        cost: newData.cost || 'Free',
        restrictions: newData.restrictions || [],
        hours: newData.hours || '24/7'
      },
      type: newData.type,
      lastUpdated: new Date().toISOString()
    };
    
    // Update or add the location
    const existingIndex = parkingLocations.findIndex(loc => loc.id === locationId);
    if (existingIndex >= 0) {
      parkingLocations[existingIndex] = parkingLocation;
      console.log(`Updated existing location: ${locationId}`);
    } else {
      parkingLocations.push(parkingLocation);
      console.log(`Added new location: ${locationId}`);
    }
    
    // Save to GitHub
    const jsonContent = JSON.stringify(parkingLocations, null, 2);
    deployToGitHub(CONFIG.PARKING_DATA_FILE, jsonContent, `Update parking data for ${newData.name}`);
    
  } catch (error) {
    console.error('Error updating parking locations:', error);
    throw error;
  }
}

/**
 * Update app configuration JSON file
 */
function updateAppConfig(brandingData) {
  try {
    // Get existing config
    let appConfig = getCurrentAppConfig();
    
    // Update branding section
    appConfig.branding = {
      name: brandingData.name,
      logo: brandingData.logoUrl || appConfig.branding?.logo || null,
      primaryColor: brandingData.primaryColor || appConfig.branding?.primaryColor || '#2563eb',
      secondaryColor: brandingData.secondaryColor || appConfig.branding?.secondaryColor || '#64748b',
      backgroundImage: brandingData.backgroundImageUrl || appConfig.branding?.backgroundImage || null,
      customCSS: brandingData.customCSS || appConfig.branding?.customCSS || null
    };
    
    // Update map configuration if provided
    if (brandingData.mapCenterLat && brandingData.mapCenterLng) {
      appConfig.map = {
        center: {
          lat: brandingData.mapCenterLat,
          lng: brandingData.mapCenterLng
        },
        zoom: brandingData.defaultZoom || appConfig.map?.zoom || 14
      };
    }
    
    // Update last modified timestamp
    appConfig.lastUpdated = new Date().toISOString();
    
    // Save to GitHub
    const jsonContent = JSON.stringify(appConfig, null, 2);
    deployToGitHub(CONFIG.CONFIG_FILE, jsonContent, `Update app configuration for ${brandingData.name}`);
    
  } catch (error) {
    console.error('Error updating app config:', error);
    throw error;
  }
}

/**
 * Get current parking data from GitHub or return default
 */
function getCurrentParkingData() {
  try {
    const content = getFileFromGitHub(CONFIG.PARKING_DATA_FILE);
    return content ? JSON.parse(content) : [];
  } catch (error) {
    console.warn('Could not fetch existing parking data, starting with empty array');
    return [];
  }
}

/**
 * Get current app config from GitHub or return default
 */
function getCurrentAppConfig() {
  try {
    const content = getFileFromGitHub(CONFIG.CONFIG_FILE);
    return content ? JSON.parse(content) : getDefaultAppConfig();
  } catch (error) {
    console.warn('Could not fetch existing app config, using default');
    return getDefaultAppConfig();
  }
}

/**
 * Generate a unique location ID
 */
function generateLocationId(name, address) {
  const combined = `${name}-${address}`.toLowerCase();
  return combined.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Get default app configuration
 */
function getDefaultAppConfig() {
  return {
    branding: {
      name: 'Parking Finder',
      logo: null,
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      backgroundImage: null,
      customCSS: null
    },
    map: {
      center: {
        lat: 40.7128,
        lng: -74.0060
      },
      zoom: 14
    },
    dataSource: {
      url: './data/parking-locations.json',
      refreshInterval: 300000 // 5 minutes
    },
    lastUpdated: new Date().toISOString()
  };
}