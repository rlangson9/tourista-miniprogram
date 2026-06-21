# Tourista AR — Backend + Admin Dashboard

The management system behind the Tourista AR mini program. Your team uses the
**admin dashboard** to manage everything; the **mini program** reads/writes
through the **API**. One database is the single source of truth, so a price
change in the dashboard appears in the mini program instantly — no app
resubmission.

```
Management team                    Clients
      │                               │
      ▼                               ▼
[Admin Dashboard]  ───────►  [Backend + SQLite DB]  ◄───────  [Mini Program]
  (this project /admin)         (this project /api)        (tourista-miniprogram)
```

---

## Quick start

Requires **Node.js ≥ 22.5** (uses the built-in `node:sqlite` — no native build, no DB server to install).

```bash
cd tourista-backend
npm install
npm start
```

Then open **http://localhost:3000/admin**

Default login (created automatically on first run):
- Username: `admin`
- Password: `tourista2026`  ← change this after first login

On first boot the database is created and seeded with the 3 trips currently in
the mini program, plus one demo order and one demo partner lead so you can see
the dashboard populated.

---

## What the dashboard does (the 4 management tasks)

| Tab | What your team can do |
|-----|----------------------|
| **概览 Overview** | Live counts: active trips, pending orders, new leads, revenue collected, seats remaining |
| **行程管理 Trips** | Edit prices/seats inline (改价/席位), or full-edit a trip including the **day-by-day itinerary** (add/remove days, set VIP & leisure flags, bilingual titles). Create or delete trips. |
| **订单管理 Orders** | See every booking, filter by status, mark deposit/balance paid, change status (待确认→已确认→已结清→已完成), add notes |
| **合作申请 Partners** | See every partnership lead, copy their WeChat ID, move status (待对接→顾问已对接→已签约), add notes |
| **客户通知 Notify** | Send a notification to an order's customer or a partner lead; full log of what was sent |

**The key win:** edit a trip's price or seats in *Trips*, and the mini program
shows the new value on next load. No code change, no WeChat re-review.

---

## Project structure

```
tourista-backend/
├── package.json
├── .env / .env.example      # config — see below
├── data/
│   └── tourista.db          # SQLite DB (auto-created; gitignore this)
├── src/
│   ├── server.js            # Express entry point
│   ├── db/
│   │   ├── index.js         # DB connection + schema
│   │   ├── seed.js          # initial data (3 trips + demo records)
│   │   ├── bootstrap.js     # auto-seed on first boot
│   │   └── models.js        # all data access, JSON ↔ API shaping
│   ├── middleware/
│   │   └── auth.js          # JWT admin auth
│   ├── routes/
│   │   ├── public.js        # /api/*       — mini program
│   │   ├── adminAuth.js     # /admin/api/login
│   │   └── admin.js         # /admin/api/*  — management (JWT-protected)
│   └── services/
│       └── wechat.js        # WeChat login, subscribe-msg, pay (stubs w/ dev fallback)
└── public/admin/            # the dashboard (static SPA, no build step)
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## API reference

### Public (mini program) — no auth
```
GET  /api/trips                 → all published trips (mini-program JSON shape)
GET  /api/trips/:id             → one trip
POST /api/login                 → { code } → { openid }   (wx.login flow)
POST /api/orders                → create booking
GET  /api/orders?openid=...     → this user's orders
POST /api/orders/:id/pay        → { kind:'deposit'|'balance' } → WeChat Pay params
POST /api/partner-apps          → create partnership lead
GET  /api/partner-apps?openid=  → this user's applications
```

### Admin — `Authorization: Bearer <token>`
```
POST   /admin/api/login                  → { username, password } → { token }
GET    /admin/api/me                     → verify token
GET    /admin/api/stats                  → dashboard overview

GET    /admin/api/trips                  → all trips (incl. unpublished)
POST   /admin/api/trips                  → create
PUT    /admin/api/trips/:id              → full update
PATCH  /admin/api/trips/:id              → quick update (price/seats/status)
DELETE /admin/api/trips/:id              → delete

GET    /admin/api/orders[?status=]       → list/filter
PUT    /admin/api/orders/:id             → update status/notes/checklist
POST   /admin/api/orders/:id/mark-paid   → { kind:'deposit'|'balance' }
DELETE /admin/api/orders/:id

GET    /admin/api/partner-apps[?status=] → list/filter
PUT    /admin/api/partner-apps/:id       → update status/notes
DELETE /admin/api/partner-apps/:id

GET    /admin/api/notifications          → log
POST   /admin/api/notifications          → send to order customer / partner
```

---

## Connecting the mini program to this backend

In the mini program, replace the inline data + mock submits with API calls.
Set your server base URL once and use `wx.request`.

**`utils/data.js`** — instead of returning the hardcoded `TRIPS`, fetch them:
```js
const BASE = "https://your-server.com";  // must be HTTPS + filed in WeChat MP console
function fetchTrips() {
  return new Promise((resolve, reject) => {
    wx.request({ url: BASE + "/api/trips", success: r => resolve(r.data), fail: reject });
  });
}
module.exports = { fetchTrips, BASE };
```

**`pages/booking/booking.js`** — replace the `setTimeout` mock in `payDeposit`:
```js
wx.request({
  url: app.globalData.BASE + "/api/orders",
  method: "POST",
  data: { tripId, customerName, passport, phone, company, openid: app.globalData.openid },
  success: (r) => { /* then call /api/orders/:id/pay → wx.requestPayment */ }
});
```

**`pages/partner-form/partner-form.js`** — replace the `setTimeout` mock in `submit`:
```js
wx.request({
  url: app.globalData.BASE + "/api/partner-apps",
  method: "POST",
  data: { company, contact, wechat, categories, modes, markets, openid: app.globalData.openid }
});
```

The API already returns trips in the exact camelCase shape your pages expect
(`memberPrice`, `seatsLeft`, `titleEn`, `itinerary[].vip`, etc.), so the
templates don't change.

---

## Configuration (`.env`)

```
PORT=3000
JWT_SECRET=<long random string>      # CHANGE in production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tourista2026          # CHANGE after first login

WX_APPID=                            # WeChat MP console
WX_SECRET=                           # WeChat MP console
WXPAY_MCHID=                         # WeChat merchant platform
WXPAY_KEY=                           # WeChat merchant platform
```

Without WeChat credentials the server runs in **dev mode**: `/api/login`
returns a deterministic fake openid and notifications are logged rather than
pushed — so the whole system works locally before WeChat is wired up.

---

## Going to production — checklist for your developers

1. **Change** `JWT_SECRET` and the admin password.
2. **WeChat login**: fill `WX_APPID` / `WX_SECRET`. `code2session` then returns real openids.
3. **WeChat Pay**: implement the v3 unified-order call in
   `src/services/wechat.js → createPaymentOrder` (needs the merchant cert), then
   the mini program calls `/api/orders/:id/pay` and passes the result to `wx.requestPayment`.
4. **Subscribe messages**: create message templates in the WeChat MP console, have
   the mini program call `wx.requestSubscribeMessage` to get user consent, then pass
   the `templateId` + `data` when calling `/admin/api/notifications`.
5. **Database**: `node:sqlite` is great for a single server. If you need
   multiple servers or managed backups, the models are plain SQL — switching to
   MySQL/PostgreSQL (common on Alibaba Cloud / Tencent Cloud in China) is
   straightforward. Keep `data/tourista.db` out of git and back it up.
6. **HTTPS + domain filing**: WeChat requires the API domain to be HTTPS and
   registered in the mini program console under request domains (request合法域名).
7. **Roles**: the schema supports `admin` vs `manager` roles — add more admin
   users and role checks if you want to limit who can delete vs. who can view.

---

## Notes

- SQLite is accessed via Node's built-in `node:sqlite` (no `better-sqlite3`
  native compile needed). This requires Node ≥ 22.5; if your servers run older
  Node, either upgrade or `npm i better-sqlite3` and swap the two lines in
  `src/db/index.js` (the API is nearly identical).
- The dashboard is intentionally a no-build static SPA so it just works. If your
  team prefers React/Vue, the API is standard REST and a rebuild is easy.
