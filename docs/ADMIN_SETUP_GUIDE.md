# Parking Finder - Administrator Setup Guide

## Overview

This guide helps city administrators and IT staff set up and maintain the Parking Finder application. The system uses Google Forms for data entry and Google Apps Script for automated processing.

## Prerequisites

### Required Accounts
- Google Workspace or Gmail account with Google Drive access
- GitHub account (for hosting)
- Domain name (optional, for custom URL)

### Technical Requirements
- Basic familiarity with Google Forms and Google Sheets
- Access to your organization's web hosting or GitHub Pages
- Ability to create and manage Google Apps Script projects

## Initial Setup

### Step 1: Clone the Repository

1. Go to the Parking Finder GitHub repository
2. Click "Fork" to create your own copy
3. Clone your fork to your local machine or use GitHub's web interface

### Step 2: Configure Hosting

#### Option A: GitHub Pages (Recommended)
1. In your repository settings, enable GitHub Pages
2. Set source to "GitHub Actions"
3. The app will automatically deploy when you push changes

#### Option B: Custom Hosting
1. Build the application: `npm run build`
2. Upload the `dist` folder contents to your web server
3. Ensure proper CORS headers are configured

### Step 3: Set Up Google Forms

#### Create Parking Data Form
1. Go to Google Forms (forms.google.com)
2. Create a new form titled "Parking Data Update"
3. Add the following fields:
   - Location Name (Short answer, required)
   - Address (Short answer, required)
   - Latitude (Short answer, required)
   - Longitude (Short answer, required)
   - Total Capacity (Number, required)
   - Current Available (Number, required)
   - Parking Type (Multiple choice: Street, Lot, Structure, Garage)
   - Time Limit (Short answer)
   - Cost (Short answer)
   - Special Rules (Paragraph)

#### Create Branding Configuration Form
1. Create another form titled "Branding Configuration"
2. Add these fields:
   - Town/City Name (Short answer, required)
   - Primary Color (Short answer, hex code)
   - Secondary Color (Short answer, hex code)
   - Logo Image (File upload)
   - Background Image (File upload, optional)
   - Custom CSS (Paragraph, optional)

### Step 4: Set Up Google Apps Script

1. Open Google Apps Script (script.google.com)
2. Create a new project
3. Copy the provided scripts from the `admin/google-apps-script/` folder
4. Configure the script with your form IDs and hosting details

## Configuration

### Environment Variables

Update the configuration in your Google Apps Script:

```javascript
const CONFIG = {
  GITHUB_REPO: 'your-username/parking-finder',
  GITHUB_TOKEN: 'your-github-token',
  PARKING_FORM_ID: 'your-parking-form-id',
  BRANDING_FORM_ID: 'your-branding-form-id',
  HOSTING_URL: 'https://your-domain.com'
};
```

### Data Sources

Configure the data source URLs in `public/config.json`:

```json
{
  "dataSource": {
    "url": "https://your-domain.com/data",
    "refreshInterval": 300000
  },
  "map": {
    "center": { "lat": 37.7749, "lng": -122.4194 },
    "zoom": 13
  }
}
```
## Da
ily Operations

### Updating Parking Data

#### Manual Updates
1. Open the Parking Data Update form
2. Fill in current parking information for each location
3. Submit the form
4. Changes will appear on the website within 5 minutes

#### Bulk Updates
1. Access the Google Sheet linked to your form
2. Edit multiple rows at once
3. Save changes to trigger automatic processing

### Managing Branding

#### Logo Updates
1. Use the Branding Configuration form
2. Upload new logo files (PNG, JPG, SVG supported)
3. Files are automatically processed and deployed

#### Color Scheme Changes
1. Submit branding form with new hex color codes
2. Changes apply immediately to the live site
3. Test on different devices to ensure readability

## Monitoring and Maintenance

### Data Quality Checks

#### Daily Monitoring
- Verify parking data accuracy
- Check for missing or outdated information
- Monitor user feedback and reports

#### Weekly Reviews
- Review parking capacity trends
- Update seasonal parking restrictions
- Check for new parking locations to add

### System Health

#### Performance Monitoring
- Monitor website loading times
- Check for broken links or missing data
- Verify mobile responsiveness

#### Error Handling
- Check Google Apps Script execution logs
- Monitor form submission errors
- Verify data synchronization

## Troubleshooting

### Common Issues

#### Data Not Updating
1. Check Google Apps Script execution logs
2. Verify form IDs in script configuration
3. Ensure GitHub token has proper permissions
4. Check hosting service status

#### Form Submission Errors
1. Verify all required fields are completed
2. Check coordinate format (decimal degrees)
3. Ensure file uploads are within size limits
4. Test form submission manually

#### Website Display Issues
1. Clear browser cache and reload
2. Check console for JavaScript errors
3. Verify JSON data format
4. Test on different browsers and devices

### Getting Help

#### Technical Support
- Check GitHub repository issues
- Review Google Apps Script documentation
- Contact your IT department for hosting issues

#### Data Issues
- Verify information with parking enforcement
- Cross-reference with city planning documents
- Update based on field observations

## Security and Privacy

### Data Protection
- No personal information is collected from users
- Parking data is public information only
- Regular backups of configuration data

### Access Control
- Limit form access to authorized personnel
- Use strong passwords for all accounts
- Regular review of user permissions

### Compliance
- Ensure data accuracy for public safety
- Follow local regulations for public information
- Maintain audit trail of data changes

## Advanced Configuration

### Custom Styling
- Modify CSS files for custom appearance
- Add custom fonts and branding elements
- Ensure accessibility compliance

### API Integration
- Connect to existing parking management systems
- Set up automated data feeds
- Configure real-time updates

### Analytics
- Set up Google Analytics (optional)
- Monitor usage patterns
- Track popular parking locations

## Backup and Recovery

### Regular Backups
- Export Google Forms responses monthly
- Backup Google Apps Script code
- Save configuration files

### Disaster Recovery
- Document all setup procedures
- Maintain contact list for technical support
- Test recovery procedures annually

---

For additional support, refer to the technical documentation or contact the development team through the GitHub repository.