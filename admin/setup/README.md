# Parking Finder Admin Setup Guide

This guide will help you set up the Google Apps Script integration for managing parking data and branding through Google Forms.

## Prerequisites

- Google account with access to Google Apps Script, Forms, and Drive
- GitHub repository for hosting the JSON data files
- GitHub personal access token with repository write permissions
- Basic understanding of Google Apps Script (optional but helpful)

## Setup Steps

### 1. Create GitHub Repository

1. Create a new GitHub repository (e.g., `parking-finder-data`)
2. Create a personal access token:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate new token with `repo` scope
   - Save the token securely

### 2. Set Up Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project named "Parking Finder Admin"
3. Delete the default `Code.gs` file
4. Create the following files by copying from the `google-apps-script` folder:
   - `Code.gs`
   - `DataProcessor.gs`
   - `AssetProcessor.gs`
   - `GitHubDeployment.gs`
   - `Utilities.gs`

### 3. Configure Script Properties

1. In Apps Script, go to Project Settings > Script Properties
2. Add the following properties:

| Property | Value | Description |
|----------|-------|-------------|
| `GITHUB_REPO` | `your-username/parking-finder-data` | Your GitHub repository |
| `GITHUB_TOKEN` | `your-github-token` | GitHub personal access token |
| `ADMIN_EMAIL` | `admin@example.com` | Email for error notifications |
| `DEPLOYMENT_WEBHOOK_URL` | `https://api.netlify.com/build_hooks/your-hook` | Optional: Deployment webhook |

### 4. Create Google Forms

#### Parking Data Form

1. Go to [Google Forms](https://forms.google.com)
2. Create a new form titled "Parking Location Data Update"
3. Use the template in `forms/parking-data-form-template.json` as a guide
4. Add the following questions:
   - Location Name (Text, Required)
   - Address (Text, Required)
   - Latitude (Text, Required)
   - Longitude (Text, Required)
   - Total Capacity (Text, Required)
   - Available Spaces (Text, Optional)
   - Location Type (Multiple Choice: Street, Lot, Structure, Garage, Required)
   - Time Limit (Text, Optional)
   - Cost (Text, Optional)
   - Restrictions (Paragraph, Optional)
   - Operating Hours (Text, Optional)

5. In Form Settings:
   - Enable "Collect email addresses"
   - Enable "Restrict to users in your organization" (if applicable)
   - Set confirmation message

6. Copy the form ID from the URL (the long string after `/forms/d/`)

#### Branding Configuration Form

1. Create another form titled "Parking Finder Branding Configuration"
2. Use the template in `forms/branding-form-template.json` as a guide
3. Add the following questions:
   - Town/City Name (Text, Required)
   - Logo Upload (File Upload, PNG/JPG/SVG, Optional)
   - Primary Color (Text with hex validation, Required)
   - Secondary Color (Text with hex validation, Required)
   - Background Image Upload (File Upload, PNG/JPG, Optional)
   - Map Center Latitude (Text, Required)
   - Map Center Longitude (Text, Required)
   - Default Zoom Level (Multiple Choice: 10-16, Optional)
   - Custom CSS (Paragraph, Optional)

4. Copy the form ID from the URL

### 5. Update Script Properties with Form IDs

1. Return to Apps Script > Project Settings > Script Properties
2. Add the form IDs:

| Property | Value |
|----------|-------|
| `PARKING_FORM_ID` | `your-parking-form-id` |
| `BRANDING_FORM_ID` | `your-branding-form-id` |

### 6. Initialize the Script

1. In Apps Script, run the `setupScriptProperties()` function first
2. Run the `initializeScript()` function to set up form triggers
3. Test the setup by running `testFormSubmissionPipeline()`

### 7. Set Up Form Triggers

1. Go to Apps Script > Triggers
2. Create triggers for form submissions:
   - Trigger 1: `onParkingFormSubmit` when parking form is submitted
   - Trigger 2: `onBrandingFormSubmit` when branding form is submitted

### 8. Test the Integration

1. Submit test data through both forms
2. Check the Apps Script logs for any errors
3. Verify that JSON files are created in your GitHub repository
4. Test the deployment webhook (if configured)

## Usage

### Updating Parking Data

1. Share the parking data form with authorized users
2. Users fill out the form with parking location information
3. The script automatically processes submissions and updates the JSON data
4. Changes are deployed to your static hosting platform

### Updating Branding

1. Use the branding form to update visual elements
2. Upload logo and background images through the form
3. The script processes images and updates the configuration
4. Changes are reflected in the live application

## Troubleshooting

### Common Issues

1. **GitHub API Errors**: Check your token permissions and repository name
2. **Form Trigger Issues**: Ensure triggers are properly set up in Apps Script
3. **Image Upload Problems**: Verify file types and sizes are within limits
4. **Validation Errors**: Check that required fields are filled correctly

### Monitoring

- Check Apps Script logs regularly for errors
- Set up email notifications for critical failures
- Monitor your GitHub repository for successful updates
- Test forms periodically to ensure they're working

### Support

For technical issues:
1. Check the Apps Script execution logs
2. Verify all script properties are set correctly
3. Test individual functions in the Apps Script editor
4. Check GitHub repository permissions and webhook configuration

## Security Considerations

- Keep your GitHub token secure and rotate it regularly
- Restrict form access to authorized users only
- Monitor form submissions for suspicious activity
- Use Google Workspace domain restrictions when possible
- Regularly review and clean up old asset files

## Maintenance

- Clean up old asset files monthly using `cleanupOldAssets()`
- Monitor GitHub repository size and clean up old commits if needed
- Update form questions as requirements change
- Review and update script properties as needed