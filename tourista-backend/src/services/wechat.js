// src/services/wechat.js
// Thin wrappers around the WeChat Mini Program + WeChat Pay v3 APIs.
// Login / token / subscribe-message activate once WX_APPID / WX_SECRET are set.
// WeChat Pay v3 JSAPI activates once the WXPAY_* credentials are set in .env;
// without them createPaymentOrder returns a dev mock so flows keep working.

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const APPID = process.env.WX_APPID;
const SECRET = process.env.WX_SECRET;

const WXPAY_API_BASE = "https://api.mch.weixin.qq.com";
// WeChat Pay rejects notify requests whose timestamp deviates too far from now;
// we apply the same ±5 min window when verifying inbound signatures.
const NOTIFY_MAX_CLOCK_SKEW_S = 300;

const hasWeChat = () => Boolean(APPID && SECRET);

// ── Login: exchange js_code for openid + session_key ──────────────────────
// Mini program calls wx.login() -> sends code here -> we call code2session.
async function code2session(code) {
  if (!hasWeChat()) {
    // Dev fallback: deterministic fake openid so flows work without WeChat.
    return { openid: "dev-openid-" + code.slice(0, 8), session_key: "dev", _dev: true };
  }
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
  const r = await fetch(url);
  const data = await r.json();
  if (data.errcode) throw new Error(`code2session failed: ${data.errcode} ${data.errmsg}`);
  return data; // { openid, session_key, unionid? }
}

// ── Access token (cached) — needed for subscribe messages ─────────────────
let _token = null, _tokenExp = 0;
async function getAccessToken() {
  if (!hasWeChat()) return null;
  if (_token && Date.now() < _tokenExp) return _token;
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${SECRET}`;
  const r = await fetch(url);
  const data = await r.json();
  if (!data.access_token) throw new Error(`token failed: ${data.errcode} ${data.errmsg}`);
  _token = data.access_token;
  _tokenExp = Date.now() + (data.expires_in - 300) * 1000;
  return _token;
}

// ── Subscribe message (订阅消息) ──────────────────────────────────────────
// WeChat only allows TEMPLATED messages, and only after the user has tapped
// to authorize that template (wx.requestSubscribeMessage on the client).
// `data` must match the template's field structure, e.g.
//   { thing1: { value: "津巴布韦商务考察团" }, time2: { value: "2026-07-19" } }
async function sendSubscribeMessage({ openid, templateId, data, page }) {
  if (!hasWeChat()) {
    return { ok: true, _dev: true, note: "WeChat not configured — message logged only" };
  }
  const token = await getAccessToken();
  const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`;
  const body = { touser: openid, template_id: templateId, data };
  if (page) body.page = page;
  const r = await fetch(url, { method: "POST", body: JSON.stringify(body) });
  const res = await r.json();
  if (res.errcode !== 0) return { ok: false, error: `${res.errcode} ${res.errmsg}` };
  return { ok: true };
}

// ══════════════════════════════════════════════════════════════════════════
// WeChat Pay v3 — JSAPI payments
//
// Required .env (merchant platform: 账户中心 → API安全):
//   WXPAY_MCHID                     merchant id (e.g. 1900000000)
//   WXPAY_APPID                     optional, defaults to WX_APPID
//   WXPAY_SERIAL_NO                 serial_no of the merchant API certificate
//   WXPAY_PRIVATE_KEY_PATH          path to apiclient_key.pem (merchant private key)
//   WXPAY_PRIVATE_KEY               optional inline PEM instead of the path
//   WXPAY_APIV3_KEY                 the 32-character APIv3 key (decrypts notify payloads)
//   WXPAY_NOTIFY_URL                publicly reachable https://your-domain/api/payment/notify
//   WXPAY_PLATFORM_PUBLIC_KEY_PATH  WeChat Pay public key OR platform certificate
//                                   (used to verify notify request signatures)
//   WXPAY_PUBLIC_KEY_ID             optional: enforce the expected Wechatpay-Serial header
// ══════════════════════════════════════════════════════════════════════════

let _merchantKeyCache = null;
let _platformKeyCache = null;

function resolveKeyPath(p) {
  if (!p) return null;
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
}

function loadMerchantPrivateKey() {
  if (_merchantKeyCache) return _merchantKeyCache;
  const inline = process.env.WXPAY_PRIVATE_KEY;
  if (inline) {
    _merchantKeyCache = inline.replace(/\\n/g, "\n");
    return _merchantKeyCache;
  }
  const p = resolveKeyPath(process.env.WXPAY_PRIVATE_KEY_PATH);
  if (p) _merchantKeyCache = fs.readFileSync(p, "utf8");
  return _merchantKeyCache;
}

function loadPlatformPublicKey() {
  if (_platformKeyCache) return _platformKeyCache;
  let pem = process.env.WXPAY_PLATFORM_PUBLIC_KEY
    ? process.env.WXPAY_PLATFORM_PUBLIC_KEY.replace(/\\n/g, "\n")
    : null;
  if (!pem) {
    const p = resolveKeyPath(process.env.WXPAY_PLATFORM_PUBLIC_KEY_PATH);
    if (p) pem = fs.readFileSync(p, "utf8");
  }
  if (!pem) return null;
  // Accept either a bare public key (微信支付公钥) or an X.509 platform certificate
  if (/BEGIN CERTIFICATE/.test(pem)) {
    _platformKeyCache = new crypto.X509Certificate(pem).publicKey; // KeyObject
  } else {
    _platformKeyCache = pem; // PEM string works directly with crypto.verify
  }
  return _platformKeyCache;
}

function payConfig() {
  return {
    mchid: process.env.WXPAY_MCHID || "",
    appid: process.env.WXPAY_APPID || APPID || "",
    serialNo: process.env.WXPAY_SERIAL_NO || "",
    privateKey: loadMerchantPrivateKey(),
    apiV3Key: process.env.WXPAY_APIV3_KEY || process.env.WXPAY_KEY || "",
    notifyUrl: process.env.WXPAY_NOTIFY_URL || "",
  };
}

// True when all credentials required for real v3 payments are present.
const isPayConfigured = () => {
  const c = payConfig();
  return Boolean(c.mchid && c.appid && c.serialNo && c.privateKey && c.apiV3Key && c.notifyUrl);
};

const payMchid = () => process.env.WXPAY_MCHID || "";

// ── Request signing: WECHATPAY2-SHA256-RSA2048 ─────────────────────────────
function buildAuthorizationHeader(method, urlPath, bodyJson) {
  const c = payConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(16).toString("hex");
  const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${bodyJson}\n`;
  const signature = crypto
    .sign("sha256", Buffer.from(message, "utf8"), c.privateKey)
    .toString("base64");
  return `WECHATPAY2-SHA256-RSA2048 mchid="${c.mchid}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${c.serialNo}"`;
}

// POST /v3/pay/transactions/jsapi -> { prepay_id }
async function jsapiPrepay({ openid, outTradeNo, totalFen, description }) {
  const c = payConfig();
  const urlPath = "/v3/pay/transactions/jsapi";
  const bodyJson = JSON.stringify({
    appid: c.appid,
    mchid: c.mchid,
    description: String(description || "").slice(0, 127),
    out_trade_no: outTradeNo,
    notify_url: c.notifyUrl,
    amount: { total: totalFen, currency: "CNY" },
    payer: { openid },
  });
  const resp = await fetch(WXPAY_API_BASE + urlPath, {
    method: "POST",
    headers: {
      "Authorization": buildAuthorizationHeader("POST", urlPath, bodyJson),
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "tourista-backend/1.0",
    },
    body: bodyJson,
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.prepay_id) {
    const detail = data.code ? `${data.code}: ${data.message || ""}` : `HTTP ${resp.status}`;
    throw new Error(`WeChat Pay jsapi order failed — ${detail}`);
  }
  return data.prepay_id;
}

// Build the params object consumed by wx.requestPayment on the mini program.
// paySign = RSA-SHA256 over `${appid}\n${timeStamp}\n${nonceStr}\n${package}\n`
function buildJsapiPayParams(prepayId) {
  const c = payConfig();
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString("hex");
  const pkg = `prepay_id=${prepayId}`;
  const message = `${c.appid}\n${timeStamp}\n${nonceStr}\n${pkg}\n`;
  const paySign = crypto
    .sign("sha256", Buffer.from(message, "utf8"), c.privateKey)
    .toString("base64");
  return { timeStamp, nonceStr, package: pkg, signType: "RSA", paySign };
}

// out_trade_no rules: 6-32 chars, [a-zA-Z0-9_-] only
function sanitizeOutTradeNo(s) {
  return String(s || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
}

// ── Public API: create a JSAPI order, return wx.requestPayment params ─────
async function createPaymentOrder({ openid, outTradeNo, totalFen, description }) {
  if (!isPayConfigured()) {
    return {
      _dev: true,
      note: "WeChat Pay not configured — returning mock params",
      outTradeNo, totalFen
    };
  }
  if (!openid) throw new Error("createPaymentOrder: openid is required");
  const fee = Math.round(Number(totalFen));
  if (!Number.isInteger(fee) || fee <= 0) {
    throw new Error(`createPaymentOrder: invalid totalFen ${totalFen}`);
  }
  const tradeNo = sanitizeOutTradeNo(outTradeNo);
  if (tradeNo.length < 6) {
    throw new Error(`createPaymentOrder: out_trade_no too short "${outTradeNo}"`);
  }
  const prepayId = await jsapiPrepay({ openid, outTradeNo: tradeNo, totalFen: fee, description });
  return buildJsapiPayParams(prepayId);
}

// ── Notify: verify the request signature ───────────────────────────────────
// Signature covers `${timestamp}\n${nonce}\n${rawBody}\n`, signed with the
// WeChat Pay platform private key; we verify with the platform public key.
function verifyNotifySignature({ timestamp, nonce, signature, serial, rawBody }) {
  const key = loadPlatformPublicKey();
  if (!key) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > NOTIFY_MAX_CLOCK_SKEW_S) return false;
  const expectedSerial = process.env.WXPAY_PUBLIC_KEY_ID;
  if (expectedSerial && serial && serial !== expectedSerial) return false;
  let sigBuf;
  try {
    sigBuf = Buffer.from(signature || "", "base64");
  } catch {
    return false;
  }
  if (sigBuf.length === 0) return false;
  const message = `${timestamp}\n${nonce}\n${rawBody.toString("utf8")}\n`;
  try {
    return crypto.verify("sha256", Buffer.from(message, "utf8"), key, sigBuf);
  } catch {
    return false;
  }
}

// ── Notify: decrypt the AEAD_AES_256_GCM resource payload ──────────────────
// ciphertext = AES-256-GCM(JSON, key=APIv3 key, iv=nonce, aad=associated_data)
// with the 16-byte auth tag appended.
function decryptNotifyResource(resource) {
  const apiV3Key = payConfig().apiV3Key;
  if (!apiV3Key || apiV3Key.length !== 32) {
    throw new Error("WXPAY_APIV3_KEY must be the 32-character APIv3 key");
  }
  const { ciphertext, nonce, associated_data: aad } = resource || {};
  if (!ciphertext || !nonce) throw new Error("notify resource missing ciphertext/nonce");
  const buf = Buffer.from(ciphertext, "base64");
  if (buf.length <= 16) throw new Error("notify ciphertext too short");
  const tag = buf.subarray(buf.length - 16);
  const data = buf.subarray(0, buf.length - 16);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(apiV3Key, "utf8"),
    Buffer.from(nonce, "utf8")
  );
  decipher.setAuthTag(tag);
  if (aad) decipher.setAAD(Buffer.from(aad, "utf8"));
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return JSON.parse(plain.toString("utf8"));
}

module.exports = {
  hasWeChat, code2session, getAccessToken,
  sendSubscribeMessage, createPaymentOrder,
  isPayConfigured, payMchid, verifyNotifySignature, decryptNotifyResource
};
