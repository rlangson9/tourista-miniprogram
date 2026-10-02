// ============================================================
// Tourista AR — Shared catalog data
// Trip content (titles, prices, seats, itinerary, status) comes
// exclusively from the backend (GET /api/trips) and is managed by
// the admin dashboard. This file only holds frontend-only display
// assets (flag/banner images) and UI configuration constants.
// ============================================================

// Frontend-only display assets per trip id. The backend does not
// store these design assets, so they are merged onto API results.
const TRIP_ASSETS = {
  zw: {
    flagImage: "/images/flag-zimbabwe.png",
    bannerImage: "/images/banner-zimbabwe.jpg",
    bannerOverlay: "linear-gradient(180deg, rgba(216,90,12,0.25) 0%, rgba(15,23,42,0.75) 100%)"
  },
  sa: {
    flagImage: "/images/flag-southafrica.jpg",
    bannerImage: "/images/banner-southafrica.jpg",
    bannerOverlay: "linear-gradient(180deg, rgba(27,110,156,0.25) 0%, rgba(15,23,42,0.78) 100%)"
  },
  both: {
    flagImage: "/images/flag-both.png",
    bannerImage: "/images/banner-zimbabwe.jpg",
    bannerOverlay: "linear-gradient(180deg, rgba(194,66,20,0.25) 0%, rgba(15,23,42,0.75) 100%)"
  }
};

// Fallback assets for trips created in the admin dashboard that
// have no dedicated artwork yet.
const DEFAULT_TRIP_ASSETS = {
  flagImage: "/images/flag-both.png",
  bannerImage: "/images/banner-zimbabwe.jpg",
  bannerOverlay: "linear-gradient(180deg, rgba(15,23,42,0.35) 0%, rgba(15,23,42,0.78) 100%)"
};

// Business partnership types
const BIZ_TYPES = [
  { icon: "/images/icon-package.svg", bg: "#FBE9E2", title: "分销代理", titleEn: "Distribution", desc: "依托非洲多国本地公司与销售团队，覆盖南部非洲主流市场", descEn: "Leverage our local companies and sales teams across multiple African countries, covering major Southern African markets" },
  { icon: "/images/icon-store.svg", bg: "#FDF3DD", title: "展厅入驻", titleEn: "Showroom Entry", desc: "非洲多国展厅网络 · 哈拉雷2900㎡旗舰展厅 + 约堡展厅", descEn: "Multi-country showroom network across Africa · 2900㎡ flagship in Harare + Johannesburg showroom" },
  { icon: "/images/icon-ship.svg", bg: "#E6F9EE", title: "物流货代", titleEn: "Logistics", desc: "中国直达非洲多国港口 · 全链路货运、清关与仓储配送", descEn: "Direct shipping from China to multiple African ports · Full-chain logistics, customs, warehousing & delivery" },
  { icon: "/images/icon-megaphone.svg", bg: "#E8F1FC", title: "营销推广", titleEn: "Marketing", desc: "本地化营销团队 · 商超渠道对接 · 政府与行业资源引荐", descEn: "Local marketing teams · Retail channel connections · Government & industry resource introductions" }
];

const BIZ_STEPS = [
  { n: "1", color: "var(--terra)", text: "提交产品与合作意向", textEn: "Submit products and cooperation intent" },
  { n: "2", color: "var(--terra)", text: "顾问48小时内对接 · 评估非洲市场匹配度", textEn: "Advisor contacts within 48 hours · Evaluate African market fit" },
  { n: "3", color: "var(--terra)", text: "签订合作协议 · 样品出运 / 展厅上架", textEn: "Sign cooperation agreement · Ship samples / Display in showroom" },
  { n: "4", color: "var(--green)", text: "本地团队销售 · 微信群实时同步进展", textEn: "Local team sales · Real-time updates via WeChat group" }
];

// Form options for partner application
const PRODUCT_CATEGORIES = ["家用电器", "建材五金", "农机设备", "日用百货", "服装鞋帽", "太阳能产品"];
const PRODUCT_CATEGORIES_EN = ["Home Appliances", "Building Materials & Hardware", "Agricultural Machinery", "Daily Necessities", "Clothing & Footwear", "Solar Products"];

const COOPERATION_MODES = ["分销代理", "展厅入驻", "物流货代", "营销推广"];
const COOPERATION_MODES_EN = ["Distribution", "Showroom Entry", "Logistics", "Marketing"];

const TARGET_MARKETS = ["津巴布韦", "南非", "肯尼亚"];
const TARGET_MARKETS_EN = ["Zimbabwe", "South Africa", "Kenya"];

// ── API fetch (backend is the single source of truth) ──────────────────────
const LOCAL_ONLY_FIELDS = ['flagImage', 'bannerImage', 'bannerOverlay'];

function mergeLocalFields(apiTrip) {
  const assets = TRIP_ASSETS[apiTrip.id] || DEFAULT_TRIP_ASSETS;
  const merged = Object.assign({}, apiTrip);
  LOCAL_ONLY_FIELDS.forEach(f => { if (!merged[f] && assets[f]) merged[f] = assets[f]; });
  return merged;
}

function getBaseUrl() {
  const app = getApp();
  return (app && app.globalData && app.globalData.baseUrl) || 'http://localhost:3000';
}

// Returns an array of trips from the backend; [] when the backend is
// unreachable or has no published trips (no fake local fallback).
function fetchTrips() {
  return new Promise((resolve) => {
    wx.request({
      url: getBaseUrl() + '/api/trips',
      success: (res) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) {
          resolve(res.data.map(mergeLocalFields));
        } else { resolve([]); }
      },
      fail: () => resolve([])
    });
  });
}

// Returns a single trip from the backend; null when unavailable.
function fetchTrip(id) {
  return new Promise((resolve) => {
    wx.request({
      url: getBaseUrl() + '/api/trips/' + id,
      success: (res) => {
        if (res.statusCode === 200 && res.data) { resolve(mergeLocalFields(res.data)); }
        else { resolve(null); }
      },
      fail: () => resolve(null)
    });
  });
}

module.exports = {
  BIZ_TYPES,
  BIZ_STEPS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORIES_EN,
  COOPERATION_MODES,
  COOPERATION_MODES_EN,
  TARGET_MARKETS,
  TARGET_MARKETS_EN,
  fetchTrips,
  fetchTrip
};
