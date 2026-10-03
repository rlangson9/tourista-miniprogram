// ════════════════════════════════════════════════════════════════════════
// Tourista AR — Admin dashboard (vanilla JS, no build step)
// ════════════════════════════════════════════════════════════════════════
const API = "";  // same origin
let TOKEN = localStorage.getItem("tourista_admin_token") || null;
let TRIPS_CACHE = [];

// Country flag colors - based on African country flags
const COUNTRY_COLORS = {
  ZW: { name: "Zimbabwe", nameCn: "津巴布韦", colors: ["#2E5E1F", "#C24214"], gradient: "linear-gradient(120deg, #2E5E1F, #C24214)" },
  ZA: { name: "South Africa", nameCn: "南非", colors: ["#0E4D3C", "#1B6E9C"], gradient: "linear-gradient(120deg, #0E4D3C, #1B6E9C)" },
  KE: { name: "Kenya", nameCn: "肯尼亚", colors: ["#006600", "#FFCC00", "#000000"], gradient: "linear-gradient(120deg, #006600, #FFCC00)" },
  NG: { name: "Nigeria", nameCn: "尼日利亚", colors: ["#008751", "#FFFFFF", "#E52B50"], gradient: "linear-gradient(120deg, #008751, #E52B50)" },
  EG: { name: "Egypt", nameCn: "埃及", colors: ["#CE1126", "#FFFFFF", "#002654"], gradient: "linear-gradient(120deg, #CE1126, #002654)" },
  GH: { name: "Ghana", nameCn: "加纳", colors: ["#006B3F", "#FCD116", "#CE1126"], gradient: "linear-gradient(120deg, #006B3F, #CE1126)" },
  TZ: { name: "Tanzania", nameCn: "坦桑尼亚", colors: ["#00A651", "#FFFFFF", "#1E4D8C"], gradient: "linear-gradient(120deg, #00A651, #1E4D8C)" },
  MU: { name: "Morocco", nameCn: "摩洛哥", colors: ["#E94560", "#FFFFFF", "#262626"], gradient: "linear-gradient(120deg, #E94560, #262626)" },
  NA: { name: "Namibia", nameCn: "纳米比亚", colors: ["#007A5E", "#FFFFFF", "#CD212A"], gradient: "linear-gradient(120deg, #007A5E, #CD212A)" },
  BW: { name: "Botswana", nameCn: "博茨瓦纳", colors: ["#79BEDB", "#FFFFFF", "#004B8D"], gradient: "linear-gradient(120deg, #79BEDB, #004B8D)" },
  OTHER: { name: "Other", nameCn: "其他", colors: ["#1A1A2E", "#00A896"], gradient: "linear-gradient(120deg, #1A1A2E, #00A896)" }
};

function updateCountryColors() {
  const flag = document.getElementById("t_flag").value;
  if (!flag || !COUNTRY_COLORS[flag]) return;
  const country = COUNTRY_COLORS[flag];
  document.getElementById("t_country").value = country.nameCn;
  document.getElementById("t_countryEn").value = country.name;
  document.getElementById("t_gradient").value = country.gradient;
}

// ── Icon library (inline SVG) ────────────────────────────────────────────
const ICONS = {
  loading: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-dasharray="40 60"/><path d="M12 2v4M12 18v4" stroke-width="2.5"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 5"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'
};

// ── i18n (Chinese / English admin UI) ─────────────────────────────────────
// The DB keeps Chinese canonical status values; the UI displays localized
// text via stxt() while always submitting the original Chinese value.
let LANG = localStorage.getItem("tourista_admin_lang") === "en" ? "en" : "zh";
let CURRENT_VIEW = "overview";

const I18N = {
  zh: {
    nav: { overview: "概览", trips: "行程管理", orders: "订单管理", partners: "合作申请", stories: "成功案例", opportunities: "非洲商机", inquiries: "用户咨询", notifications: "客户通知" },
    login: {
      sub: "管理后台", userLabel: "用户名", passLabel: "密码", signIn: "登 录", logout: "退出登录",
      scriptFailTitle: "⚠️ 脚本加载失败", scriptFailBody: "如果你正在使用 Trae IDE 内置浏览器，请在 Chrome 或 Safari 中打开：",
      scriptFailTail: "", needUser: "请输入用户名和密码", expired: "登录已过期", reqFail: "请求失败"
    },
    common: {
      save: "保存", cancel: "取消", create: "创建", edit: "编辑", del: "删除", detail: "详情",
      manage: "管理", all: "全部", loading: "加载中…", loadError: "加载失败", yes: "是", no: "否",
      published: "已上架", unpublished: "已下架", paid: "已付", unpaid: "未付", due: "待付", days: "天",
      updated: "已更新", saved: "已保存", created: "已创建", deleted: "已删除", recorded: "已记录付款",
      send: "发送", sent: "已发送", logged: "已记录", failed: "失败", copyWechat: "复制微信号", wechatCopied: "已复制微信号",
      needId: "ID 必填", needTitle: "请输入标题", selectTarget: "请选择接收对象",
      addImage: "上传图片", addVideo: "上传视频", uploading: "上传中…", uploadFail: "上传失败",
      mediaHint: "图片 JPG / PNG / GIF / WEBP；视频 MP4 / MOV / WEBM；单个文件不超过 50MB",
      video: "视频",
      confirmTripDel: "确认删除该行程？此操作不可撤销。",
      confirmStoryDel: "确认删除该案例？",
      confirmOppDel: "确认删除该机会？",
      wechat: "微信", createdAt: "创建时间"
    },
    overview: {
      title: "概览", sub: "实时业务数据",
      activeTrips: "在售行程", pendingOrders: "待确认订单", totalOrders: "订单总数", revenue: "已收款",
      newLeads: "待对接合作", totalLeads: "合作申请总数", confirmed: "已确认订单", seats: "剩余席位",
      quickActions: "快捷操作", aTrips: "管理行程与价格 →", aOrders: "查看订单 →", aPartners: "合作申请 →", aNotify: "发送通知 →"
    },
    trips: {
      title: "行程管理", sub: "编辑行程、价格、席位", newTrip: "+ 新建行程",
      trip: "行程", depart: "出发", member: "会员价", normal: "原价", deposit: "订金", seats: "席位", status: "状态",
      quick: "改价/席位", quickTitle: "快速调整", seatsLeft: "剩余席位", seatsTotal: "总席位",
      stRegistering: "报名中", stLimited: "名额紧张", stFull: "已满", stEnded: "已结束",
      eNew: "新建行程", eEdit: "编辑行程", id: "行程ID", idLocked: "(不可改)", country: "国家",
      countryZh: "国家名称（中文）", countryEn: "国家名称（英文）",
      shortZh: "短标题（中文）", shortEn: "短标题（英文）", titleZh: "完整标题（中文）", titleEn: "完整标题（英文）",
      days: "天数", nights: "晚数", departDate: "出发日期 (2026.07.19)", dateRange: "日期范围 (07.19—07.25)",
      memberPrice: "会员价", normalPrice: "原价",
      seatTag: "席位标签（中文）", leadZh: "亮点语（中文）", leadEn: "亮点语（英文）",
      summaryZh: "摘要（中文）", summaryEn: "摘要（英文）", gradient: "渐变色 (CSS)", statusTag: "状态标签色",
      highlightsZh: "亮点（中文，逗号分隔）", highlightsEn: "亮点（英文，逗号分隔）",
      includesZh: "费用包含（中文，逗号分隔）", includesEn: "费用包含（英文，逗号分隔）",
      itinerary: "每日行程", itinHint: "VIP = 政商接待日(金边) · 休闲 = 休闲体验日(金底)",
      addDay: "+ 添加一天", dayPh: "第几天", titlePhZh: "标题（中）", titlePhEn: "Title (EN)",
      descPhZh: "描述（中）", descPhEn: "Desc (EN)", vip: "VIP", leisure: "休闲",
      departSuffix: "出发", selectCountry: "选择国家"
    },
    orders: {
      title: "订单管理", sub: "跟踪报名与付款",
      order: "订单号", customer: "客户", trip: "行程", amount: "金额", balance: "余款",
      all: "全部", sPending: "待确认", sDeposit: "已付订金", sConfirmed: "已确认", sSettled: "已结清",
      sDone: "已完成", sCancelled: "已取消",
      none: "暂无订单", manage: "详情/管理", phone: "电话", passport: "护照", company: "企业",
      city: "出发", total: "总价", checklist: "出行准备", notes: "备注",
      markDeposit: "标记订金已付", markBalance: "标记余款已付"
    },
    partners: {
      title: "合作申请", sub: "管理企业合作意向",
      company: "企业", contact: "联系人", categories: "产品类目", modes: "合作方式", markets: "目标市场",
      all: "全部", sNew: "待对接", sConnected: "顾问已对接", sSigned: "已签约", sClosed: "已关闭",
      none: "暂无合作申请", manage: "详情/管理", phone: "电话", createdAt: "提交时间", notes: "备注"
    },
    notifications: {
      title: "客户通知", sub: "向订单客户或合作企业发送通知",
      send: "发送通知", audience: "接收对象类型", target: "选择对象", nTitle: "标题", body: "内容",
      audOrder: "订单客户", audPartner: "合作企业",
      titlePh: "如：行程确认通知", bodyPh: "通知内容…",
      tplLabel: "WeChat 订阅消息模板ID（可选）", tplPh: "留空 = 仅记录，由顾问通过微信跟进",
      tplHint: "填写模板ID且客户已授权该模板时，将通过微信下发；否则仅作为内部记录，由顾问通过微信/电话跟进。",
      log: "通知记录", time: "时间", channel: "渠道", status: "状态",
      chWechat: "微信", chRecord: "记录", none: "暂无通知记录"
    },
    stories: {
      title: "成功案例", sub: "管理成功案例内容", newStory: "+ 新建案例",
      t: "标题", company: "公司", category: "分类", featured: "精选", createdAt: "创建时间",
      edit: "编辑", del: "删除", none: "暂无案例",
      eNew: "新建案例", eEdit: "编辑案例",
      titleZh: "标题（中文）", titleEn: "标题（英文）", companyZh: "公司（中文）", companyEn: "公司（英文）",
      summaryZh: "摘要（中文）", summaryEn: "摘要（英文）", contentZh: "详细内容（中文）", contentEn: "详细内容（英文）",
      titlePhZh: "案例标题", titlePhEn: "Story title", companyPhZh: "公司名称", companyPhEn: "Company name",
      summaryPhZh: "简短摘要", summaryPhEn: "Brief summary", contentPhZh: "详细内容", contentPhEn: "Full content",
      catBusiness: "商务", catInvestment: "投资", catTour: "考察团",
      images: "故事图片/视频（用户查看案例详情时可见）"
    },
    opps: {
      title: "非洲商机", sub: "管理投资与贸易机会", newOpp: "+ 新建机会",
      t: "标题", country: "国家", type: "类型", category: "分类", status: "状态",
      edit: "编辑", del: "删除", none: "暂无机会", published: "已发布", draft: "草稿",
      eNew: "新建机会", eEdit: "编辑机会",
      titleZh: "标题（中文）", titleEn: "标题（英文）", countryZh: "国家（中文）", countryEn: "国家（英文）",
      typeOpp: "机会", typeDemand: "需求",
      catInvestment: "投资", catTrade: "贸易", catJV: "合资", catSupply: "供应", catProject: "项目",
      descZh: "描述（中文）", descEn: "描述（英文）", reqZh: "要求（中文）", reqEn: "要求（英文）",
      budget: "预算", deadline: "截止日期", media: "图片/视频（用户查看详情时可见）",
      titlePhZh: "机会标题", titlePhEn: "Opportunity title", countryPhZh: "国家", countryPhEn: "Country",
      descPhZh: "详细描述", descPhEn: "Detailed description", reqPhZh: "资质/要求", budgetPh: "如：$50,000 - $100,000"
    },
    inquiries: {
      title: "用户咨询", sub: "管理用户提问与合作意向",
      type: "类型", content: "内容", user: "用户", status: "状态", createdAt: "时间",
      tStoryQ: "案例提问", tIntent: "合作意向", tGeneral: "咨询",
      stNew: "新", stContacted: "已联系", stClosed: "已关闭",
      none: "暂无咨询", detail: "详情", dTitle: "咨询详情",
      related: "相关内容", phone: "电话", company: "公司", notes: "备注"
    }
  },
  en: {
    nav: { overview: "Overview", trips: "Trips", orders: "Orders", partners: "Partners", stories: "Success Stories", opportunities: "Opportunities", inquiries: "Inquiries", notifications: "Notifications" },
    login: {
      sub: "Management Console", userLabel: "Username", passLabel: "Password", signIn: "Sign In", logout: "Log out",
      scriptFailTitle: "⚠️ Script load failed", scriptFailBody: "If you're using the Trae IDE built-in browser, please open this in Chrome or Safari:",
      scriptFailTail: "", needUser: "Please enter username and password", expired: "Session expired", reqFail: "Request failed"
    },
    common: {
      save: "Save", cancel: "Cancel", create: "Create", edit: "Edit", del: "Delete", detail: "Detail",
      manage: "Manage", all: "All", loading: "Loading…", loadError: "Failed to load", yes: "Yes", no: "No",
      published: "Published", unpublished: "Unpublished", paid: "Paid", unpaid: "Unpaid", due: "Due", days: "d",
      updated: "Updated", saved: "Saved", created: "Created", deleted: "Deleted", recorded: "Payment recorded",
      send: "Send", sent: "Sent", logged: "Logged", failed: "Failed", copyWechat: "Copy WeChat ID", wechatCopied: "WeChat ID copied",
      needId: "ID is required", needTitle: "Title is required", selectTarget: "Please select a recipient",
      addImage: "Upload image", addVideo: "Upload video", uploading: "Uploading…", uploadFail: "Upload failed",
      mediaHint: "Images JPG / PNG / GIF / WEBP; videos MP4 / MOV / WEBM; up to 50MB per file",
      video: "Video",
      confirmTripDel: "Delete this trip permanently?",
      confirmStoryDel: "Delete this story?",
      confirmOppDel: "Delete this opportunity?",
      wechat: "WeChat", createdAt: "Created"
    },
    overview: {
      title: "Overview", sub: "Real-time business snapshot",
      activeTrips: "Active Trips", pendingOrders: "Pending Orders", totalOrders: "Total Orders", revenue: "Revenue Collected",
      newLeads: "New Partner Leads", totalLeads: "Total Leads", confirmed: "Confirmed Orders", seats: "Seats Remaining",
      quickActions: "Quick Actions", aTrips: "Manage trips & prices →", aOrders: "View orders →", aPartners: "Partner leads →", aNotify: "Send notification →"
    },
    trips: {
      title: "Trips", sub: "Edit itineraries, prices & seats", newTrip: "+ New Trip",
      trip: "Trip", depart: "Depart", member: "Member", normal: "Normal", deposit: "Deposit", seats: "Seats", status: "Status",
      quick: "Price/Seats", quickTitle: "Quick adjust", seatsLeft: "Seats Left", seatsTotal: "Total Seats",
      stRegistering: "Registering", stLimited: "Limited Seats", stFull: "Fully Booked", stEnded: "Ended",
      eNew: "New Trip", eEdit: "Edit Trip", id: "Trip ID", idLocked: "(locked)", country: "Country",
      countryZh: "Country (Chinese)", countryEn: "Country (English)",
      shortZh: "Short Title (Chinese)", shortEn: "Short Title (English)", titleZh: "Full Title (Chinese)", titleEn: "Full Title (English)",
      days: "Days", nights: "Nights", departDate: "Depart date (2026.07.19)", dateRange: "Date range (07.19—07.25)",
      memberPrice: "Member Price", normalPrice: "Normal Price",
      seatTag: "Seat Tag (Chinese)", leadZh: "Lead (Chinese)", leadEn: "Lead (English)",
      summaryZh: "Summary (Chinese)", summaryEn: "Summary (English)", gradient: "Gradient (CSS)", statusTag: "Status Tag",
      highlightsZh: "Highlights (Chinese, comma separated)", highlightsEn: "Highlights (English, comma separated)",
      includesZh: "Includes (Chinese, comma separated)", includesEn: "Includes (English, comma separated)",
      itinerary: "Daily Itinerary", itinHint: "VIP = government/business reception day (gold edge) · Leisure = leisure experience day (gold fill)",
      addDay: "+ Add day", dayPh: "Day #", titlePhZh: "Title (中)", titlePhEn: "Title (EN)",
      descPhZh: "Desc (中)", descPhEn: "Desc (EN)", vip: "VIP", leisure: "Leisure",
      departSuffix: "", selectCountry: "Select Country"
    },
    orders: {
      title: "Orders", sub: "Track bookings & payments",
      order: "Order", customer: "Customer", trip: "Trip", amount: "Amount", balance: "Balance",
      all: "All", sPending: "Pending", sDeposit: "Deposit Paid", sConfirmed: "Confirmed", sSettled: "Paid in Full",
      sDone: "Completed", sCancelled: "Cancelled",
      none: "No orders yet", manage: "Details/Manage", phone: "Phone", passport: "Passport", company: "Company",
      city: "Depart", total: "Total", checklist: "Checklist", notes: "Notes",
      markDeposit: "Mark deposit paid", markBalance: "Mark balance paid"
    },
    partners: {
      title: "Partner Leads", sub: "Manage partnership applications",
      company: "Company", contact: "Contact", categories: "Categories", modes: "Modes", markets: "Markets",
      all: "All", sNew: "New", sConnected: "Advisor Connected", sSigned: "Signed", sClosed: "Closed",
      none: "No partner leads yet", manage: "Details/Manage", phone: "Phone", createdAt: "Submitted", notes: "Notes"
    },
    notifications: {
      title: "Notifications", sub: "Notify customers & partner leads",
      send: "Send Notification", audience: "Audience", target: "Target", nTitle: "Title", body: "Message",
      audOrder: "Order customer", audPartner: "Partner lead",
      titlePh: "e.g. Trip confirmation notice", bodyPh: "Notification message…",
      tplLabel: "WeChat subscribe-message template ID (optional)", tplPh: "Blank = internal record only, advisor follows up via WeChat",
      tplHint: "When a template ID is provided and the customer has authorized it, the message is delivered via WeChat; otherwise it is saved as an internal record for WeChat/phone follow-up.",
      log: "Notification Log", time: "Time", channel: "Channel", status: "Status",
      chWechat: "WeChat", chRecord: "Record", none: "No notifications yet"
    },
    stories: {
      title: "Success Stories", sub: "Manage success story content", newStory: "+ New Story",
      t: "Title", company: "Company", category: "Category", featured: "Featured", createdAt: "Created",
      edit: "Edit", del: "Delete", none: "No stories yet",
      eNew: "New Story", eEdit: "Edit Story",
      titleZh: "Title (Chinese)", titleEn: "Title (English)", companyZh: "Company (Chinese)", companyEn: "Company (English)",
      summaryZh: "Summary (Chinese)", summaryEn: "Summary (English)", contentZh: "Content (Chinese)", contentEn: "Content (English)",
      titlePhZh: "Story title", titlePhEn: "Story title", companyPhZh: "Company name", companyPhEn: "Company name",
      summaryPhZh: "Brief summary", summaryPhEn: "Brief summary", contentPhZh: "Full content", contentPhEn: "Full content",
      catBusiness: "Business", catInvestment: "Investment", catTour: "Tour",
      images: "Story images/videos (visible to users viewing this story)"
    },
    opps: {
      title: "African Opportunities", sub: "Manage investment & trade opportunities", newOpp: "+ New Opportunity",
      t: "Title", country: "Country", type: "Type", category: "Category", status: "Status",
      edit: "Edit", del: "Delete", none: "No opportunities yet", published: "Published", draft: "Draft",
      eNew: "New Opportunity", eEdit: "Edit Opportunity",
      titleZh: "Title (Chinese)", titleEn: "Title (English)", countryZh: "Country (Chinese)", countryEn: "Country (English)",
      typeOpp: "Opportunity", typeDemand: "Demand",
      catInvestment: "Investment", catTrade: "Trade", catJV: "Joint Venture", catSupply: "Supply", catProject: "Project",
      descZh: "Description (Chinese)", descEn: "Description (English)", reqZh: "Requirements (Chinese)", reqEn: "Requirements (English)",
      budget: "Budget", deadline: "Deadline", media: "Images/videos (visible to users viewing this opportunity)",
      titlePhZh: "Opportunity title", titlePhEn: "Opportunity title", countryPhZh: "Country", countryPhEn: "Country",
      descPhZh: "Detailed description", descPhEn: "Detailed description", reqPhZh: "Qualifications/requirements", budgetPh: "e.g. $50,000 - $100,000"
    },
    inquiries: {
      title: "User Inquiries", sub: "Manage questions & intents",
      type: "Type", content: "Content", user: "User", status: "Status", createdAt: "Created",
      tStoryQ: "Story Question", tIntent: "Partnership Intent", tGeneral: "Inquiry",
      stNew: "New", stContacted: "Contacted", stClosed: "Closed",
      none: "No inquiries yet", detail: "Detail", dTitle: "Inquiry detail",
      related: "Related", phone: "Phone", company: "Company", notes: "Notes"
    }
  }
};

// Translate dotted key, zh fallback, then raw key.
function t(key) {
  const walk = (dict) => key.split(".").reduce((v, k) => (v == null ? v : v[k]), dict);
  const v = walk(I18N[LANG]);
  return v == null ? (walk(I18N.zh) == null ? key : walk(I18N.zh)) : v;
}
// Pick one of a zh/en pair for inline strings.
const b = (zh, en) => (LANG === "en" ? (en == null || en === "" ? zh : en) : (zh == null || zh === "" ? en : zh));
// Localized display of a DB record field pair (zh column / *_en column).
const locField = (zhVal, enVal) => b(zhVal, enVal);

// Canonical Chinese DB value → localized display text
const STATUS_I18N = {
  "待确认": ["orders.sPending"], "已付订金": ["orders.sDeposit"], "已确认": ["orders.sConfirmed"],
  "已结清": ["orders.sSettled"], "已完成": ["orders.sDone"], "已取消": ["orders.sCancelled"],
  "待对接": ["partners.sNew"], "顾问已对接": ["partners.sConnected"], "已签约": ["partners.sSigned"], "已关闭": ["partners.sClosed"],
  "报名中": ["trips.stRegistering"], "名额紧张": ["trips.stLimited"], "已满": ["trips.stFull"], "已结束": ["trips.stEnded"]
};
function stxt(zhStatus) {
  const key = STATUS_I18N[zhStatus];
  return key ? t(key[0]) : zhStatus;
}

function applyI18n() {
  document.documentElement.lang = LANG === "en" ? "en" : "zh";
  document.title = LANG === "en" ? "Tourista AR · Admin Console" : "Tourista AR · 管理后台";
  document.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  const nextLabel = LANG === "en" ? "中文" : "English";
  const lb1 = document.getElementById("loginLangBtn");
  const lb2 = document.getElementById("sideLangBtn");
  if (lb1) lb1.textContent = nextLabel;
  if (lb2) lb2.textContent = nextLabel;
}
function toggleLang() {
  LANG = LANG === "en" ? "zh" : "en";
  localStorage.setItem("tourista_admin_lang", LANG);
  applyI18n();
  // Re-render open modal + current view
  if (!document.getElementById("modal").classList.contains("hidden")) closeModal();
  if (!document.getElementById("app").classList.contains("hidden")) navigate(CURRENT_VIEW);
}

// ── API client ────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (TOKEN) opts.headers.Authorization = "Bearer " + TOKEN;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (res.status === 401) { logout(); throw new Error(t("login.expired")); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `${t("login.reqFail")} (${res.status})`);
  return data;
}

// ── Toast ──────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
}

// ── Modal ──────────────────────────────────────────────────────────────────
function openModal(title, html) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() { document.getElementById("modal").classList.add("hidden"); }

// ── Auth ─────────────────────────────────────────────────────────────────
async function login() {
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  if (!username || !password) { errEl.textContent = t("login.needUser"); return; }
  try {
    const { accessToken, admin } = await api("POST", "/admin/api/login", { username, password });
    TOKEN = accessToken;
    localStorage.setItem("tourista_admin_token", accessToken);
    localStorage.setItem("tourista_admin_user", JSON.stringify(admin));
    showApp(admin);
  } catch (e) {
    errEl.textContent = e.message;
  }
}

function logout() {
  TOKEN = null;
  localStorage.removeItem("tourista_admin_token");
  localStorage.removeItem("tourista_admin_user");
  document.getElementById("app").classList.add("hidden");
  document.getElementById("login").classList.remove("hidden");
}

function showApp(admin) {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("sideUser").textContent = `${admin.username} · ${admin.role}`;
  navigate("overview");
}

// ── Router ─────────────────────────────────────────────────────────────────
const views = {};  // filled by view modules below
async function navigate(name) {
  CURRENT_VIEW = name;
  document.querySelectorAll(".nav-item").forEach(n =>
    n.classList.toggle("active", n.dataset.view === name));
  const view = document.getElementById("view");
  view.innerHTML = `<div class="empty"><div class="empty-ico">⏳</div>${t("common.loading")}</div>`;
  try {
    await views[name](view);
  } catch (e) {
    view.innerHTML = `<div class="empty"><div class="empty-ico">⚠️</div>${esc(e.message)}</div>`;
  }
}

// ── Shared helpers ──────────────────────────────────────────────────────────
const fmt = (n) => "¥" + Number(n || 0).toLocaleString();
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function statusBadge(status) {
  const map = {
    "待确认": "badge-gold", "待对接": "badge-gold", "报名中": "badge-green",
    "已确认": "badge-blue", "顾问已对接": "badge-blue",
    "已付订金": "badge-blue", "已结清": "badge-green", "已签约": "badge-green",
    "已完成": "badge-grey", "已取消": "badge-red", "已关闭": "badge-red"
  };
  return `<span class="badge ${map[status] || "badge-grey"}">${esc(stxt(status))}</span>`;
}

function chips(arr) {
  if (!Array.isArray(arr) || !arr.length) return '<span class="muted">—</span>';
  return `<div class="chip-row">${arr.map(a => `<span class="chip">${esc(a)}</span>`).join("")}</div>`;
}

// ── Boot ─────────────────────────────────────────────────────────────────
applyI18n();
document.getElementById("loginBtn").onclick = login;
document.getElementById("loginPass").addEventListener("keydown", e => { if (e.key === "Enter") login(); });
document.getElementById("logoutBtn").onclick = logout;
document.getElementById("loginLangBtn").onclick = toggleLang;
document.getElementById("sideLangBtn").onclick = toggleLang;
document.getElementById("modalClose").onclick = closeModal;
document.getElementById("modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
document.querySelectorAll(".nav-item").forEach(n => n.onclick = () => navigate(n.dataset.view));

// ── Event delegation for dynamically rendered buttons ──────────────────────
// Inline onclick="fn('id')" attributes are NOT compiled in some preview
// environments (CSP without unsafe-eval blocks the attribute->handler
// compilation, leaving btn.onclick === null). Delegation via addEventListener
// on document works everywhere. Use data-action + data-arg (and data-arg2).
const ACTIONS = {
  navigate: (a) => navigate(a),
  editTrip: (a) => editTrip(a || undefined),
  quickPrice: (a) => quickPrice(a),
  deleteTrip: (a) => deleteTrip(a),
  closeModal: () => closeModal(),
  saveQuickPrice: (a) => saveQuickPrice(a),
  addItinRow: () => addItinRow(),
  saveTrip: (a) => saveTrip(a === "true"),
  removeItinRow: (_a, el) => el.parentElement.remove(),
  setOrderFilter: (a) => setOrderFilter(a || ""),
  viewOrder: (a) => viewOrder(a),
  markPaid: (a, _el, a2) => markPaid(a, a2),
  saveOrder: (a) => saveOrder(a),
  setPartnerFilter: (a) => setPartnerFilter(a || ""),
  viewPartner: (a) => viewPartner(a),
  copyWeChat: (a) => copyWeChat(a),
  savePartner: (a) => savePartner(a),
  sendNotification: () => sendNotification(),
  editStory: (a) => editStory(a || undefined),
  deleteStory: (a) => deleteStory(a),
  saveStory: (a) => saveStory(a),
  pickEditorFile: (a) => {
    const f = document.getElementById(a === "video" ? "editor_file_video" : "editor_file_image");
    if (f) f.click();
  },
  removeEditorMedia: (a) => removeEditorMedia(Number(a)),
  editOpportunity: (a) => editOpportunity(a || undefined),
  deleteOpportunity: (a) => deleteOpportunity(a),
  saveOpportunity: (a) => saveOpportunity(a),
  viewInquiry: (a) => viewInquiry(a),
  saveInquiry: (a) => saveInquiry(a),
};
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const fn = ACTIONS[el.dataset.action];
  if (fn) fn(el.dataset.arg, el, el.dataset.arg2);
});
// Delegated change events (selects rendered inside views/modals)
const CHANGE_ACTIONS = {
  updateCountryColors: () => updateCountryColors(),
  onAudienceChange: () => onAudienceChange(),
  editorFilePicked: (el) => uploadEditorMedia(el),
};
document.addEventListener("change", (e) => {
  const el = e.target.closest("[data-onchange]");
  if (!el) return;
  const fn = CHANGE_ACTIONS[el.dataset.onchange];
  if (fn) fn(el);
});

// Auto-login if token present and valid
(async function init() {
  if (!TOKEN) return;
  try {
    const { admin } = await api("GET", "/admin/api/me");
    showApp(admin);
  } catch {
    logout();
  }
})();

// ════════════════════════════════════════════════════════════════════════
// VIEW: OVERVIEW
// ════════════════════════════════════════════════════════════════════════
views.overview = async function (el) {
  const s = await api("GET", "/admin/api/stats");
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">${t("overview.title")}</div>
        <div class="view-subtitle">${t("overview.sub")}</div>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-card accent-terra"><div class="stat-num">${s.trips}</div><div class="stat-lbl">${t("overview.activeTrips")}</div></div>
      <div class="stat-card accent-gold"><div class="stat-num">${s.ordersPending}</div><div class="stat-lbl">${t("overview.pendingOrders")}</div></div>
      <div class="stat-card accent-blue"><div class="stat-num">${s.ordersTotal}</div><div class="stat-lbl">${t("overview.totalOrders")}</div></div>
      <div class="stat-card accent-green"><div class="stat-num">${fmt(s.revenueCollected)}</div><div class="stat-lbl">${t("overview.revenue")}</div></div>
    </div>
    <div class="stat-grid" style="margin-top:16px">
      <div class="stat-card accent-gold"><div class="stat-num">${s.partnersNew}</div><div class="stat-lbl">${t("overview.newLeads")}</div></div>
      <div class="stat-card accent-blue"><div class="stat-num">${s.partnersTotal}</div><div class="stat-lbl">${t("overview.totalLeads")}</div></div>
      <div class="stat-card accent-terra"><div class="stat-num">${s.ordersConfirmed}</div><div class="stat-lbl">${t("overview.confirmed")}</div></div>
      <div class="stat-card"><div class="stat-num">${s.seatsLeft}</div><div class="stat-lbl">${t("overview.seats")}</div></div>
    </div>
    <div class="card" style="margin-top:24px">
      <div class="card-head">${t("overview.quickActions")}</div>
      <div style="padding:18px 20px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" data-action="navigate" data-arg="trips">${t("overview.aTrips")}</button>
        <button class="btn btn-ink" data-action="navigate" data-arg="orders">${t("overview.aOrders")}</button>
        <button class="btn btn-ghost" data-action="navigate" data-arg="partners">${t("overview.aPartners")}</button>
        <button class="btn btn-ghost" data-action="navigate" data-arg="notifications">${t("overview.aNotify")}</button>
      </div>
    </div>`;
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: TRIPS — edit itineraries / prices / seats
// ════════════════════════════════════════════════════════════════════════
views.trips = async function (el) {
  const trips = await api("GET", "/admin/api/trips");
  TRIPS_CACHE = trips;
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">${t("trips.title")}</div>
        <div class="view-subtitle">${t("trips.sub")}</div>
      </div>
      <button class="btn btn-primary" data-action="editTrip">${t("trips.newTrip")}</button>
    </div>
    <div class="card">
      <table>
        <thead><tr>
          <th>${t("trips.trip")}</th><th>${t("trips.depart")}</th><th>${t("trips.member")}</th><th>${t("trips.normal")}</th>
          <th>${t("trips.deposit")}</th><th>${t("trips.seats")}</th><th>${t("trips.status")}</th><th></th>
        </tr></thead>
        <tbody>
          ${trips.map(tr => `
            <tr>
              <td>
                <div style="font-weight:600">${esc(locField(tr.shortTitle, tr.shortTitleEn))}</div>
                <div class="muted" style="font-size:12px">${esc(tr.id)} · ${tr.days}${t("common.days")} · ${tr.isPublished ? t("common.published") : `<span style="color:var(--red)">${t("common.unpublished")}</span>`}</div>
              </td>
              <td>${esc(tr.depart)}<div class="muted" style="font-size:12px">${esc(tr.dateRange)}</div></td>
              <td class="price-cell">${fmt(tr.memberPrice)}</td>
              <td class="muted">${fmt(tr.normalPrice)}</td>
              <td>${fmt(tr.deposit)}</td>
              <td><b>${tr.seatsLeft}</b> <span class="muted">/ ${tr.seatsTotal}</span></td>
              <td>${statusBadge(tr.status)}</td>
              <td class="row-actions">
                <button class="btn btn-sm btn-ghost" data-action="quickPrice" data-arg="${tr.id}">${t("trips.quick")}</button>
                <button class="btn btn-sm btn-ink" data-action="editTrip" data-arg="${tr.id}">${t("common.edit")}</button>
                <button class="btn btn-sm btn-danger" data-action="deleteTrip" data-arg="${tr.id}">${t("common.del")}</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
};

// Quick price + seats adjustment (most common task)
window.quickPrice = function (id) {
  const tr = TRIPS_CACHE.find(x => x.id === id);
  const tripStatuses = ["报名中", "名额紧张", "已满", "已结束"];
  openModal(`${t("trips.quickTitle")} · ${esc(locField(tr.shortTitle, tr.shortTitleEn))}`, `
    <div class="form-grid">
      <div class="form-field"><label>${t("trips.memberPrice")}</label><input id="q_member" type="number" value="${tr.memberPrice}"/></div>
      <div class="form-field"><label>${t("trips.normalPrice")}</label><input id="q_normal" type="number" value="${tr.normalPrice}"/></div>
      <div class="form-field"><label>${t("trips.deposit")}</label><input id="q_deposit" type="number" value="${tr.deposit}"/></div>
      <div class="form-field"><label>${t("trips.seatsLeft")}</label><input id="q_seats" type="number" value="${tr.seatsLeft}"/></div>
      <div class="form-field"><label>${t("trips.status")}</label>
        <select id="q_status">
          ${tripStatuses.map(s => `<option value="${s}" ${tr.status === s ? "selected" : ""}>${stxt(s)}</option>`).join("")}
        </select>
      </div>
      <div class="form-field"><label>${t("common.published")}</label>
        <select id="q_pub"><option value="1" ${tr.isPublished ? "selected" : ""}>${t("common.published")}</option><option value="0" ${!tr.isPublished ? "selected" : ""}>${t("common.unpublished")}</option></select>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-action="closeModal">${t("common.cancel")}</button>
      <button class="btn btn-primary" data-action="saveQuickPrice" data-arg="${id}">${t("common.save")}</button>
    </div>`);
};

window.saveQuickPrice = async function (id) {
  const patch = {
    memberPrice: Number(document.getElementById("q_member").value),
    normalPrice: Number(document.getElementById("q_normal").value),
    deposit: Number(document.getElementById("q_deposit").value),
    seatsLeft: Number(document.getElementById("q_seats").value),
    status: document.getElementById("q_status").value,
    isPublished: document.getElementById("q_pub").value === "1"
  };
  try {
    await api("PATCH", `/admin/api/trips/${id}`, patch);
    closeModal(); toast(t("common.updated"), "success"); navigate("trips");
  } catch (e) { toast(e.message, "error"); }
};

window.deleteTrip = async function (id) {
  if (!confirm(t("common.confirmTripDel"))) return;
  try {
    await api("DELETE", `/admin/api/trips/${id}`);
    toast(t("common.deleted"), "success"); navigate("trips");
  } catch (e) { toast(e.message, "error"); }
};

// ── Full trip editor (create + edit, incl. itinerary) ──────────────────────
window.editTrip = function (id) {
  const tr = id ? TRIPS_CACHE.find(x => x.id === id) : {
    id: "", flag: "", country: "", countryEn: "", shortTitle: "", shortTitleEn: "",
    title: "", titleEn: "", days: 7, nights: 6, depart: "", departShort: "", dateRange: "",
    structure: "4天商务 + 1天休闲", structureEn: "4 Business Days + 1 Leisure Day",
    lead: "", leadEn: "", gradient: "linear-gradient(120deg,#2E5E1F,#C24214)",
    memberPrice: 0, normalPrice: 0, deposit: 0, seatsTotal: 15, seatsLeft: 15,
    status: "报名中", statusEn: "Registering", statusTag: "tag-terra", seatTag: "", seatTagEn: "",
    highlights: [], highlightsEn: [], summary: "", summaryEn: "",
    includes: [], includesEn: [], itinerary: [], isPublished: true
  };
  const isNew = !id;
  const field = (k, label, val, type = "text") =>
    `<div class="form-field"><label>${label}</label><input id="t_${k}" type="${type}" value="${esc(val)}"/></div>`;

  openModal(isNew ? t("trips.eNew") : `${t("trips.eEdit")} · ${esc(locField(tr.shortTitle, tr.shortTitleEn))}`, `
    <div class="form-grid">
      <div class="form-field"><label>${t("trips.id")} ${isNew ? "" : t("trips.idLocked")}</label>
        <input id="t_id" value="${esc(tr.id)}" ${isNew ? `placeholder="e.g. kenya"` : "disabled"}/></div>
      <div class="form-field"><label>${t("trips.country")}</label>
        <select id="t_flag" data-onchange="updateCountryColors">
          <option value="">${t("trips.selectCountry")}</option>
          ${Object.entries(COUNTRY_COLORS).map(([code, data]) => `<option ${tr.flag === code ? "selected" : ""} value="${code}">${code} - ${locField(data.nameCn, data.name)}</option>`).join("")}
        </select></div>
      <div class="form-field"><label>${t("trips.countryZh")}</label><input id="t_country" value="${esc(tr.country)}"/></div>
      <div class="form-field"><label>${t("trips.countryEn")}</label><input id="t_countryEn" value="${esc(tr.countryEn)}"/></div>
      ${field("shortTitle", t("trips.shortZh"), tr.shortTitle)}
      ${field("shortTitleEn", t("trips.shortEn"), tr.shortTitleEn)}
      ${field("title", t("trips.titleZh"), tr.title)}
      ${field("titleEn", t("trips.titleEn"), tr.titleEn)}
      ${field("days", t("trips.days"), tr.days, "number")}
      ${field("nights", t("trips.nights"), tr.nights, "number")}
      ${field("depart", t("trips.departDate"), tr.depart)}
      ${field("dateRange", t("trips.dateRange"), tr.dateRange)}
      ${field("memberPrice", t("trips.memberPrice"), tr.memberPrice, "number")}
      ${field("normalPrice", t("trips.normalPrice"), tr.normalPrice, "number")}
      ${field("deposit", t("trips.deposit"), tr.deposit, "number")}
      ${field("seatsTotal", t("trips.seatsTotal"), tr.seatsTotal, "number")}
      ${field("seatsLeft", t("trips.seatsLeft"), tr.seatsLeft, "number")}
      ${field("seatTag", t("trips.seatTag"), tr.seatTag)}
      ${field("seatTagEn", "Seat Tag (EN)", tr.seatTagEn)}
      ${field("lead", t("trips.leadZh"), tr.lead)}
      ${field("leadEn", t("trips.leadEn"), tr.leadEn)}
      <div class="form-field"><label>${t("trips.status")}</label>
        <select id="t_status">
          ${["报名中","名额紧张","已满","已结束"].map(s => `<option ${tr.status === s ? "selected" : ""} value="${s}">${stxt(s)}</option>`).join("")}
        </select></div>
      <div class="form-field"><label>Status (EN)</label><input id="t_statusEn" value="${esc(tr.statusEn)}"/></div>
      <div class="form-field"><label>${t("common.published")}</label>
        <select id="t_pub"><option value="1" ${tr.isPublished ? "selected" : ""}>${t("common.published")}</option><option value="0" ${!tr.isPublished ? "selected" : ""}>${t("common.unpublished")}</option></select></div>
      ${field("structure", "Structure (中)", tr.structure)}
      ${field("structureEn", "Structure (EN)", tr.structureEn)}
      <div class="form-field full"><label>${t("trips.summaryZh")}</label><input id="t_summary" value="${esc(tr.summary)}"/></div>
      <div class="form-field full"><label>${t("trips.summaryEn")}</label><input id="t_summaryEn" value="${esc(tr.summaryEn)}"/></div>
      <div class="form-field"><label>${t("trips.gradient")}</label><input id="t_gradient" value="${esc(tr.gradient)}"/></div>
      <div class="form-field"><label>${t("trips.statusTag")}</label>
        <select id="t_statusTag">
          ${["tag-terra","tag-green","tag-gold"].map(s => `<option ${tr.statusTag === s ? "selected" : ""}>${s}</option>`).join("")}
        </select></div>
      <div class="form-field full"><label>${t("trips.highlightsZh")}</label><input id="t_highlights" value="${esc((tr.highlights||[]).join(", "))}"/></div>
      <div class="form-field full"><label>${t("trips.highlightsEn")}</label><input id="t_highlightsEn" value="${esc((tr.highlightsEn||[]).join(", "))}"/></div>
      <div class="form-field full"><label>${t("trips.includesZh")}</label><textarea id="t_includes">${esc((tr.includes||[]).join(", "))}</textarea></div>
      <div class="form-field full"><label>${t("trips.includesEn")}</label><textarea id="t_includesEn">${esc((tr.includesEn||[]).join(", "))}</textarea></div>
    </div>

    <div style="margin-top:20px;font-weight:600;font-size:14px">${t("trips.itinerary")}</div>
    <div class="form-hint" style="margin-bottom:10px">${t("trips.itinHint")}</div>
    <div id="itinList">
      ${(tr.itinerary||[]).map((d, i) => itinRowHtml(d, i)).join("")}
    </div>
    <button class="btn btn-sm btn-ghost" data-action="addItinRow">${t("trips.addDay")}</button>

    <div class="modal-foot">
      <button class="btn btn-ghost" data-action="closeModal">${t("common.cancel")}</button>
      <button class="btn btn-primary" data-action="saveTrip" data-arg="${isNew}">${isNew ? t("common.create") : t("common.save")}</button>
    </div>`);
};

function itinRowHtml(d, i) {
  return `<div class="itin-row" data-i="${i}">
    <input class="itin-day" type="number" value="${d.day || i + 1}" title="${t("trips.dayPh")}"/>
    <div><input class="itin-title" value="${esc(d.title || "")}" placeholder="${t("trips.titlePhZh")}"/>
         <input class="itin-titleEn" value="${esc(d.titleEn || "")}" placeholder="${t("trips.titlePhEn")}" style="margin-top:4px"/></div>
    <div><input class="itin-desc" value="${esc(d.desc || "")}" placeholder="${t("trips.descPhZh")}"/>
         <input class="itin-descEn" value="${esc(d.descEn || "")}" placeholder="${t("trips.descPhEn")}" style="margin-top:4px"/></div>
    <div class="itin-flags">
      <label><input type="checkbox" class="itin-vip" ${d.vip ? "checked" : ""}/>${t("trips.vip")}</label>
      <label><input type="checkbox" class="itin-leisure" ${d.leisure ? "checked" : ""}/>${t("trips.leisure")}</label>
    </div>
    <button class="btn btn-sm btn-danger" data-action="removeItinRow">×</button>
  </div>`;
}
window.addItinRow = function () {
  const list = document.getElementById("itinList");
  const i = list.children.length;
  list.insertAdjacentHTML("beforeend", itinRowHtml({ day: i + 1 }, i));
};

// Auto-fill country name + flag gradient when the country dropdown changes
window.updateCountryColors = function () {
  const code = document.getElementById("t_flag").value;
  const d = COUNTRY_COLORS[code];
  if (!d) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  set("t_country", d.nameCn);
  set("t_countryEn", d.name);
  set("t_gradient", d.gradient);
};

window.saveTrip = async function (isNew) {
  const v = (id) => document.getElementById(id).value;
  const arr = (id) => v(id).split(",").map(s => s.trim()).filter(Boolean);

  const itinerary = [...document.querySelectorAll("#itinList .itin-row")].map(row => ({
    day: Number(row.querySelector(".itin-day").value),
    title: row.querySelector(".itin-title").value,
    titleEn: row.querySelector(".itin-titleEn").value,
    desc: row.querySelector(".itin-desc").value,
    descEn: row.querySelector(".itin-descEn").value,
    vip: row.querySelector(".itin-vip").checked,
    leisure: row.querySelector(".itin-leisure").checked
  }));

  const payload = {
    id: v("t_id"),
    flag: v("t_flag"), country: v("t_country"), countryEn: v("t_countryEn"),
    shortTitle: v("t_shortTitle"), shortTitleEn: v("t_shortTitleEn"),
    title: v("t_title"), titleEn: v("t_titleEn"),
    days: Number(v("t_days")), nights: Number(v("t_nights")),
    depart: v("t_depart"), dateRange: v("t_dateRange"),
    departShort: v("t_depart").split(".").slice(1).join(".") + t("trips.departSuffix"),
    memberPrice: Number(v("t_memberPrice")), normalPrice: Number(v("t_normalPrice")),
    deposit: Number(v("t_deposit")), seatsTotal: Number(v("t_seatsTotal")), seatsLeft: Number(v("t_seatsLeft")),
    seatTag: v("t_seatTag"), seatTagEn: v("t_seatTagEn"),
    status: v("t_status"), statusEn: v("t_statusEn"),
    isPublished: v("t_pub") === "1",
    structure: v("t_structure"), structureEn: v("t_structureEn"),
    lead: v("t_lead"), leadEn: v("t_leadEn"),
    summary: v("t_summary"), summaryEn: v("t_summaryEn"),
    gradient: v("t_gradient"), statusTag: v("t_statusTag"),
    highlights: arr("t_highlights"), highlightsEn: arr("t_highlightsEn"),
    includes: arr("t_includes"), includesEn: arr("t_includesEn"),
    itinerary
  };
  if (!payload.id) { toast(t("common.needId"), "error"); return; }
  try {
    if (isNew) await api("POST", "/admin/api/trips", payload);
    else await api("PUT", `/admin/api/trips/${payload.id}`, payload);
    closeModal(); toast(isNew ? t("common.created") : t("common.saved"), "success"); navigate("trips");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: ORDERS — track orders & payments
// ════════════════════════════════════════════════════════════════════════
let ORDER_FILTER = "";
views.orders = async function (el) {
  const q = ORDER_FILTER ? `?status=${encodeURIComponent(ORDER_FILTER)}` : "";
  const orders = await api("GET", "/admin/api/orders" + q);
  const statuses = [["","all"], ["待确认","sPending"], ["已付订金","sDeposit"], ["已确认","sConfirmed"], ["已结清","sSettled"], ["已完成","sDone"], ["已取消","sCancelled"]];
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">${t("orders.title")}</div>
        <div class="view-subtitle">${t("orders.sub")}</div>
      </div>
    </div>
    <div class="filters">
      ${statuses.map(([s, k]) => `<div class="filter-pill ${ORDER_FILTER === s ? "on" : ""}" data-action="setOrderFilter" data-arg="${s}">${s ? t("orders." + k) : t("orders.all")}</div>`).join("")}
    </div>
    <div class="card">
      ${orders.length ? `
      <table>
        <thead><tr>
          <th>${t("orders.order")}</th><th>${t("orders.customer")}</th><th>${t("orders.trip")}</th><th>${t("orders.amount")}</th>
          <th>${t("trips.deposit")}</th><th>${t("orders.balance")}</th><th>${t("trips.status")}</th><th></th>
        </tr></thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td class="mono">${esc(o.id)}<div class="muted" style="font-size:11px">${esc((o.createdAt||"").slice(0,10))}</div></td>
              <td><b>${esc(o.customerName)}</b><div class="muted" style="font-size:12px">${esc(o.phone)}</div></td>
              <td>${esc(locField(o.title, o.titleEn))}<div class="muted" style="font-size:12px">${esc(o.depart)}</div></td>
              <td class="price-cell">${fmt(o.totalPrice)}</td>
              <td>${o.depositPaid ? `<span class="badge badge-green">${t("common.paid")}</span>` : `<span class="badge badge-grey">${t("common.unpaid")}</span>`}<div class="muted" style="font-size:12px">${fmt(o.deposit)}</div></td>
              <td>${o.balancePaid ? `<span class="badge badge-green">${t("common.paid")}</span>` : `<span class="badge badge-gold">${t("common.due")}</span>`}<div class="muted" style="font-size:12px">${fmt(o.balance)}</div></td>
              <td>${statusBadge(o.status)}</td>
              <td class="row-actions"><button class="btn btn-sm btn-ink" data-action="viewOrder" data-arg="${o.id}">${t("orders.manage")}</button></td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">📭</div>${t("orders.none")}</div>`}
    </div>`;
};
window.setOrderFilter = function (s) { ORDER_FILTER = s; navigate("orders"); };

window.viewOrder = async function (id) {
  const o = await api("GET", `/admin/api/orders/${id}`);
  const row = (k, v) => `<div class="detail-row"><div class="detail-k">${k}</div><div class="detail-v">${v}</div></div>`;
  const checklist = (o.checklist || []).map(c => {
    const label = locField(c.label, c.labelEn);
    return `<div style="font-size:13px;padding:4px 0">${c.done ? "✅" : "⬜"} ${esc(label)}</div>`;
  }).join("") || '<span class="muted">—</span>';
  const orderStatuses = ["待确认","已付订金","已确认","已结清","已完成","已取消"];
  openModal(`${t("orders.order")} · ${esc(o.id)}`, `
    ${row(t("orders.customer"), esc(o.customerName))}
    ${row(t("orders.phone"), esc(o.phone))}
    ${row(t("orders.passport"), esc(o.passport) || "—")}
    ${row(t("orders.company"), esc(locField(o.company, o.companyEn)) || "—")}
    ${row(t("orders.trip"), esc(locField(o.title, o.titleEn)))}
    ${row(t("orders.city"), esc(o.depart) + " · " + esc(locField(o.city, o.cityEn)))}
    ${row(t("orders.total"), `<b class="price-cell">${fmt(o.totalPrice)}</b>`)}
    ${row(t("trips.deposit"), fmt(o.deposit) + (o.depositPaid ? ` <span class="badge badge-green">${t("common.paid")}</span>` : ` <span class="badge badge-grey">${t("common.unpaid")}</span>`))}
    ${row(t("orders.balance"), fmt(o.balance) + (o.balancePaid ? ` <span class="badge badge-green">${t("common.paid")}</span>` : ` <span class="badge badge-gold">${t("common.due")} (${esc(o.balanceDue)})</span>`))}
    ${row(t("orders.checklist"), checklist)}
    ${row(t("orders.notes"), `<textarea id="o_notes" style="width:100%;min-height:50px;border:1px solid var(--line);border-radius:8px;padding:8px">${esc(o.notes || "")}</textarea>`)}
    ${row(t("trips.status"), `<select id="o_status">
        ${orderStatuses.map(s => `<option ${o.status === s ? "selected" : ""} value="${s}">${stxt(s)}</option>`).join("")}
      </select>`)}
    <div class="modal-foot">
      ${!o.depositPaid ? `<button class="btn btn-green btn-sm" data-action="markPaid" data-arg="${o.id}" data-arg2="deposit">${t("orders.markDeposit")}</button>` : ""}
      ${!o.balancePaid ? `<button class="btn btn-green btn-sm" data-action="markPaid" data-arg="${o.id}" data-arg2="balance">${t("orders.markBalance")}</button>` : ""}
      <button class="btn btn-primary" data-action="saveOrder" data-arg="${o.id}">${t("common.save")}</button>
    </div>`);
};
window.markPaid = async function (id, kind) {
  try { await api("POST", `/admin/api/orders/${id}/mark-paid`, { kind }); closeModal(); toast(t("common.recorded"), "success"); navigate("orders"); }
  catch (e) { toast(e.message, "error"); }
};
window.saveOrder = async function (id) {
  try {
    await api("PUT", `/admin/api/orders/${id}`, {
      status: document.getElementById("o_status").value,
      notes: document.getElementById("o_notes").value
    });
    closeModal(); toast(t("common.saved"), "success"); navigate("orders");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: PARTNERS — manage partner leads
// ════════════════════════════════════════════════════════════════════════
let PARTNER_FILTER = "";
views.partners = async function (el) {
  const q = PARTNER_FILTER ? `?status=${encodeURIComponent(PARTNER_FILTER)}` : "";
  const apps = await api("GET", "/admin/api/partner-apps" + q);
  const statuses = [["","all"], ["待对接","sNew"], ["顾问已对接","sConnected"], ["已签约","sSigned"], ["已关闭","sClosed"]];
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">${t("partners.title")}</div>
        <div class="view-subtitle">${t("partners.sub")}</div>
      </div>
    </div>
    <div class="filters">
      ${statuses.map(([s, k]) => `<div class="filter-pill ${PARTNER_FILTER === s ? "on" : ""}" data-action="setPartnerFilter" data-arg="${s}">${s ? t("partners." + k) : t("partners.all")}</div>`).join("")}
    </div>
    <div class="card">
      ${apps.length ? `
      <table>
        <thead><tr>
          <th>${t("partners.company")}</th><th>${t("partners.contact")}</th><th>${t("partners.categories")}</th>
          <th>${t("partners.modes")}</th><th>${t("partners.markets")}</th><th>${t("trips.status")}</th><th></th>
        </tr></thead>
        <tbody>
          ${apps.map(a => `
            <tr>
              <td><b>${esc(locField(a.company, a.companyEn))}</b><div class="muted" style="font-size:11px">${esc((a.createdAt||"").slice(0,10))}</div></td>
              <td>${esc(a.contact)}<div class="muted" style="font-size:12px">${t("common.wechat")} ${esc(a.wechat)}</div></td>
              <td>${chips(locField(a.categories, a.categoriesEn))}</td>
              <td>${chips(locField(a.modes, a.modesEn))}</td>
              <td>${chips(locField(a.markets, a.marketsEn))}</td>
              <td>${statusBadge(a.status)}</td>
              <td class="row-actions"><button class="btn btn-sm btn-ink" data-action="viewPartner" data-arg="${a.id}">${t("partners.manage")}</button></td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">🤝</div>${t("partners.none")}</div>`}
    </div>`;
};
window.setPartnerFilter = function (s) { PARTNER_FILTER = s; navigate("partners"); };

window.viewPartner = async function (id) {
  const a = await api("GET", `/admin/api/partner-apps/${id}`);
  const row = (k, v) => `<div class="detail-row"><div class="detail-k">${k}</div><div class="detail-v">${v}</div></div>`;
  const statuses = ["待对接","顾问已对接","已签约","已关闭"];
  openModal(`${t("partners.title")} · ${esc(locField(a.company, a.companyEn))}`, `
    ${row(t("partners.company"), esc(locField(a.company, a.companyEn)))}
    ${row(t("partners.contact"), esc(a.contact))}
    ${row(t("common.wechat"), `<b>${esc(a.wechat)}</b>`)}
    ${row(t("partners.phone"), esc(a.phone) || "—")}
    ${row(t("partners.categories"), chips(locField(a.categories, a.categoriesEn)))}
    ${row(t("partners.modes"), chips(locField(a.modes, a.modesEn)))}
    ${row(t("partners.markets"), chips(locField(a.markets, a.marketsEn)))}
    ${row(t("partners.createdAt"), esc((a.createdAt||"").slice(0,16))) }
    ${row(t("partners.notes"), `<textarea id="p_notes" style="width:100%;min-height:60px;border:1px solid var(--line);border-radius:8px;padding:8px">${esc(a.notes || "")}</textarea>`)}
    ${row(t("trips.status"), `<select id="p_status">
        ${statuses.map(s => `<option ${a.status === s ? "selected" : ""} value="${s}">${stxt(s)}</option>`).join("")}
      </select>`)}
    <div class="modal-foot">
      <button class="btn btn-ghost" data-action="copyWeChat" data-arg="${esc(a.wechat)}">${t("common.copyWechat")}</button>
      <button class="btn btn-primary" data-action="savePartner" data-arg="${a.id}">${t("common.save")}</button>
    </div>`);
};
window.copyWeChat = function (w) { navigator.clipboard?.writeText(w); toast(t("common.wechatCopied") + ": " + w, "success"); };
window.savePartner = async function (id) {
  try {
    await api("PUT", `/admin/api/partner-apps/${id}`, {
      status: document.getElementById("p_status").value,
      notes: document.getElementById("p_notes").value
    });
    closeModal(); toast(t("common.saved"), "success"); navigate("partners");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: NOTIFICATIONS — notify clients
// ════════════════════════════════════════════════════════════════════════
views.notifications = async function (el) {
  const [orders, partners, log] = await Promise.all([
    api("GET", "/admin/api/orders"),
    api("GET", "/admin/api/partner-apps"),
    api("GET", "/admin/api/notifications?limit=50")
  ]);
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">${t("notifications.title")}</div>
        <div class="view-subtitle">${t("notifications.sub")}</div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">${t("notifications.send")}</div>
      <div style="padding:20px">
        <div class="form-grid">
          <div class="form-field">
            <label>${t("notifications.audience")}</label>
            <select id="n_audience" data-onchange="onAudienceChange">
              <option value="order">${t("notifications.audOrder")}</option>
              <option value="partner">${t("notifications.audPartner")}</option>
            </select>
          </div>
          <div class="form-field">
            <label>${t("notifications.target")}</label>
            <select id="n_target">
              ${orders.map(o => `<option value="${o.id}">${esc(o.customerName)} · ${esc(locField(o.title, o.titleEn))}</option>`).join("")}
            </select>
          </div>
          <div class="form-field full"><label>${t("notifications.nTitle")}</label><input id="n_title" placeholder="${t("notifications.titlePh")}"/></div>
          <div class="form-field full"><label>${t("notifications.body")}</label><textarea id="n_body" placeholder="${t("notifications.bodyPh")}"></textarea></div>
          <div class="form-field full">
            <label>${t("notifications.tplLabel")}</label>
            <input id="n_template" placeholder="${t("notifications.tplPh")}"/>
            <div class="form-hint">${t("notifications.tplHint")}</div>
          </div>
        </div>
        <div style="margin-top:16px"><button class="btn btn-primary" data-action="sendNotification">${t("common.send")}</button></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">${t("notifications.log")}</div>
      ${log.length ? `
      <table>
        <thead><tr><th>${t("notifications.time")}</th><th>${t("notifications.audience")}</th><th>${t("notifications.nTitle")}</th><th>${t("notifications.channel")}</th><th>${t("notifications.status")}</th></tr></thead>
        <tbody>
          ${log.map(n => `<tr>
            <td class="muted mono">${esc((n.created_at||"").slice(0,16))}</td>
            <td>${esc(n.audience)} ${esc(n.target_id || "")}</td>
            <td>${esc(n.title)}</td>
            <td>${n.channel === "subscribe" ? `<span class="badge badge-blue">${t("notifications.chWechat")}</span>` : `<span class="badge badge-grey">${t("notifications.chRecord")}</span>`}</td>
            <td>${n.status === "sent" ? `<span class="badge badge-green">${t("common.sent")}</span>` : n.status === "failed" ? `<span class="badge badge-red">${t("common.failed")}</span>` : `<span class="badge badge-gold">${t("common.logged")}</span>`}</td>
          </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">✉️</div>${t("notifications.none")}</div>`}
    </div>`;
  // stash for audience switching
  window._notifyData = { orders, partners };
};
window.onAudienceChange = function () {
  const aud = document.getElementById("n_audience").value;
  const { orders, partners } = window._notifyData;
  const target = document.getElementById("n_target");
  target.innerHTML = aud === "order"
    ? orders.map(o => `<option value="${o.id}">${esc(o.customerName)} · ${esc(locField(o.title, o.titleEn))}</option>`).join("")
    : partners.map(p => `<option value="${p.id}">${esc(locField(p.company, p.companyEn))} · ${esc(p.contact)}</option>`).join("");
};
window.sendNotification = async function () {
  const payload = {
    audience: document.getElementById("n_audience").value,
    targetId: document.getElementById("n_target").value,
    title: document.getElementById("n_title").value,
    body: document.getElementById("n_body").value,
    templateId: document.getElementById("n_template").value || undefined
  };
  if (!payload.targetId) { toast(t("common.selectTarget"), "error"); return; }
  if (!payload.title) { toast(t("common.needTitle"), "error"); return; }
  try {
    const r = await api("POST", "/admin/api/notifications", payload);
    toast(r.sendResult && r.sendResult.ok ? t("common.sent") : t("common.logged"), "success");
    navigate("notifications");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: STORIES — manage success stories
// ════════════════════════════════════════════════════════════════════════
// Media list (images + videos) for whichever entity is being edited — only
// one editor modal is open at a time. Held client-side until Save persists it.
let editorMedia = [];

function editorMediaRowHtml(m, i) {
  const inner = m.type === "video"
    ? `<video class="img-thumb-vid" src="${esc(m.url)}" muted preload="metadata"></video>
       <span class="img-thumb-play">▶</span><span class="img-thumb-badge">${t("common.video")}</span>`
    : `<img src="${esc(m.url)}" alt=""/>`;
  return `<div class="img-thumb${m.type === "video" ? " img-thumb-video" : ""}">
    ${inner}
    <button type="button" class="img-thumb-x" title="${t("common.del")}" data-action="removeEditorMedia" data-arg="${i}">×</button>
  </div>`;
}

// Shared media picker block embedded in the story/opportunity editors.
function editorMediaSectionHtml(label) {
  return `
      <div class="form-field full">
        <label>${label}</label>
        <div id="editor_media" class="img-grid">${editorMedia.map(editorMediaRowHtml).join("")}</div>
        <input type="file" id="editor_file_image" accept="image/*" style="display:none" data-onchange="editorFilePicked"/>
        <input type="file" id="editor_file_video" accept="video/*" style="display:none" data-onchange="editorFilePicked"/>
        <button type="button" class="btn btn-sm btn-ghost" data-action="pickEditorFile" data-arg="image">+ ${t("common.addImage")}</button>
        <button type="button" class="btn btn-sm btn-ghost" data-action="pickEditorFile" data-arg="video">+ ${t("common.addVideo")}</button>
        <div class="form-hint">${t("common.mediaHint")}</div>
      </div>`;
}

function renderEditorMedia() {
  const grid = document.getElementById("editor_media");
  if (grid) grid.innerHTML = editorMedia.map(editorMediaRowHtml).join("");
}

// Upload the picked file immediately (multipart), then append the returned
// {url, type} to the editor's pending media list.
window.uploadEditorMedia = async function (input) {
  const file = input && input.files && input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  toast(t("common.uploading"));
  try {
    const res = await fetch("/admin/api/upload", {
      method: "POST",
      headers: TOKEN ? { Authorization: "Bearer " + TOKEN } : {},
      body: fd
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || t("common.uploadFail") + ` (${res.status})`);
    editorMedia.push({ url: data.url, type: data.type || "image" });
    renderEditorMedia();
    toast(t("common.saved"), "success");
  } catch (e) {
    toast(e.message, "error");
  } finally {
    input.value = "";  // allow picking the same file again
  }
};

window.removeEditorMedia = function (i) {
  editorMedia.splice(i, 1);
  renderEditorMedia();
};

views.stories = async function (el) {
  const stories = await api("GET", "/admin/api/stories");
  const storyCat = (c) => t("stories.cat" + c.charAt(0).toUpperCase() + c.slice(1));
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">${t("stories.title")}</div>
        <div class="view-subtitle">${t("stories.sub")}</div>
      </div>
      <button class="btn btn-primary" data-action="editStory">${t("stories.newStory")}</button>
    </div>
    <div class="card">
      ${stories.length ? `
      <table>
        <thead><tr>
          <th>${t("stories.t")}</th><th>${t("stories.company")}</th><th>${t("stories.category")}</th>
          <th>${t("stories.featured")}</th><th>${t("stories.createdAt")}</th><th></th>
        </tr></thead>
        <tbody>
          ${stories.map(s => `
            <tr>
              <td><b>${esc(locField(s.title, s.titleEn))}</b><div class="muted" style="font-size:12px">${esc(LANG === "en" ? s.title : s.titleEn || "")}</div></td>
              <td>${esc(locField(s.company, s.companyEn))}</td>
              <td><span class="badge badge-blue">${storyCat(s.category)}</span></td>
              <td>${s.featured ? `<span class="badge badge-green">${t("common.yes")}</span>` : `<span class="badge badge-grey">${t("common.no")}</span>`}</td>
              <td class="muted">${esc((s.createdAt||"").slice(0,10))}</td>
              <td class="row-actions">
                <button class="btn btn-sm btn-ink" data-action="editStory" data-arg="${s.id}">${t("stories.edit")}</button>
                <button class="btn btn-sm btn-danger" data-action="deleteStory" data-arg="${s.id}">${t("stories.del")}</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">${ICONS.trophy}</div>${t("stories.none")}</div>`}
    </div>`;
};

window.editStory = async function (id) {
  // Load existing story if editing; otherwise start with empty defaults
  let s;
  try {
    s = id
      ? await api("GET", `/admin/api/stories/${id}`)
      : { title: "", titleEn: "", company: "", companyEn: "", category: "business", summary: "", summaryEn: "", content: "", contentEn: "", featured: false, media: [] };
  } catch (e) {
    toast(e.message, "error");
    return;
  }
  editorMedia = Array.isArray(s.media) ? s.media.map(m => ({ ...m })) : [];
  const catSel = (val) => s.category === val ? "selected" : "";
  const featSel = (val) => (s.featured ? val === "1" : val === "0") ? "selected" : "";
  const V = (val) => esc(val == null ? "" : val);
  openModal(id ? t("stories.eEdit") : t("stories.eNew"), `
    <div class="form-grid">
      <div class="form-field full"><label>${t("stories.titleZh")}</label><input id="s_title" value="${V(s.title)}" placeholder="${t("stories.titlePhZh")}"/></div>
      <div class="form-field full"><label>${t("stories.titleEn")}</label><input id="s_titleEn" value="${V(s.titleEn)}" placeholder="${t("stories.titlePhEn")}"/></div>
      <div class="form-field"><label>${t("stories.companyZh")}</label><input id="s_company" value="${V(s.company)}" placeholder="${t("stories.companyPhZh")}"/></div>
      <div class="form-field"><label>${t("stories.companyEn")}</label><input id="s_companyEn" value="${V(s.companyEn)}" placeholder="${t("stories.companyPhEn")}"/></div>
      <div class="form-field"><label>${t("stories.category")}</label>
        <select id="s_category">
          <option value="business" ${catSel("business")}>${t("stories.catBusiness")}</option>
          <option value="investment" ${catSel("investment")}>${t("stories.catInvestment")}</option>
          <option value="tour" ${catSel("tour")}>${t("stories.catTour")}</option>
        </select></div>
      <div class="form-field"><label>${t("stories.featured")}</label>
        <select id="s_featured"><option value="0" ${featSel("0")}>${t("common.no")}</option><option value="1" ${featSel("1")}>${t("common.yes")}</option></select></div>
      <div class="form-field full"><label>${t("stories.summaryZh")}</label><textarea id="s_summary" placeholder="${t("stories.summaryPhZh")}">${V(s.summary)}</textarea></div>
      <div class="form-field full"><label>${t("stories.summaryEn")}</label><textarea id="s_summaryEn" placeholder="${t("stories.summaryPhEn")}">${V(s.summaryEn)}</textarea></div>
      <div class="form-field full"><label>${t("stories.contentZh")}</label><textarea id="s_content" style="min-height:100px" placeholder="${t("stories.contentPhZh")}">${V(s.content)}</textarea></div>
      <div class="form-field full"><label>${t("stories.contentEn")}</label><textarea id="s_contentEn" style="min-height:100px" placeholder="${t("stories.contentPhEn")}">${V(s.contentEn)}</textarea></div>
      ${editorMediaSectionHtml(t("stories.images"))}
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-action="closeModal">${t("common.cancel")}</button>
      <button class="btn btn-primary" data-action="saveStory" data-arg="${id || ""}">${t("common.save")}</button>
    </div>`);
};

window.saveStory = async function (id) {
  const payload = {
    title: document.getElementById("s_title").value,
    titleEn: document.getElementById("s_titleEn").value,
    company: document.getElementById("s_company").value,
    companyEn: document.getElementById("s_companyEn").value,
    category: document.getElementById("s_category").value,
    featured: document.getElementById("s_featured").value === "1",
    summary: document.getElementById("s_summary").value,
    summaryEn: document.getElementById("s_summaryEn").value,
    content: document.getElementById("s_content").value,
    contentEn: document.getElementById("s_contentEn").value,
    media: editorMedia
  };
  if (!payload.title) { toast(t("common.needTitle"), "error"); return; }
  try {
    if (id) await api("PUT", `/admin/api/stories/${id}`, payload);
    else await api("POST", "/admin/api/stories", payload);
    closeModal(); toast(t("common.saved"), "success"); navigate("stories");
  } catch (e) { toast(e.message, "error"); }
};

window.deleteStory = async function (id) {
  if (!confirm(t("common.confirmStoryDel"))) return;
  try {
    await api("DELETE", `/admin/api/stories/${id}`);
    toast(t("common.deleted"), "success"); navigate("stories");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: OPPORTUNITIES — manage African opportunities
// ════════════════════════════════════════════════════════════════════════
const OPP_CATS = { investment: "catInvestment", trade: "catTrade", joint_venture: "catJV", supply: "catSupply", project: "catProject" };
const oppCat = (c) => t("opps." + (OPP_CATS[c] || "catInvestment"));

views.opportunities = async function (el) {
  const opps = await api("GET", "/admin/api/opportunities");
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">${t("opps.title")}</div>
        <div class="view-subtitle">${t("opps.sub")}</div>
      </div>
      <button class="btn btn-primary" data-action="editOpportunity">${t("opps.newOpp")}</button>
    </div>
    <div class="card">
      ${opps.length ? `
      <table>
        <thead><tr>
          <th>${t("opps.t")}</th><th>${t("opps.country")}</th><th>${t("opps.type")}</th>
          <th>${t("opps.category")}</th><th>${t("opps.status")}</th><th></th>
        </tr></thead>
        <tbody>
          ${opps.map(o => `
            <tr>
              <td><b>${esc(locField(o.title, o.titleEn))}</b><div class="muted" style="font-size:12px">${esc(LANG === "en" ? o.title : o.titleEn || "")}</div></td>
              <td>${esc(locField(o.country, o.countryEn))}</td>
              <td>${o.type === 'demand' ? `<span class="badge badge-gold">${t("opps.typeDemand")}</span>` : `<span class="badge badge-blue">${t("opps.typeOpp")}</span>`}</td>
              <td><span class="badge badge-blue">${oppCat(o.category)}</span></td>
              <td>${o.isPublished ? `<span class="badge badge-green">${t("opps.published")}</span>` : `<span class="badge badge-grey">${t("opps.draft")}</span>`}</td>
              <td class="row-actions">
                <button class="btn btn-sm btn-ink" data-action="editOpportunity" data-arg="${o.id}">${t("opps.edit")}</button>
                <button class="btn btn-sm btn-danger" data-action="deleteOpportunity" data-arg="${o.id}">${t("opps.del")}</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">${ICONS.briefcase}</div>${t("opps.none")}</div>`}
    </div>`;
};

window.editOpportunity = async function (id) {
  // Load existing opportunity if editing; otherwise empty defaults
  let o;
  try {
    o = id
      ? await api("GET", `/admin/api/opportunities/${id}`)
      : { title: "", titleEn: "", country: "", countryEn: "", region: "", type: "opportunity", category: "investment",
          description: "", descriptionEn: "", requirements: "", requirementsEn: "", contactInfo: "",
          budget: "", deadline: "", featured: false, isPublished: true, media: [] };
  } catch (e) { toast(e.message, "error"); return; }
  editorMedia = Array.isArray(o.media) ? o.media.map(m => ({ ...m })) : [];
  const typeSel = (v) => o.type === v ? "selected" : "";
  const catSel = (v) => o.category === v ? "selected" : "";
  const V = (val) => esc(val == null ? "" : val);
  openModal(id ? t("opps.eEdit") : t("opps.eNew"), `
    <div class="form-grid">
      <div class="form-field full"><label>${t("opps.titleZh")}</label><input id="o_title" value="${V(o.title)}" placeholder="${t("opps.titlePhZh")}"/></div>
      <div class="form-field full"><label>${t("opps.titleEn")}</label><input id="o_titleEn" value="${V(o.titleEn)}" placeholder="${t("opps.titlePhEn")}"/></div>
      <div class="form-field"><label>${t("opps.countryZh")}</label><input id="o_country" value="${V(o.country)}" placeholder="${t("opps.countryPhZh")}"/></div>
      <div class="form-field"><label>${t("opps.countryEn")}</label><input id="o_countryEn" value="${V(o.countryEn)}" placeholder="${t("opps.countryPhEn")}"/></div>
      <div class="form-field"><label>${t("opps.type")}</label>
        <select id="o_type">
          <option value="opportunity" ${typeSel("opportunity")}>${t("opps.typeOpp")}</option>
          <option value="demand" ${typeSel("demand")}>${t("opps.typeDemand")}</option>
        </select></div>
      <div class="form-field"><label>${t("opps.category")}</label>
        <select id="o_category">
          <option value="investment" ${catSel("investment")}>${t("opps.catInvestment")}</option>
          <option value="trade" ${catSel("trade")}>${t("opps.catTrade")}</option>
          <option value="joint_venture" ${catSel("joint_venture")}>${t("opps.catJV")}</option>
          <option value="supply" ${catSel("supply")}>${t("opps.catSupply")}</option>
          <option value="project" ${catSel("project")}>${t("opps.catProject")}</option>
        </select></div>
      <div class="form-field full"><label>${t("opps.descZh")}</label><textarea id="o_description" placeholder="${t("opps.descPhZh")}">${V(o.description)}</textarea></div>
      <div class="form-field full"><label>${t("opps.descEn")}</label><textarea id="o_descriptionEn" placeholder="${t("opps.descPhEn")}">${V(o.descriptionEn)}</textarea></div>
      <div class="form-field"><label>${t("opps.reqZh")}</label><input id="o_requirements" value="${V(o.requirements)}" placeholder="${t("opps.reqPhZh")}"/></div>
      <div class="form-field"><label>${t("opps.reqEn")}</label><input id="o_requirements_en" value="${V(o.requirementsEn)}"/></div>
      <div class="form-field"><label>${t("opps.budget")}</label><input id="o_budget" value="${V(o.budget)}" placeholder="${t("opps.budgetPh")}"/></div>
      <div class="form-field"><label>${t("opps.deadline")}</label><input id="o_deadline" value="${V(o.deadline)}" placeholder="2026-12-31"/></div>
      ${editorMediaSectionHtml(t("opps.media"))}
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-action="closeModal">${t("common.cancel")}</button>
      <button class="btn btn-primary" data-action="saveOpportunity" data-arg="${id || ""}">${t("common.save")}</button>
    </div>`);
};

window.saveOpportunity = async function (id) {
  const payload = {
    title: document.getElementById("o_title").value,
    titleEn: document.getElementById("o_titleEn").value,
    country: document.getElementById("o_country").value,
    countryEn: document.getElementById("o_countryEn").value,
    type: document.getElementById("o_type").value,
    category: document.getElementById("o_category").value,
    description: document.getElementById("o_description").value,
    descriptionEn: document.getElementById("o_descriptionEn").value,
    requirements: document.getElementById("o_requirements").value,
    requirementsEn: document.getElementById("o_requirements_en").value,
    budget: document.getElementById("o_budget").value,
    deadline: document.getElementById("o_deadline").value,
    media: editorMedia
  };
  if (!payload.title) { toast(t("common.needTitle"), "error"); return; }
  try {
    if (id) await api("PUT", `/admin/api/opportunities/${id}`, payload);
    else await api("POST", "/admin/api/opportunities", payload);
    closeModal(); toast(t("common.saved"), "success"); navigate("opportunities");
  } catch (e) { toast(e.message, "error"); }
};

window.deleteOpportunity = async function (id) {
  if (!confirm(t("common.confirmOppDel"))) return;
  try {
    await api("DELETE", `/admin/api/opportunities/${id}`);
    toast(t("common.deleted"), "success"); navigate("opportunities");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: INQUIRIES — manage user questions/intents
// ════════════════════════════════════════════════════════════════════════
const inqType = (type) => type === 'story_question' ? t("inquiries.tStoryQ") : type === 'opportunity_intent' ? t("inquiries.tIntent") : t("inquiries.tGeneral");
const inqStatusBadge = (st) =>
  st === 'new' ? `<span class="badge badge-gold">${t("inquiries.stNew")}</span>`
  : st === 'contacted' ? `<span class="badge badge-blue">${t("inquiries.stContacted")}</span>`
  : `<span class="badge badge-grey">${t("inquiries.stClosed")}</span>`;

views.inquiries = async function (el) {
  const inquiries = await api("GET", "/admin/api/inquiries");
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">${t("inquiries.title")}</div>
        <div class="view-subtitle">${t("inquiries.sub")}</div>
      </div>
    </div>
    <div class="card">
      ${inquiries.length ? `
      <table>
        <thead><tr>
          <th>${t("inquiries.type")}</th><th>${t("inquiries.content")}</th><th>${t("inquiries.user")}</th>
          <th>${t("inquiries.status")}</th><th>${t("inquiries.createdAt")}</th><th></th>
        </tr></thead>
        <tbody>
          ${inquiries.map(i => `
            <tr>
              <td>${inqType(i.type)}</td>
              <td><b>${esc(locField(i.targetTitle, i.targetTitleEn))}</b><div class="muted" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis">${esc(i.content || "")}</div></td>
              <td>${esc(i.userName)}<div class="muted" style="font-size:11px">${esc(i.userPhone || "")}</div></td>
              <td>${inqStatusBadge(i.status)}</td>
              <td class="muted">${esc((i.createdAt||"").slice(0,16))}</td>
              <td class="row-actions">
                <button class="btn btn-sm btn-ink" data-action="viewInquiry" data-arg="${i.id}">${t("inquiries.detail")}</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">${ICONS.chat}</div>${t("inquiries.none")}</div>`}
    </div>`;
};

window.viewInquiry = async function (id) {
  const i = await api("GET", `/admin/api/inquiries/${id}`);
  const row = (k, v) => `<div class="detail-row"><div class="detail-k">${k}</div><div class="detail-v">${v}</div></div>`;
  openModal(`${t("inquiries.dTitle")} · ${esc(i.targetTitle || "General")}`, `
    ${row(t("inquiries.type"), inqType(i.type))}
    ${row(t("inquiries.related"), esc(locField(i.targetTitle, i.targetTitleEn)) || "—")}
    ${row(t("inquiries.content"), esc(i.content || "—"))}
    ${row(t("inquiries.user"), esc(i.userName))}
    ${row(t("inquiries.phone"), esc(i.userPhone || "—"))}
    ${row(t("inquiries.company"), esc(i.userCompany || "—"))}
    ${row(t("inquiries.notes"), `<textarea id="i_notes" style="width:100%;min-height:60px;border:1px solid var(--line);border-radius:8px;padding:8px">${esc(i.notes || "")}</textarea>`)}
    ${row(t("inquiries.status"), `<select id="i_status">
        <option value="new" ${i.status === 'new' ? 'selected' : ''}>${t("inquiries.stNew")}</option>
        <option value="contacted" ${i.status === 'contacted' ? 'selected' : ''}>${t("inquiries.stContacted")}</option>
        <option value="closed" ${i.status === 'closed' ? 'selected' : ''}>${t("inquiries.stClosed")}</option>
      </select>`)}
    <div class="modal-foot">
      <button class="btn btn-ghost" data-action="closeModal">${t("common.cancel")}</button>
      <button class="btn btn-primary" data-action="saveInquiry" data-arg="${i.id}">${t("common.save")}</button>
    </div>`);
};

window.saveInquiry = async function (id) {
  try {
    await api("PUT", `/admin/api/inquiries/${id}`, {
      status: document.getElementById("i_status").value,
      notes: document.getElementById("i_notes").value
    });
    closeModal(); toast(t("common.saved"), "success"); navigate("inquiries");
  } catch (e) { toast(e.message, "error"); }
};
