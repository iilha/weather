# Weather Design Document

## Architecture Overview

Weather is a Progressive Web App (PWA) that displays current weather conditions and 7-day forecasts for locations worldwide, with a focus on Taiwan cities. Built with vanilla JavaScript and HTML5 (no map component), the app fetches data from the Open-Meteo API and provides location-based weather via GPS, city selector, or search.

The app features current weather cards, scrollable 7-day forecast, temperature charts, and location management with auto-refresh. It can be served via HTTP (GitHub Pages), loaded in native WebView wrappers, or installed as a PWA with smart caching for offline access.

## Data Flow

### Data Sources
- **Open-Meteo API**: `https://api.open-meteo.com/v1/forecast`
  - Current weather: temperature, feels-like, humidity, wind, precipitation, pressure
  - 7-day forecast: daily hi/lo temps, weather codes, precipitation probability
  - No authentication required, CORS-enabled, free tier (10,000 requests/day)
- **Open-Meteo Geocoding API**: `https://geocoding-api.open-meteo.com/v1/search`
  - Location search: city name → coordinates (lat/lng)
  - Supports worldwide locations with multi-language results

### Fetch-Render Cycle
1. **Auto GPS**: Page load triggers `navigator.geolocation.getCurrentPosition()`
2. **Coordinates → Weather**: Fetch from Open-Meteo with `latitude={lat}&longitude={lng}`
3. **Parse Response**: Extract current weather + 7-day forecast from JSON
4. **Render Cards**: Current weather card + 7 forecast cards with weather icons
5. **Cache Response**: Store in `localStorage` with 30-minute TTL
6. **Auto-Refresh**: Fetch new data every 30 minutes if tab visible

### Weather Code Mapping
- Open-Meteo returns WMO weather codes (0-99)
- App maps codes to icons: ☀️ (clear), ⛅ (partly cloudy), ☁️ (cloudy), 🌧️ (rain), ⛈️ (thunderstorm), 🌨️ (snow)
- Color-coded temperature: Blue (<15°C), Green (15-25°C), Orange (25-30°C), Red (>30°C)

## UI Components

### Navigation Header
- Language toggle button (EN/中文)
- Active state highlighting

### Location Bar
- **Auto GPS Button**: 📍 button triggers geolocation, shows loading animation
- **City Selector**: Dropdown for 13 Taiwan cities (Taipei, Taichung, Kaohsiung, etc.)
- **World Cities**: Dropdown for 20 major world cities (Tokyo, Seoul, Singapore, NYC, etc.)
- **Search Box**: Text input for worldwide location search (fuzzy match via Geocoding API)
- Active location highlighted with blue background

### Current Weather Card
- Large temperature display (°C)
- Location name (city, country)
- Weather description (e.g., "Partly Cloudy")
- Weather icon (based on WMO code)
- Metadata grid: Feels-like, Humidity, Wind, Precipitation, Pressure
- Last updated timestamp (relative: "Updated 5 minutes ago")

### 7-Day Forecast
- Horizontal scrollable cards (optimized for mobile)
- Each card: Day name, Weather icon, Hi/Lo temps, Precipitation %
- Today's card highlighted with border
- Swipe gesture for navigation (touch-enabled)

### Temperature Chart (Optional)
- CSS bar chart showing hi/lo temps for 7 days
- Color gradient: blue (cold) to red (hot)
- Hover shows exact temperature values

### Mobile Layout
- Single-column layout (no sidebar)
- Full-width cards with responsive padding
- Large touch targets for buttons (48px min height)

## Caching Strategy

### Service Worker (`sw.js`)
| Resource Type | Strategy | TTL |
|---------------|----------|-----|
| Static assets (HTML, CSS, JS) | Cache-first | 24 hours |
| Open-Meteo API weather data | Stale-while-revalidate | 30 minutes |
| Open-Meteo Geocoding API | Cache-first | 7 days |

### Stale-While-Revalidate Logic
1. Check cache first, return cached response immediately if within TTL
2. Fetch fresh data in background, update cache
3. If cache expired, wait for network response
4. On network failure, serve stale cache (up to 2 hours old)
5. Show "Offline" indicator when serving stale data

### localStorage Cache
```javascript
localStorage.setItem('weather-cache', JSON.stringify({
  location: {lat, lng, name},
  data: weatherData,
  timestamp: Date.now()
}));
```
- TTL: 30 minutes (1800000 ms)
- On cache hit: render immediately, fetch in background
- On cache miss: show loading spinner, wait for fetch

### Auto-Refresh Strategy
- `setInterval()` checks if cache expired every 1 minute
- If expired and tab visible: fetch new data silently
- If tab hidden: defer refresh until tab visible (Page Visibility API)
- Prevents unnecessary API calls when user not viewing app

## Localization

### Language Toggle
- Default: `navigator.language` (zh-TW/zh-CN → Chinese, else English)
- Persistence: `localStorage.setItem('weather-lang', lang)`
- Text elements: `data-en` and `data-zh` attributes
- Weather descriptions: Translated (e.g., "Partly Cloudy" → "多雲")
- Temperature unit: Always Celsius (Taiwan standard)

### City Names
- Taiwan cities: Bilingual in selector (e.g., "台北 Taipei")
- World cities: English names with Chinese translations in parentheses

## Native Wrappers

### Android WebView
- Loads `file:///android_asset/index.html` from APK assets
- WebView settings: JavaScript enabled, geolocation permission, DOM storage
- Background sync for weather updates (WorkManager, every 30 minutes)
- JavaScript bridge: `Android.shareWeather(location, temp)` for native share sheet
- Widget: Home screen widget shows current weather (synced from WebView cache)

### iOS WKWebView
- Loads local HTML via `WKWebView.loadFileURL()` from app bundle
- Configuration: `allowsInlineMediaPlayback`, location services entitlements
- Swift bridge: `window.webkit.messageHandlers.shareWeather.postMessage(data)`
- Background fetch: BGTaskScheduler for weather updates (every 30 minutes)
- Today Widget: Shows current weather (synced via App Groups shared UserDefaults)

### Asset Sync
- CI/CD: GitHub Actions copies web build to native repos on merge
- Git submodule: `ios/Weather/Resources/` and `android/app/src/main/assets/`
- Build script validates Open-Meteo API response parsing

## State Management

### localStorage Keys
| Key | Purpose | Values |
|-----|---------|--------|
| `weather-lang` | Language preference | `'en'` \| `'zh'` |
| `weather-cache` | Weather data cache | JSON: `{location, data, timestamp}` |
| `weather-last-location` | Last selected location | JSON: `{lat, lng, name}` |

### In-Memory State
- `currentWeather`: Current weather object from API
- `forecast`: Array of 7 daily forecast objects
- `location`: Current location object `{lat, lng, name}`
- `refreshTimer`: `setInterval()` ID for 30-minute refresh cycle
- `cacheTimestamp`: Time when current data was cached

### State Persistence
- Language: persisted to localStorage on change
- Last location: persisted to localStorage on location change (restored on page load)
- Weather data: cached in localStorage with 30-minute TTL
- User preferences: not persisted (ephemeral UI state)

### Cache Invalidation
- Time-based: 30-minute TTL, checked on page load and every minute
- Location-based: Cache cleared when user selects different location
- Manual refresh: Pull-to-refresh gesture clears cache, forces fetch
- No versioning: Cache schema changes require localStorage.clear() in migration code

## Future Plan

### Short-term
- Add hourly forecast (next 24 hours)
- Implement weather alerts/warnings
- Add UV index and air quality (AQI)
- Show precipitation radar/map

### Medium-term
- Weather widget for home screen
- Clothing/umbrella recommendations based on forecast
- Historical weather comparison
- Multi-location weather dashboard

### Long-term
- Agricultural weather advisory
- Outdoor activity planner (hiking, surfing conditions)
- Weather-based event recommendations
- Integration with calendar for trip weather preview

## TODO

- [ ] Add hourly forecast timeline
- [ ] Integrate AQI data (Taiwan EPA)
- [ ] Add UV index display
- [ ] Implement weather alerts from CWA
- [ ] Add precipitation map/radar
- [ ] Implement weather notification service
- [ ] Add dark mode
