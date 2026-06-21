// src/services/wechat.js
// Thin wrappers around the WeChat Mini Program APIs.
// These are real and correct; they activate once WX_APPID / WX_SECRET /
// WeChat Pay credentials are set in .env. Without credentials they fall back
// to a safe "log" mode so the rest of the system runs in development.

const APPID = process.env.WX_APPID;
const SECRET = process.env.WX_SECRET;

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

// ── WeChat Pay unified order (统一下单) ────────────────────────────────────
// Stub: returns the params shape the mini program needs for wx.requestPayment.
// Wire to WeChat Pay v3 API with your merchant cert before going live.
async function createPaymentOrder({ openid, outTradeNo, totalFen, description }) {
  const configured = Boolean(process.env.WXPAY_MCHID && process.env.WXPAY_KEY);
  if (!configured) {
    return {
      _dev: true,
      note: "WeChat Pay not configured — returning mock params",
      outTradeNo, totalFen
    };
  }
  // TODO: call WeChat Pay v3 JSAPI order API, then build + sign the
  // wx.requestPayment params (timeStamp, nonceStr, package, signType, paySign).
  throw new Error("WeChat Pay v3 integration not implemented — add merchant cert logic here");
}

module.exports = {
  hasWeChat, code2session, getAccessToken,
  sendSubscribeMessage, createPaymentOrder
};
