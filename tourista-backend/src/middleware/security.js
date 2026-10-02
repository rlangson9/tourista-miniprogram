// src/middleware/security.js
// Comprehensive security middleware for Tourista AR backend

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sanitizeFilename = require("sanitize-filename");
const { promisify } = require("util");

// ── Helmet security headers ────────────────────────────────────────────────
// Set security-related HTTP headers
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // NOTE: no 'strict-dynamic' here — per CSP3, once 'strict-dynamic' is
      // present browsers IGNORE 'self'/'unsafe-inline'/host allowlists for
      // scripts, which blocked app.js and the inline fallback entirely
      // (dead login button). The admin SPA is fully self-hosted, so a plain
      // allowlist is both sufficient and correct.
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.weixin.qq.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      // NOTE: helmet enables `upgrade-insecure-requests` BY DEFAULT. It
      // rewrites http:// subresource requests to https://, which silently
      // breaks the admin dashboard when served over plain HTTP in
      // development (app.js/styles.css fail to load, so the login button
      // does nothing). Explicitly disable it; HSTS below already forces
      // secure loading once the site runs over HTTPS in production.
      upgradeInsecureRequests: null,
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Allow assets to be embedded from proxy/preview environments (IDE
  // built-in browsers fetch localhost assets through a proxy origin).
  // 'same-origin' would block app.js/styles.css in those environments.
  crossOriginResourcePolicy: { policy: "cross-origin" },
  frameguard: {
    action: "deny",
  },
  dnsPrefetchControl: {
    allow: false,
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },
  permittedCrossDomainPolicies: {
    permittedPolicies: "none",
  },
});

// ── Rate limiting ──────────────────────────────────────────────────────────
// Prevent brute-force attacks on login and sensitive endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "登录尝试过于频繁，请稍后再试 Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "请求过于频繁，请稍后再试 Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const sendCodeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: "验证码发送过于频繁，请稍后再试 Too many code requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Input sanitization ────────────────────────────────────────────────────
function sanitizeInput(req, _res, next) {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
}

function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

function sanitizeString(str) {
  str = str.trim();
  str = str.replace(/<[^>]*>/g, "");
  str = str.replace(/[<>]/g, "");
  return str;
}

// ── Phone number validation ───────────────────────────────────────────────
function validatePhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/\D/g, "");
  return /^1[3-9]\d{9}$/.test(cleaned);
}

// ── Password strength validation ──────────────────────────────────────────
function validatePassword(password) {
  if (!password || typeof password !== "string") return false;
  if (password.length < 8) return false;
  if (!/[A-Za-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

// ── XSS protection ───────────────────────────────────────────────────────
function xssProtection(req, res, next) {
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
}

// ── Request logging with PII masking ──────────────────────────────────────
function secureLogger(req, _res, next) {
  const logObj = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    bodyKeys: Object.keys(req.body || {}),
  };
  console.log(JSON.stringify(logObj));
  next();
}

// ── Error handling ────────────────────────────────────────────────────────
function errorHandler(err, req, res, _next) {
  console.error("[ERROR]", err.message);
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "未授权 Unauthorized" });
  }
  if (err.name === "NotFoundError") {
    return res.status(404).json({ error: "资源不存在 Not found" });
  }
  res.status(500).json({ error: "服务器内部错误 Internal server error" });
}

// ── Auth token security ───────────────────────────────────────────────────
function validateTokenFormat(token) {
  if (!token || typeof token !== "string") return false;
  if (!token.startsWith("Bearer ")) return false;
  const tokenPart = token.slice(7);
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(tokenPart)) {
    return false;
  }
  return true;
}

module.exports = {
  helmet: helmetConfig,
  loginLimiter,
  apiLimiter,
  sendCodeLimiter,
  sanitizeInput,
  validatePhone,
  validatePassword,
  xssProtection,
  secureLogger,
  errorHandler,
  validateTokenFormat,
  sanitizeFilename,
};
