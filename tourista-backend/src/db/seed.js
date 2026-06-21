// src/db/seed.js
// Seeds the database with the default admin + the 3 trips that currently
// live in the mini program's utils/data.js, plus the demo order & lead.
// Safe to run repeatedly (INSERT OR IGNORE / upsert on trips).
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./index.js");

// ── Default admin ────────────────────────────────────────────────────────
const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD || "tourista2026";

const existing = db.prepare("SELECT id FROM admins WHERE username = ?").get(username);
if (!existing) {
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT INTO admins (username, password_hash, role) VALUES (?, ?, 'admin')")
    .run(username, hash);
  console.log(`✓ Admin created: ${username} / ${password}  (change after first login)`);
} else {
  console.log(`• Admin '${username}' already exists — skipped`);
}

// ── Trips (mirror of mini program utils/data.js) ──────────────────────────
const TRIPS = [
  {
    id: "zw", flag: "ZW", country: "津巴布韦", country_en: "Zimbabwe",
    title: "津巴布韦商务考察团 · 7天", title_en: "Zimbabwe Business Tour · 7 Days",
    short_title: "津巴布韦商务考察团", short_title_en: "Zimbabwe Business Tour",
    days: 7, nights: 6, depart: "2026.07.19", depart_short: "07.19出发", date_range: "07.19—07.25",
    structure: "4天商务 + 1天休闲", structure_en: "4 Business Days + 1 Leisure Day",
    lead: "全程领导接待 · 津籍合伙人赵蓝狮带队", lead_en: "Full leadership reception · Led by Zimbabwe partner Zhao Lanshi",
    gradient: "linear-gradient(120deg, #2E5E1F, #C24214)",
    member_price: 28000, normal_price: 38000, deposit: 8000, seats_total: 15, seats_left: 6,
    status: "报名中", status_en: "Registering", status_tag: "tag-terra",
    seat_tag: "仅剩6席", seat_tag_en: "Only 6 seats left",
    highlights: ["政府接待", "矿业考察", "维多利亚瀑布"],
    highlights_en: ["Government Reception", "Mining Inspection", "Victoria Falls"],
    summary: "ZIDA投资署 · STANBIC银行 · 黄金矿区 · 大津巴布韦遗址",
    summary_en: "ZIDA Investment Agency · STANBIC Bank · Gold Mining Area · Great Zimbabwe Ruins",
    includes: ["国际机票（往返）", "全程四星住宿", "全程餐饮 + 商务晚宴", "本地交通 + 翻译", "全部领导接待协调", "签证协助（落地签 $55 自理）"],
    includes_en: ["International flights (round trip)", "4-star accommodation throughout", "All meals + business dinner", "Local transport + translator", "All leadership reception coordination", "Visa assistance (visa on arrival $55 self-paid)"],
    itinerary: [
      {
        day: 1, vip: false, leisure: false,
        title: "抵达哈拉雷 · 欢迎晚宴", titleEn: "Arrive in Harare · Welcome Dinner",
        desc: "本地合伙人接待 · 入住 Meikles Hotel", descEn: "Local partner reception · Check in at Meikles Hotel",
        schedule: [
          { time: "14:00", title: "抵达哈拉雷国际机场", titleEn: "Arrive at Harare International Airport", desc: "专车接机，办理落地签", descEn: "Private pickup, visa on arrival processing" },
          { time: "15:30", title: "前往市区酒店", titleEn: "Transfer to city hotel", desc: "车程约30分钟", descEn: "Approx. 30 min drive" },
          { time: "16:30", title: "入住 Meikles Hotel", titleEn: "Check in at Meikles Hotel", desc: "津巴布韦最古老五星级酒店", descEn: "Zimbabwe's oldest 5-star hotel" },
          { time: "18:00", title: "欢迎晚宴", titleEn: "Welcome Dinner", desc: "本地合伙人赵蓝狮主持", descEn: "Hosted by local partner Zhao Lanshi" }
        ],
        activities: [
          { title: "机场接机", titleEn: "Airport Pickup", desc: "VIP通道快速通关", descEn: "VIP fast-track clearance", duration: "1小时", location: "哈拉雷机场" },
          { title: "酒店休息", titleEn: "Hotel Rest", desc: "调整时差，准备次日行程", descEn: "Adjust to time zone, prepare for next day", duration: "2小时", location: "Meikles Hotel" }
        ],
        meals: [
          { type: "晚餐", venue: "Meikles Hotel La Fontaine", venueEn: "Meikles Hotel La Fontaine", cuisine: "西式自助 + 津巴布韦特色菜", notes: "欢迎晚宴，含酒水" }
        ],
        accommodation: {
          hotel: "Meikles Hotel", hotelEn: "Meikles Hotel",
          rating: 5, roomType: "豪华大床房", roomTypeEn: "Deluxe King Room",
          amenities: "WiFi、空调、迷你吧、保险箱",
          address: "Jason Moyo Ave, Harare", addressEn: "Jason Moyo Ave, Harare"
        },
        transport: [
          { type: "专车接机", detail: "商务车队，含翻译陪同" },
          { type: "市区接送", detail: "酒店至餐厅步行可达" }
        ],
        tips: "落地签费用$55需自理，建议准备美元现金。酒店可兑换当地货币，汇率较优。",
        tipsEn: "Visa on arrival $55 self-paid, prepare USD cash. Hotel offers favorable exchange rates for local currency."
      },
      {
        day: 2, vip: true, leisure: false,
        title: "政府对接日", titleEn: "Government Meeting Day",
        desc: "ZIDA 投资署官员 · STANBIC 银行领导会面", descEn: "ZIDA Investment Agency officials · STANBIC Bank leadership meeting",
        schedule: [
          { time: "08:00", title: "酒店早餐", titleEn: "Hotel Breakfast", desc: "自助早餐", descEn: "Buffet breakfast" },
          { time: "09:00", title: "前往ZIDA投资署", titleEn: "Depart for ZIDA", desc: "车程约15分钟", descEn: "Approx. 15 min drive" },
          { time: "09:30", title: "ZIDA投资署会议", titleEn: "ZIDA Meeting", desc: "投资政策解读、项目对接", descEn: "Investment policy briefing, project matching" },
          { time: "12:00", title: "商务午餐", titleEn: "Business Lunch", desc: "与ZIDA官员共进午餐", descEn: "Lunch with ZIDA officials" },
          { time: "14:00", title: "STANBIC银行会议", titleEn: "STANBIC Bank Meeting", desc: "银行开户、融资方案", descEn: "Bank account opening, financing options" },
          { time: "17:00", title: "返回酒店", titleEn: "Return to Hotel", desc: "整理会议资料", descEn: "Organize meeting materials" },
          { time: "19:00", title: "商务晚宴", titleEn: "Business Dinner", desc: "与本地企业家交流", descEn: "Networking with local entrepreneurs" }
        ],
        meetings: [
          {
            company: "津巴布韦投资发展署 (ZIDA)", companyEn: "Zimbabwe Investment and Development Agency",
            type: "government",
            attendees: "投资署署长、项目对接专员、政策顾问",
            attendeesEn: "CEO, Project Matching Specialist, Policy Advisor",
            purpose: "了解津巴布韦投资政策、优先发展领域、税收优惠",
            purposeEn: "Understand Zimbabwe investment policies, priority sectors, tax incentives",
            agenda: "1. 国家投资政策介绍\n2. 优先投资领域说明\n3. 税收优惠政策解读\n4. 项目对接洽谈",
            agendaEn: "1. National investment policy overview\n2. Priority investment sectors\n3. Tax incentive briefing\n4. Project matching discussion",
            outcome: "获取投资许可证申请表、建立官方联系渠道",
            outcomeEn: "Receive investment license application forms, establish official contacts",
            preparation: "准备公司介绍材料、投资意向书草稿、名片",
            preparationEn: "Prepare company profile, draft LOI, business cards"
          },
          {
            company: "斯坦比克银行 (STANBIC)", companyEn: "STANBIC Bank Zimbabwe",
            type: "business",
            attendees: "企业银行部总经理、国际业务专员",
            attendeesEn: "Head of Corporate Banking, International Business Specialist",
            purpose: "了解银行开户流程、跨境汇款、企业融资方案",
            purposeEn: "Learn about account opening, cross-border transfers, corporate financing",
            agenda: "1. 企业账户开户流程\n2. 跨境汇款服务介绍\n3. 贸易融资产品\n4. 信用证业务",
            agendaEn: "1. Corporate account opening process\n2. Cross-border transfer services\n3. Trade finance products\n4. Letter of credit services",
            outcome: "获取开户所需材料清单、预约开户时间",
            outcomeEn: "Receive account opening checklist, schedule account opening",
            preparation: "准备公司注册文件、董事身份证明、业务计划书",
            preparationEn: "Prepare company registration docs, director IDs, business plan"
          }
        ],
        activities: [
          { title: "ZIDA投资署参观", titleEn: "ZIDA Office Visit", desc: "了解投资审批流程", descEn: "Learn about investment approval process", duration: "2.5小时", location: "ZIDA总部" },
          { title: "STANBIC银行洽谈", titleEn: "STANBIC Bank Meeting", desc: "银行业务对接", descEn: "Banking services discussion", duration: "2小时", location: "STANBIC总部" }
        ],
        meals: [
          { type: "早餐", venue: "Meikles Hotel", venueEn: "Meikles Hotel", cuisine: "国际自助", notes: "酒店含早" },
          { type: "午餐", venue: "ZIDA餐厅", venueEn: "ZIDA Cafeteria", cuisine: "津巴布韦特色", notes: "与官员共进" },
          { type: "晚餐", venue: "Amanzi Restaurant", venueEn: "Amanzi Restaurant", cuisine: "海鲜烧烤", notes: "商务晚宴" }
        ],
        accommodation: {
          hotel: "Meikles Hotel", hotelEn: "Meikles Hotel",
          rating: 5, roomType: "豪华大床房", roomTypeEn: "Deluxe King Room",
          amenities: "WiFi、空调、迷你吧、保险箱",
          address: "Jason Moyo Ave, Harare", addressEn: "Jason Moyo Ave, Harare"
        },
        transport: [
          { type: "商务车队", detail: "全天专车服务，含翻译" },
          { type: "市内接送", detail: "酒店至会议地点" }
        ],
        tips: "政府会议着装要求正装。建议提前准备公司介绍PPT和投资意向书。会议期间可拍照留念。",
        tipsEn: "Formal attire required for government meetings. Prepare company presentation and LOI in advance. Photos allowed during meetings."
      },
      {
        day: 3, vip: true, leisure: false,
        title: "矿业考察", titleEn: "Mining Inspection",
        desc: "黄金矿区矿主会面 · 马佐伊处女矿实地", descEn: "Gold mine owner meeting · Mazowe Virgin Mine site visit",
        schedule: [
          { time: "06:00", title: "早起出发", titleEn: "Early Departure", desc: "前往马佐伊矿区", descEn: "Depart for Mazowe mining area" },
          { time: "08:00", title: "抵达矿区", titleEn: "Arrive at Mine", desc: "矿区安全培训", descEn: "Safety briefing" },
          { time: "09:00", title: "矿区实地考察", titleEn: "Mine Site Inspection", desc: "参观采矿作业", descEn: "Tour mining operations" },
          { time: "12:00", title: "矿区午餐", titleEn: "Mine Lunch", desc: "与矿主交流", descEn: "Lunch with mine owner" },
          { time: "14:00", title: "商务洽谈", titleEn: "Business Discussion", desc: "合作模式探讨", descEn: "Partnership discussion" },
          { time: "17:00", title: "返回哈拉雷", titleEn: "Return to Harare", desc: "车程约2小时", descEn: "Approx. 2 hour drive" }
        ],
        meetings: [
          {
            company: "马佐伊处女矿", companyEn: "Mazowe Virgin Mine",
            type: "business",
            attendees: "矿主、技术总监、运营经理",
            attendeesEn: "Mine Owner, Technical Director, Operations Manager",
            purpose: "了解金矿开采技术、产量、合作机会",
            purposeEn: "Learn about gold mining technology, production, partnership opportunities",
            agenda: "1. 矿区概况介绍\n2. 实地参观\n3. 技术交流\n4. 合作洽谈",
            agendaEn: "1. Mine overview\n2. Site tour\n3. Technical exchange\n4. Partnership discussion",
            outcome: "建立联系，获取矿区数据报告",
            outcomeEn: "Establish contact, receive mine data report",
            preparation: "准备矿业投资相关问题清单，穿戴适合矿区的服装和鞋子",
            preparationEn: "Prepare mining investment questions, wear appropriate clothing and shoes"
          }
        ],
        activities: [
          { title: "矿区安全培训", titleEn: "Safety Briefing", desc: "矿区安全须知", descEn: "Mine safety guidelines", duration: "30分钟", location: "矿区办公室" },
          { title: "井下参观", titleEn: "Underground Tour", desc: "参观采矿作业面", descEn: "Visit mining face", duration: "2小时", location: "矿井" },
          { title: "选矿厂参观", titleEn: "Processing Plant Tour", desc: "了解黄金提炼流程", descEn: "Learn about gold extraction process", duration: "1小时", location: "选矿厂" }
        ],
        meals: [
          { type: "早餐", venue: "酒店打包早餐", venueEn: "Packed Breakfast", cuisine: "简餐", notes: "早起出发" },
          { type: "午餐", venue: "矿区食堂", venueEn: "Mine Canteen", cuisine: "本地特色", notes: "与矿主共进" },
          { type: "晚餐", venue: "Meikles Hotel", venueEn: "Meikles Hotel", cuisine: "国际自助", notes: "返回后用餐" }
        ],
        accommodation: {
          hotel: "Meikles Hotel", hotelEn: "Meikles Hotel",
          rating: 5, roomType: "豪华大床房", roomTypeEn: "Deluxe King Room",
          amenities: "WiFi、空调、迷你吧、保险箱",
          address: "Jason Moyo Ave, Harare", addressEn: "Jason Moyo Ave, Harare"
        },
        transport: [
          { type: "越野车队", detail: "四驱车，适合矿区道路" },
          { type: "矿区交通", detail: "矿区专用车辆" }
        ],
        tips: "矿区道路颠簸，建议穿着舒适的运动鞋。矿区有安全帽和反光背心提供。建议携带防晒霜和驱蚊剂。",
        tipsEn: "Rough terrain, wear comfortable sports shoes. Hard hats and safety vests provided. Bring sunscreen and insect repellent."
      },
      {
        day: 4, vip: false, leisure: false,
        title: "旅游运营 & 物流对接", titleEn: "Tourism & Logistics Meeting",
        desc: "旅游运营商 · 酒店集团 · 贝特桥跨境物流", descEn: "Tourism operators · Hotel groups · Beitbridge cross-border logistics",
        schedule: [
          { time: "09:00", title: "旅游运营商会议", titleEn: "Tourism Operator Meeting", desc: "旅游产品合作", descEn: "Tourism product partnership" },
          { time: "11:00", title: "酒店集团洽谈", titleEn: "Hotel Group Meeting", desc: "酒店预订合作", descEn: "Hotel booking partnership" },
          { time: "12:30", title: "商务午餐", titleEn: "Business Lunch", desc: "本地特色餐厅", descEn: "Local specialty restaurant" },
          { time: "14:00", title: "贝特桥物流会议", titleEn: "Beitbridge Logistics Meeting", desc: "跨境物流方案", descEn: "Cross-border logistics solutions" },
          { time: "16:00", title: "自由活动", titleEn: "Free Time", desc: "市区购物或休息", descEn: "City shopping or rest" }
        ],
        meetings: [
          {
            company: "津巴布韦旅游运营商协会", companyEn: "Zimbabwe Tourism Operators Association",
            type: "business",
            attendees: "协会主席、会员企业代表",
            attendeesEn: "Association Chairman, Member Representatives",
            purpose: "了解旅游产品开发、市场推广合作",
            purposeEn: "Learn about tourism product development, marketing partnership",
            agenda: "1. 津巴布韦旅游资源介绍\n2. 旅游产品合作模式\n3. 市场推广计划",
            agendaEn: "1. Zimbabwe tourism resources\n2. Tourism product partnership models\n3. Marketing plans",
            outcome: "建立合作联系，获取旅游资源清单",
            outcomeEn: "Establish partnership, receive tourism resource list"
          },
          {
            company: "贝特桥跨境物流", companyEn: "Beitbridge Cross-border Logistics",
            type: "business",
            attendees: "物流公司总经理、清关专员",
            attendeesEn: "Logistics Company GM, Customs Specialist",
            purpose: "了解中津跨境物流流程、费用、时效",
            purposeEn: "Learn about China-Zimbabwe logistics process, costs, timelines",
            agenda: "1. 跨境运输路线介绍\n2. 清关流程说明\n3. 费用结构\n4. 合作模式",
            agendaEn: "1. Cross-border routes\n2. Customs clearance process\n3. Cost structure\n4. Partnership models",
            outcome: "获取物流报价单，预约试运",
            outcomeEn: "Receive logistics quotation, schedule trial shipment"
          }
        ],
        activities: [
          { title: "市区观光", titleEn: "City Tour", desc: "哈拉雷市区景点", descEn: "Harare city attractions", duration: "2小时", location: "市区" }
        ],
        meals: [
          { type: "早餐", venue: "Meikles Hotel", venueEn: "Meikles Hotel", cuisine: "国际自助", notes: "酒店含早" },
          { type: "午餐", venue: "Victoria 22 Restaurant", venueEn: "Victoria 22 Restaurant", cuisine: "津巴布韦特色", notes: "商务午餐" },
          { type: "晚餐", venue: "Meikles Hotel", venueEn: "Meikles Hotel", cuisine: "国际自助", notes: "自由安排" }
        ],
        accommodation: {
          hotel: "Meikles Hotel", hotelEn: "Meikles Hotel",
          rating: 5, roomType: "豪华大床房", roomTypeEn: "Deluxe King Room",
          amenities: "WiFi、空调、迷你吧、保险箱",
          address: "Jason Moyo Ave, Harare", addressEn: "Jason Moyo Ave, Harare"
        },
        transport: [
          { type: "商务车队", detail: "全天专车服务" }
        ],
        tips: "下午自由时间可前往市区购物中心购买纪念品。建议兑换一些当地货币用于小额消费。",
        tipsEn: "Free time in afternoon for shopping at city malls. Exchange some local currency for small purchases."
      },
      {
        day: 5, vip: true, leisure: false,
        title: "布拉瓦约 & 马斯温戈", titleEn: "Bulawayo & Masvingo",
        desc: "工业商会 Mr Moyo · 大津巴布韦遗址 NMMZ", descEn: "Chamber of Industry Mr Moyo · Great Zimbabwe Ruins NMMZ",
        schedule: [
          { time: "06:00", title: "出发前往布拉瓦约", titleEn: "Depart for Bulawayo", desc: "车程约4.5小时", descEn: "Approx. 4.5 hour drive" },
          { time: "11:00", title: "抵达布拉瓦约", titleEn: "Arrive in Bulawayo", desc: "工业商会会议", descEn: "Chamber of Industry meeting" },
          { time: "13:00", title: "午餐", titleEn: "Lunch", desc: "本地餐厅", descEn: "Local restaurant" },
          { time: "14:00", title: "前往马斯温戈", titleEn: "Depart for Masvingo", desc: "车程约3小时", descEn: "Approx. 3 hour drive" },
          { time: "17:00", title: "大津巴布韦遗址", titleEn: "Great Zimbabwe Ruins", desc: "世界文化遗产参观", descEn: "UNESCO World Heritage site tour" },
          { time: "19:00", title: "返回哈拉雷", titleEn: "Return to Harare", desc: "车程约3小时", descEn: "Approx. 3 hour drive" }
        ],
        meetings: [
          {
            company: "布拉瓦约工业商会", companyEn: "Bulawayo Chamber of Industry",
            type: "business",
            attendees: "商会主席 Mr Moyo、会员企业代表",
            attendeesEn: "Chamber Chairman Mr Moyo, Member Representatives",
            purpose: "了解布拉瓦约工业发展、投资机会",
            purposeEn: "Learn about Bulawayo industrial development, investment opportunities",
            agenda: "1. 布拉瓦约工业概况\n2. 重点发展行业\n3. 投资优惠政策\n4. 企业对接",
            agendaEn: "1. Bulawayo industry overview\n2. Priority sectors\n3. Investment incentives\n4. Business matching",
            outcome: "建立商会联系，获取投资指南",
            outcomeEn: "Establish chamber contact, receive investment guide"
          }
        ],
        activities: [
          { title: "大津巴布韦遗址参观", titleEn: "Great Zimbabwe Ruins Tour", desc: "非洲最大的古代石建筑群", descEn: "Largest ancient stone structure in Africa", duration: "2小时", location: "马斯温戈" }
        ],
        meals: [
          { type: "早餐", venue: "酒店打包早餐", venueEn: "Packed Breakfast", cuisine: "简餐", notes: "早起出发" },
          { type: "午餐", venue: "布拉瓦约餐厅", venueEn: "Bulawayo Restaurant", cuisine: "本地特色", notes: "商务午餐" },
          { type: "晚餐", venue: "途中简餐", venueEn: "Roadside Dinner", cuisine: "简餐", notes: "返回途中" }
        ],
        accommodation: {
          hotel: "Meikles Hotel", hotelEn: "Meikles Hotel",
          rating: 5, roomType: "豪华大床房", roomTypeEn: "Deluxe King Room",
          amenities: "WiFi、空调、迷你吧、保险箱",
          address: "Jason Moyo Ave, Harare", addressEn: "Jason Moyo Ave, Harare"
        },
        transport: [
          { type: "长途车队", detail: "全天专车，含午餐和休息" }
        ],
        tips: "今日行程较长，建议穿着舒适的衣物。大津巴布韦遗址是世界文化遗产，值得拍照留念。",
        tipsEn: "Long travel day, wear comfortable clothing. Great Zimbabwe is a UNESCO site, great for photos."
      },
      {
        day: 6, vip: false, leisure: true,
        title: "维多利亚瀑布 · 休闲体验日", titleEn: "Victoria Falls · Leisure Day",
        desc: "直升机俯瞰 · Chobe 国家公园 · 日落游轮 · 剧院", descEn: "Helicopter view · Chobe National Park · Sunset cruise · Theatre",
        schedule: [
          { time: "07:00", title: "飞往维多利亚瀑布", titleEn: "Fly to Victoria Falls", desc: "国内航班", descEn: "Domestic flight" },
          { time: "09:00", title: "维多利亚瀑布参观", titleEn: "Victoria Falls Tour", desc: "世界三大瀑布之一", descEn: "One of the world's three largest waterfalls" },
          { time: "11:00", title: "直升机俯瞰", titleEn: "Helicopter Tour", desc: "空中俯瞰瀑布全景", descEn: "Aerial view of the falls" },
          { time: "13:00", title: "午餐", titleEn: "Lunch", desc: "瀑布景区餐厅", descEn: "Falls area restaurant" },
          { time: "14:30", title: "Chobe国家公园", titleEn: "Chobe National Park", desc: "博茨瓦纳跨境游猎", descEn: "Botswana cross-border safari" },
          { time: "18:00", title: "日落游轮", titleEn: "Sunset Cruise", desc: "赞比西河游船", descEn: "Zambezi River cruise" },
          { time: "20:00", title: "非洲鼓剧场", titleEn: "African Drum Show", desc: "传统文化表演", descEn: "Traditional cultural performance" }
        ],
        activities: [
          { title: "维多利亚瀑布参观", titleEn: "Victoria Falls Visit", desc: "徒步穿越雨林", descEn: "Walk through rainforest", duration: "2小时", location: "瀑布景区" },
          { title: "直升机观光", titleEn: "Helicopter Tour", desc: "15分钟空中游览", descEn: "15-minute aerial tour", duration: "15分钟", location: "维多利亚瀑布机场" },
          { title: "Chobe游猎", titleEn: "Chobe Safari", desc: "越野车游猎+游船", descEn: "4x4 safari + boat cruise", duration: "3小时", location: "Chobe国家公园" },
          { title: "日落游轮", titleEn: "Sunset Cruise", desc: "赞比西河日落", descEn: "Zambezi sunset", duration: "2小时", location: "赞比西河" }
        ],
        meals: [
          { type: "早餐", venue: "Meikles Hotel", venueEn: "Meikles Hotel", cuisine: "国际自助", notes: "早起用餐" },
          { type: "午餐", venue: "Victoria Falls Restaurant", venueEn: "Victoria Falls Restaurant", cuisine: "国际自助", notes: "景区餐厅" },
          { type: "晚餐", venue: "Boma Restaurant", venueEn: "Boma Restaurant", cuisine: "非洲烧烤", notes: "传统表演餐厅" }
        ],
        accommodation: {
          hotel: "Victoria Falls Hotel", hotelEn: "Victoria Falls Hotel",
          rating: 5, roomType: "瀑布景观房", roomTypeEn: "Falls View Room",
          amenities: "WiFi、空调、迷你吧、阳台",
          address: "Zambezi Drive, Victoria Falls", addressEn: "Zambezi Drive, Victoria Falls"
        },
        transport: [
          { type: "国内航班", detail: "哈拉雷至维多利亚瀑布" },
          { type: "景区专车", detail: "全天接送服务" }
        ],
        tips: "瀑布水雾很大，建议携带雨衣或防水外套。直升机和游猎项目需提前预约。晚上剧场有互动环节，可参与非洲鼓表演。",
        tipsEn: "Heavy mist at falls, bring raincoat or waterproof jacket. Helicopter and safari require advance booking. Evening show has interactive drumming."
      },
      {
        day: 7, vip: false, leisure: false,
        title: "收官总结 → 飞往德班", titleEn: "Summary → Fly to Durban",
        desc: "津巴布韦阶段复盘 · 意向书签署 · 赴南非", descEn: "Zimbabwe phase review · LOI signing · Depart for South Africa",
        schedule: [
          { time: "08:00", title: "酒店早餐", titleEn: "Hotel Breakfast", desc: "最后整理行李", descEn: "Final packing" },
          { time: "09:00", title: "行程复盘会议", titleEn: "Trip Review Meeting", desc: "总结津巴布韦阶段成果", descEn: "Summarize Zimbabwe phase outcomes" },
          { time: "10:30", title: "意向书签署", titleEn: "LOI Signing", desc: "与合作伙伴签署意向书", descEn: "Sign LOI with partners" },
          { time: "12:00", title: "告别午餐", titleEn: "Farewell Lunch", desc: "与本地合作伙伴告别", descEn: "Farewell with local partners" },
          { time: "14:00", title: "前往机场", titleEn: "Depart for Airport", desc: "飞往南非德班", descEn: "Fly to Durban, South Africa" }
        ],
        activities: [
          { title: "行程总结", titleEn: "Trip Summary", desc: "整理会议资料和名片", descEn: "Organize meeting materials and business cards", duration: "1小时", location: "酒店会议室" },
          { title: "意向书签署", titleEn: "LOI Signing", desc: "正式签署合作意向书", descEn: "Formal LOI signing ceremony", duration: "1小时", location: "酒店会议室" }
        ],
        meals: [
          { type: "早餐", venue: "Victoria Falls Hotel", venueEn: "Victoria Falls Hotel", cuisine: "国际自助", notes: "酒店含早" },
          { type: "午餐", venue: "Victoria Falls Hotel", venueEn: "Victoria Falls Hotel", cuisine: "欢送午宴", notes: "与合作伙伴" }
        ],
        transport: [
          { type: "专车送机", detail: "维多利亚瀑布机场" },
          { type: "国际航班", detail: "飞往南非德班" }
        ],
        tips: "请确认所有文件和资料已整理完毕。建议提前到达机场办理登机手续。南非段行程即将开始。",
        tipsEn: "Confirm all documents are organized. Arrive early at airport. South Africa phase begins soon."
      }
    ],
    sort_order: 1
  },
  {
    id: "sa", flag: "ZA", country: "南非", country_en: "South Africa",
    title: "南非商务考察团 · 5天", title_en: "South Africa Business Tour · 5 Days",
    short_title: "南非商务考察团", short_title_en: "South Africa Business Tour",
    days: 5, nights: 4, depart: "2026.07.26", depart_short: "07.26出发", date_range: "07.26—07.30",
    structure: "4天商务 + 1天休闲", structure_en: "4 Business Days + 1 Leisure Day",
    lead: "德班港物流 · 中华总商会 · 展厅选址", lead_en: "Durban Port Logistics · Chinese Chamber of Commerce · Showroom Selection",
    gradient: "linear-gradient(120deg, #0E4D3C, #1B6E9C)",
    member_price: 12800, normal_price: 16800, deposit: 4000, seats_total: 15, seats_left: 12,
    status: "报名中", status_en: "Registering", status_tag: "tag-green",
    seat_tag: "报名中", seat_tag_en: "Registering",
    highlights: ["德班港口", "中华总商会", "桌山"],
    highlights_en: ["Durban Port", "Chinese Chamber of Commerce", "Table Mountain"],
    summary: "德班港物流 · 约堡批发市场 · 展厅选址 · 开普敦",
    summary_en: "Durban Port Logistics · Johannesburg Wholesale Market · Showroom Selection · Cape Town",
    includes: ["国际机票（往返）", "全程四星住宿", "全程餐饮 + 商务晚宴", "本地交通 + 翻译", "全部领导接待协调", "签证协助（需提前办理）"],
    includes_en: ["International flights (round trip)", "4-star accommodation throughout", "All meals + business dinner", "Local transport + translator", "All leadership reception coordination", "Visa assistance (apply in advance)"],
    itinerary: [
      { day: 1, vip: true, leisure: false, title: "德班 · 港口与市场考察", titleEn: "Durban · Port & Market Inspection", desc: "港口领导接待 · uShaka 海洋世界 · 维多利亚街市场", descEn: "Port leadership reception · uShaka Marine World · Victoria Street Market" },
      { day: 2, vip: true, leisure: false, title: "约翰内斯堡 · 贸易对接", titleEn: "Johannesburg · Trade Matching", desc: "批发市场调研 · 南非中华总商会会长会面", descEn: "Wholesale market research · Meeting with Chinese Chamber of Commerce President" },
      { day: 3, vip: false, leisure: false, title: "约堡 · 展示厅选址 & 文化", titleEn: "Johannesburg · Showroom & Culture", desc: "展示厅选址 · 种族隔离博物馆 · 黄金城", descEn: "Showroom selection · Apartheid Museum · Gold Reef City" },
      { day: 4, vip: true, leisure: false, title: "开普敦 · 商务对接日", titleEn: "Cape Town · Business Meeting Day", desc: "展示厅选址 · 华人商会晚宴 · 投资环境", descEn: "Showroom selection · Chinese Chamber dinner · Investment environment" },
      { day: 5, vip: false, leisure: true, title: "开普敦 · 休闲体验 & 返程", titleEn: "Cape Town · Leisure & Departure", desc: "桌山缆车 · 罗本岛游船 · V&A 海滨 · 晚间返程", descEn: "Table Mountain cable car · Robben Island cruise · V&A Waterfront · Evening departure" }
    ],
    sort_order: 2
  },
  {
    id: "both", flag: "ZW+ZA", country: "双国联报", country_en: "Both Countries",
    title: "双国联报 · 津巴布韦 + 南非 12天", title_en: "Dual Country Tour · Zimbabwe + South Africa 12 Days",
    short_title: "津巴布韦 + 南非 12天", short_title_en: "Zimbabwe + South Africa 12 Days",
    days: 12, nights: 11, depart: "2026.07.19", depart_short: "07.19出发", date_range: "07.19—07.30",
    structure: "一次走完两国", structure_en: "Complete both countries in one trip",
    lead: "联报立省 ¥4,000 · 一次走完两国", lead_en: "Save ¥4,000 with dual booking · Complete both countries in one trip",
    gradient: "linear-gradient(120deg, #C24214, #0E4D3C)",
    member_price: 36800, normal_price: 50800, deposit: 10000, seats_total: 12, seats_left: 8,
    status: "报名中", status_en: "Registering", status_tag: "tag-gold",
    seat_tag: "联报立省¥4,000", seat_tag_en: "Save ¥4,000 with dual booking",
    highlights: ["两国全覆盖", "政府接待", "立省¥4,000"],
    highlights_en: ["Both Countries", "Government Reception", "Save ¥4,000"],
    summary: "津巴布韦10天 + 南非5天完整行程，联报立省 ¥4,000",
    summary_en: "Complete Zimbabwe 10 days + South Africa 5 days itinerary, save ¥4,000 with dual booking",
    includes: ["两国国际机票 + 内陆联程", "全程四星住宿", "全程餐饮 + 商务晚宴", "本地交通 + 全程翻译", "两国全部领导接待协调", "签证协助"],
    includes_en: ["Both countries international flights + domestic connections", "4-star accommodation throughout", "All meals + business dinner", "Local transport + full-time translator", "Both countries leadership reception coordination", "Visa assistance"],
    itinerary: [
      { day: 1, vip: false, leisure: false, title: "ZW 抵达哈拉雷 · 欢迎晚宴", titleEn: "ZW Arrive in Harare · Welcome Dinner", desc: "津巴布韦段开始 · 本地合伙人接待", descEn: "Zimbabwe phase begins · Local partner reception" },
      { day: 2, vip: true, leisure: false, title: "ZW 政府对接日", titleEn: "ZW Government Meeting Day", desc: "ZIDA 投资署 · STANBIC 银行", descEn: "ZIDA Investment Agency · STANBIC Bank" },
      { day: 3, vip: true, leisure: false, title: "ZW 矿业考察", titleEn: "ZW Mining Inspection", desc: "黄金矿区 · 马佐伊处女矿", descEn: "Gold mining area · Mazowe Virgin Mine" },
      { day: 6, vip: false, leisure: true, title: "ZW 维多利亚瀑布 · 休闲日", titleEn: "ZW Victoria Falls · Leisure Day", desc: "直升机 · Chobe · 日落游轮", descEn: "Helicopter · Chobe · Sunset cruise" },
      { day: 8, vip: true, leisure: false, title: "ZA 德班港口考察", titleEn: "ZA Durban Port Inspection", desc: "南非段开始 · 港口物流对接", descEn: "South Africa phase begins · Port logistics meeting" },
      { day: 9, vip: true, leisure: false, title: "ZA 约堡贸易对接", titleEn: "ZA Johannesburg Trade Matching", desc: "批发市场 · 中华总商会", descEn: "Wholesale market · Chinese Chamber of Commerce" },
      { day: 12, vip: false, leisure: true, title: "ZA 开普敦休闲 & 返程", titleEn: "ZA Cape Town Leisure & Departure", desc: "桌山 · 罗本岛 · V&A 海滨", descEn: "Table Mountain · Robben Island · V&A Waterfront" }
    ],
    sort_order: 3
  }
];

const upsertTrip = db.prepare(`
  INSERT INTO trips (
    id, flag, country, country_en, title, title_en, short_title, short_title_en,
    days, nights, depart, depart_short, date_range, structure, structure_en,
    lead, lead_en, gradient, member_price, normal_price, deposit, seats_total, seats_left,
    status, status_en, status_tag, seat_tag, seat_tag_en,
    highlights, highlights_en, summary, summary_en, includes, includes_en, itinerary,
    is_published, sort_order, updated_at
  ) VALUES (
    @id, @flag, @country, @country_en, @title, @title_en, @short_title, @short_title_en,
    @days, @nights, @depart, @depart_short, @date_range, @structure, @structure_en,
    @lead, @lead_en, @gradient, @member_price, @normal_price, @deposit, @seats_total, @seats_left,
    @status, @status_en, @status_tag, @seat_tag, @seat_tag_en,
    @highlights, @highlights_en, @summary, @summary_en, @includes, @includes_en, @itinerary,
    1, @sort_order, datetime('now')
  )
  ON CONFLICT(id) DO UPDATE SET
    member_price=@member_price, normal_price=@normal_price, deposit=@deposit,
    seats_total=@seats_total, seats_left=@seats_left, status=@status, status_en=@status_en,
    updated_at=datetime('now')
`);

for (const t of TRIPS) {
  upsertTrip.run({
    ...t,
    highlights: JSON.stringify(t.highlights),
    highlights_en: JSON.stringify(t.highlights_en),
    includes: JSON.stringify(t.includes),
    includes_en: JSON.stringify(t.includes_en),
    itinerary: JSON.stringify(t.itinerary)
  });
}
console.log(`✓ Seeded ${TRIPS.length} trips`);

// ── Demo order + lead (only if tables empty) ──────────────────────────────
const orderCount = db.prepare("SELECT COUNT(*) c FROM orders").get().c;
if (orderCount === 0) {
  db.prepare(`
    INSERT INTO orders (id, trip_id, title, title_en, customer_name, passport, phone, company,
      depart, city, city_en, status, status_en, total_price, deposit, deposit_paid, balance, balance_due, checklist)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    "T20260719", "zw", "津巴布韦商务考察团 · 7天", "Zimbabwe Business Tour · 7 Days",
    "王建国", "E12345678", "13800002233", "上海科技创新有限公司",
    "2026.07.19", "哈拉雷", "Harare", "已确认", "Confirmed",
    28000, 8000, 1, 20000, "2026.07.05",
    JSON.stringify([
      { label: "护照有效期6个月以上", labelEn: "Passport valid for 6+ months", done: true },
      { label: "黄热病疫苗证书", labelEn: "Yellow fever vaccine certificate", done: true },
      { label: "落地签材料（照片+行程）", labelEn: "Visa on arrival materials (photo + itinerary)", done: false },
      { label: "美元现金准备建议", labelEn: "USD cash recommended", done: false, info: true }
    ])
  );
  console.log("✓ Seeded 1 demo order");
}

const apptCount = db.prepare("SELECT COUNT(*) c FROM partner_apps").get().c;
if (apptCount === 0) {
  db.prepare(`
    INSERT INTO partner_apps (id, company, company_en, contact, wechat, phone,
      categories, categories_en, modes, modes_en, markets, markets_en, status, status_en)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    "P20260610", "上海科技创新有限公司", "Shanghai Tech Innovation Co., Ltd.", "李总 · 外贸部总监", "li_wechat_id", "13900001122",
    JSON.stringify(["家用电器"]), JSON.stringify(["Home Appliances"]),
    JSON.stringify(["分销代理", "展厅入驻"]), JSON.stringify(["Distribution", "Showroom Entry"]),
    JSON.stringify(["津巴布韦", "南非"]), JSON.stringify(["Zimbabwe", "South Africa"]),
    "顾问已对接", "Advisor Connected"
  );
  console.log("✓ Seeded 1 demo partner lead");
}

console.log("\nSeed complete.");
