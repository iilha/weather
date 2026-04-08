English | [繁體中文](README_zh.md)

# Weather

Current weather conditions and 7-day forecast powered by Open-Meteo API.

## Features

### Location Support
- **Auto-detect GPS**: Automatically locate user via browser geolocation
- **13 Taiwan Cities**: Taipei, New Taipei, Taoyuan, Hsinchu, Taichung, Chiayi, Tainan, Kaohsiung, Pingtung, Yilan, Hualien, Taitung, Keelung
- **20 World Cities**: Tokyo, Seoul, Hong Kong, Singapore, Bangkok, New York, Los Angeles, London, Paris, Berlin, Sydney, Dubai, Shanghai, Beijing, Mumbai, Sao Paulo, Cairo, Moscow, Vancouver, Amsterdam
- **Search with Geocoding**: Search any city worldwide via Open-Meteo Geocoding API

### Current Weather
- Temperature and feels-like temperature (Celsius)
- Wind speed and direction (km/h with 16-point compass)
- Humidity (%)
- Atmospheric pressure (hPa)
- Precipitation (mm)
- Sunrise and sunset times

### 7-Day Forecast
- Daily high/low temperatures
- Weather icons (based on WMO weather codes)
- Precipitation amount (mm)
- Maximum wind speed (km/h)
- Scrollable horizontal card layout

### User Experience
- **Bilingual**: English/Chinese toggle with auto-detect from browser locale
- **30-min Cache**: localStorage caching with TTL to reduce API calls
- **Auto-refresh**: Automatic data refresh every 30 minutes
- **Responsive Design**: Mobile-friendly layout, collapsible world cities section
- **PWA**: Installable progressive web app with service worker offline support

## Tech Stack

- **HTML5/CSS3/JavaScript**: All inline, no external frameworks
- **No Map Library**: Pure HTML/CSS UI (no Leaflet, no Mapbox)
- **Open-Meteo API**: Free weather data, no authentication required
  - Forecast API: `https://api.open-meteo.com/v1/forecast`
  - Geocoding API: `https://geocoding-api.open-meteo.com/v1/search`
- **PWA**: Service worker with stale-while-revalidate caching strategy for API calls
- **localStorage**: 30-minute cache TTL for weather data

## Quick Start

```bash
# Start local server on port 8007
python3 -m http.server 8007

# Open browser
open http://localhost:8007
```

Alternative servers:
```bash
# Node.js
npx serve . -p 8007

# PHP
php -S localhost:8007
```

## File Structure

```
weather/
├── index.html          # Main app (HTML/CSS/JS all inline)
├── manifest.webapp     # PWA manifest
├── sw.js               # Service worker
├── favicon.ico         # 16x16 favicon
├── img/                # App icons (32, 64, 128, 180, 192, 512px)
├── android/            # Android WebView wrapper
│   ├── sync-web.sh     # Sync web assets to Android assets folder
│   └── app/            # Android Studio project
├── ios/                # iOS WKWebView wrapper
│   ├── sync-web.sh     # Sync web assets to iOS bundle
│   └── Weather/        # Xcode project
├── tests/              # Playwright E2E tests
├── package.json        # Test dependencies
└── playwright.config.js # Playwright config
```

## Native Builds

### Android (tw.pwa.weather)
```bash
cd android
./sync-web.sh           # Sync web assets to app/src/main/assets
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### iOS (tw.pwa.weather)
```bash
cd ios
./sync-web.sh           # Sync web assets to Weather/Weather/assets
open Weather/Weather.xcodeproj
# Build in Xcode
```

## Testing

```bash
# Install dependencies
npm install

# Run Playwright tests
npm test

# Run with UI
npm run test:headed
```

Tests validate:
- Initial page load
- Language toggle (EN/ZH)
- Taiwan city selection
- World city selection
- Search functionality
- Current weather display
- 7-day forecast rendering

## Data & Caching

### Weather Data (Open-Meteo)
- **Current**: `temperature_2m`, `relative_humidity_2m`, `apparent_temperature`, `precipitation`, `weather_code`, `wind_speed_10m`, `wind_direction_10m`, `surface_pressure`
- **Daily**: `weather_code`, `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, `wind_speed_10m_max`, `sunrise`, `sunset`
- **Timezone**: Auto-detected from coordinates

### localStorage Cache
```javascript
{
  "weather-cache": {
    timestamp: number,     // Unix ms
    location: { lat, lng, name },
    data: { current, daily }
  },
  "weather-lang": "en" | "zh"
}
```

Cache TTL: 30 minutes

### Service Worker Strategy
- **Static Assets**: Cache-first (`weather-static-v1`)
- **API Calls**: Stale-while-revalidate (`weather-api-v1`)
- **Offline**: Serves cached API responses when network unavailable

## WMO Weather Codes

The app uses WMO code 4677 standard for weather conditions:
- `0`: Clear sky
- `1-3`: Mainly clear / Partly cloudy / Overcast
- `45-48`: Fog
- `51-57`: Drizzle (light to freezing)
- `61-67`: Rain (slight to freezing)
- `71-77`: Snow (slight to heavy)
- `80-82`: Rain showers
- `85-86`: Snow showers
- `95-99`: Thunderstorm (with hail)

## License

No explicit license. Part of Taiwan Transport PWA collection.
