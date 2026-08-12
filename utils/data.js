// ============================================================
// Tourista AR — Shared catalog data
// In production, replace these with API calls to your backend.
// ============================================================

const TRIPS = [
  {
    id: "zw",
    flag: "ZW",
    flagImage: "/images/flag-zimbabwe.png",
    bannerImage: "/images/banner-zimbabwe.jpg",
    country: "津巴布韦",
    countryEn: "Zimbabwe",
    title: "津巴布韦商务考察团 · 7天",
    titleEn: "Zimbabwe Business Tour · 7 Days",
    shortTitle: "津巴布韦商务考察团",
    shortTitleEn: "Zimbabwe Business Tour",
    days: 7,
    nights: 6,
    depart: "2026.07.19",
    departShort: "07.19出发",
    dateRange: "07.19—07.25",
    structure: "4天商务 + 1天休闲",
    structureEn: "4 Business Days + 1 Leisure Day",
    lead: "全程领导接待 · 津籍合伙人赵蓝狮带队",
    leadEn: "Full leadership reception · Led by Zimbabwe partner Zhao Lanshi",
    gradient: "#d85a0cff",
    bannerOverlay: "linear-gradient(180deg, rgba(216,90,12,0.25) 0%, rgba(15,23,42,0.75) 100%)",
    memberPrice: 48000,
    normalPrice: 58000,
    deposit: 12000,
    seatsLeft: 6,
    seatsTotal: 16,
    status: "报名中",
    statusEn: "Registering",
    statusTag: "tag-primary",
    seatTag: "仅剩6席",
    seatTagEn: "Only 6 seats left",
    highlights: ["政府接待", "矿业考察", "维多利亚瀑布"],
    highlightsEn: ["Government Reception", "Mining Inspection", "Victoria Falls"],
    summary: "ZIDA投资署 · STANBIC银行 · 黄金矿区 · 大津巴布韦遗址",
    summaryEn: "ZIDA Investment Agency · STANBIC Bank · Gold Mining Area · Great Zimbabwe Ruins",
    includes: [
      "国际机票（往返）", "全程四星住宿",
      "全程餐饮 + 商务晚宴", "本地交通 + 翻译",
      "全部领导接待协调", "签证协助（落地签 $55 自理）"
    ],
    includesEn: [
      "International flights (round trip)", "4-star accommodation throughout",
      "All meals + business dinner", "Local transport + translator",
      "All leadership reception coordination", "Visa assistance (visa on arrival $55 self-paid)"
    ],
    itinerary: [
      { day: 1, vip: false, leisure: false, title: "抵达哈拉雷 · 欢迎晚宴", titleEn: "Arrive in Harare · Welcome Dinner", desc: "本地合伙人接待 · 入住 Meikles Hotel", descEn: "Local partner reception · Check in at Meikles Hotel" },
      { day: 2, vip: true, leisure: false, title: "政府对接日", titleEn: "Government Meeting Day", desc: "ZIDA 投资署官员 · STANBIC 银行领导会面", descEn: "ZIDA Investment Agency officials · STANBIC Bank leadership meeting" },
      { day: 3, vip: true, leisure: false, title: "矿业考察", titleEn: "Mining Inspection", desc: "黄金矿区矿主会面 · 马佐伊处女矿实地", descEn: "Gold mine owner meeting · Mazowe Virgin Mine site visit" },
      { day: 4, vip: false, leisure: false, title: "旅游运营 & 物流对接", titleEn: "Tourism & Logistics Meeting", desc: "旅游运营商 · 酒店集团 · 贝特桥跨境物流", descEn: "Tourism operators · Hotel groups · Beitbridge cross-border logistics" },
      { day: 5, vip: true, leisure: false, title: "布拉瓦约 & 马斯温戈", titleEn: "Bulawayo & Masvingo", desc: "工业商会 Mr Moyo · 大津巴布韦遗址 NMMZ", descEn: "Chamber of Industry Mr Moyo · Great Zimbabwe Ruins NMMZ" },
      { day: 6, vip: false, leisure: true, title: "维多利亚瀑布 · 休闲体验日", titleEn: "Victoria Falls · Leisure Day", desc: "直升机俯瞰 · Chobe 国家公园 · 日落游轮 · 剧院", descEn: "Helicopter view · Chobe National Park · Sunset cruise · Theatre" },
      { day: 7, vip: false, leisure: false, title: "收官总结 → 飞往德班", titleEn: "Summary → Fly to Durban", desc: "津巴布韦阶段复盘 · 意向书签署 · 赴南非", descEn: "Zimbabwe phase review · LOI signing · Depart for South Africa" }
    ]
  },
  {
    id: "sa",
    flag: "ZA",
    flagImage: "/images/flag-southafrica.jpg",
    bannerImage: "/images/banner-southafrica.jpg",
    country: "南非",
    countryEn: "South Africa",
    title: "南非商务考察团 · 5天",
    titleEn: "South Africa Business Tour · 5 Days",
    shortTitle: "南非商务考察团",
    shortTitleEn: "South Africa Business Tour",
    days: 5,
    nights: 4,
    depart: "2026.07.26",
    departShort: "07.26出发",
    dateRange: "07.26—07.30",
    structure: "4天商务 + 1天休闲",
    structureEn: "4 Business Days + 1 Leisure Day",
    lead: "德班港物流 · 中华总商会 · 展厅选址",
    leadEn: "Durban Port Logistics · Chinese Chamber of Commerce · Showroom Selection",
    gradient: "linear-gradient(120deg, #0E4D3C, #1B6E9C)",
    bannerOverlay: "linear-gradient(180deg, rgba(27,110,156,0.25) 0%, rgba(15,23,42,0.78) 100%)",
    memberPrice: 50000,
    normalPrice: 60000,
    deposit: 12000,
    seatsLeft: 12,
    seatsTotal: 20,
    status: "报名中",
    statusEn: "Registering",
    statusTag: "tag-green",
    seatTag: "报名中",
    seatTagEn: "Registering",
    highlights: ["德班港口", "中华总商会", "桌山"],
    highlightsEn: ["Durban Port", "Chinese Chamber of Commerce", "Table Mountain"],
    summary: "德班港物流 · 约堡批发市场 · 展厅选址 · 开普敦",
    summaryEn: "Durban Port Logistics · Johannesburg Wholesale Market · Showroom Selection · Cape Town",
    includes: [
      "国际机票（往返）", "全程四星住宿",
      "全程餐饮 + 商务晚宴", "本地交通 + 翻译",
      "全部领导接待协调", "签证协助（需提前办理）"
    ],
    includesEn: [
      "International flights (round trip)", "4-star accommodation throughout",
      "All meals + business dinner", "Local transport + translator",
      "All leadership reception coordination", "Visa assistance (apply in advance)"
    ],
    itinerary: [
      { day: 1, vip: true, leisure: false, title: "德班 · 港口与市场考察", titleEn: "Durban · Port & Market Inspection", desc: "港口领导接待 · uShaka 海洋世界 · 维多利亚街市场", descEn: "Port leadership reception · uShaka Marine World · Victoria Street Market" },
      { day: 2, vip: true, leisure: false, title: "约翰内斯堡 · 贸易对接", titleEn: "Johannesburg · Trade Matching", desc: "批发市场调研 · 南非中华总商会会长会面", descEn: "Wholesale market research · Meeting with Chinese Chamber of Commerce President" },
      { day: 3, vip: false, leisure: false, title: "约堡 · 展示厅选址 & 文化", titleEn: "Johannesburg · Showroom & Culture", desc: "展示厅选址 · 种族隔离博物馆 · 黄金城", descEn: "Showroom selection · Apartheid Museum · Gold Reef City" },
      { day: 4, vip: true, leisure: false, title: "开普敦 · 商务对接日", titleEn: "Cape Town · Business Meeting Day", desc: "展示厅选址 · 华人商会晚宴 · 投资环境", descEn: "Showroom selection · Chinese Chamber dinner · Investment environment" },
      { day: 5, vip: false, leisure: true, title: "开普敦 · 休闲体验 & 返程", titleEn: "Cape Town · Leisure & Departure", desc: "桌山缆车 · 罗本岛游船 · V&A 海滨 · 晚间返程", descEn: "Table Mountain cable car · Robben Island cruise · V&A Waterfront · Evening departure" }
    ]
  },
  {
    id: "both",
    flag: "ZW+ZA",
    flagImage: "/images/flag-both.png",
    bannerImage: "/images/banner-zimbabwe.jpg",
    country: "双国联报",
    countryEn: "Both Countries",
    title: "双国联报 · 津巴布韦 + 南非 12天",
    titleEn: "Dual Country Tour · Zimbabwe + South Africa 12 Days",
    shortTitle: "津巴布韦 + 南非 12天",
    shortTitleEn: "Zimbabwe + South Africa 12 Days",
    days: 12,
    nights: 11,
    depart: "2026.07.19",
    departShort: "07.19出发",
    dateRange: "07.19—07.30",
    structure: "一次走完两国",
    structureEn: "Complete both countries in one trip",
    lead: "联报立省 ¥4,000 · 一次走完两国",
    leadEn: "Save ¥4,000 with dual booking · Complete both countries in one trip",
    gradient: "linear-gradient(120deg, #C24214, #0E4D3C)",
    bannerOverlay: "linear-gradient(180deg, rgba(194,66,20,0.25) 0%, rgba(15,23,42,0.75) 100%)",
    memberPrice: 94000,
    normalPrice: 114000,
    deposit: 20000,
    seatsLeft: 8,
    seatsTotal: 16,
    status: "报名中",
    statusEn: "Registering",
    statusTag: "tag-accent",
    seatTag: "联报立省¥4,000",
    seatTagEn: "Save ¥4,000 with dual booking",
    highlights: ["两国全覆盖", "政府接待", "立省¥4,000"],
    highlightsEn: ["Both Countries", "Government Reception", "Save ¥4,000"],
    summary: "津巴布韦10天 + 南非5天完整行程，联报立省 ¥4,000",
    summaryEn: "Complete Zimbabwe 10 days + South Africa 5 days itinerary, save ¥4,000 with dual booking",
    includes: [
      "两国国际机票 + 内陆联程", "全程四星住宿",
      "全程餐饮 + 商务晚宴", "本地交通 + 全程翻译",
      "两国全部领导接待协调", "签证协助"
    ],
    includesEn: [
      "Both countries international flights + domestic connections", "4-star accommodation throughout",
      "All meals + business dinner", "Local transport + full-time translator",
      "Both countries leadership reception coordination", "Visa assistance"
    ],
    itinerary: [
      { day: 1, vip: false, leisure: false, title: "ZW 抵达哈拉雷 · 欢迎晚宴", titleEn: "ZW Arrive in Harare · Welcome Dinner", desc: "津巴布韦段开始 · 本地合伙人接待", descEn: "Zimbabwe phase begins · Local partner reception" },
      { day: 2, vip: true, leisure: false, title: "ZW 政府对接日", titleEn: "ZW Government Meeting Day", desc: "ZIDA 投资署 · STANBIC 银行", descEn: "ZIDA Investment Agency · STANBIC Bank" },
      { day: 3, vip: true, leisure: false, title: "ZW 矿业考察", titleEn: "ZW Mining Inspection", desc: "黄金矿区 · 马佐伊处女矿", descEn: "Gold mining area · Mazowe Virgin Mine" },
      { day: 6, vip: false, leisure: true, title: "ZW 维多利亚瀑布 · 休闲日", titleEn: "ZW Victoria Falls · Leisure Day", desc: "直升机 · Chobe · 日落游轮", descEn: "Helicopter · Chobe · Sunset cruise" },
      { day: 8, vip: true, leisure: false, title: "ZA 德班港口考察", titleEn: "ZA Durban Port Inspection", desc: "南非段开始 · 港口物流对接", descEn: "South Africa phase begins · Port logistics meeting" },
      { day: 9, vip: true, leisure: false, title: "ZA 约堡贸易对接", titleEn: "ZA Johannesburg Trade Matching", desc: "批发市场 · 中华总商会", descEn: "Wholesale market · Chinese Chamber of Commerce" },
      { day: 12, vip: false, leisure: true, title: "ZA 开普敦休闲 & 返程", titleEn: "ZA Cape Town Leisure & Departure", desc: "桌山 · 罗本岛 · V&A 海滨", descEn: "Table Mountain · Robben Island · V&A Waterfront" }
    ]
  }
];

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

module.exports = {
  TRIPS,
  BIZ_TYPES,
  BIZ_STEPS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORIES_EN,
  COOPERATION_MODES,
  COOPERATION_MODES_EN,
  TARGET_MARKETS,
  TARGET_MARKETS_EN,
  getTrip(id) { return TRIPS.find(t => t.id === id); },
  getTrips() { return TRIPS; }
};
