# SANKALP AI

SANKALP AI is a production-grade civic governance mobile app for Uttarakhand citizens and city administrators, offering real-time civic command, interactive maps, SOS features, gamification, and bilingual support.

## Run & Operate

```bash
# Start the backend server
node node_modules/tsx/dist/cli.mjs server/index.ts

# Build the web frontend (if needed)
node node_modules/expo/bin/cli export --platform web --output-dir static-build/web

# Required Environment Variables:
# No explicit environment variables mentioned, but API calls dynamically
# resolve to localhost:5000 or Replit domain.
```

## Stack

**Frontend:**
- Framework: Expo React Native (Expo Router for file-based routing)
- State Management: React Context (AuthContext, AppContext, LanguageContext), AsyncStorage
- UI: Custom components, Animated API, LinearGradient, Ionicons, Inter fonts

**Backend:**
- Framework: Express.js + TypeScript
- Database: In-memory storage (for demo/development)
- Real-time: WebSocket server

**Build Tool:** Metro (for React Native), Expo CLI

## Where things live

- `server/storage.ts`: Source of truth for Uttarakhand data (districts, blocks, police stations) and seeded data.
- `server/routes.ts`: All API routes, WebSocket handling, and AI responses.
- `context/AppContext.tsx`: Main application context for API integration and polling.
- `context/AuthContext.tsx`: Authentication context, including user roles and district information.
- `context/LanguageContext.tsx`: Context for English/Hindi bilingual translations.
- `components/DelhiMap.tsx` / `components/DelhiMap.web.tsx`: Map component for native and web, defining Uttarakhand regions.
- `app/_layout.tsx`: Root layout, handling authentication gates.
- `app/(tabs)/_layout.tsx`: Defines the main tab navigation structure.
- `static-build/web/`: Web build output directory.

## Architecture decisions

- **In-memory Backend Storage:** Simplifies deployment and local development by using in-memory data, suitable for a demo/prototype phase.
- **Token-based Authentication:** Standard Bearer token authentication stored in AsyncStorage for stateless and secure API access.
- **Dynamic API URL Resolution:** Automatically switches between `localhost:5000` and the Replit deployment URL, streamlining development and deployment.
- **Hybrid Map Implementation:** Separate map components for web (`DelhiMap.web.tsx`) and native (`DelhiMap.tsx`) to leverage platform-specific map capabilities while maintaining a unified interface.
- **File-based Routing (Expo Router):** Leverages Expo Router for intuitive, file-system-based navigation, improving development velocity and code organization.

## Product

- **Civic Governance Core:** Submit and manage complaints, view status, and interact with civic services.
- **Real-time SOS:** Multiple panic methods for women's safety, including hardware button, tap, hold, shake, and app state changes, with real-time alerts.
- **Interactive Maps:** District-specific maps showing complaints, SOS alerts, worker locations, and police stations.
- **Gamification:** Leaderboards, points, and badges to encourage civic engagement.
- **Bilingual Support:** Full English and Hindi language toggling across the app.
- **Admin War Room:** Dedicated admin panel for monitoring KPIs, managing complaints, workers, announcements, and emergency responses with district-level filtering.
- **AI Integration:** NVIDIA LLaMA 3.1 8B Instruct for chat, and predictive maintenance AI for complaint analysis.
- **RTI Portal:** Facilitates filing requests under the RTI Act 2005 with status tracking.
- **Community Features:** Polls, petitions, and civic event management.
- **Bills Payment:** Integrated portal for various Uttarakhand government utility bills.

## User preferences

- _Populate as you build_

## Gotchas

- **Web Build Dependency:** The `node_modules/react-native/Libraries/Core/InitializeCore.js` stub is required for the web build process.
- **Demo User Authentication:** Seeded demo users might use plain-text PINs for backward compatibility checks during login, while new registrations use bcrypt hashing.
- **Backend Startup:** Ensure the `node_modules/tsx/dist/cli.mjs` path is correct when starting the backend server.
- **Rate Limiting:** Be aware of rate limits on API endpoints like `/api/auth/register`, `/api/auth/login`, and `/api/ai/chat` during testing.

## Pointers

- **Expo Documentation:** [https://docs.expo.dev/](https://docs.expo.dev/)
- **React Native Documentation:** [https://reactnative.dev/docs/](https://reactnative.dev/docs/)
- **Express.js Documentation:** [https://expressjs.com/](https://expressjs.com/)
- **TypeScript Handbook:** [https://www.typescriptlang.org/docs/handbook/intro.html](https://www.typescriptlang.org/docs/handbook/intro.html)
- **NVIDIA AI Playground:** [https://build.nvidia.com/](https://build.nvidia.com/) (for LLaMA integration details)