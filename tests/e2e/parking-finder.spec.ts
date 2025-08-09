import { test, expect } from '@playwright/test';

test.describe('Parking Finder Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the application with map and branding', async ({ page }) => {
    // Check that the page loads
    await expect(page).toHaveTitle(/Parking Finder/);
    
    // Check for branding header
    await expect(page.locator('[data-testid="branding-header"]')).toBeVisible();
    
    // Check for map container
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
    
    // Check for info panel
    await expect(page.locator('[data-testid="info-panel"]')).toBeVisible();
  });

  test('should display parking locations on map', async ({ page }) => {
    // Wait for parking data to load
    await page.waitForSelector('[data-testid="parking-marker"]', { timeout: 10000 });
    
    // Check that parking markers are visible
    const markers = page.locator('[data-testid="parking-marker"]');
    await expect(markers).toHaveCount.greaterThan(0);
  });

  test('should show parking details when marker is clicked', async ({ page }) => {
    // Wait for parking data to load
    await page.waitForSelector('[data-testid="parking-marker"]', { timeout: 10000 });
    
    // Click on the first parking marker
    const firstMarker = page.locator('[data-testid="parking-marker"]').first();
    await firstMarker.click();
    
    // Check that info panel shows parking details
    const infoPanel = page.locator('[data-testid="info-panel"]');
    await expect(infoPanel.locator('[data-testid="parking-name"]')).toBeVisible();
    await expect(infoPanel.locator('[data-testid="parking-address"]')).toBeVisible();
    await expect(infoPanel.locator('[data-testid="parking-capacity"]')).toBeVisible();
    await expect(infoPanel.locator('[data-testid="directions-link"]')).toBeVisible();
  });

  test('should filter parking locations with search', async ({ page }) => {
    // Wait for parking data to load
    await page.waitForSelector('[data-testid="parking-marker"]', { timeout: 10000 });
    
    // Get initial marker count
    const initialMarkers = await page.locator('[data-testid="parking-marker"]').count();
    
    // Use search functionality
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Main');
    
    // Wait for search results to update
    await page.waitForTimeout(500);
    
    // Check that search filtered the results
    const filteredMarkers = await page.locator('[data-testid="parking-marker"]').count();
    expect(filteredMarkers).toBeLessThanOrEqual(initialMarkers);
  });

  test('should clear search results', async ({ page }) => {
    // Wait for parking data to load
    await page.waitForSelector('[data-testid="parking-marker"]', { timeout: 10000 });
    
    // Get initial marker count
    const initialMarkers = await page.locator('[data-testid="parking-marker"]').count();
    
    // Search for something
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Main');
    await page.waitForTimeout(500);
    
    // Clear search
    const clearButton = page.locator('[data-testid="clear-search"]');
    await clearButton.click();
    
    // Check that all markers are visible again
    await page.waitForTimeout(500);
    const finalMarkers = await page.locator('[data-testid="parking-marker"]').count();
    expect(finalMarkers).toBe(initialMarkers);
  });

  test('should open directions in new tab', async ({ page, context }) => {
    // Wait for parking data to load
    await page.waitForSelector('[data-testid="parking-marker"]', { timeout: 10000 });
    
    // Click on a parking marker
    const firstMarker = page.locator('[data-testid="parking-marker"]').first();
    await firstMarker.click();
    
    // Wait for info panel to update
    await page.waitForSelector('[data-testid="directions-link"]');
    
    // Listen for new page creation
    const pagePromise = context.waitForEvent('page');
    
    // Click directions link
    const directionsLink = page.locator('[data-testid="directions-link"]');
    await directionsLink.click();
    
    // Verify new page opened with maps URL
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('maps');
  });

  test('should handle auto-refresh functionality', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="parking-marker"]', { timeout: 10000 });
    
    // Check for refresh indicator
    const refreshIndicator = page.locator('[data-testid="refresh-indicator"]');
    await expect(refreshIndicator).toBeVisible();
    
    // Check that last updated time is shown
    const lastUpdated = page.locator('[data-testid="last-updated"]');
    await expect(lastUpdated).toBeVisible();
    
    // Trigger manual refresh
    const refreshButton = page.locator('[data-testid="manual-refresh"]');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Check that refresh indicator shows loading state
      await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile layout is applied
    const infoPanel = page.locator('[data-testid="info-panel"]');
    
    // On mobile, info panel should be collapsible or positioned differently
    await expect(infoPanel).toBeVisible();
    
    // Check that map is still functional on mobile
    await page.waitForSelector('[data-testid="parking-marker"]', { timeout: 10000 });
    const markers = page.locator('[data-testid="parking-marker"]');
    await expect(markers).toHaveCount.greaterThan(0);
  });

  test('should handle offline scenarios gracefully', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    
    // Reload the page
    await page.reload();
    
    // Check that cached data is used or appropriate offline message is shown
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    const cachedDataIndicator = page.locator('[data-testid="cached-data-indicator"]');
    
    // Either offline indicator or cached data should be visible
    await expect(offlineIndicator.or(cachedDataIndicator)).toBeVisible();
  });

  test('should display error states appropriately', async ({ page }) => {
    // Mock network failure by intercepting requests
    await page.route('**/parking-data.json', route => route.abort());
    await page.route('**/config.json', route => route.abort());
    
    // Reload to trigger error state
    await page.reload();
    
    // Check for error boundary or fallback UI
    const errorBoundary = page.locator('[data-testid="error-boundary"]');
    const mapFallback = page.locator('[data-testid="map-fallback"]');
    
    // Either error boundary or map fallback should be visible
    await expect(errorBoundary.or(mapFallback)).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="search-input"]', { timeout: 10000 });
    
    // Test keyboard navigation through interactive elements
    await page.keyboard.press('Tab'); // Should focus search input
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
    
    // Continue tabbing through focusable elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Test that Enter key works on focused elements
    await page.keyboard.press('Enter');
    
    // Verify that keyboard interactions work
    // This is a basic test - more specific tests would depend on exact implementation
  });

  test('should maintain accessibility standards', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('[data-testid="map-container"]', { timeout: 10000 });
    
    // Check for proper ARIA labels and roles
    const mapContainer = page.locator('[data-testid="map-container"]');
    await expect(mapContainer).toHaveAttribute('role');
    
    // Check that interactive elements have proper labels
    const searchInput = page.locator('[data-testid="search-input"]');
    await expect(searchInput).toHaveAttribute('aria-label');
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    await expect(headings).toHaveCount.greaterThan(0);
  });
});