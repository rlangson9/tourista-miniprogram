// src/routes/admin.js
// All management endpoints. Protected by requireAdmin (applied in server.js).
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("node:path");
const fs = require("node:fs");
const { Trips, Orders, Partners, SuccessStories, Opportunities, Inquiries, Notifications, Stats } = require("../db/models.js");
const wechat = require("../services/wechat.js");

const uploadsDir = path.join(__dirname, "..", "..", "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `qr_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif"];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片文件 (JPG, PNG, GIF)"));
    }
  },
});

// ════════════════════════════════════════════════════════════════════════
// DASHBOARD OVERVIEW
// ════════════════════════════════════════════════════════════════════════
router.get("/stats", (req, res) => res.json(Stats.overview()));

// ════════════════════════════════════════════════════════════════════════
// TASK 1 — TRIPS: edit itineraries / prices / seats
// ════════════════════════════════════════════════════════════════════════
router.get("/trips", (req, res) => res.json(Trips.all()));

router.get("/trips/:id", (req, res) => {
  const t = Trips.get(req.params.id);
  if (!t) return res.status(404).json({ error: "行程不存在" });
  res.json(t);
});

router.post("/trips", (req, res) => {
  const b = req.body || {};
  if (!b.id) return res.status(400).json({ error: "行程ID必填 (e.g. zw, sa, kenya)" });
  if (Trips.get(b.id)) return res.status(409).json({ error: "该行程ID已存在" });
  try {
    res.status(201).json(Trips.create(b));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put("/trips/:id", (req, res) => {
  const updated = Trips.update(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: "行程不存在" });
  res.json(updated);
});

// Quick price/seat adjustment (most common management action)
router.patch("/trips/:id", (req, res) => {
  const allowed = {};
  const b = req.body || {};
  ["memberPrice", "normalPrice", "deposit", "seatsLeft", "seatsTotal", "status", "statusEn", "seatTag", "seatTagEn", "isPublished", "depart", "dateRange"].forEach(k => {
    if (b[k] !== undefined) allowed[k] = b[k];
  });
  const updated = Trips.update(req.params.id, allowed);
  if (!updated) return res.status(404).json({ error: "行程不存在" });
  res.json(updated);
});

router.delete("/trips/:id", (req, res) => {
  if (!Trips.remove(req.params.id)) return res.status(404).json({ error: "行程不存在" });
  res.json({ ok: true });
});

router.post("/trips/:id/upload-qr", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "请选择要上传的文件" });
  const trip = Trips.update(req.params.id, { qrCode: `/uploads/${req.file.filename}` });
  if (!trip) return res.status(404).json({ error: "行程不存在" });
  res.json({ qrCode: trip.qrCode });
});

// Generic media upload for content galleries (stories, opportunities).
// Accepts images and short videos. Returns the URL immediately so it works
// even before the entity is saved; the admin keeps the media list client-side
// and persists it with the form.
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
const VIDEO_EXTS = [".mp4", ".mov", ".m4v", ".webm"];
const mediaUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const prefix = VIDEO_EXTS.includes(ext) ? "vid" : "img";
      cb(null, `${prefix}_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (IMAGE_EXTS.includes(ext) || VIDEO_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片 (JPG/PNG/GIF/WEBP) 或视频 (MP4/MOV/WEBM)"));
    }
  },
});

router.post("/upload", (req, res) => {
  mediaUpload.single("file")(req, res, (err) => {
    // Multer rejections (bad extension, >50MB) land here, not in try/catch
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: "请选择要上传的文件" });
    const ext = path.extname(req.file.filename).toLowerCase();
    const type = VIDEO_EXTS.includes(ext) ? "video" : "image";
    res.status(201).json({ url: `/uploads/${req.file.filename}`, type });
  });
});

// ════════════════════════════════════════════════════════════════════════
// TASK 2 — ORDERS: track orders & payments
// ════════════════════════════════════════════════════════════════════════
router.get("/orders", (req, res) => {
  res.json(Orders.all({ status: req.query.status, tripId: req.query.tripId }));
});

router.get("/orders/:id", (req, res) => {
  const o = Orders.get(req.params.id);
  if (!o) return res.status(404).json({ error: "订单不存在" });
  res.json(o);
});

// Update status / payment flags / checklist / notes
router.put("/orders/:id", (req, res) => {
  const updated = Orders.update(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: "订单不存在" });
  res.json(updated);
});

// Convenience: mark deposit or balance as paid (records payment manually)
router.post("/orders/:id/mark-paid", (req, res) => {
  const kind = req.body.kind === "balance" ? "balance" : "deposit";
  const patch = kind === "balance"
    ? { balancePaid: true, status: "已结清", statusEn: "Paid in Full" }
    : { depositPaid: true, status: "已付订金", statusEn: "Deposit Paid" };
  const updated = Orders.update(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: "订单不存在" });
  res.json(updated);
});

router.delete("/orders/:id", (req, res) => {
  if (!Orders.remove(req.params.id)) return res.status(404).json({ error: "订单不存在" });
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════════════
// TASK 3 — PARTNER LEADS: manage partner applications
// ════════════════════════════════════════════════════════════════════════
router.get("/partner-apps", (req, res) => {
  res.json(Partners.all({ status: req.query.status }));
});

router.get("/partner-apps/:id", (req, res) => {
  const a = Partners.get(req.params.id);
  if (!a) return res.status(404).json({ error: "申请不存在" });
  res.json(a);
});

// Update status (待对接 -> 顾问已对接 -> 已签约) + notes
router.put("/partner-apps/:id", (req, res) => {
  const updated = Partners.update(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: "申请不存在" });
  res.json(updated);
});

router.delete("/partner-apps/:id", (req, res) => {
  if (!Partners.remove(req.params.id)) return res.status(404).json({ error: "申请不存在" });
  res.json({ ok: true });
});

// ════════════════════════════════════════════════════════════════════════
// TASK 4 — NOTIFICATIONS: notify clients
// ════════════════════════════════════════════════════════════════════════
router.get("/notifications", (req, res) => {
  res.json(Notifications.all({ limit: Number(req.query.limit) || 100 }));
});

// Send a notification to one order's customer or one partner lead.
// POST /admin/api/notifications
//   { audience:'order'|'partner', targetId, title, body, templateId?, data?, page? }
router.post("/notifications", async (req, res) => {
  const b = req.body || {};
  if (!b.audience || !b.targetId) {
    return res.status(400).json({ error: "缺少 audience 或 targetId" });
  }

  // Resolve the recipient's openid
  let openid = null;
  if (b.audience === "order") {
    const o = Orders.get(b.targetId);
    if (!o) return res.status(404).json({ error: "订单不存在" });
    openid = o.openid;
  } else if (b.audience === "partner") {
    const p = Partners.get(b.targetId);
    if (!p) return res.status(404).json({ error: "申请不存在" });
    openid = p.openid;
  }

  // Record the notification first (queued)
  const notif = Notifications.create({
    audience: b.audience, targetId: b.targetId, openid,
    template: b.templateId || null, title: b.title || "", body: b.body || "",
    channel: b.templateId ? "subscribe" : "log",
    createdBy: req.admin && req.admin.username
  });

  // If a WeChat subscribe-message template is supplied AND we have the user's
  // openid, attempt to send it. Otherwise it stays as an internal log entry
  // your team actions via WeChat/phone (the app already routes deep chat there).
  if (b.templateId && openid) {
    try {
      const r = await wechat.sendSubscribeMessage({
        openid, templateId: b.templateId, data: b.data || {}, page: b.page
      });
      Notifications.markSent(notif.id, r.ok, r.error);
      return res.status(201).json({ ...notif, sendResult: r });
    } catch (e) {
      Notifications.markSent(notif.id, false, e.message);
      return res.status(201).json({ ...notif, sendResult: { ok: false, error: e.message } });
    }
  }

  res.status(201).json({ ...notif, sendResult: { ok: true, note: "Logged (no WeChat template) — action via WeChat/phone" } });
});

// GET /admin/stories  -> list all stories (including drafts)
router.get("/stories", (req, res) => {
  res.json(SuccessStories.all(true));
});

// POST /admin/stories  -> create story
router.post("/stories", (req, res) => {
  const b = req.body || {};
  if (!b.title && !b.titleEn) return res.status(400).json({ error: "请提供标题" });
  const story = SuccessStories.create(b);
  res.status(201).json(story);
});

// GET /admin/stories/:id  -> get single story
router.get("/stories/:id", (req, res) => {
  const story = SuccessStories.get(req.params.id);
  if (!story) return res.status(404).json({ error: "案例不存在" });
  res.json(story);
});

// PUT /admin/stories/:id  -> update story
router.put("/stories/:id", (req, res) => {
  const story = SuccessStories.update(req.params.id, req.body || {});
  if (!story) return res.status(404).json({ error: "案例不存在" });
  res.json(story);
});

// DELETE /admin/stories/:id  -> delete story
router.delete("/stories/:id", (req, res) => {
  if (!SuccessStories.remove(req.params.id)) return res.status(404).json({ error: "案例不存在" });
  res.json({ ok: true });
});

// GET /admin/opportunities  -> list all opportunities (including drafts)
router.get("/opportunities", (req, res) => {
  res.json(Opportunities.all(true));
});

// POST /admin/opportunities  -> create opportunity
router.post("/opportunities", (req, res) => {
  const b = req.body || {};
  if (!b.title && !b.titleEn) return res.status(400).json({ error: "请提供标题" });
  const opportunity = Opportunities.create(b);
  res.status(201).json(opportunity);
});

// GET /admin/opportunities/:id  -> get single opportunity
router.get("/opportunities/:id", (req, res) => {
  const opportunity = Opportunities.get(req.params.id);
  if (!opportunity) return res.status(404).json({ error: "机会不存在" });
  res.json(opportunity);
});

// PUT /admin/opportunities/:id  -> update opportunity
router.put("/opportunities/:id", (req, res) => {
  const opportunity = Opportunities.update(req.params.id, req.body || {});
  if (!opportunity) return res.status(404).json({ error: "机会不存在" });
  res.json(opportunity);
});

// DELETE /admin/opportunities/:id  -> delete opportunity
router.delete("/opportunities/:id", (req, res) => {
  if (!Opportunities.remove(req.params.id)) return res.status(404).json({ error: "机会不存在" });
  res.json({ ok: true });
});

// GET /admin/inquiries  -> list all inquiries
router.get("/inquiries", (req, res) => {
  const { type } = req.query;
  if (type) return res.json(Inquiries.byType(type));
  res.json(Inquiries.all());
});

// GET /admin/inquiries/:id  -> get single inquiry
router.get("/inquiries/:id", (req, res) => {
  const inquiry = Inquiries.get(req.params.id);
  if (!inquiry) return res.status(404).json({ error: "咨询不存在" });
  res.json(inquiry);
});

// PUT /admin/inquiries/:id  -> update inquiry status
router.put("/inquiries/:id", (req, res) => {
  const inquiry = Inquiries.update(req.params.id, req.body || {});
  if (!inquiry) return res.status(404).json({ error: "咨询不存在" });
  res.json(inquiry);
});

// DELETE /admin/inquiries/:id  -> delete inquiry
router.delete("/inquiries/:id", (req, res) => {
  if (!Inquiries.remove(req.params.id)) return res.status(404).json({ error: "咨询不存在" });
  res.json({ ok: true });
});

module.exports = router;
