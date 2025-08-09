# Parking Finder

A modern, accessible web application that helps users find available public parking spaces in small coastal festival towns. Built with React, TypeScript, and Leaflet.js.

## Features

- **Interactive Map**: Real-time parking availability displayed on an OpenStreetMap-based interface
- **Search Functionality**: Find parking by location name, address, or type
- **Detailed Information**: View capacity, rules, costs, and time limits for each parking location
- **Mobile Optimized**: Responsive design that works on all devices
- **Offline Support**: Cached data ensures functionality without internet connection
- **Accessibility**: WCAG 2.1 AA compliant with screen reader and keyboard navigation support
- **Auto-refresh**: Parking data updates automatically every 5 minutes
- **Admin Interface**: Simple Google Forms integration for data management

## Quick Start

### For Users
1. Visit your town's Parking Finder URL
2. Browse the map to see available parking locations
3. Click markers for detailed information
4. Use the search bar to find specific locations
5. Click "Get Directions" to navigate to parking spots

### For Administrators
1. Use the provided Google Forms to update parking data
2. Changes appear on the website within 5 minutes
3. Customize branding through the configuration form

### For Developers
```bash
git clone <repository-url>
cd parking-finder
npm install
npm run dev
```

## Documentation

- **[User Guide](./USER_GUIDE.md)** - How to use the application
- **[Admin Setup Guide](./ADMIN_SETUP_GUIDE.md)** - Setting up and managing the system
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Technical documentation for developers

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Mapping**: Leaflet.js, React-Leaflet, OpenStreetMap
- **Styling**: CSS Modules
- **Testing**: Vitest, React Testing Library, Playwright
- **CI/CD**: GitHub Actions
- **Hosting**: GitHub Pages, Netlify, Vercel compatible

## Testing

The project includes comprehensive testing:

```bash
npm run test           # Unit tests
npm run test:integration  # Integration tests
npm run test:performance # Performance tests
npm run test:e2e       # End-to-end tests
npm run test:all       # All tests
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- Check the documentation in the `/docs` folder
- Open an issue on GitHub for bugs or feature requests
- Contact your local administrator for data-related questions