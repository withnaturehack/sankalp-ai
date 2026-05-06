# SANKALP AI

SANKALP AI is a production-grade civic governance mobile app for Uttarakhand citizens and city administrators, offering real-time civic command, interactive maps, SOS features, gamification, and bilingual support.

## Run & Operate

```bash
# Start the backend server (primary workflow)
node_modules/.bin/tsx server/index.ts

# Rebuild web bundle for deployment
EXPO_PUBLIC_DOMAIN=sankalp-ai.replit.app EXPO_NO_TELEMETRY=1 EXPO_NO_DOTENV=1 \
  node_modules/.bin/expo export --platform web --output-dir /tmp/web-build && \
  rm -rf static-build/web && mv /tmp/web-build static-build/web

# Required Environment Variables:
# EXPO_PUBLIC_DOMAIN=sankalp-ai.replit.app  (set for production builds)
# NVIDIA_API_KEY                             (optional, for AI chat)
```

## Stack

**Frontend:**
- Framework: Expo ~54.0.27 + React Native 0.81.5 (Expo Router for file-based routing)
- State Management: React Context (AuthContext, AppContext, LanguageContext, NotificationContext)
- UI: Custom components, Animated API, LinearGradient, Ionicons, Inter fonts
- Map (native): react-native-webview + Leaflet.js (CartoDB dark tiles, same as web)
- Map (web): Leaflet.js via inline iframe srcDoc (CartoDB dark tiles)
- Voice: expo-speech (TTS alerts on SOS trigger)
- Notifications: expo-notifications (local system notifications)
- Location: expo-location ~19.0.8
- Audio: expo-av ^16.0.8 (recording during SOS)

**Backend:**
- Framework: Express.js + TypeScript
- Database: In-memory storage (demo/prototype)
- Real-time: WebSocket server
- Static Serving: Express serves `static-build/web/` + SPA fallback + no-cache on index.html

**Build Tool:** Metro (React Native), Expo CLI (web export)

## Where things live

- `server/storage.ts`: Uttarakhand data (districts, blocks, police stations) + seeded demo users
- `server/routes.ts`: API routes, WebSocket, AI responses
- `server/index.ts`: Express server; SPA fallback + Cache-Control: no-store on index.html
- `context/AppContext.tsx`: Main context — API calls, WebSocket, triggerSOS, triggerWomenSafetySOS
- `context/AuthContext.tsx`: Auth + user roles
- `context/NotificationContext.tsx`: In-app notifications + expo-notifications system alerts
- `context/LanguageContext.tsx`: English/Hindi bilingual translations
- `components/UttarakhandMap.tsx`: Native map — WebView + Leaflet.js (dark CartoDB tiles, works in Expo Go)
- `components/UttarakhandMap.web.tsx`: Web map — Leaflet.js in iframe via srcDoc with CartoDB tiles
- `app/(tabs)/_layout.tsx`: 5-tab navigation (Home, Reports, District Map, SOS, Profile)
- `app/(tabs)/sos.tsx`: Full SOS screen — shake/tap/hold/volume/voice detection + audio recording
- `static-build/web/`: Committed web bundle (served as static SPA)

## Architecture decisions

- **Unified Leaflet Map**: Both native (WebView) and web (iframe) use identical Leaflet.js HTML with CartoDB dark tiles. No Google Maps API key needed. Works in Expo Go out of the box.
- **In-memory Backend Storage**: Simplifies deployment; suitable for demo/prototype.
- **Token-based Authentication**: Bearer tokens in AsyncStorage; stateless API.
- **Dynamic API URL Resolution**: `getApiUrl()` returns `https://sankalp-ai.replit.app/` in production builds, `localhost:5000` in dev.
- **SPA Fallback + No-Cache**: Server serves `index.html` for all non-API routes with `Cache-Control: no-store` so browsers always load the latest bundle.
- **Location Cleanup Safety**: All `watchPositionAsync.remove()` calls wrapped in try-catch to prevent `LocationEventEmitter.removeSubscription` crash in some Expo versions.

## Product

- **Civic Governance**: Submit/manage complaints, track status, ward health scores
- **Real-time SOS**: Voice-announced alerts; shake ×4, tap ×6, hold 2s, Vol+×6, side button, web keyboard (ArrowUp ×5); live GPS sharing to police every 15s
- **Women Safety**: Silent panic activation; voice says "Emergency alert sent. Police notified. Stay calm." on activation; audio recording during panic
- **Interactive Maps**: Leaflet (web + native WebView) — complaints, SOS, workers, police stations, risk zones with dark CartoDB theme. Recenter button. Works offline-ish (tiles from CDN).
- **Notifications**: expo-notifications local system alerts on SOS trigger; in-app notification list
- **Bilingual**: Full English/Hindi toggle
- **Admin War Room**: District-filtered monitoring for admins/super-admins
- **AI Chat**: NVIDIA LLaMA 3.1 8B (requires NVIDIA_API_KEY)
- **RTI Portal, Bills, Community, Leaderboard**: Available via hidden tabs

## User preferences

- App color scheme: deep dark (#0d1117, #0A0F1C) with Saffron/Orange accents (#FF9933)
- Demo credentials: citizen `9876543210`/`123456`, super admin `9999999999`/`000000`

## Gotchas

- **Web Bundle Rebuild**: After source changes, run the `expo export` command above to regenerate `static-build/web/`. Bundle hash in filename is stable (path-based, not content-based).
- **SPA Routing + No-Cache**: Server serves `index.html` with `Cache-Control: no-store` for all non-API routes so browsers always get the fresh bundle reference.
- **expo-av deprecation**: Package is deprecated in SDK 54 but still functional. Warning is expected.
- **expo-notifications web**: Push token changes not supported on web — warning is expected. Local `scheduleNotificationAsync` with `trigger: null` works on native.
- **useNativeDriver on web**: All animations use `useNativeDriver: false` for web. Warning about native module is expected and benign.
- **Demo User Auth**: Seeded users use plain-text PINs. New registrations use bcrypt.
- **NVIDIA_API_KEY**: Optional. AI chat falls back gracefully if missing.
- **Map Tiles**: CartoDB dark tiles load from CDN (`unpkg.com`, `basemaps.cartocdn.com`) — requires internet. Works in Expo Go and browser.
- **Location Subscription**: `watchPositionAsync.remove()` wrapped in try-catch to prevent `LocationEventEmitter.removeSubscription` crash in some Expo SDK versions.

## Pointers

- Expo docs: https://docs.expo.dev/
- react-native-webview: https://github.com/react-native-webview/react-native-webview
- expo-notifications: https://docs.expo.dev/versions/latest/sdk/notifications/
- expo-speech: https://docs.expo.dev/versions/latest/sdk/speech/
- Leaflet.js: https://leafletjs.com/reference.html
- NVIDIA AI: https://build.nvidia.com/
