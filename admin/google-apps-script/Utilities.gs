/**
 * Utility functions for error handling, notifications, and testing
 */

/**
 * Send error notification email
 */
function sendErrorNotification(subject, errorMessage) {
  try {
    const adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
    
    if (!adminEmail) {
      console.warn('No admin email configured for error notifications');
      return;
    }
    
    const emailBody = `
An error occurred in the Parking Finder Admin Script:

Error: ${errorMessage}
Time: ${new Date().toISOString()}
Script: ${ScriptApp.getScriptId()}

Please check the script logs for more details.
    `;
    
    MailApp.sendEmail({
      to: adminEmail,
      subject: `Parking Finder Admin Error: ${subject}`,
      body: emailBody
    });
    
    console.log(`Error notification sent to ${adminEmail}`);
    
  } catch (error) {
    console.error('Error sending notification email:', error);
  }
}

/**
 * Log script activity for monitoring
 */
function logActivity(action, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    details: details
  };
  
  console.log(`Activity: ${JSON.stringify(logEntry)}`);
  
  // Optionally store in a spreadsheet for monitoring
  try {
    const logSheetId = PropertiesService.getScriptProperties().getProperty('LOG_SHEET_ID');
    if (logSheetId) {
      const sheet = SpreadsheetApp.openById(logSheetId).getActiveSheet();
      sheet.appendRow([
        logEntry.timestamp,
        logEntry.action,
        JSON.stringify(logEntry.details)
      ]);
    }
  } catch (error) {
    console.warn('Could not log to spreadsheet:', error.message);
  }
}

/**
 * Test the complete form submission pipeline
 */
function testFormSubmissionPipeline() {
  console.log('Testing form submission pipeline...');
  
  try {
    // Test parking data submission
    const testParkingData = {
      name: 'Test Parking Lot',
      address: '123 Test Street',
      lat: 40.7128,
      lng: -74.0060,
      totalCapacity: 50,
      availableSpaces: 25,
      type: 'lot',
      timeLimit: '2 hours',
      cost: 'Free',
      restrictions: ['No overnight parking'],
      hours: '6 AM - 10 PM'
    };
    
    console.log('Testing parking data validation...');
    if (validateParkingData(testParkingData)) {
      console.log('✓ Parking data validation passed');
    } else {
      throw new Error('Parking data validation failed');
    }
    
    // Test branding data submission
    const testBrandingData = {
      name: 'Test Town',
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      mapCenterLat: 40.7128,
      mapCenterLng: -74.0060,
      defaultZoom: 14
    };
    
    console.log('Testing branding data validation...');
    if (validateBrandingData(testBrandingData)) {
      console.log('✓ Branding data validation passed');
    } else {
      throw new Error('Branding data validation failed');
    }
    
    // Test GitHub connection
    console.log('Testing GitHub connection...');
    if (testGitHubConnection()) {
      console.log('✓ GitHub connection successful');
    } else {
      throw new Error('GitHub connection failed');
    }
    
    console.log('✓ All tests passed successfully');
    
  } catch (error) {
    console.error('Pipeline test failed:', error);
    throw error;
  }
}

/**
 * Setup script properties (run once during initial setup)
 */
function setupScriptProperties() {
  const properties = PropertiesService.getScriptProperties();
  
  // Set default properties (replace with actual values)
  const defaultProperties = {
    'GITHUB_REPO': 'your-username/parking-finder-data',
    'GITHUB_TOKEN': 'your-github-token',
    'PARKING_FORM_ID': 'your-parking-form-id',
    'BRANDING_FORM_ID': 'your-branding-form-id',
    'ADMIN_EMAIL': 'admin@example.com',
    'DEPLOYMENT_WEBHOOK_URL': 'https://api.netlify.com/build_hooks/your-hook-id'
  };
  
  // Create assets folder and set its ID
  const assetsFolderId = createAssetsFolder();
  defaultProperties['ASSETS_FOLDER_ID'] = assetsFolderId;
  
  properties.setProperties(defaultProperties);
  
  console.log('Script properties set up. Please update with your actual values:');
  Object.keys(defaultProperties).forEach(key => {
    console.log(`${key}: ${defaultProperties[key]}`);
  });
}

/**
 * Get script configuration status
 */
function getConfigurationStatus() {
  const properties = PropertiesService.getScriptProperties();
  const requiredProperties = [
    'GITHUB_REPO',
    'GITHUB_TOKEN',
    'PARKING_FORM_ID',
    'BRANDING_FORM_ID',
    'ASSETS_FOLDER_ID'
  ];
  
  const status = {
    configured: true,
    missing: []
  };
  
  requiredProperties.forEach(prop => {
    const value = properties.getProperty(prop);
    if (!value || value.startsWith('your-')) {
      status.configured = false;
      status.missing.push(prop);
    }
  });
  
  console.log('Configuration Status:', JSON.stringify(status, null, 2));
  return status;
}

/**
 * Manual trigger for testing parking form submission
 */
function testParkingFormSubmission() {
  const testData = {
    name: 'Main Street Parking',
    address: '100 Main Street',
    lat: 40.7128,
    lng: -74.0060,
    totalCapacity: 30,
    availableSpaces: 15,
    type: 'street',
    timeLimit: '2 hours',
    cost: '$2/hour',
    restrictions: ['No parking during street cleaning'],
    hours: '8 AM - 6 PM'
  };
  
  try {
    updateParkingLocations(testData);
    console.log('✓ Test parking form submission completed');
  } catch (error) {
    console.error('Test parking form submission failed:', error);
  }
}

/**
 * Manual trigger for testing branding form submission
 */
function testBrandingFormSubmission() {
  const testData = {
    name: 'Seaside Town',
    primaryColor: '#1e40af',
    secondaryColor: '#475569',
    mapCenterLat: 40.7589,
    mapCenterLng: -73.9851,
    defaultZoom: 15
  };
  
  try {
    updateAppConfig(testData);
    console.log('✓ Test branding form submission completed');
  } catch (error) {
    console.error('Test branding form submission failed:', error);
  }
}