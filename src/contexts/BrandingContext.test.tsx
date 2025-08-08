import { render, screen, waitFor } from '@testing-library/react';
import { BrandingProvider, useBranding } from './BrandingContext';
import type { AppConfig } from '../types';

import { vi } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test component to access branding context
const TestComponent = () => {
  const { config, isLoading, error } = useBranding();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!config) return <div>No config</div>;
  
  return (
    <div>
      <div data-testid="town-name">{config.branding.name}</div>
      <div data-testid="primary-color">{config.branding.primaryColor}</div>
      <div data-testid="secondary-color">{config.branding.secondaryColor}</div>
      {config.branding.logo && <div data-testid="logo">{config.branding.logo}</div>}
      {config.branding.backgroundImage && <div data-testid="background">{config.branding.backgroundImage}</div>}
    </div>
  );
};

const mockConfig: AppConfig = {
  branding: {
    name: 'Test Town Parking',
    logo: '/test-logo.png',
    primaryColor: '#ff0000',
    secondaryColor: '#00ff00',
    backgroundImage: '/test-bg.jpg',
    customCSS: '.test { color: red; }',
  },
  map: {
    center: { lat: 40.7128, lng: -74.0060 },
    zoom: 12,
  },
  dataSource: {
    url: '/test-data.json',
    refreshInterval: 60000,
  },
};

describe('BrandingProvider', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Clear any existing custom styles
    const existingStyle = document.getElementById('custom-branding-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    // Reset document title
    document.title = 'Test';
    // Reset body styles
    document.body.style.backgroundImage = '';
  });

  it('loads and applies configuration successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    render(
      <BrandingProvider>
        <TestComponent />
      </BrandingProvider>
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for config to load
    await waitFor(() => {
      expect(screen.getByTestId('town-name')).toHaveTextContent('Test Town Parking');
    });

    expect(screen.getByTestId('primary-color')).toHaveTextContent('#ff0000');
    expect(screen.getByTestId('secondary-color')).toHaveTextContent('#00ff00');
    expect(screen.getByTestId('logo')).toHaveTextContent('/test-logo.png');
    expect(screen.getByTestId('background')).toHaveTextContent('/test-bg.jpg');
  });

  it('applies CSS custom properties correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    render(
      <BrandingProvider>
        <TestComponent />
      </BrandingProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('town-name')).toBeInTheDocument();
    });

    // Check CSS custom properties
    const root = document.documentElement;
    expect(root.style.getPropertyValue('--primary-color')).toBe('#ff0000');
    expect(root.style.getPropertyValue('--secondary-color')).toBe('#00ff00');
  });

  it('applies background image to body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    render(
      <BrandingProvider>
        <TestComponent />
      </BrandingProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('town-name')).toBeInTheDocument();
    });

    expect(document.body.style.backgroundImage).toBe('url("/test-bg.jpg")');
    expect(document.body.style.backgroundSize).toBe('cover');
    expect(document.body.style.backgroundPosition).toBe('center');
  });

  it('applies custom CSS', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    render(
      <BrandingProvider>
        <TestComponent />
      </BrandingProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('town-name')).toBeInTheDocument();
    });

    const customStyle = document.getElementById('custom-branding-css');
    expect(customStyle).toBeInTheDocument();
    expect(customStyle?.textContent).toBe('.test { color: red; }');
  });

  it('updates document title with town name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    render(
      <BrandingProvider>
        <TestComponent />
      </BrandingProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('town-name')).toBeInTheDocument();
    });

    expect(document.title).toBe('Test Town Parking - Parking Finder');
  });

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <BrandingProvider>
        <TestComponent />
      </BrandingProvider>
    );

    await waitFor(() => {
      // Should show error but still load default config
      expect(screen.getByText('Error: Network error')).toBeInTheDocument();
    });
  });

  it('handles invalid response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    render(
      <BrandingProvider>
        <TestComponent />
      </BrandingProvider>
    );

    await waitFor(() => {
      // Should show error but still load default config
      expect(screen.getByText(/Error: Failed to load configuration: 404/)).toBeInTheDocument();
    });
  });

  it('uses custom config URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockConfig,
    });

    render(
      <BrandingProvider configUrl="/custom-config.json">
        <TestComponent />
      </BrandingProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('town-name')).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledWith('/custom-config.json');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useBranding must be used within a BrandingProvider');
    
    consoleSpy.mockRestore();
  });
});