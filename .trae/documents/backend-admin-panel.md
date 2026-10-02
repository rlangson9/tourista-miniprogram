# Plan: Launch the Backend Admin Panel for Team Editing

## Context

The user wants a backend where their team can edit program information (trips, prices, banners, itineraries, orders, partner leads, etc.). **Discovery: the entire backend already exists** at `tourista-backend/` — it was built in a prior session and is fully functional but has never been verified as running. This plan gets it running, verifies the admin dashboard works, and optionally connects the mini program to the live API.

## What Already Exists (verified by reading every file)

| Layer | Status | File |
|-------|--------|------|
| Express server | ✅ Complete | [server.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/server.js) |
| SQLite schema (10 tables) | ✅ Complete | [db/index.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/db/index.js) |
| Models (CRUD for all entities) | ✅ Complete | [db/models.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/db/models.js) |
| Auto-seed (3 trips + admin) | ✅ Complete | [db/seed.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/db/seed.js), [db/bootstrap.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/db/bootstrap.js) |
| JWT auth (access + refresh) | ✅ Complete | [middleware/auth.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/middleware/auth.js), [routes/adminAuth.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/routes/adminAuth.js) |
| Security (helmet, CORS, rate-limit, XSS, sanitization) | ✅ Complete | [middleware/security.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/middleware/security.js) |
| Public API (`/api/*` — for mini program) | ✅ Complete | [routes/public.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/routes/public.js) |
| Admin API (`/admin/api/*` — JWT-protected CRUD) | ✅ Complete | [routes/admin.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/routes/admin.js) |
| WeChat service (login, pay, subscribe-msg stubs) | ✅ Complete | [services/wechat.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/src/services/wechat.js) |
| Admin dashboard SPA (8 sections, vanilla JS) | ✅ Complete | [public/admin/index.html](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/public/admin/index.html), [app.js](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/public/admin/app.js), [styles.css](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/public/admin/styles.css) |
| `.env` config | ✅ Exists | [`.env`](file:///Users/apple/Downloads/tourista-miniprogram/tourista-backend/.env) |
| Database (seeded) | ✅ Exists | `data/tourista.db` (4KB + WAL) |
| `node_modules` | ✅ Installed | — |
| Node version | ✅ v25.8.2 (requires ≥22.5) | — |

**The admin dashboard has 8 management sections:**
1. Overview — live stats (trips, orders, revenue, seats)
2. Trips — edit prices/seats inline + full editor with day-by-day itinerary
3. Orders — track bookings, mark deposits/balances paid, status workflow
4. Partners — manage partner leads, copy WeChat IDs, status workflow
5. Stories — CRUD success stories (bilingual)
6. Opportunities — CRUD investment/trade opportunities (bilingual)
7. Inquiries — manage user questions and intents
8. Notifications — send/log customer notifications

## Implementation Steps

### Step 1: Start the backend server
```bash
cd tourista-backend && npm start
```
The server auto-seeds on first boot (bootstrap.js). Since the DB already exists, it will just start.

### Step 2: Verify the server is running
- `GET http://localhost:3000/health` → `{ ok: true }`
- `GET http://localhost:3000/admin` → serves the dashboard HTML

### Step 3: Verify admin login + dashboard
- Open `http://localhost:3000/admin` in a browser
- Login with `admin` / `tourista2026`
- Verify the Overview page shows stats
- Verify the Trips page lists 3 seeded trips (Zimbabwe, South Africa, Both)
- Test editing a trip price (quick-edit modal → save → verify it persists)

### Step 4: Connect the mini program to the backend (optional, recommended)
Currently the mini program reads from hardcoded `utils/data.js`. To make dashboard edits reflect in the app in real-time, update the mini program to fetch from the API:

**Files to modify:**
- `utils/data.js` — add `BASE` URL + async `fetchTrips()` / `fetchTrip(id)` using `wx.request` to `GET /api/trips` and `GET /api/trips/:id`. Keep the hardcoded `TRIPS` as a fallback for offline/preview mode.
- `app.js` — store `BASE` in `globalData` (e.g., `globalData.BASE = "http://localhost:3000"` for dev)
- Pages that call `data.getTrips()` synchronously (`home.js`, `trips.js`, `trip-detail.js`, `booking.js`, `orders.js`) — update to use the async fetch with fallback to local data.

**Approach:** Add a `fetchTrips()` that tries the API first, falls back to local `TRIPS` array if the server is unreachable (so the mini program still works in WeChat DevTools preview without the backend running). This avoids breaking the existing preview workflow.

### Step 5: Test end-to-end
1. Start backend → login to admin → edit Zimbabwe price to ¥49,000
2. Open mini program in WeChat DevTools → Trips page → verify price shows ¥49,000
3. Verify all other pages still render correctly

## Verification
- Backend: `curl http://localhost:3000/health` returns `{ ok: true }`
- Admin: browser at `http://localhost:3000/admin` → login → see trips
- API: `curl http://localhost:3000/api/trips` returns JSON array of trips
- Mini program: trips page reflects backend data (when connected)
- Mini program fallback: still works with local data when backend is offline
