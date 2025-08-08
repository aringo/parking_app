import { loadAppConfig, defaultAppConfig } from './app.config';
import type { AppConfig } from '../types';

import { vi } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const validConfig: AppConfig = {
  branding: {
    name: 'Test Town',
    primaryColor: '#ff0000',
    secondaryColor: '#00ff00',
    logo: '/test-logo.png',
    backgroundImage: '/test-bg.jpg',
    customCSS: '.test { color: red; }',
  },
  map: {
    center: { lat: 40.7128, lng: -74.0060 },
    zoom: 15,
  },
  dataSource: {
    url: '/test-data.json',
    refreshInterval: 120000,
  },
};

describe('loadAppConfig', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Suppress console warnings for tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads valid configuration successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => validConfig,
    });

    const config = await loadAppConfig();

    expect(config).toEqual(validConfig);
    expect(mockFetch).toHaveBeenCalledWith('/config.json');
  });

  it('uses custom config URL when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => validConfig,
    });

    await loadAppConfig('/custom-config.json');

    expect(mockFetch).toHaveBeenCalledWith('/custom-config.json');
  });

  it('merges partial config with defaults', async () => {
    const partialConfig = {
      branding: {
        name: 'Partial Town',
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
      },
      map: {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 15,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => partialConfig,
    });

    const config = await loadAppConfig();

    expect(config.branding.name).toBe('Partial Town');
    expect(config.branding.primaryColor).toBe('#ff0000');
    expect(config.map.center.lat).toBe(40.7128);
    expect(config.dataSource).toEqual(defaultAppConfig.dataSource);
  });

  it('returns default config when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const config = await loadAppConfig();

    expect(config).toEqual(defaultAppConfig);
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to load app configuration, using defaults:',
      expect.any(Error)
    );
  });

  it('returns default config when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    const config = await loadAppConfig();

    expect(config).toEqual(defaultAppConfig);
  });

  it('validates required branding fields', async () => {
    const invalidConfig = {
      branding: {
        name: '', // Invalid: empty name
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
      },
      map: validConfig.map,
      dataSource: validConfig.dataSource,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidConfig,
    });

    const config = await loadAppConfig();

    expect(config).toEqual(defaultAppConfig);
    expect(console.warn).toHaveBeenCalledWith(
      'Failed to load app configuration, using defaults:',
      expect.any(Error)
    );
  });

  it('validates required map fields', async () => {
    const invalidConfig = {
      branding: validConfig.branding,
      map: {
        center: { lat: 0 }, // Missing lng
        zoom: 15,
      },
      dataSource: validConfig.dataSource,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => invalidConfig,
    });

    const config = await loadAppConfig();

    expect(config).toEqual(defaultAppConfig);
  });

  it('handles malformed JSON gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const config = await loadAppConfig();

    expect(config).toEqual(defaultAppConfig);
  });

  it('preserves optional branding fields when present', async () => {
    const configWithOptionals = {
      ...validConfig,
      branding: {
        ...validConfig.branding,
        logo: '/custom-logo.png',
        backgroundImage: '/custom-bg.jpg',
        customCSS: '.custom { font-size: 16px; }',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => configWithOptionals,
    });

    const config = await loadAppConfig();

    expect(config.branding.logo).toBe('/custom-logo.png');
    expect(config.branding.backgroundImage).toBe('/custom-bg.jpg');
    expect(config.branding.customCSS).toBe('.custom { font-size: 16px; }');
  });
});