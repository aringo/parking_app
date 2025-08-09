# Parking Finder Deployment Guide

This guide provides step-by-step instructions for deploying the Parking Finder application to production hosting platforms.

## Quick Start

Choose one of the following hosting platforms:

1. **Netlify** (Recommended for ease of use)
2. **Vercel** (Great for performance)
3. **GitHub Pages** (Free for public repositories)

## Prerequisites

- GitHub repository with your Parking Finder code
- Node.js 18+ installed locally (for testing)
- Admin access to chosen hosting platform

## Option 1: Netlify Deployment

### Step 1: Prepare Repository

1. Ensure your code is pushed to GitHub
2. Verify `netlify.toml` is in the repository root
3. Test build locally:
   ```bash
   cd parking-finder
   npm install
   npm run build
   ```

### Step 2: Connect to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "New site from Git"
3. Choose GitHub and authorize Netlify
4. Select your parking-finder repository
5. Configure build settings:
   - **Base directory**: `parking-finder`
   - **Build command**: `npm run build`
   - **Publish directory**: `parking-finder/dist`

### Step 3: Deploy

1. Click "Deploy site"
2. Wait for build to complete (usually 2-3 minutes)
3. Your site will be available at `https://random-name.netlify.app`

### Step 4: Configure Custom Domain (Optional)

1. Go to Site Settings > Domain management
2. Add custom domain
3. Follow DNS configuration instructions
4. SSL certificate will be automatically provisioned

### Step 5: Set Up Build Hook for Admin Updates

1. Go to Site Settings > Build & deploy > Build hooks
2. Create new build hook named "Data Update"
3. Copy the webhook URL
4. Add to Google Apps Script properties as `DEPLOYMENT_WEBHOOK_URL`

## Option 2: Vercel Deployment

### Step 1: Prepare Repository

1. Ensure `vercel.json` is in repository root
2. Test build locally:
   ```bash
   cd parking-finder
   npm install
   npm run build
   ```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: React
   - **Root Directory**: `parking-finder`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Your site will be available at `https://your-project.vercel.app`

### Step 4: Configure Environment Variables (if needed)

1. Go to Project Settings > Environment Variables
2. Add any required environment variables
3. Redeploy if variables were added

## Option 3: GitHub Pages Deployment

### Step 1: Enable GitHub Pages

1. Go to repository Settings > Pages
2. Select source: "GitHub Actions"
3. The workflow file `.github/workflows/deploy.yml` will handle deployment

### Step 2: Configure Repository

1. Ensure the workflow file exists in `.github/workflows/deploy.yml`
2. Push changes to main branch
3. GitHub Actions will automatically build and deploy

### Step 3: Access Your Site

1. Go to repository Settings > Pages
2. Your site URL will be shown (usually `https://username.github.io/repository-name`)
3. It may take a few minutes for the first deployment

## Post-Deployment Configuration

### 1. Update Data Source URLs

Update your `config.json` to point to the correct data sources:

```json
{
  "dataSource": {
    "url": "https://your-domain.com/data/parking-locations.json",
    "refreshInterval": 300000
  }
}
```

### 2. Test Application

1. Visit your deployed site
2. Verify map loads correctly
3. Test search functionality
4. Check that parking data displays properly
5. Test on mobile devices

### 3. Configure Google Apps Script Integration

Update your Google Apps Script with the deployment webhook URL:

1. Open Google Apps Script project
2. Go to Project Settings > Script Properties
3. Add property:
   - **Key**: `DEPLOYMENT_WEBHOOK_URL`
   - **Value**: Your webhook URL from hosting platform

## Data Management Setup

### 1. Create Data Repository Structure

Your data should be organized as follows:

```
your-data-repository/
├── data/
│   ├── parking-locations.json
│   └── app-config.json
├── assets/
│   ├── logo.png
│   └── background.jpg
└── README.md
```

### 2. Sample Data Files

#### parking-locations.json
```json
[
  {
    "id": "main-street-parking",
    "name": "Main Street Parking",
    "address": "100 Main Street",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "capacity": {
      "total": 30,
      "available": 15,
      "reserved": 0
    },
    "rules": {
      "timeLimit": "2 hours",
      "cost": "Free",
      "restrictions": ["No overnight parking"],
      "hours": "6 AM - 10 PM"
    },
    "type": "street",
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
]
```

### 3. Configure CORS for Data Access

Ensure your data hosting allows cross-origin requests:

- **GitHub Pages**: Automatically allows CORS
- **Netlify/Vercel**: Configured via `netlify.toml`/`vercel.json`
- **Custom hosting**: Add appropriate CORS headers

## Monitoring and Maintenance

### 1. Set Up Monitoring

1. **Uptime Monitoring**
   - Use services like UptimeRobot or Pingdom
   - Monitor main application URL
   - Set up email alerts for downtime

2. **Performance Monitoring**
   - Use Google PageSpeed Insights
   - Monitor Core Web Vitals
   - Set up regular performance audits

### 2. Regular Maintenance Tasks

1. **Weekly**
   - Check application functionality
   - Verify data updates are working
   - Review error logs

2. **Monthly**
   - Update dependencies if needed
   - Review performance metrics
   - Check SSL certificate status

3. **Quarterly**
   - Full security audit
   - Performance optimization review
   - Backup configuration documentation

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   ```bash
   # Check build locally
   cd parking-finder
   npm install
   npm run build
   
   # Check for TypeScript errors
   npm run lint
   ```

2. **CORS Errors**
   - Verify CORS headers in hosting configuration
   - Check data source URLs are accessible
   - Test with browser developer tools

3. **Data Loading Issues**
   - Verify JSON file format is valid
   - Check file permissions and accessibility
   - Test data URLs directly in browser

4. **Map Not Loading**
   - Check console for JavaScript errors
   - Verify Leaflet CSS is loading
   - Test on different browsers

### Getting Help

1. **Hosting Platform Support**
   - Netlify: [docs.netlify.com](https://docs.netlify.com)
   - Vercel: [vercel.com/docs](https://vercel.com/docs)
   - GitHub Pages: [docs.github.com/pages](https://docs.github.com/pages)

2. **Application Issues**
   - Check browser console for errors
   - Review network tab for failed requests
   - Test with different browsers and devices

## Security Considerations

### 1. HTTPS Configuration

- All hosting platforms provide automatic HTTPS
- Ensure all external resources use HTTPS
- Configure HSTS headers for enhanced security

### 2. Content Security Policy

The application includes basic CSP headers. For enhanced security:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;
```

### 3. Data Protection

- Ensure parking data doesn't include sensitive information
- Use HTTPS for all data transfers
- Regularly audit data access logs

## Performance Optimization

### 1. Build Optimization

The application is configured with:
- Code splitting for vendor libraries
- Asset optimization
- Gzip compression (handled by hosting platforms)

### 2. Caching Strategy

- Static assets: 1 year cache
- Data files: 5 minute cache
- HTML: No cache (for updates)

### 3. Monitoring Performance

Use tools like:
- Google PageSpeed Insights
- WebPageTest
- Lighthouse audits

## Backup and Recovery

### 1. Code Backup

- Primary: GitHub repository
- Secondary: Local development environment
- Tertiary: Hosting platform's built-in backups

### 2. Data Backup

- Export Google Forms responses regularly
- Maintain local copies of data files
- Document all configuration settings

### 3. Recovery Procedures

1. **Application Recovery**
   - Redeploy from GitHub repository
   - Restore from hosting platform backup
   - Rebuild from local development environment

2. **Data Recovery**
   - Restore from Google Forms export
   - Use cached data files
   - Manually recreate from documentation

This deployment guide should get your Parking Finder application running in production. For additional support, refer to the hosting platform documentation or contact your development team.