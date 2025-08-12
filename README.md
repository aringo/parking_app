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

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Mapping**: Leaflet.js, React-Leaflet, OpenStreetMap
- **Styling**: CSS Modules
- **Testing**: Vitest, React Testing Library
- **CI/CD**: GitHub Actions
- **Hosting**: GitHub Pages, Netlify, Vercel compatible

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run linting
npm run lint
```

## Documentation

Complete documentation is available in the `/docs` folder:

- **[User Guide](./docs/USER_GUIDE.md)** - How to use the application
- **[Admin Setup Guide](./docs/ADMIN_SETUP_GUIDE.md)** - Setting up and managing the system
- **[Developer Guide](./docs/DEVELOPER_GUIDE.md)** - Technical documentation for developers

### Documentation Maintenance

- **[Maintenance Overview](./docs/MAINTENANCE_OVERVIEW.md)** - Complete maintenance system overview
- **[Maintenance Procedures](./docs/MAINTENANCE_PROCEDURES.md)** - Complete guidelines for maintaining documentation
- **[Style Guide](./docs/STYLE_GUIDE.md)** - Formatting and writing standards
- **[Quality Guide](./docs/QUALITY_GUIDE.md)** - Automated quality checks and tools

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
