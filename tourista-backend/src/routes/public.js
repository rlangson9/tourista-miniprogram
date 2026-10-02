// src/routes/public.js
const express = require("express");
const router = express.Router();
const db = require("../db/index.js");
const { Trips, Orders, Partners, Reviews, SuccessStories, Opportunities, Inquiries, VerificationCodes } = require("../db/models.js");
const wechat = require("../services/wechat.js");
const { validatePhone } = require("../middleware/security.js");
const { signUserToken, requireUser } = require("../middleware/auth.js");

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
      const openid = session.openid;
      const token = signUserToken(openid, { loginType: 'wechat' });
      res.json({
        token,
        user: {
          id: openid,
          openid,
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

      if (!VerificationCodes.isValid(phone, code)) {
        return res.status(400).json({ error: "验证码无效或已过期 Invalid or expired verification code" });
      }

      VerificationCodes.consume(phone);

      const token = signUserToken(phone, { loginType: 'phone' });
      res.json({
        token,
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

  // Purge expired codes periodically
  VerificationCodes.purgeExpired();

  const code = String(Math.floor(100000 + Math.random() * 900000));
  VerificationCodes.set(phone, code);

  if (process.env.NODE_ENV === "production") {
    res.json({ success: true, message: "验证码已发送" });
  } else {
    res.json({ success: true, message: "验证码已发送", debugCode: code });
  }
});

// ── User profile (called by mini program after login) ──────────────────────
router.get("/user/profile", requireUser, (req, res) => {
  const openid = req.user.openid;

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
router.post("/orders", requireUser, (req, res) => {
  const b = req.body || {};
  const openid = req.user.openid;
  const trip = Trips.get(b.tripId);
  if (!trip) return res.status(400).json({ error: "行程不存在" });

  // Support multi-traveller bookings (company mode); default = 1 seat
  const travellerCount = Number.isInteger(b.travellerCount) && b.travellerCount > 0 ? b.travellerCount : 1;

  if (!b.customerName || !b.passport || !b.phone) {
    return res.status(400).json({ error: "请完整填写出行人信息" });
  }

  if (!validatePhone(b.phone)) {
    return res.status(400).json({ error: "手机号格式不正确 Invalid phone number format" });
  }

  // ── Atomic seat reservation ────────────────────────────────────────────
  // Use a conditional UPDATE so two concurrent requests can't both pass the
  // check and overbook the same seat slot (TOCTOU race protection).
  const seatStmt = db.prepare(
    "UPDATE trips SET seats_left = seats_left - ?, updated_at = datetime('now') WHERE id = ? AND seats_left >= ?"
  );
  const seatResult = seatStmt.run(travellerCount, trip.id, travellerCount);
  if (seatResult.changes === 0) {
    return res.status(409).json({ error: "该团席位不足，请选择其他出发日期或减少人数" });
  }

  const city = trip.country === "南非" ? "德班" : (trip.country === "双国联报" ? "哈拉雷" : "哈拉雷");
  const cityEn = trip.country === "南非" ? "Durban" : "Harare";
  const perPersonPrice = trip.memberPrice;
  const perPersonDeposit = trip.deposit;
  const totalPrice = perPersonPrice * travellerCount;
  const totalDeposit = perPersonDeposit * travellerCount;

  let order;
  try {
    order = Orders.create({
      tripId: trip.id,
      title: `${trip.shortTitle} · ${trip.days}天`,
      titleEn: `${trip.shortTitleEn} · ${trip.days} Days`,
      openid,
      customerName: b.customerName, passport: b.passport, phone: b.phone, company: b.company || "",
      depart: trip.depart, city, cityEn,
      status: "待确认", statusEn: "Pending",
      totalPrice,
      deposit: totalDeposit, depositPaid: false,
      balance: totalPrice - totalDeposit, balancePaid: false,
      balanceDue: "出发前14天",
      checklist: [
        { label: "护照有效期6个月以上", labelEn: "Passport valid for 6+ months", done: false },
        { label: "黄热病疫苗证书", labelEn: "Yellow fever vaccine certificate", done: false },
        { label: "落地签材料（照片+行程）", labelEn: "Visa on arrival materials (photo + itinerary)", done: false }
      ]
    });
  } catch (e) {
    // Order creation failed — restore the reserved seats so we don't leak them
    Trips.adjustSeats(trip.id, travellerCount);
    throw e;
  }
  res.status(201).json(order);
});

// GET /api/orders  -> this user's orders (openid from JWT)
router.get("/orders", requireUser, (req, res) => {
  res.json(Orders.byOpenid(req.user.openid));
});

// ── WeChat Pay ────────────────────────────────────────────────────────────
// Helper: apply a payment confirmation to an order in the DB (kind = deposit | balance)
function applyPaidToOrder(orderId, kind) {
  const cur = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  if (!cur) return null;
  const isDeposit = kind === "deposit";
  const patch = {
    depositPaid: isDeposit ? true : (cur.deposit_paid ? true : false),
    balancePaid: !isDeposit ? true : (cur.balance_paid ? true : false),
  };
  // Derive status from both paid flags
  const newDepositPaid = patch.depositPaid;
  const newBalancePaid = patch.balancePaid;
  let status, statusEn;
  if (newBalancePaid) { status = "已结清"; statusEn = "Paid in Full"; }
  else if (newDepositPaid) { status = "已付订金"; statusEn = "Deposit Paid"; }
  else { status = cur.status; statusEn = cur.status_en; }
  patch.status = status;
  patch.statusEn = statusEn;
  return Orders.update(orderId, patch);
}

// Step 1: Initiate payment – returns wx.requestPayment params.
router.post("/orders/:id/pay", requireUser, async (req, res) => {
  try {
    const order = Orders.get(req.params.id);
    if (!order) return res.status(404).json({ error: "订单不存在" });
    if (order.openid !== req.user.openid) {
      return res.status(403).json({ error: "无权操作此订单 Forbidden" });
    }
    const kind = req.body.kind === "balance" ? "balance" : "deposit";
    // Reject duplicate payment attempts for this leg
    if (kind === "deposit" ? order.deposit_paid : order.balance_paid) {
      return res.status(409).json({ error: "该款项已支付 Already paid" });
    }
    const totalYuan = kind === "balance" ? order.balance : order.deposit;
    // out_trade_no format: `${orderId}-D|B<base36 timestamp>` — fits WeChat's
    // 32-char limit and is parsed back by /payment/notify to locate the order.
    const outTradeNo = `${order.id}-${kind === "balance" ? "B" : "D"}${Date.now().toString(36)}`;
    const params = await wechat.createPaymentOrder({
      openid: req.user.openid,
      outTradeNo,
      totalFen: Math.round(totalYuan * 100),
      description: `${order.title} ${kind === "balance" ? "余款" : "订金"}`
    });
    res.json({ kind, totalYuan, outTradeNo, payParams: params });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Step 2 (dev mode): Confirm payment success directly.
// In production, the WeChat Pay notify callback below calls applyPaidToOrder instead.
// Here we require the user to own the order, so another user can't confirm someone else's payment.
// Disabled entirely once real WeChat Pay is configured — otherwise a user could
// mark the balance as paid without actually paying it.
router.post("/orders/:id/confirm-payment", requireUser, (req, res) => {
  if (wechat.isPayConfigured()) {
    return res.status(403).json({ error: "confirm-payment is dev-only; production payments are confirmed via /api/payment/notify" });
  }
  const order = Orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "订单不存在" });
  if (order.openid !== req.user.openid) {
    return res.status(403).json({ error: "无权操作此订单 Forbidden" });
  }
  const kind = req.body.kind === "balance" ? "balance" : "deposit";
  const updated = applyPaidToOrder(req.params.id, kind);
  if (!updated) return res.status(404).json({ error: "订单不存在" });
  res.json(updated);
});

// Parse the out_trade_no generated by POST /orders/:id/pay:
// `${orderId}-D<base36 ts>` (deposit) | `${orderId}-B<base36 ts>` (balance)
function parseOutTradeNo(s) {
  const idx = String(s || "").lastIndexOf("-");
  if (idx <= 0) return null;
  const orderId = s.slice(0, idx);
  const code = s.slice(idx + 1);
  if (code[0] === "D") return { orderId, kind: "deposit" };
  if (code[0] === "B") return { orderId, kind: "balance" };
  return null;
}

// Step 2 (production): WeChat Pay v3 JSAPI notify callback.
// WeChat's servers POST the payment result here. The request is verified via
// the Wechatpay-Signature header (RSA-SHA256 over timestamp/nonce/raw body,
// checked against the platform public key), then the AES-256-GCM encrypted
// resource is decrypted with the APIv3 key before the order is updated.
router.post("/payment/notify", express.json({ type: "application/json" }), (req, res) => {
  const fail = (status, message) => res.status(status).json({ code: "FAIL", message });
  try {
    const signature = req.headers["wechatpay-signature"];
    const timestamp = req.headers["wechatpay-timestamp"];
    const nonce = req.headers["wechatpay-nonce"];
    const serial = req.headers["wechatpay-serial"];
    if (!signature || !timestamp || !nonce || !req.rawBody) {
      return fail(400, "Missing Wechatpay signature headers");
    }

    // 1. Verify the signature against the platform public key
    const valid = wechat.verifyNotifySignature({
      timestamp: String(timestamp),
      nonce: String(nonce),
      signature: String(signature),
      serial: serial ? String(serial) : "",
      rawBody: req.rawBody,
    });
    if (!valid) return fail(401, "Invalid Wechatpay signature");

    const event = req.body || {};
    // Only payment-success events mutate orders; ack everything else
    // (e.g. REFUND.SUCCESS, TRANSACTION.CLOSED) so WeChat stops retrying.
    if (event.event_type !== "TRANSACTION.SUCCESS") {
      return res.json({ code: "SUCCESS", message: "OK" });
    }

    // 2. Decrypt the resource payload with the APIv3 key
    const tx = wechat.decryptNotifyResource(event.resource || {});
    if (tx.trade_state !== "SUCCESS") {
      return res.json({ code: "SUCCESS", message: "OK" });
    }

    // 3. Locate the order from out_trade_no
    const parsed = parseOutTradeNo(tx.out_trade_no);
    if (!parsed) return fail(400, `Unrecognized out_trade_no: ${tx.out_trade_no}`);
    const { orderId, kind } = parsed;
    const order = Orders.get(orderId);
    if (!order) return fail(404, "Order not found");

    // 4. Guard against mismatched merchant/amount (defence in depth)
    if (wechat.payMchid() && tx.mchid && tx.mchid !== wechat.payMchid()) {
      return fail(400, "Merchant id mismatch");
    }
    const expectedFen = Math.round((kind === "balance" ? order.balance : order.deposit) * 100);
    const paidFen = tx.amount ? Number(tx.amount.total) : NaN;
    if (!Number.isFinite(paidFen) || paidFen !== expectedFen) {
      return fail(400, `Amount mismatch: expected ${expectedFen} fen, got ${paidFen}`);
    }

    // 5. Idempotent update
    const alreadyPaid = kind === "balance" ? order.balance_paid : order.deposit_paid;
    if (!alreadyPaid) applyPaidToOrder(orderId, kind);
    return res.json({ code: "SUCCESS", message: "OK" });
  } catch (e) {
    console.error("[wxpay-notify] error:", e.message);
    return fail(500, "Internal error");
  }
});

// ── Partner application ─────────────────────────────────────────────────────
router.post("/partner-apps", requireUser, (req, res) => {
  const b = req.body || {};
  const openid = req.user.openid;
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
    openid,
    company: b.company, companyEn: b.companyEn || "",
    contact: b.contact, wechat: b.wechat, phone: b.phone || "",
    categories: b.categories, categoriesEn: b.categoriesEn || [],
    modes: b.modes, modesEn: b.modesEn || [],
    markets: b.markets || [], marketsEn: b.marketsEn || [],
    status: "待对接", statusEn: "New"
  });
  res.status(201).json(app);
});

router.get("/partner-apps", requireUser, (req, res) => {
  res.json(Partners.byOpenid(req.user.openid));
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

router.post("/reviews", requireUser, (req, res) => {
  const b = req.body || {};
  if (!b.tripId) return res.status(400).json({ error: "缺少行程ID" });
  if (!b.content && (!b.media || !b.media.length)) {
    return res.status(400).json({ error: "请填写评价内容或上传图片/视频" });
  }
  const review = Reviews.create({
    tripId: b.tripId,
    openid: req.user.openid,
    userName: b.userName || "Anonymous",
    rating: b.rating || 5,
    title: b.title,
    content: b.content,
    media: b.media || []
  });
  res.status(201).json(review);
});

router.post("/reviews/:id/like", requireUser, (req, res) => {
  const review = Reviews.like(req.params.id, req.user.openid);
  if (!review) return res.status(404).json({ error: "评价不存在" });
  res.json(review);
});

router.post("/reviews/:id/comments", requireUser, (req, res) => {
  const b = req.body || {};
  if (!b.content) return res.status(400).json({ error: "请填写评论内容" });
  const comment = Reviews.addComment(req.params.id, {
    openid: req.user.openid,
    userName: b.userName || "Anonymous",
    content: b.content
  });
  res.status(201).json(comment);
});

router.delete("/reviews/:id", requireUser, (req, res) => {
  const existing = db.prepare("SELECT id, openid FROM reviews WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "评价不存在" });
  // Only the review owner can delete it
  if (existing.openid !== req.user.openid) {
    return res.status(403).json({ error: "无权删除此评价 Forbidden" });
  }
  if (!Reviews.remove(req.params.id)) return res.status(404).json({ error: "评价不存在" });
  res.json({ ok: true });
});

router.delete("/reviews/comments/:commentId", requireUser, (req, res) => {
  const existing = db.prepare("SELECT id, openid FROM review_comments WHERE id = ?").get(req.params.commentId);
  if (!existing) return res.status(404).json({ error: "评论不存在" });
  // Only the comment owner can delete it
  if (existing.openid !== req.user.openid) {
    return res.status(403).json({ error: "无权删除此评论 Forbidden" });
  }
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
