// Leaflet configuration and icon fixes for React applications

import L from 'leaflet';

// Fix for default markers in React-Leaflet
// This addresses the issue where marker icons don't display correctly in production builds
export const fixLeafletIcons = () => {
  // Delete the default icon URLs that Leaflet sets
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  // Set the icon URLs manually
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
};

// Call the fix function immediately
fixLeafletIcons();