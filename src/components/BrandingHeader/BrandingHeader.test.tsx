import { render, screen } from '@testing-library/react';
import { BrandingHeader } from './BrandingHeader';
import { BrandingProvider } from '../../contexts/BrandingContext';
import type { AppConfig } from '../../types';

import { vi } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockConfig: AppConfig = {
  branding: {
    name: 'Coastal Town Parking',
    logo: '/logo.png',
    primaryColor: '#1e40af',
    secondaryColor: '#64748b',
  },
  map: {
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 14,
  },
  dataSource: {
    url: '/api/parking-data.json',
    refreshInterval: 300000,
  },
};

const renderWithBranding = (component: React.ReactElement) => {
  return render(
    <BrandingProvider>
      {component}
    </BrandingProvider>
  );
};

describe('BrandingHeader', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('displays loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithBranding(<BrandingHeader />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays town name and logo when config loads', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    renderWithBranding(<BrandingHeader />);

    // Wait for config to load
    await screen.findByText('Coastal Town Parking');

    expect(screen.getByText('Coastal Town Parking')).toBeInTheDocument();
    
    const logo = screen.getByAltText('Coastal Town Parking logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/logo.png');
  });

  it('displays only town name when no logo is provided', async () => {
    const configWithoutLogo = {
      ...mockConfig,
      branding: {
        ...mockConfig.branding,
        logo: undefined,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => configWithoutLogo,
    });

    renderWithBranding(<BrandingHeader />);

    await screen.findByText('Coastal Town Parking');

    expect(screen.getByText('Coastal Town Parking')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('hides logo when image fails to load', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    renderWithBranding(<BrandingHeader />);

    await screen.findByText('Coastal Town Parking');

    const logo = screen.getByAltText('Coastal Town Parking logo');
    
    // Simulate image load error
    const errorEvent = new Event('error');
    logo.dispatchEvent(errorEvent);

    expect(logo.style.display).toBe('none');
  });

  it('applies custom className', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    renderWithBranding(<BrandingHeader className="custom-class" />);

    await screen.findByText('Coastal Town Parking', { exact: false });

    const header = screen.getByText('Coastal Town Parking', { exact: false }).closest('.custom-class');
    expect(header).toHaveClass('custom-class');
  });

  it('handles missing config gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Config not found'));

    renderWithBranding(<BrandingHeader />);

    // Should fall back to default config
    await screen.findByText('Parking Finder', { exact: false });

    expect(screen.getByText('Parking Finder', { exact: false })).toBeInTheDocument();
  });
});