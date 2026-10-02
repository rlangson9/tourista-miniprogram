// src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("node:path");
const fs = require("node:fs");

const publicRoutes = require("./routes/public.js");
const adminAuthRoutes = require("./routes/adminAuth.js");
const adminRoutes = require("./routes/admin.js");
const { requireAdmin } = require("./middleware/auth.js");
const {
  helmet,
  loginLimiter,
  apiLimiter,
  sendCodeLimiter,
  sanitizeInput,
  secureLogger,
  errorHandler,
  xssProtection,
} = require("./middleware/security.js");

require("./db/index.js");
const bootstrap = require("./db/bootstrap.js");
bootstrap();

const app = express();

// ── Security Middleware ────────────────────────────────────────────────────
app.use(helmet);
app.use(xssProtection);

// ── CORS Configuration ────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : ["http://localhost:3000", "https://touristaar.com"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"), false);
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Openid"],
    credentials: true,
  })
);

// ── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({
  limit: "1mb",
  // Keep the exact raw bytes — /api/payment/notify verifies the WeChat Pay
  // signature over the original request body, not the re-serialized JSON.
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));

// ── Security: Input Sanitization ──────────────────────────────────────────
app.use(sanitizeInput);

// ── Request Logging ───────────────────────────────────────────────────────
app.use(secureLogger);

// ── Rate Limiting ────────────────────────────────────────────────────────
app.use("/admin/api/login", loginLimiter);
app.use("/api/send-code", sendCodeLimiter);
app.use("/api", apiLimiter);
app.use("/admin/api", apiLimiter);

// ── API Routes ────────────────────────────────────────────────────────────
app.use("/api", publicRoutes);
app.use("/admin/api", adminAuthRoutes);
app.use("/admin/api", requireAdmin, adminRoutes);

// ── Admin Dashboard (static SPA) ──────────────────────────────────────────
app.use("/admin", express.static(path.join(__dirname, "..", "public", "admin")));
app.get("/admin", (_req, res) =>
  res.sendFile(path.join(__dirname, "..", "public", "admin", "index.html"))
);

// ── Uploads (QR codes, images) ────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

// ── Health + Root ────────────────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));
app.get("/", (_req, res) => res.redirect("/admin"));

// ── Error Handling ────────────────────────────────────────────────────────
app.use(errorHandler);

// ── HTTPS Support (production) ────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === "production" && process.env.HTTPS_ENABLED === "true") {
  const https = require("node:https");
  const options = {
    key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
    cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log("\n──────────────────────────────────────────────");
    console.log("  Tourista AR backend running (HTTPS)");
    console.log(`  API:        https://localhost:${PORT}/api`);
    console.log(`  Admin:      https://localhost:${PORT}/admin`);
    console.log(`  Health:     https://localhost:${PORT}/health`);
    console.log("──────────────────────────────────────────────\n");
  });
} else {
  app.listen(PORT, () => {
    console.log("\n──────────────────────────────────────────────");
    console.log("  Tourista AR backend running");
    console.log(`  API:        http://localhost:${PORT}/api`);
    console.log(`  Admin:      http://localhost:${PORT}/admin`);
    console.log(`  Health:     http://localhost:${PORT}/health`);
    console.log("──────────────────────────────────────────────\n");
    console.log("  ⚠️  Security Note: Running in development mode");
    console.log("     Set NODE_ENV=production and HTTPS_ENABLED=true for production");
    console.log("──────────────────────────────────────────────\n");
  });
}
