/**
 * Google Apps Script for Parking Finder Admin Forms
 * Processes form submissions and generates JSON data files
 */

// Configuration constants
const CONFIG = {
  // GitHub repository settings for deployment
  GITHUB_REPO: 'your-username/parking-finder-data',
  GITHUB_TOKEN: PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN'),
  
  // Data file paths
  PARKING_DATA_FILE: 'data/parking-locations.json',
  CONFIG_FILE: 'data/app-config.json',
  
  // Form IDs (set these after creating forms)
  PARKING_FORM_ID: PropertiesService.getScriptProperties().getProperty('PARKING_FORM_ID'),
  BRANDING_FORM_ID: PropertiesService.getScriptProperties().getProperty('BRANDING_FORM_ID'),
  
  // Drive folder for assets
  ASSETS_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('ASSETS_FOLDER_ID')
};

/**
 * Initialize the script and set up form triggers
 */
function initializeScript() {
  console.log('Initializing Parking Finder Admin Script...');
  
  // Create triggers for form submissions
  if (CONFIG.PARKING_FORM_ID) {
    createFormTrigger(CONFIG.PARKING_FORM_ID, 'onParkingFormSubmit');
  }
  
  if (CONFIG.BRANDING_FORM_ID) {
    createFormTrigger(CONFIG.BRANDING_FORM_ID, 'onBrandingFormSubmit');
  }
  
  console.log('Script initialization complete');
}

/**
 * Create a form submission trigger
 */
function createFormTrigger(formId, functionName) {
  try {
    const form = FormApp.openById(formId);
    ScriptApp.newTrigger(functionName)
      .timeBased()
      .everyMinutes(1) // Check for new submissions every minute
      .create();
    
    console.log(`Trigger created for form: ${formId}`);
  } catch (error) {
    console.error(`Error creating trigger for form ${formId}:`, error);
  }
}

/**
 * Handle parking data form submissions
 */
function onParkingFormSubmit(e) {
  try {
    console.log('Processing parking form submission...');
    
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // Extract form data
    const parkingData = extractParkingData(itemResponses);
    
    // Validate the data
    if (!validateParkingData(parkingData)) {
      throw new Error('Invalid parking data submitted');
    }
    
    // Update the parking locations JSON
    updateParkingLocations(parkingData);
    
    console.log('Parking form submission processed successfully');
    
  } catch (error) {
    console.error('Error processing parking form submission:', error);
    sendErrorNotification('Parking Form Error', error.message);
  }
}

/**
 * Handle branding form submissions
 */
function onBrandingFormSubmit(e) {
  try {
    console.log('Processing branding form submission...');
    
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // Extract form data
    const brandingData = extractBrandingData(itemResponses);
    
    // Process uploaded images
    const processedBranding = processBrandingAssets(brandingData);
    
    // Validate the data
    if (!validateBrandingData(processedBranding)) {
      throw new Error('Invalid branding data submitted');
    }
    
    // Update the app configuration JSON
    updateAppConfig(processedBranding);
    
    console.log('Branding form submission processed successfully');
    
  } catch (error) {
    console.error('Error processing branding form submission:', error);
    sendErrorNotification('Branding Form Error', error.message);
  }
}/*
*
 * Extract parking data from form responses
 */
function extractParkingData(itemResponses) {
  const data = {};
  
  itemResponses.forEach(itemResponse => {
    const title = itemResponse.getItem().getTitle();
    const response = itemResponse.getResponse();
    
    switch (title) {
      case 'Location Name':
        data.name = response;
        break;
      case 'Address':
        data.address = response;
        break;
      case 'Latitude':
        data.lat = parseFloat(response);
        break;
      case 'Longitude':
        data.lng = parseFloat(response);
        break;
      case 'Total Capacity':
        data.totalCapacity = parseInt(response);
        break;
      case 'Available Spaces':
        data.availableSpaces = parseInt(response);
        break;
      case 'Location Type':
        data.type = response.toLowerCase();
        break;
      case 'Time Limit':
        data.timeLimit = response;
        break;
      case 'Cost':
        data.cost = response;
        break;
      case 'Restrictions':
        data.restrictions = response ? response.split(',').map(r => r.trim()) : [];
        break;
      case 'Operating Hours':
        data.hours = response;
        break;
    }
  });
  
  return data;
}

/**
 * Extract branding data from form responses
 */
function extractBrandingData(itemResponses) {
  const data = {};
  
  itemResponses.forEach(itemResponse => {
    const title = itemResponse.getItem().getTitle();
    const response = itemResponse.getResponse();
    
    switch (title) {
      case 'Town/City Name':
        data.name = response;
        break;
      case 'Logo Upload':
        data.logoFileId = response;
        break;
      case 'Primary Color':
        data.primaryColor = response;
        break;
      case 'Secondary Color':
        data.secondaryColor = response;
        break;
      case 'Background Image Upload':
        data.backgroundImageFileId = response;
        break;
      case 'Custom CSS':
        data.customCSS = response;
        break;
      case 'Map Center Latitude':
        data.mapCenterLat = parseFloat(response);
        break;
      case 'Map Center Longitude':
        data.mapCenterLng = parseFloat(response);
        break;
      case 'Default Zoom Level':
        data.defaultZoom = parseInt(response);
        break;
    }
  });
  
  return data;
}

/**
 * Validate parking data
 */
function validateParkingData(data) {
  const required = ['name', 'address', 'lat', 'lng', 'totalCapacity', 'type'];
  
  for (const field of required) {
    if (!data[field] && data[field] !== 0) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }
  
  // Validate coordinates
  if (data.lat < -90 || data.lat > 90) {
    console.error('Invalid latitude');
    return false;
  }
  
  if (data.lng < -180 || data.lng > 180) {
    console.error('Invalid longitude');
    return false;
  }
  
  // Validate capacity
  if (data.totalCapacity < 0 || (data.availableSpaces && data.availableSpaces > data.totalCapacity)) {
    console.error('Invalid capacity data');
    return false;
  }
  
  // Validate type
  const validTypes = ['street', 'lot', 'structure', 'garage'];
  if (!validTypes.includes(data.type)) {
    console.error('Invalid location type');
    return false;
  }
  
  return true;
}

/**
 * Validate branding data
 */
function validateBrandingData(data) {
  if (!data.name || data.name.trim().length === 0) {
    console.error('Town/City name is required');
    return false;
  }
  
  // Validate colors (basic hex color validation)
  const colorRegex = /^#[0-9A-F]{6}$/i;
  if (data.primaryColor && !colorRegex.test(data.primaryColor)) {
    console.error('Invalid primary color format');
    return false;
  }
  
  if (data.secondaryColor && !colorRegex.test(data.secondaryColor)) {
    console.error('Invalid secondary color format');
    return false;
  }
  
  // Validate coordinates if provided
  if (data.mapCenterLat && (data.mapCenterLat < -90 || data.mapCenterLat > 90)) {
    console.error('Invalid map center latitude');
    return false;
  }
  
  if (data.mapCenterLng && (data.mapCenterLng < -180 || data.mapCenterLng > 180)) {
    console.error('Invalid map center longitude');
    return false;
  }
  
  return true;
}