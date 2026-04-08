const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:8007';

test.describe('Weather Standalone PWA', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto(BASE_URL);
  });

  test('should load with correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Weather');

    // Check page title element
    const pageTitle = page.locator('#page-title');
    await expect(pageTitle).toHaveText('Weather');
  });

  test('should have no cross-app navigation links', async ({ page }) => {
    // Check that there are no links to other transport apps
    const header = page.locator('header');
    const navLinks = header.locator('a');

    // Should have no navigation links (standalone app)
    await expect(navLinks).toHaveCount(0);

    // Verify no links to ubike, mrt, rail, bus, etc.
    await expect(page.locator('a[href*="ubike"]')).toHaveCount(0);
    await expect(page.locator('a[href*="mrt"]')).toHaveCount(0);
    await expect(page.locator('a[href*="rail"]')).toHaveCount(0);
    await expect(page.locator('a[href*="bus"]')).toHaveCount(0);
    await expect(page.locator('a[href*="thsr"]')).toHaveCount(0);
  });

  test('should have no Leaflet map', async ({ page }) => {
    // Verify no Leaflet container
    await expect(page.locator('#map')).toHaveCount(0);
    await expect(page.locator('.leaflet-container')).toHaveCount(0);

    // Verify Leaflet is not loaded
    const leafletLoaded = await page.evaluate(() => {
      return typeof window.L !== 'undefined';
    });
    expect(leafletLoaded).toBe(false);
  });

  test('should have auto-detect location button', async ({ page }) => {
    const autoBtn = page.locator('#auto-btn');

    await expect(autoBtn).toBeVisible();
    await expect(autoBtn).toHaveText(/Auto|自動/);
    await expect(autoBtn).toHaveAttribute('onclick', 'detectLocation()');
  });

  test('should have Taiwan city selector with 13+ cities', async ({ page }) => {
    const taiwanSelect = page.locator('#taiwan-select');

    await expect(taiwanSelect).toBeVisible();
    await expect(taiwanSelect).toHaveAttribute('onchange', 'onTaiwanCityChange()');

    // Check that it has placeholder + at least 13 cities
    const options = taiwanSelect.locator('option');
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(14); // 1 placeholder + 13 cities

    // Verify first option is placeholder
    const firstOption = options.nth(0);
    await expect(firstOption).toHaveAttribute('value', '');
    await expect(firstOption).toHaveText(/Taiwan|台灣/);

    // Verify some Taiwan cities are present
    const allText = await taiwanSelect.innerHTML();
    expect(allText).toContain('Taipei');
    expect(allText).toContain('Kaohsiung');
    expect(allText).toContain('Taichung');
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.locator('#search-input');

    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('type', 'text');
    await expect(searchInput).toHaveAttribute('placeholder', /Search city|搜尋城市/);
    await expect(searchInput).toHaveAttribute('oninput', 'onSearchInput()');
  });

  test('should have current weather card (initially hidden)', async ({ page }) => {
    const currentWeather = page.locator('#current-weather');

    // Element should exist
    await expect(currentWeather).toHaveCount(1);

    // Should have the class
    await expect(currentWeather).toHaveClass('current-weather');

    // Check for key child elements
    await expect(currentWeather.locator('#cw-location')).toHaveCount(1);
    await expect(currentWeather.locator('#cw-temp')).toHaveCount(1);
    await expect(currentWeather.locator('#cw-icon')).toHaveCount(1);
    await expect(currentWeather.locator('#cw-desc')).toHaveCount(1);
    await expect(currentWeather.locator('#cw-wind')).toHaveCount(1);
    await expect(currentWeather.locator('#cw-humidity')).toHaveCount(1);
    await expect(currentWeather.locator('#cw-pressure')).toHaveCount(1);
    await expect(currentWeather.locator('#cw-precip')).toHaveCount(1);
  });

  test('should have 7-day forecast section', async ({ page }) => {
    const forecastSection = page.locator('#forecast-section');

    await expect(forecastSection).toHaveCount(1);
    await expect(forecastSection).toHaveClass('forecast-section');

    // Check for title and row
    await expect(forecastSection.locator('#forecast-title')).toHaveCount(1);
    await expect(forecastSection.locator('#forecast-row')).toHaveCount(1);
  });

  test('should have world cities section', async ({ page }) => {
    const worldSection = page.locator('.world-section');

    await expect(worldSection).toHaveCount(1);

    // Check for header and grid
    const worldHeader = worldSection.locator('.world-header');
    await expect(worldHeader).toBeVisible();

    const worldTitle = worldSection.locator('#world-title');
    await expect(worldTitle).toHaveText(/World Cities|世界城市/);

    const worldGrid = worldSection.locator('#world-grid');
    await expect(worldGrid).toHaveCount(1);
    await expect(worldGrid).toHaveClass(/collapsed/); // Initially collapsed
  });

  test('should have language toggle button', async ({ page }) => {
    const langBtn = page.locator('#lang-btn');

    await expect(langBtn).toBeVisible();
    await expect(langBtn).toHaveClass('float-btn');
    await expect(langBtn).toHaveAttribute('onclick', 'toggleLang()');
    await expect(langBtn).toHaveText(/EN|中/);
  });

  test('language toggle should work', async ({ page }) => {
    const langBtn = page.locator('#lang-btn');
    const pageTitle = page.locator('#page-title');

    // Get initial state
    const initialLangText = await langBtn.textContent();
    const initialPageTitle = await pageTitle.textContent();

    // Click language toggle
    await langBtn.click();

    // Wait for changes
    await page.waitForTimeout(100);

    // Verify language changed
    const newLangText = await langBtn.textContent();
    const newPageTitle = await pageTitle.textContent();

    expect(newLangText).not.toBe(initialLangText);
    expect(newPageTitle).not.toBe(initialPageTitle);

    // Toggle back
    await langBtn.click();
    await page.waitForTimeout(100);

    // Should return to original
    await expect(langBtn).toHaveText(initialLangText);
    await expect(pageTitle).toHaveText(initialPageTitle);
  });

  test('should have Open-Meteo API URLs configured', async ({ page }) => {
    // Check that API endpoints are defined in the page
    const pageContent = await page.content();

    expect(pageContent).toContain('https://api.open-meteo.com/v1/forecast');
    expect(pageContent).toContain('https://geocoding-api.open-meteo.com/v1/search');
  });

  test('should have API constants properly configured', async ({ page }) => {
    // Check JavaScript constants
    const apiConfig = await page.evaluate(() => {
      return {
        hasForecastApi: typeof FORECAST_API !== 'undefined',
        hasGeocodingApi: typeof GEOCODING_API !== 'undefined',
        forecastUrl: typeof FORECAST_API !== 'undefined' ? FORECAST_API : null,
        geocodingUrl: typeof GEOCODING_API !== 'undefined' ? GEOCODING_API : null
      };
    });

    expect(apiConfig.hasForecastApi).toBe(true);
    expect(apiConfig.hasGeocodingApi).toBe(true);
    expect(apiConfig.forecastUrl).toBe('https://api.open-meteo.com/v1/forecast');
    expect(apiConfig.geocodingUrl).toBe('https://geocoding-api.open-meteo.com/v1/search');
  });

  test('manifest.webapp should be accessible', async ({ page, request }) => {
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', 'manifest.webapp');

    // Verify manifest file is accessible
    const manifestResponse = await request.get(`${BASE_URL}/manifest.webapp`);
    expect(manifestResponse.ok()).toBe(true);
    expect(manifestResponse.headers()['content-type']).toContain('application');

    // Parse and verify manifest content
    const manifestJson = await manifestResponse.json();
    expect(manifestJson).toHaveProperty('name');
    expect(manifestJson).toHaveProperty('short_name');
    expect(manifestJson).toHaveProperty('start_url');
  });

  test('service worker should be accessible', async ({ page, request }) => {
    // Check that sw.js is registered
    const pageContent = await page.content();
    expect(pageContent).toContain('serviceWorker');
    expect(pageContent).toContain('sw.js');

    // Verify sw.js file is accessible
    const swResponse = await request.get(`${BASE_URL}/sw.js`);
    expect(swResponse.ok()).toBe(true);
    expect(swResponse.headers()['content-type']).toContain('javascript');
  });

  test('should have no console errors on initial load', async ({ page }) => {
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('should initialize weather app correctly', async ({ page }) => {
    // Wait for initialization
    await page.waitForFunction(() => {
      return typeof initialize !== 'undefined' &&
             typeof TAIWAN_CITIES !== 'undefined' &&
             typeof WORLD_CITIES !== 'undefined';
    });

    const appState = await page.evaluate(() => {
      return {
        hasTaiwanCities: Array.isArray(TAIWAN_CITIES) && TAIWAN_CITIES.length >= 13,
        hasWorldCities: Array.isArray(WORLD_CITIES) && WORLD_CITIES.length >= 20,
        hasWmoCodes: typeof WMO_CODES !== 'undefined'
      };
    });

    expect(appState.hasTaiwanCities).toBe(true);
    expect(appState.hasWorldCities).toBe(true);
    expect(appState.hasWmoCodes).toBe(true);
  });

  test('should have loading message', async ({ page }) => {
    const loadingMsg = page.locator('#loading-msg');

    await expect(loadingMsg).toHaveCount(1);
    await expect(loadingMsg.locator('[data-en]')).toHaveAttribute('data-en', 'Loading weather...');
  });

  test('should have error message element (initially hidden)', async ({ page }) => {
    const errorMsg = page.locator('#error-msg');

    await expect(errorMsg).toHaveCount(1);
    await expect(errorMsg).toHaveClass('error-msg');

    // Should not have 'visible' class initially
    const hasVisibleClass = await errorMsg.evaluate(el => el.classList.contains('visible'));
    expect(hasVisibleClass).toBe(false);
  });

  test('should have search results container', async ({ page }) => {
    const searchResults = page.locator('#search-results');

    await expect(searchResults).toHaveCount(1);
    await expect(searchResults).toHaveClass('search-results');

    // Should not have 'open' class initially
    const hasOpenClass = await searchResults.evaluate(el => el.classList.contains('open'));
    expect(hasOpenClass).toBe(false);
  });

  test('should expand world cities section when clicked', async ({ page }) => {
    const worldHeader = page.locator('.world-header');
    const worldGrid = page.locator('#world-grid');
    const worldToggle = page.locator('#world-toggle');

    // Initially collapsed
    await expect(worldGrid).toHaveClass(/collapsed/);
    await expect(worldToggle).toHaveText(/Show|展開/);

    // Click to expand
    await worldHeader.click();

    // Wait for animation
    await page.waitForTimeout(100);

    // Should be expanded
    const hasCollapsedClass = await worldGrid.evaluate(el => el.classList.contains('collapsed'));
    expect(hasCollapsedClass).toBe(false);
    await expect(worldToggle).toHaveText(/Hide|收起/);
  });

  test('should have Taiwan cities data with coordinates', async ({ page }) => {
    const taiwanCities = await page.evaluate(() => {
      return TAIWAN_CITIES.map(city => ({
        key: city.key,
        hasName: city.name && city.name.en && city.name.zh,
        hasCoords: typeof city.lat === 'number' && typeof city.lng === 'number'
      }));
    });

    expect(taiwanCities.length).toBeGreaterThanOrEqual(13);
    taiwanCities.forEach(city => {
      expect(city.hasName).toBe(true);
      expect(city.hasCoords).toBe(true);
    });
  });

  test('should have world cities data with coordinates', async ({ page }) => {
    const worldCities = await page.evaluate(() => {
      return WORLD_CITIES.map(city => ({
        hasName: city.name && city.name.en && city.name.zh,
        hasCoords: typeof city.lat === 'number' && typeof city.lng === 'number'
      }));
    });

    expect(worldCities.length).toBeGreaterThanOrEqual(20);
    worldCities.forEach(city => {
      expect(city.hasName).toBe(true);
      expect(city.hasCoords).toBe(true);
    });
  });

  test('should have WMO weather codes defined', async ({ page }) => {
    const wmoCodesValid = await page.evaluate(() => {
      const codes = [0, 1, 2, 3, 45, 48, 51, 61, 63, 65, 71, 95, 96, 99];
      return codes.every(code => {
        const wmo = WMO_CODES[code];
        return wmo && wmo.icon && wmo.en && wmo.zh;
      });
    });

    expect(wmoCodesValid).toBe(true);
  });

  test('should have wind direction data', async ({ page }) => {
    const windDirsValid = await page.evaluate(() => {
      return WIND_DIRS.en && WIND_DIRS.en.length === 16 &&
             WIND_DIRS.zh && WIND_DIRS.zh.length === 16;
    });

    expect(windDirsValid).toBe(true);
  });

  test('should have cache configuration', async ({ page }) => {
    const cacheConfig = await page.evaluate(() => {
      return {
        hasCacheKey: typeof CACHE_KEY !== 'undefined',
        hasCacheTtl: typeof CACHE_TTL !== 'undefined',
        hasAutoRefresh: typeof AUTO_REFRESH_MS !== 'undefined',
        cacheKey: typeof CACHE_KEY !== 'undefined' ? CACHE_KEY : null,
        cacheTtl: typeof CACHE_TTL !== 'undefined' ? CACHE_TTL : null
      };
    });

    expect(cacheConfig.hasCacheKey).toBe(true);
    expect(cacheConfig.hasCacheTtl).toBe(true);
    expect(cacheConfig.hasAutoRefresh).toBe(true);
    expect(cacheConfig.cacheKey).toBe('weather-cache');
    expect(cacheConfig.cacheTtl).toBe(30 * 60 * 1000); // 30 minutes
  });

  test('should have responsive design meta tag', async ({ page }) => {
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /initial-scale=1.0/);
  });

  test('should have PWA meta tags', async ({ page }) => {
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#0288D1');

    const appleCapable = page.locator('meta[name="apple-mobile-web-app-capable"]');
    await expect(appleCapable).toHaveAttribute('content', 'yes');

    const appleIcon = page.locator('link[rel="apple-touch-icon"]');
    await expect(appleIcon).toHaveAttribute('href', /icon-180/);
  });

  test('should have favicon', async ({ page, request }) => {
    const faviconLink = page.locator('link[rel="icon"]');
    await expect(faviconLink).toHaveAttribute('href', 'favicon.ico');

    // Verify favicon is accessible
    const faviconResponse = await request.get(`${BASE_URL}/favicon.ico`);
    expect(faviconResponse.ok()).toBe(true);
  });
});
