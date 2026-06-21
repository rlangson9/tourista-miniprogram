// src/routes/adminAuth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const { Admins } = require("../db/models.js");
const { generateTokenPair, verifyRefreshToken, sign } = require("../middleware/auth.js");
const { validatePassword } = require("../middleware/security.js");

// POST /admin/api/login { username, password } -> { accessToken, refreshToken, admin }
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: "请输入用户名和密码 Username and password required" });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: "密码不符合安全要求 Password does not meet security requirements" });
  }

  const admin = Admins.byUsername(username);
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: "用户名或密码错误 Invalid credentials" });
  }

  const tokens = generateTokenPair({ id: admin.id, username: admin.username, role: admin.role });
  
  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    admin: { id: admin.id, username: admin.username, role: admin.role }
  });
});

// POST /admin/api/refresh { refreshToken } -> { accessToken, refreshToken }
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({ error: "缺少刷新令牌 Missing refresh token" });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return res.status(401).json({ error: "无效的刷新令牌 Invalid refresh token" });
  }

  const admin = Admins.get(decoded.id);
  if (!admin) {
    return res.status(401).json({ error: "管理员不存在 Admin not found" });
  }

  const newTokens = generateTokenPair({ id: admin.id, username: admin.username, role: admin.role });
  
  res.json({
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken
  });
});

// GET /admin/api/me  (verify token still valid; used by the dashboard on load)
const { requireAdmin } = require("../middleware/auth.js");
router.get("/me", requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

// POST /admin/api/logout { refreshToken } -> { ok }
router.post("/logout", (req, res) => {
  res.json({ ok: true, message: "已登出 Logged out successfully" });
});

module.exports = router;
