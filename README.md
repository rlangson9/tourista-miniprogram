# Tourista AR — 微信小程序 / WeChat Mini Program

中非超级应用小程序：服务中国客户的非洲商务考察研学，以及中国企业对非洲的产品分销、渠道与合作通道。

A WeChat Mini Program for **Tourista AR** — serving Chinese clients with (1) Africa business-inspection study tours, and (2) a partnership channel for Chinese companies to distribute, sell, and market their products into Africa.

---

## How to open

1. Install **微信开发者工具 (WeChat DevTools)**: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. Open DevTools → **导入项目 (Import Project)**
3. Select this folder (`tourista-miniprogram`)
4. **AppID**: replace `touristaXXXXXXXXXXXX` in `project.config.json` with your own AppID (or use 测试号 / test mode while developing)
5. The simulator will build and render all 8 pages

---

## Project structure

```
tourista-miniprogram/
├── app.js              # Global store: user, trip orders, partner applications
├── app.json            # Pages registry + tabBar (4 tabs) + window theme
├── app.wxss            # Design tokens + shared classes (cards, buttons, tags, pills)
├── sitemap.json
├── project.config.json
├── images/             # tabBar icons (normal + active)
├── utils/
│   └── data.js         # Trips catalog + business types + form options
└── pages/
    ├── home/           # Dual-entry hero (去非洲 / 做生意) + featured trip
    ├── trips/          # Trip list (3 products) + custom + past tabs
    ├── trip-detail/    # Gold timeline itinerary + VIP/leisure days + sticky booking
    ├── booking/        # Traveller form + member pricing + WeChat Pay (deposit)
    ├── business/       # 4 partnership types + 4-step flow
    ├── partner-form/   # Tap-to-select tags (category/mode/market) + cross-sell
    ├── orders/         # Trip orders + prep checklist + group entry / applications
    └── profile/        # Member badge + stats + menus
```

## Navigation map

```
[Home] ──去非洲──▶ [Trips] ──▶ [Trip Detail] ──立即报名──▶ [Booking] ──支付──▶ [Orders]
   │
   └──做生意──▶ [Business] ──提交意向──▶ [Partner Form] ──提交──▶ [Orders/合作申请]

[Profile] ──▶ Orders / Applications / Advisor / App download
```

The four bottom tabs are **首页 / 非洲之旅 / 商务合作 / 我的**.

---

## What you must wire up for production

Everything renders and navigates now using mock data in `app.js` + `utils/data.js`. To go live:

### 1. Login & identity
`app.js → onLaunch`: call `wx.login()`, send the `code` to your server, exchange for `openid`/`session_key`, then load the real user profile, membership status, orders, and applications.

### 2. WeChat Pay (booking deposit + balance)
`pages/booking/booking.js → payDeposit` and `pages/orders/orders.js → payBalance` currently simulate success. Replace with:
- `wx.request` → your server creates a **统一下单 (unified order)** via the WeChat Pay API and returns signed payment params
- `wx.requestPayment(params)` → opens the native pay sheet
- On success callback → write the confirmed order to your database

You need a registered **微信商户号 (WeChat merchant account)** and the mini program bound to it.

### 3. Form submission
`pages/partner-form/partner-form.js → submit` and the booking form: replace the `setTimeout` mock with `wx.request` POSTs to your backend. Store leads/orders and notify your sales team (e.g. push to the advisor's WeChat Work).

### 4. Catalog data
`utils/data.js` holds the 3 trips and business options inline. Move these to your backend so you can update trip dates, prices, seats, and itineraries without resubmitting the mini program for review.

### 5. Advisor contact
The `wx.setClipboardData` advisor WeChat IDs (`TouristaAR_Advisor`, `TouristaAR_Lead`) are placeholders — swap for your real IDs, or better, use a **客服消息 (customer service message)** button or WeChat Work contact.

### 6. Assets
The tabBar icons are simple generated glyphs. Replace with your branded icons (81×81px PNG recommended). Trip banners currently use CSS gradients — swap for real destination photos once you have them.

---

## Design system (from the approved UI)

| Token | Hex | Use |
|-------|-----|-----|
| ink | `#1A2233` | text, business mode |
| terra | `#D85A30` | Africa accent, primary brand |
| gold | `#EFA427` | CTA buttons, timeline |
| wechat-green | `#07C160` | **payment & group entry only** |
| sand | `#FBF6EE` | soft backgrounds |

Rules baked into the code:
- Travel sections use warm terra/gold; business sections use ink navy
- WeChat green is reserved exclusively for pay buttons + group entries (Chinese-user mental model)
- The gold timeline in Trip Detail matches your printed posters
- VIP reception days = gold left border; leisure days = gold-tinted card
