/**
 * Asset processing functions for handling image uploads and Drive integration
 */

/**
 * Process branding assets (logos, background images)
 */
function processBrandingAssets(brandingData) {
  const processedData = { ...brandingData };
  
  try {
    // Process logo upload
    if (brandingData.logoFileId) {
      processedData.logoUrl = processImageAsset(brandingData.logoFileId, 'logo');
    }
    
    // Process background image upload
    if (brandingData.backgroundImageFileId) {
      processedData.backgroundImageUrl = processImageAsset(brandingData.backgroundImageFileId, 'background');
    }
    
    return processedData;
    
  } catch (error) {
    console.error('Error processing branding assets:', error);
    throw error;
  }
}

/**
 * Process individual image asset
 */
function processImageAsset(fileId, assetType) {
  try {
    // Get the file from Drive
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    
    // Validate image type
    const mimeType = blob.getContentType();
    if (!isValidImageType(mimeType)) {
      throw new Error(`Invalid image type: ${mimeType}. Only PNG, JPG, and SVG are supported.`);
    }
    
    // Generate filename
    const timestamp = new Date().getTime();
    const extension = getFileExtension(mimeType);
    const filename = `${assetType}-${timestamp}.${extension}`;
    
    // Copy to assets folder
    const assetsFolder = DriveApp.getFolderById(CONFIG.ASSETS_FOLDER_ID);
    const newFile = assetsFolder.createFile(blob.setName(filename));
    
    // Make file publicly viewable
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get public URL
    const publicUrl = `https://drive.google.com/uc?id=${newFile.getId()}`;
    
    console.log(`Processed ${assetType} asset: ${filename}`);
    return publicUrl;
    
  } catch (error) {
    console.error(`Error processing ${assetType} asset:`, error);
    throw error;
  }
}

/**
 * Validate image MIME type
 */
function isValidImageType(mimeType) {
  const validTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
    'image/webp'
  ];
  return validTypes.includes(mimeType);
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType) {
  const extensions = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/svg+xml': 'svg',
    'image/webp': 'webp'
  };
  return extensions[mimeType] || 'jpg';
}

/**
 * Clean up old asset files (keep only latest 5 versions)
 */
function cleanupOldAssets() {
  try {
    const assetsFolder = DriveApp.getFolderById(CONFIG.ASSETS_FOLDER_ID);
    const files = assetsFolder.getFiles();
    
    const assetGroups = {
      logo: [],
      background: []
    };
    
    // Group files by type
    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName();
      
      if (name.startsWith('logo-')) {
        assetGroups.logo.push(file);
      } else if (name.startsWith('background-')) {
        assetGroups.background.push(file);
      }
    }
    
    // Clean up each group
    Object.keys(assetGroups).forEach(type => {
      const files = assetGroups[type];
      if (files.length > 5) {
        // Sort by creation date (oldest first)
        files.sort((a, b) => a.getDateCreated().getTime() - b.getDateCreated().getTime());
        
        // Delete oldest files, keep latest 5
        const filesToDelete = files.slice(0, files.length - 5);
        filesToDelete.forEach(file => {
          console.log(`Deleting old ${type} asset: ${file.getName()}`);
          file.setTrashed(true);
        });
      }
    });
    
  } catch (error) {
    console.error('Error cleaning up old assets:', error);
  }
}

/**
 * Create assets folder if it doesn't exist
 */
function createAssetsFolder() {
  try {
    const folderName = 'Parking Finder Assets';
    const folders = DriveApp.getFoldersByName(folderName);
    
    if (folders.hasNext()) {
      const folder = folders.next();
      console.log(`Assets folder exists: ${folder.getId()}`);
      return folder.getId();
    } else {
      const newFolder = DriveApp.createFolder(folderName);
      newFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      console.log(`Created assets folder: ${newFolder.getId()}`);
      return newFolder.getId();
    }
    
  } catch (error) {
    console.error('Error creating assets folder:', error);
    throw error;
  }
}