[English](README.md) | 繁體中文

# Weather

由 Open-Meteo API 驅動的即時天氣狀況與 7 天天氣預報。

## 功能特色

### 位置支援
- **自動定位 GPS**：透過瀏覽器地理位置自動定位使用者
- **台灣 13 縣市**：台北、新北、桃園、新竹、台中、嘉義、台南、高雄、屏東、宜蘭、花蓮、台東、基隆
- **全球 20 大城市**：東京、首爾、香港、新加坡、曼谷、紐約、洛杉磯、倫敦、巴黎、柏林、雪梨、杜拜、上海、北京、孟買、聖保羅、開羅、莫斯科、溫哥華、阿姆斯特丹
- **搜尋功能與地理編碼**：透過 Open-Meteo Geocoding API 搜尋全球任何城市

### 即時天氣
- 溫度與體感溫度（攝氏）
- 風速與風向（km/h，16 方位羅盤）
- 濕度（%）
- 大氣壓力（hPa）
- 降雨量（mm）
- 日出與日落時間

### 7 天天氣預報
- 每日最高/最低溫度
- 天氣圖示（基於 WMO 天氣代碼）
- 降雨量（mm）
- 最大風速（km/h）
- 可橫向滑動的卡片式版面

### 使用者體驗
- **雙語支援**：英文/中文切換，並可從瀏覽器語系自動偵測
- **30 分鐘快取**：localStorage 快取搭配 TTL，減少 API 呼叫
- **自動更新**：每 30 分鐘自動更新資料
- **響應式設計**：適合行動裝置的版面，全球城市區塊可收合
- **PWA**：可安裝的漸進式網頁應用程式，具備 service worker 離線支援

## 技術架構

- **HTML5/CSS3/JavaScript**：全部內嵌，無外部框架
- **無地圖函式庫**：純 HTML/CSS UI（無 Leaflet、無 Mapbox）
- **Open-Meteo API**：免費天氣資料，無需驗證
  - Forecast API: `https://api.open-meteo.com/v1/forecast`
  - Geocoding API: `https://geocoding-api.open-meteo.com/v1/search`
- **PWA**：Service worker 搭配 stale-while-revalidate 快取策略處理 API 呼叫
- **localStorage**：天氣資料 30 分鐘快取 TTL

## 快速開始

```bash
# 在 8007 埠啟動本機伺服器
python3 -m http.server 8007

# 開啟瀏覽器
open http://localhost:8007
```

其他伺服器選項：
```bash
# Node.js
npx serve . -p 8007

# PHP
php -S localhost:8007
```

## 檔案結構

```
weather/
├── index.html          # 主應用程式（HTML/CSS/JS 全部內嵌）
├── manifest.webapp     # PWA manifest
├── sw.js               # Service worker
├── favicon.ico         # 16x16 favicon
├── img/                # 應用程式圖示（32, 64, 128, 180, 192, 512px）
├── android/            # Android WebView 封裝
│   ├── sync-web.sh     # 同步 web 資源到 Android assets 資料夾
│   └── app/            # Android Studio 專案
├── ios/                # iOS WKWebView 封裝
│   ├── sync-web.sh     # 同步 web 資源到 iOS bundle
│   └── Weather/        # Xcode 專案
├── tests/              # Playwright E2E 測試
├── package.json        # 測試相依套件
└── playwright.config.js # Playwright 設定檔
```

## 原生應用程式建置

### Android (tw.pwa.weather)
```bash
cd android
./sync-web.sh           # 同步 web 資源到 app/src/main/assets
./gradlew assembleRelease
```

輸出：`android/app/build/outputs/apk/release/app-release.apk`

### iOS (tw.pwa.weather)
```bash
cd ios
./sync-web.sh           # 同步 web 資源到 Weather/Weather/assets
open Weather/Weather.xcodeproj
# 在 Xcode 中建置
```

## 測試

```bash
# 安裝相依套件
npm install

# 執行 Playwright 測試
npm test

# 以 UI 模式執行
npm run test:headed
```

測試項目驗證：
- 初始頁面載入
- 語言切換（EN/ZH）
- 台灣城市選擇
- 全球城市選擇
- 搜尋功能
- 即時天氣顯示
- 7 天天氣預報呈現

## 資料與快取

### 天氣資料（Open-Meteo）
- **即時**：`temperature_2m`、`relative_humidity_2m`、`apparent_temperature`、`precipitation`、`weather_code`、`wind_speed_10m`、`wind_direction_10m`、`surface_pressure`
- **每日**：`weather_code`、`temperature_2m_max`、`temperature_2m_min`、`precipitation_sum`、`wind_speed_10m_max`、`sunrise`、`sunset`
- **時區**：從座標自動偵測

### localStorage 快取
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

快取 TTL：30 分鐘

### Service Worker 策略
- **靜態資源**：Cache-first（`weather-static-v1`）
- **API 呼叫**：Stale-while-revalidate（`weather-api-v1`）
- **離線模式**：當網路不可用時提供快取的 API 回應

## WMO 天氣代碼

本應用程式使用 WMO code 4677 標準表示天氣狀況：
- `0`：晴朗
- `1-3`：大致晴朗 / 局部多雲 / 陰天
- `45-48`：霧
- `51-57`：毛毛雨（輕微到冰凍）
- `61-67`：雨（輕微到冰凍）
- `71-77`：雪（輕微到大雪）
- `80-82`：陣雨
- `85-86`：陣雪
- `95-99`：雷暴（伴隨冰雹）

## 授權條款

無明確授權。為台灣交通 PWA 系列的一部分。
