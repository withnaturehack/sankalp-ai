# SANKALP AI — Uttarakhand's Civic Nervous System

## Overview
A production-grade civic governance mobile app built with Expo/React Native. Acts as a live civic command center for Uttarakhand's citizens across 13 districts and city administrators. Features real data, interactive maps, real-time SOS, gamification, bilingual EN/HI support, and an admin war room.

**Tagline:** "Uttarakhand's Civic Nervous System"

## Key Features Implemented
- **5-tab dashboard**: Dashboard, Complaints, Map, SOS, Bills + Profile
- **Animated Login Splash Carousel**: 3-slide story-style splash with Uttarakhand-themed photos, progress bars, quotes, skip button — transitions to animated login form with Indian tricolor hero
- **Women Safety SOS — 5 Panic Methods**:
  1. Hardware-styled Volume Up button (6 taps in 4s)
  2. **TAP 6×** — Large dedicated purple card with 62px circle counter + pip dots
  3. **HOLD 2s** — Large indigo card with fill bar animation (onPressIn/onPressOut setInterval)
  4. **SHAKE 3×** — Accelerometer at 80ms intervals, threshold 2.5, real-time count shown in green circle
  5. AppState rapid background/foreground (power button 3× in 2s)
- **SOS Error Boundary**: Class-based `SOSErrorBoundary` wraps SOS screen; shows retry + "Call 112" fallback if screen crashes
- **Admin Emergency Broadcast**: Admin sends state-wide alert to all citizen devices via WebSocket
- **Uttarakhand Map**: Interactive district map with 13 district chips, UK geo bounds, complaints/SOS/workers/police markers
- **Uttarakhand Gov Bills**: ULB Tax, UJN Water, UPCL Electricity, Vehicle Tax — payment modal with UPI/Card/Net Banking selector + security badge
- **Global Emergency Buzzer**: Overlay in root layout receives real-time broadcast alerts
- **expo-location**: Real GPS in SOS and Map screens
- **expo-sensors**: Accelerometer shake detection (3 shakes = panic trigger)
- **expo-av**: 30s audio recording as evidence for women safety SOS
- **Government Announcements**: Admin posts announcements visible on public dashboard; full CRUD backend + admin UI
- **Complaint detail modal**: Admin War Room P1 complaints + Reports fully clickable → detail modal with resolve/reject
- **Worker detail modal**: Worker cards → full modal with stats, assigned complaints, contact, performance
- **Admin Announcements screen**: Dedicated admin screen to post and delete government notices
- **Photo capture in complaints**: expo-image-picker integration (camera + gallery)
- **Real before/after photos in reports**: Unsplash photos in complaint cards with Image components
- **Emoji → Ionicons**: All emoji icons replaced with Ionicons throughout app
- **News clickable detail modal**: All 6 UK_NEWS items have full article body; tapping opens a slide-up modal with full content
- **8 Quick Services grid**: Dashboard quick nav expanded to 8 items in flexWrap grid (AI Chat, Live Map, Pay Bills, SOS Alert, Reports, Analytics, My Profile, Notices)
- **Weather widget**: Dehradun weather card (24°C Sunny, AQI 68 Satisfactory) with blue mountain theme replacing old hazardous AQI
- **Hindi language toggle (EN/HI)**: Dashboard reads `app_language` from AsyncStorage; greetings, city health label, quick access labels, activity labels, news section all show Hindi text when HI is active. Language switched in Profile → Language Settings
- **Police stations in district admin**: DistrictAdminDashboard shows police station grid with live SOS count, officer count, call button
- **Worker performance in district admin**: Worker performance section with star rating bars in district admin war room
- **Web sign-out fix**: `handleLogout` in profile uses `window.confirm()` on web platform instead of Alert API

## Demo Credentials
- **Super Admin:** Phone `9999999999` / PIN `000000` (sees all 13 Uttarakhand districts)
- **Citizen (Champawat):** Phone `9876543210` / PIN `123456`
- **District Admins:** `9999000001`–`9999000006` / PINs `111111`–`666666`
- **Admin hint:** Tap the SANKALP logo 5 times on the login screen

## Uttarakhand Districts (13)
Dehradun, Haridwar, Tehri Garhwal, Pauri Garhwal, Rudraprayag, Chamoli, Uttarkashi, Pithoragarh, Bageshwar, Almora, Champawat, Nainital, Udham Singh Nagar

## Roles
- **super_admin**: Sees all complaints/data across all 13 districts
- **admin**: District-level admin — sees only their district's data
- **citizen**: Submits complaints, uses SOS, views district data
- **worker**: Assigned to complaints within their district

## Architecture

### Frontend (Expo React Native)
- **Framework:** Expo Router (file-based routing)
- **State:** React Context (AuthContext, AppContext, LanguageContext) + AsyncStorage
- **Auth:** Token-based auth (Bearer) stored in AsyncStorage; AppContext reloads data reactively when token changes
- **API:** All data from real backend; `getApiUrl()` returns `http://localhost:5000` when on localhost, HTTPS Replit domain otherwise
- **UI:** Custom components, Animated API, LinearGradient, Ionicons, Inter fonts
- **Languages:** English / Hindi toggle via LanguageContext

### Backend (Express + TypeScript)
- Express.js server on port 5000
- In-memory storage with Uttarakhand complaints across 13 districts and 32 blocks
- 28 real Uttarakhand police stations with coordinates
- Gamification: points, badges (First Report, Active Citizen, Hero, etc.), leaderboard
- WebSocket server for real-time updates
- Risk zones across Uttarakhand
- Token-based auth with Bearer tokens
- District-aware data filtering (admin sees only their district, super_admin sees all)

### Server Startup
- Command: `node node_modules/tsx/dist/cli.mjs server/index.ts`
- Web build: `static-build/web/` (built with `node node_modules/expo/bin/cli export --platform web --output-dir static-build/web`)
- The `node_modules/react-native/Libraries/Core/InitializeCore.js` stub is required for web build

### Key Files
- `server/storage.ts` — Uttarakhand data: 13 districts, 32 blocks, 28 police stations, district-filtered getters
- `server/routes.ts` — All API routes + WebSocket + Uttarakhand AI responses + super_admin middleware
- `context/AppContext.tsx` — Real backend API integration with 30s polling, token-reactive
- `context/AuthContext.tsx` — Auth with district field, super_admin role, isSuperAdmin boolean
- `context/LanguageContext.tsx` — EN/HI bilingual translations
- `components/DelhiMap.web.tsx` — Uttarakhand map with 13 district chips (web)
- `components/DelhiMap.tsx` — Native map using UK_REGION (30.0668, 79.0193)
- `lib/query-client.ts` — API URL resolution

## App Structure

### Auth Screens (app/(auth)/)
- `login.tsx` — Animated login with SANKALP logo, Uttarakhand splash slides, phone + PIN
- `register.tsx` — Registration with district picker (13 Uttarakhand districts)
- `onboarding.tsx` — Onboarding slides: "Transform Uttarakhand", "Government of Uttarakhand"

### Citizen Tabs (app/(tabs)/)
- `index.tsx` — Command Center Dashboard: live stats, Uttarakhand schemes, civic health meter
- `complaints.tsx` — Full complaint management with Uttarakhand geo coordinates
- `map.tsx` — Uttarakhand Map with district-aware userDistrict prop
- `sos.tsx` — SOS Emergency: UK Police helplines, Uttarakhand emergency response
- `profile.tsx` — Gamification profile: "Devbhoomi Hero" badge, Govt of Uttarakhand ID
- `bills.tsx` — ULB Tax, UJN Water, UPCL Electricity, Transport Dept. Uttarakhand
- `wards.tsx` — "Uttarakhand Block Performance Board"

### Admin Panel (app/admin/)
- `index.tsx` — War Room: KPI grid, Emergency Mode toggle, live SOS feed
- `reports.tsx` — Complaint reports with filter/sort
- `alerts.tsx` — Uttarakhand Emergency Response SOS monitoring
- `workers.tsx` — Worker management
- `announcements.tsx` — Post announcements for Uttarakhand citizens

### Infrastructure
- `app/_layout.tsx` — Root layout: AuthGate, super_admin routed to /admin
- `app/(tabs)/_layout.tsx` — Tab bar: Dashboard, Complaints, Map, SOS, Profile
- `metro.config.js` — Excludes `.local` from Metro file watcher

## API Endpoints
- `POST /api/auth/login` — Login, returns user + Bearer token (with district)
- `POST /api/auth/register` — Register citizen (accepts district field)
- `GET /api/complaints` — District-filtered complaints (admin sees own district, super_admin sees all)
- `POST /api/complaints` — Submit new complaint
- `PUT /api/complaints/:id/upvote` — Upvote complaint
- `PUT /api/complaints/:id/resolve` — Resolve with proof/rating
- `PUT /api/complaints/:id/reject` — Reject/reopen
- `GET /api/sos` — All SOS alerts (district-filtered)
- `POST /api/sos` — Trigger SOS
- `PUT /api/sos/:id/resolve` — Resolve SOS
- `GET /api/wards` — Block health scores (district-filtered)
- `GET /api/workers` — Workers (district-filtered)
- `GET /api/police-stations` — 28 Uttarakhand police stations
- `GET /api/risk-zones` — Risk areas
- `GET /api/leaderboard` — Gamification leaderboard
- `GET /api/nearest-police?lat=&lng=` — Find nearest police stations
- `GET /api/superadmin/districts` — All 13 district stats (super_admin only)

## Uttarakhand Geo Data
- Lat bounds: 28.65°N – 31.45°N
- Lng bounds: 77.30°E – 81.15°E
- Center: 30.0668°N, 79.0193°E (Kedarnath area)
- 28 police stations across all 13 districts
- Complaints geo-tagged within Uttarakhand bounds

## Color Palette
- Background: `#0A0F1C`
- Saffron (primary): `#FF9933`
- Green (success): `#22C55E`
- Amber (warning): `#F59E0B`
- Red (danger): `#EF4444`
- Blue (info): `#3B82F6`
- Purple (AI): `#8B5CF6`
