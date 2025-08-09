# Deployment Guide for Parking Finder Admin Integration

This guide covers the deployment and hosting setup for the Parking Finder application with Google Apps Script integration.

## Architecture Overview

```
Google Forms → Google Apps Script → GitHub Repository → Static Hosting → Live App
```

## Static Hosting Options

### Option 1: Netlify (Recommended)

#### Setup Steps

1. **Connect GitHub Repository**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your parking-finder repository

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 18 or higher

3. **Set Up Continuous Deployment**
   - Netlify automatically deploys on git pushes
   - Set up branch protection for main branch

4. **Configure Build Hook**
   - Go to Site Settings > Build & deploy > Build hooks
   - Create a new build hook named "Data Update"
   - Copy the webhook URL
   - Add it to your Apps Script properties as `DEPLOYMENT_WEBHOOK_URL`

5. **Custom Domain (Optional)**
   - Go to Domain settings
   - Add your custom domain
   - Configure DNS settings as instructed

#### Netlify Configuration File

Create `netlify.toml` in your repository root:

```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/data/*"
  [headers.values]
    Cache-Control = "public, max-age=300"
    Access-Control-Allow-Origin = "*"

[[headers]]
  for = "*.json"
  [headers.values]
    Content-Type = "application/json"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### Option 2: Vercel

#### Setup Steps

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Configure project settings

2. **Build Configuration**
   - Framework Preset: React
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables**
   - Add any required environment variables
   - Configure for production environment

4. **Deploy Hook**
   - Go to Project Settings > Git
   - Create a deploy hook
   - Add URL to Apps Script properties

#### Vercel Configuration File

Create `vercel.json` in your repository root:

```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "headers": [
    {
      "source": "/data/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=300"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

### Option 3: GitHub Pages

#### Setup Steps

1. **Enable GitHub Pages**
   - Go to repository Settings > Pages
   - Select source: GitHub Actions
   - Configure custom domain if needed

2. **Create GitHub Action**
   - Create `.github/workflows/deploy.yml`
   - Configure build and deployment workflow

3. **Build Hook Alternative**
   - Use GitHub API to trigger workflow
   - Configure webhook in Apps Script

#### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  repository_dispatch:
    types: [data-update]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

## Data Repository Structure

Your GitHub data repository should have this structure:

```
parking-finder-data/
├── data/
│   ├── parking-locations.json
│   └── app-config.json
├── assets/
│   ├── logo-*.png
│   └── background-*.jpg
├── README.md
└── .gitignore
```

### Sample Data Files

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

#### app-config.json
```json
{
  "branding": {
    "name": "Seaside Town Parking",
    "logo": "https://drive.google.com/uc?id=your-logo-file-id",
    "primaryColor": "#2563eb",
    "secondaryColor": "#64748b",
    "backgroundImage": null,
    "customCSS": null
  },
  "map": {
    "center": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "zoom": 14
  },
  "dataSource": {
    "url": "./data/parking-locations.json",
    "refreshInterval": 300000
  },
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```

## CORS Configuration

### For Netlify
Add to `netlify.toml`:
```toml
[[headers]]
  for = "/data/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type"
```

### For Vercel
Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/data/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

## Security Considerations

### GitHub Token Security
- Use fine-grained personal access tokens
- Limit token scope to specific repository
- Rotate tokens regularly
- Store securely in Apps Script properties

### Form Security
- Restrict form access to authorized users
- Enable email collection for audit trail
- Use Google Workspace domain restrictions
- Monitor form submissions regularly

### Data Validation
- Validate all form inputs in Apps Script
- Sanitize data before JSON generation
- Implement rate limiting if needed
- Log all data changes for audit

## Monitoring and Maintenance

### Automated Monitoring
- Set up uptime monitoring for your site
- Monitor GitHub API rate limits
- Track form submission success rates
- Set up error notifications

### Regular Maintenance Tasks
- Clean up old asset files monthly
- Review and rotate access tokens
- Update form questions as needed
- Monitor repository size and clean up if needed

### Backup Strategy
- GitHub provides version control for data
- Export form responses regularly
- Backup Apps Script code
- Document all configuration settings

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Review build logs for specific errors

2. **CORS Errors**
   - Verify CORS headers are configured
   - Check data file accessibility
   - Test with browser developer tools

3. **Data Update Failures**
   - Check GitHub token permissions
   - Verify repository and file paths
   - Review Apps Script execution logs

4. **Form Integration Issues**
   - Confirm form IDs are correct
   - Check trigger configuration
   - Test form submissions manually

### Performance Optimization

- Enable CDN for static assets
- Optimize image sizes and formats
- Implement proper caching headers
- Monitor Core Web Vitals

### Support Resources

- [Netlify Documentation](https://docs.netlify.com)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Google Apps Script Documentation](https://developers.google.com/apps-script)