/**
 * GitHub integration for automated deployment of JSON data files
 */

/**
 * Deploy content to GitHub repository
 */
function deployToGitHub(filePath, content, commitMessage) {
  try {
    if (!CONFIG.GITHUB_TOKEN) {
      throw new Error('GitHub token not configured');
    }
    
    const repoUrl = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${filePath}`;
    
    // Get current file SHA if it exists
    const currentSha = getCurrentFileSha(filePath);
    
    // Prepare the request payload
    const payload = {
      message: commitMessage,
      content: Utilities.base64Encode(content),
      branch: 'main'
    };
    
    // Add SHA if file exists (for updates)
    if (currentSha) {
      payload.sha = currentSha;
    }
    
    // Make the API request
    const options = {
      method: 'PUT',
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Parking-Finder-Admin-Script'
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(repoUrl, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200 || responseCode === 201) {
      console.log(`Successfully deployed ${filePath} to GitHub`);
      
      // Trigger deployment webhook if configured
      triggerDeploymentWebhook();
      
    } else {
      throw new Error(`GitHub API error: ${responseCode} - ${response.getContentText()}`);
    }
    
  } catch (error) {
    console.error('Error deploying to GitHub:', error);
    throw error;
  }
}

/**
 * Get current file SHA from GitHub
 */
function getCurrentFileSha(filePath) {
  try {
    const repoUrl = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${filePath}`;
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Parking-Finder-Admin-Script'
      }
    };
    
    const response = UrlFetchApp.fetch(repoUrl, options);
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return data.sha;
    } else if (response.getResponseCode() === 404) {
      // File doesn't exist yet
      return null;
    } else {
      throw new Error(`GitHub API error: ${response.getResponseCode()}`);
    }
    
  } catch (error) {
    console.warn(`Could not get SHA for ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Get file content from GitHub
 */
function getFileFromGitHub(filePath) {
  try {
    const repoUrl = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}/contents/${filePath}`;
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Parking-Finder-Admin-Script'
      }
    };
    
    const response = UrlFetchApp.fetch(repoUrl, options);
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return Utilities.newBlob(Utilities.base64Decode(data.content)).getDataAsString();
    } else if (response.getResponseCode() === 404) {
      return null;
    } else {
      throw new Error(`GitHub API error: ${response.getResponseCode()}`);
    }
    
  } catch (error) {
    console.warn(`Could not fetch ${filePath} from GitHub:`, error.message);
    return null;
  }
}

/**
 * Trigger deployment webhook (for Netlify, Vercel, etc.)
 */
function triggerDeploymentWebhook() {
  try {
    const webhookUrl = PropertiesService.getScriptProperties().getProperty('DEPLOYMENT_WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.log('No deployment webhook configured');
      return;
    }
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        trigger: 'data-update',
        timestamp: new Date().toISOString()
      })
    };
    
    const response = UrlFetchApp.fetch(webhookUrl, options);
    
    if (response.getResponseCode() === 200) {
      console.log('Deployment webhook triggered successfully');
    } else {
      console.warn(`Deployment webhook failed: ${response.getResponseCode()}`);
    }
    
  } catch (error) {
    console.warn('Error triggering deployment webhook:', error.message);
  }
}

/**
 * Test GitHub connection
 */
function testGitHubConnection() {
  try {
    const repoUrl = `https://api.github.com/repos/${CONFIG.GITHUB_REPO}`;
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Parking-Finder-Admin-Script'
      }
    };
    
    const response = UrlFetchApp.fetch(repoUrl, options);
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      console.log(`GitHub connection successful. Repository: ${data.full_name}`);
      return true;
    } else {
      console.error(`GitHub connection failed: ${response.getResponseCode()}`);
      return false;
    }
    
  } catch (error) {
    console.error('Error testing GitHub connection:', error);
    return false;
  }
}