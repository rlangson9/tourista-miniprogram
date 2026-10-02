// src/middleware/auth.js
// Authentication middleware - JWT handling and admin protection

const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const SECRET = process.env.JWT_SECRET || generateSecureSecret();

function generateSecureSecret() {
  return crypto.randomBytes(32).toString("hex");
}

function sign(payload) {
  return jwt.sign(payload, SECRET, {
    expiresIn: process.env.ADMIN_TOKEN_TTL || "1h",
    algorithm: "HS256",
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_TTL || "7d",
    algorithm: "HS256",
  });
}

function verify(token) {
  return jwt.verify(token, SECRET, {
    algorithms: ["HS256"],
  });
}

function decode(token) {
  try {
    return jwt.decode(token, { complete: true });
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "未授权 Unauthorized - No token provided" });
  }

  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
    
    if (!decoded.id || !decoded.username) {
      return res.status(401).json({ error: "无效的令牌 Invalid token" });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "登录已过期，请重新登录 Session expired, please login again" });
    }
    return res.status(401).json({ error: "无效的令牌 Invalid token" });
  }
}

function generateTokenPair(admin) {
  // NOTE: do not set `iat` manually — jsonwebtoken adds it in seconds.
  // A Date.now() (ms) iat pushed `exp` ~58,000 years into the future,
  // making admin tokens effectively never expire.
  const payload = {
    id: admin.id,
    username: admin.username,
    role: admin.role,
  };

  return {
    accessToken: sign(payload),
    refreshToken: signRefreshToken({ ...payload, type: "refresh" }),
  };
}

function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
    if (decoded.type !== "refresh") {
      throw new Error("Not a refresh token");
    }
    return decoded;
  } catch {
    return null;
  }
}

// ── User (mini program) JWT ──────────────────────────────────────────────
// Regular users get a long-lived token (7d) because silent login (wx.login)
// refreshes it on every app launch. No refresh-token complexity needed.

function signUserToken(openid, extra) {
  return jwt.sign({ sub: openid, role: "user", ...extra }, SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
}

function requireUser(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "请先登录 Please login first" });
  }

  try {
    const decoded = jwt.verify(token, SECRET, { algorithms: ["HS256"] });
    if (decoded.role !== "user" || !decoded.sub) {
      return res.status(401).json({ error: "无效的令牌 Invalid token" });
    }
    req.user = { openid: decoded.sub, ...decoded };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "登录已过期 Login expired" });
    }
    return res.status(401).json({ error: "无效的令牌 Invalid token" });
  }
}

module.exports = {
  sign,
  signRefreshToken,
  verify,
  decode,
  requireAdmin,
  SECRET,
  generateTokenPair,
  verifyRefreshToken,
  signUserToken,
  requireUser,
};
