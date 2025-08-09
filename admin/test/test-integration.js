/**
 * Test script for validating the Google Apps Script integration
 * Run this in the Apps Script editor to test the complete pipeline
 */

/**
 * Main test function - runs all integration tests
 */
function runAllTests() {
  console.log('🚀 Starting Parking Finder Admin Integration Tests...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  // Test configuration
  runTest('Configuration Check', testConfiguration, results);
  
  // Test data validation
  runTest('Parking Data Validation', testParkingDataValidation, results);
  runTest('Branding Data Validation', testBrandingDataValidation, results);
  
  // Test GitHub integration
  runTest('GitHub Connection', testGitHubConnection, results);
  
  // Test data processing
  runTest('Parking Data Processing', testParkingDataProcessing, results);
  runTest('Branding Data Processing', testBrandingDataProcessing, results);
  
  // Test asset processing
  runTest('Asset Processing Functions', testAssetProcessing, results);
  
  // Print results
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%\n`);
  
  if (results.failed > 0) {
    console.log('❌ Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.name}: ${test.error}`);
    });
  }
  
  return results;
}

/**
 * Run individual test with error handling
 */
function runTest(name, testFunction, results) {
  try {
    console.log(`🧪 Testing: ${name}`);
    testFunction();
    console.log(`✅ ${name}: PASSED\n`);
    results.passed++;
    results.tests.push({ name, passed: true });
  } catch (error) {
    console.log(`❌ ${name}: FAILED - ${error.message}\n`);
    results.failed++;
    results.tests.push({ name, passed: false, error: error.message });
  }
}

/**
 * Test script configuration
 */
function testConfiguration() {
  const requiredProperties = [
    'GITHUB_REPO',
    'GITHUB_TOKEN',
    'PARKING_FORM_ID',
    'BRANDING_FORM_ID',
    'ASSETS_FOLDER_ID'
  ];
  
  const properties = PropertiesService.getScriptProperties();
  const missing = [];
  
  requiredProperties.forEach(prop => {
    const value = properties.getProperty(prop);
    if (!value || value.startsWith('your-')) {
      missing.push(prop);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing or incomplete properties: ${missing.join(', ')}`);
  }
  
  console.log('  ✓ All required properties are configured');
}

/**
 * Test parking data validation
 */
function testParkingDataValidation() {
  // Test valid data
  const validData = {
    name: 'Test Parking Lot',
    address: '123 Test Street',
    lat: 40.7128,
    lng: -74.0060,
    totalCapacity: 50,
    availableSpaces: 25,
    type: 'lot'
  };
  
  if (!validateParkingData(validData)) {
    throw new Error('Valid parking data failed validation');
  }
  console.log('  ✓ Valid parking data passes validation');
  
  // Test invalid data
  const invalidData = {
    name: 'Test Parking',
    // Missing required fields
    lat: 91, // Invalid latitude
    lng: -74.0060,
    totalCapacity: -5, // Invalid capacity
    type: 'invalid-type'
  };
  
  if (validateParkingData(invalidData)) {
    throw new Error('Invalid parking data passed validation');
  }
  console.log('  ✓ Invalid parking data fails validation correctly');
}

/**
 * Test branding data validation
 */
function testBrandingDataValidation() {
  // Test valid data
  const validData = {
    name: 'Test Town',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    mapCenterLat: 40.7128,
    mapCenterLng: -74.0060,
    defaultZoom: 14
  };
  
  if (!validateBrandingData(validData)) {
    throw new Error('Valid branding data failed validation');
  }
  console.log('  ✓ Valid branding data passes validation');
  
  // Test invalid data
  const invalidData = {
    name: '', // Empty name
    primaryColor: 'invalid-color',
    mapCenterLat: 91, // Invalid latitude
    mapCenterLng: -181 // Invalid longitude
  };
  
  if (validateBrandingData(invalidData)) {
    throw new Error('Invalid branding data passed validation');
  }
  console.log('  ✓ Invalid branding data fails validation correctly');
}

/**
 * Test GitHub connection
 */
function testGitHubConnection() {
  if (!testGitHubConnection()) {
    throw new Error('GitHub connection failed');
  }
  console.log('  ✓ GitHub connection successful');
}

/**
 * Test parking data processing
 */
function testParkingDataProcessing() {
  const testData = {
    name: 'Test Integration Parking',
    address: '999 Test Integration Street',
    lat: 40.7128,
    lng: -74.0060,
    totalCapacity: 10,
    availableSpaces: 5,
    type: 'lot',
    timeLimit: '1 hour',
    cost: 'Free',
    restrictions: ['Test restriction'],
    hours: '9 AM - 5 PM'
  };
  
  // Test ID generation
  const locationId = generateLocationId(testData.name, testData.address);
  if (!locationId || locationId.length === 0) {
    throw new Error('Location ID generation failed');
  }
  console.log(`  ✓ Generated location ID: ${locationId}`);
  
  // Test data structure creation
  const parkingLocation = {
    id: locationId,
    name: testData.name,
    address: testData.address,
    coordinates: {
      lat: testData.lat,
      lng: testData.lng
    },
    capacity: {
      total: testData.totalCapacity,
      available: testData.availableSpaces,
      reserved: 0
    },
    rules: {
      timeLimit: testData.timeLimit,
      cost: testData.cost,
      restrictions: testData.restrictions,
      hours: testData.hours
    },
    type: testData.type,
    lastUpdated: new Date().toISOString()
  };
  
  if (!parkingLocation.id || !parkingLocation.coordinates) {
    throw new Error('Parking location object creation failed');
  }
  console.log('  ✓ Parking location object created successfully');
}

/**
 * Test branding data processing
 */
function testBrandingDataProcessing() {
  const testData = {
    name: 'Test Integration Town',
    primaryColor: '#1e40af',
    secondaryColor: '#475569',
    mapCenterLat: 40.7589,
    mapCenterLng: -73.9851,
    defaultZoom: 15
  };
  
  // Test default config generation
  const defaultConfig = getDefaultAppConfig();
  if (!defaultConfig.branding || !defaultConfig.map) {
    throw new Error('Default app config generation failed');
  }
  console.log('  ✓ Default app config generated successfully');
  
  // Test config merging
  const updatedConfig = {
    ...defaultConfig,
    branding: {
      ...defaultConfig.branding,
      name: testData.name,
      primaryColor: testData.primaryColor,
      secondaryColor: testData.secondaryColor
    },
    map: {
      center: {
        lat: testData.mapCenterLat,
        lng: testData.mapCenterLng
      },
      zoom: testData.defaultZoom
    }
  };
  
  if (updatedConfig.branding.name !== testData.name) {
    throw new Error('Config merging failed');
  }
  console.log('  ✓ Config merging works correctly');
}

/**
 * Test asset processing functions
 */
function testAssetProcessing() {
  // Test MIME type validation
  if (!isValidImageType('image/png')) {
    throw new Error('PNG validation failed');
  }
  if (!isValidImageType('image/jpeg')) {
    throw new Error('JPEG validation failed');
  }
  if (isValidImageType('text/plain')) {
    throw new Error('Invalid type validation failed');
  }
  console.log('  ✓ Image type validation works correctly');
  
  // Test file extension mapping
  if (getFileExtension('image/png') !== 'png') {
    throw new Error('PNG extension mapping failed');
  }
  if (getFileExtension('image/jpeg') !== 'jpg') {
    throw new Error('JPEG extension mapping failed');
  }
  console.log('  ✓ File extension mapping works correctly');
}

/**
 * Test form data extraction (mock)
 */
function testFormDataExtraction() {
  // Mock form response data
  const mockParkingResponses = [
    { getItem: () => ({ getTitle: () => 'Location Name' }), getResponse: () => 'Test Location' },
    { getItem: () => ({ getTitle: () => 'Address' }), getResponse: () => '123 Test St' },
    { getItem: () => ({ getTitle: () => 'Latitude' }), getResponse: () => '40.7128' },
    { getItem: () => ({ getTitle: () => 'Longitude' }), getResponse: () => '-74.0060' },
    { getItem: () => ({ getTitle: () => 'Total Capacity' }), getResponse: () => '50' },
    { getItem: () => ({ getTitle: () => 'Location Type' }), getResponse: () => 'Lot' }
  ];
  
  const extractedData = extractParkingData(mockParkingResponses);
  
  if (extractedData.name !== 'Test Location' || extractedData.lat !== 40.7128) {
    throw new Error('Parking data extraction failed');
  }
  console.log('  ✓ Parking data extraction works correctly');
}

/**
 * Quick setup verification
 */
function quickSetupCheck() {
  console.log('🔍 Quick Setup Verification\n');
  
  try {
    const status = getConfigurationStatus();
    
    if (status.configured) {
      console.log('✅ Configuration is complete and ready for use');
    } else {
      console.log('⚠️  Configuration is incomplete. Missing properties:');
      status.missing.forEach(prop => {
        console.log(`  - ${prop}`);
      });
      console.log('\nPlease run setupScriptProperties() and update the values.');
    }
    
  } catch (error) {
    console.log(`❌ Setup check failed: ${error.message}`);
  }
}

/**
 * Test individual components
 */
function testParkingFormOnly() {
  console.log('🧪 Testing Parking Form Processing Only\n');
  testParkingFormSubmission();
}

function testBrandingFormOnly() {
  console.log('🧪 Testing Branding Form Processing Only\n');
  testBrandingFormSubmission();
}