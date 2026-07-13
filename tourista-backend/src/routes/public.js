// src/routes/public.js
const express = require("express");
const router = express.Router();
const { Trips, Orders, Partners, Reviews, SuccessStories, Opportunities, Inquiries } = require("../db/models.js");
const wechat = require("../services/wechat.js");
const { validatePhone } = require("../middleware/security.js");

const verificationCodes = new Map();

// ── Trips ────────────────────────────────────────────────────────────────
router.get("/trips", (req, res) => {
  res.json(Trips.allPublished());
});

router.get("/trips/:id", (req, res) => {
  const t = Trips.get(req.params.id);
  if (!t || !t.isPublished) return res.status(404).json({ error: "行程不存在" });
  res.json(t);
});

// ── WeChat login ──────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { code, phone, type = 'wechat' } = req.body;
    
    if (type === 'wechat') {
      if (!code) return res.status(400).json({ error: "缺少 code" });
      const session = await wechat.code2session(code);
      res.json({ 
        user: {
          id: session.openid,
          openid: session.openid,
          name: 'WeChat User',
          nameEn: 'WeChat User',
          isMember: false,
          isVerifiedCompany: false,
          company: '',
          companyEn: '',
          memberSaved: 0,
          loginType: 'wechat',
          loggedIn: true
        },
        dev: !!session._dev 
      });
    } else if (type === 'phone') {
      if (!phone || !code) return res.status(400).json({ error: "缺少手机号或验证码" });
      
      if (!validatePhone(phone)) {
        return res.status(400).json({ error: "手机号格式不正确 Invalid phone number format" });
      }

      const storedCode = verificationCodes.get(phone);
      if (!storedCode || storedCode.code !== code || Date.now() > storedCode.expiresAt) {
        return res.status(400).json({ error: "验证码无效或已过期 Invalid or expired verification code" });
      }

      verificationCodes.delete(phone);

      res.json({ 
        user: {
          id: phone,
          openid: phone,
          name: 'User',
          nameEn: 'User',
          phone,
          isMember: false,
          isVerifiedCompany: false,
          company: '',
          companyEn: '',
          memberSaved: 0,
          loginType: 'phone',
          loggedIn: true
        }
      });
    } else {
      res.status(400).json({ error: "不支持的登录类型" });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/send-code { phone }  -> { success }
router.post("/send-code", (req, res) => {
  const { phone } = req.body;
  
  if (!phone) return res.status(400).json({ error: "缺少手机号" });
  
  if (!validatePhone(phone)) {
    return res.status(400).json({ error: "手机号格式不正确 Invalid phone number format" });
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 5 * 60 * 1000;

  verificationCodes.set(phone, { code, expiresAt });

  if (process.env.NODE_ENV === "production") {
    res.json({ success: true, message: "验证码已发送" });
  } else {
    res.json({ success: true, message: "验证码已发送", debugCode: code });
  }
});

// ── User profile (called by mini program after login) ──────────────────────
router.get("/user/profile", (req, res) => {
  const openid = req.headers["x-openid"] || req.query.openid;
  if (!openid) return res.status(400).json({ error: "缺少 openid" });

  const user = {
    openid,
    name: "User",
    nameEn: "User",
    isMember: false,
    isVerifiedCompany: false,
    company: "",
    companyEn: "",
    memberSaved: 0
  };
  const orders = Orders.byOpenid(openid);
  const applications = Partners.byOpenid(openid);
  res.json({ user, orders, applications });
});

// ── Booking: create order ──────────────────────────────────────────────────
router.post("/orders", (req, res) => {
  const b = req.body || {};
  const trip = Trips.get(b.tripId);
  if (!trip) return res.status(400).json({ error: "行程不存在" });
  if (trip.seatsLeft <= 0) return res.status(409).json({ error: "该团已满，请选择其他出发日期" });

  if (!b.customerName || !b.passport || !b.phone) {
    return res.status(400).json({ error: "请完整填写出行人信息" });
  }

  if (!validatePhone(b.phone)) {
    return res.status(400).json({ error: "手机号格式不正确 Invalid phone number format" });
  }

  const city = trip.country === "南非" ? "德班" : (trip.country === "双国联报" ? "哈拉雷" : "哈拉雷");
  const cityEn = trip.country === "南非" ? "Durban" : "Harare";

  const order = Orders.create({
    tripId: trip.id,
    title: `${trip.shortTitle} · ${trip.days}天`,
    titleEn: `${trip.shortTitleEn} · ${trip.days} Days`,
    openid: b.openid || null,
    customerName: b.customerName, passport: b.passport, phone: b.phone, company: b.company || "",
    depart: trip.depart, city, cityEn,
    status: "待确认", statusEn: "Pending",
    totalPrice: trip.memberPrice,
    deposit: trip.deposit, depositPaid: false,
    balance: trip.memberPrice - trip.deposit, balancePaid: false,
    balanceDue: "出发前14天",
    checklist: [
      { label: "护照有效期6个月以上", labelEn: "Passport valid for 6+ months", done: false },
      { label: "黄热病疫苗证书", labelEn: "Yellow fever vaccine certificate", done: false },
      { label: "落地签材料（照片+行程）", labelEn: "Visa on arrival materials (photo + itinerary)", done: false }
    ]
  });
  res.status(201).json(order);
});

// GET /api/orders?openid=xxx  -> this user's orders
router.get("/orders", (req, res) => {
  const { openid } = req.query;
  if (!openid) return res.json([]);
  res.json(Orders.byOpenid(openid));
});

// ── WeChat Pay ────────────────────────────────────────────────────────────
router.post("/orders/:id/pay", async (req, res) => {
  try {
    const order = Orders.get(req.params.id);
    if (!order) return res.status(404).json({ error: "订单不存在" });
    const kind = req.body.kind === "balance" ? "balance" : "deposit";
    const totalYuan = kind === "balance" ? order.balance : order.deposit;
    const params = await wechat.createPaymentOrder({
      openid: req.body.openid,
      outTradeNo: `${order.id}-${kind}-${Date.now()}`,
      totalFen: totalYuan * 100,
      description: `${order.title} ${kind === "balance" ? "余款" : "订金"}`
    });
    res.json({ kind, totalYuan, payParams: params });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Partner application ─────────────────────────────────────────────────────
router.post("/partner-apps", (req, res) => {
  const b = req.body || {};
  if (!b.company || !b.contact || !b.wechat) {
    return res.status(400).json({ error: "请完整填写企业信息" });
  }
  if (!Array.isArray(b.categories) || b.categories.length === 0) {
    return res.status(400).json({ error: "请至少选择一个产品类目" });
  }
  if (!Array.isArray(b.modes) || b.modes.length === 0) {
    return res.status(400).json({ error: "请至少选择一种合作方式" });
  }
  if (b.phone && !validatePhone(b.phone)) {
    return res.status(400).json({ error: "手机号格式不正确 Invalid phone number format" });
  }
  const app = Partners.create({
    openid: b.openid || null,
    company: b.company, companyEn: b.companyEn || "",
    contact: b.contact, wechat: b.wechat, phone: b.phone || "",
    categories: b.categories, categoriesEn: b.categoriesEn || [],
    modes: b.modes, modesEn: b.modesEn || [],
    markets: b.markets || [], marketsEn: b.marketsEn || [],
    status: "待对接", statusEn: "New"
  });
  res.status(201).json(app);
});

router.get("/partner-apps", (req, res) => {
  const { openid } = req.query;
  if (!openid) return res.json([]);
  res.json(Partners.byOpenid(openid));
});

// ── Reviews ────────────────────────────────────────────────────────────────
router.get("/reviews/:tripId", (req, res) => {
  res.json(Reviews.allByTrip(req.params.tripId));
});

router.get("/reviews/:tripId/stats", (req, res) => {
  res.json({
    count: Reviews.countByTrip(req.params.tripId),
    avgRating: Reviews.avgRatingByTrip(req.params.tripId)
  });
});

router.post("/reviews", (req, res) => {
  const b = req.body || {};
  if (!b.tripId) return res.status(400).json({ error: "缺少行程ID" });
  if (!b.content && (!b.media || !b.media.length)) {
    return res.status(400).json({ error: "请填写评价内容或上传图片/视频" });
  }
  const review = Reviews.create({
    tripId: b.tripId,
    openid: b.openid || null,
    userName: b.userName || "Anonymous",
    rating: b.rating || 5,
    title: b.title,
    content: b.content,
    media: b.media || []
  });
  res.status(201).json(review);
});

router.post("/reviews/:id/like", (req, res) => {
  const { openid } = req.body || {};
  const review = Reviews.like(req.params.id, openid || "anonymous");
  if (!review) return res.status(404).json({ error: "评价不存在" });
  res.json(review);
});

router.post("/reviews/:id/comments", (req, res) => {
  const b = req.body || {};
  if (!b.content) return res.status(400).json({ error: "请填写评论内容" });
  const comment = Reviews.addComment(req.params.id, {
    openid: b.openid || null,
    userName: b.userName || "Anonymous",
    content: b.content
  });
  res.status(201).json(comment);
});

router.delete("/reviews/:id", (req, res) => {
  if (!Reviews.remove(req.params.id)) return res.status(404).json({ error: "评价不存在" });
  res.json({ ok: true });
});

router.delete("/reviews/comments/:commentId", (req, res) => {
  if (!Reviews.deleteComment(req.params.commentId)) return res.status(404).json({ error: "评论不存在" });
  res.json({ ok: true });
});

// ── Stories ────────────────────────────────────────────────────────────────
router.get("/stories", (req, res) => {
  const { category } = req.query;
  const stories = category ? SuccessStories.byCategory(category) : SuccessStories.all();
  res.json(stories);
});

router.get("/stories/featured", (req, res) => {
  res.json(SuccessStories.featured());
});

router.get("/stories/:id", (req, res) => {
  const story = SuccessStories.get(req.params.id);
  if (!story) return res.status(404).json({ error: "案例不存在" });
  res.json(story);
});

// ── Opportunities ──────────────────────────────────────────────────────────
router.get("/opportunities", (req, res) => {
  const { type, category } = req.query;
  let opportunities;
  if (type) {
    opportunities = Opportunities.byType(type);
  } else if (category) {
    opportunities = Opportunities.byCategory(category);
  } else {
    opportunities = Opportunities.all();
  }
  res.json(opportunities);
});

router.get("/opportunities/featured", (req, res) => {
  res.json(Opportunities.featured());
});

router.get("/opportunities/:id", (req, res) => {
  const opportunity = Opportunities.get(req.params.id);
  if (!opportunity) return res.status(404).json({ error: "机会不存在" });
  res.json(opportunity);
});

// ── Inquiries ──────────────────────────────────────────────────────────────
router.post("/inquiries", (req, res) => {
  const b = req.body || {};
  if (!b.type) return res.status(400).json({ error: "请提供类型" });
  if (b.userPhone && !validatePhone(b.userPhone)) {
    return res.status(400).json({ error: "手机号格式不正确 Invalid phone number format" });
  }
  const inquiry = Inquiries.create(b);
  res.status(201).json(inquiry);
});

module.exports = router;
