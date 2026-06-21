// ════════════════════════════════════════════════════════════════════════
// Tourista AR — Admin dashboard (vanilla JS, no build step)
// ════════════════════════════════════════════════════════════════════════
const API = "";  // same origin
let TOKEN = localStorage.getItem("tourista_admin_token") || null;
let TRIPS_CACHE = [];

// Country flag colors - based on African country flags
const COUNTRY_COLORS = {
  ZW: { name: "Zimbabwe", nameCn: "津巴布韦", colors: ["#2E5E1F", "#C24214"], gradient: "linear-gradient(120deg, #2E5E1F, #C24214)" },
  ZA: { name: "South Africa", nameCn: "南非", colors: ["#0E4D3C", "#1B6E9C"], gradient: "linear-gradient(120deg, #0E4D3C, #1B6E9C)" },
  KE: { name: "Kenya", nameCn: "肯尼亚", colors: ["#006600", "#FFCC00", "#000000"], gradient: "linear-gradient(120deg, #006600, #FFCC00)" },
  NG: { name: "Nigeria", nameCn: "尼日利亚", colors: ["#008751", "#FFFFFF", "#E52B50"], gradient: "linear-gradient(120deg, #008751, #E52B50)" },
  EG: { name: "Egypt", nameCn: "埃及", colors: ["#CE1126", "#FFFFFF", "#002654"], gradient: "linear-gradient(120deg, #CE1126, #002654)" },
  GH: { name: "Ghana", nameCn: "加纳", colors: ["#006B3F", "#FCD116", "#CE1126"], gradient: "linear-gradient(120deg, #006B3F, #CE1126)" },
  TZ: { name: "Tanzania", nameCn: "坦桑尼亚", colors: ["#00A651", "#FFFFFF", "#1E4D8C"], gradient: "linear-gradient(120deg, #00A651, #1E4D8C)" },
  MU: { name: "Morocco", nameCn: "摩洛哥", colors: ["#E94560", "#FFFFFF", "#262626"], gradient: "linear-gradient(120deg, #E94560, #262626)" },
  NA: { name: "Namibia", nameCn: "纳米比亚", colors: ["#007A5E", "#FFFFFF", "#CD212A"], gradient: "linear-gradient(120deg, #007A5E, #CD212A)" },
  BW: { name: "Botswana", nameCn: "博茨瓦纳", colors: ["#79BEDB", "#FFFFFF", "#004B8D"], gradient: "linear-gradient(120deg, #79BEDB, #004B8D)" },
  OTHER: { name: "Other", nameCn: "其他", colors: ["#1A1A2E", "#00A896"], gradient: "linear-gradient(120deg, #1A1A2E, #00A896)" }
};

function updateCountryColors() {
  const flag = document.getElementById("t_flag").value;
  if (!flag || !COUNTRY_COLORS[flag]) return;
  const country = COUNTRY_COLORS[flag];
  document.getElementById("t_country").value = country.nameCn;
  document.getElementById("t_countryEn").value = country.name;
  document.getElementById("t_gradient").value = country.gradient;
}

// ── Icon library (inline SVG) ────────────────────────────────────────────
const ICONS = {
  loading: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" stroke-dasharray="40 60"/><path d="M12 2v4M12 18v4" stroke-width="2.5"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  handshake: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 5"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>',
  briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'
};

// ── API client ────────────────────────────────────────────────────────────
async function api(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (TOKEN) opts.headers.Authorization = "Bearer " + TOKEN;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (res.status === 401) { logout(); throw new Error("登录已过期"); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);
  return data;
}

// ── Toast ──────────────────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2600);
}

// ── Modal ──────────────────────────────────────────────────────────────────
function openModal(title, html) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").innerHTML = html;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() { document.getElementById("modal").classList.add("hidden"); }

// ── Auth ─────────────────────────────────────────────────────────────────
async function login() {
  const username = document.getElementById("loginUser").value.trim();
  const password = document.getElementById("loginPass").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  if (!username || !password) { errEl.textContent = "请输入用户名和密码"; return; }
  try {
    const { token, admin } = await api("POST", "/admin/api/login", { username, password });
    TOKEN = token;
    localStorage.setItem("tourista_admin_token", token);
    localStorage.setItem("tourista_admin_user", JSON.stringify(admin));
    showApp(admin);
  } catch (e) {
    errEl.textContent = e.message;
  }
}

function logout() {
  TOKEN = null;
  localStorage.removeItem("tourista_admin_token");
  localStorage.removeItem("tourista_admin_user");
  document.getElementById("app").classList.add("hidden");
  document.getElementById("login").classList.remove("hidden");
}

function showApp(admin) {
  document.getElementById("login").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("sideUser").textContent = `${admin.username} · ${admin.role}`;
  navigate("overview");
}

// ── Router ─────────────────────────────────────────────────────────────────
const views = {};  // filled by view modules below
async function navigate(name) {
  document.querySelectorAll(".nav-item").forEach(n =>
    n.classList.toggle("active", n.dataset.view === name));
  const view = document.getElementById("view");
  view.innerHTML = `<div class="empty"><div class="empty-ico">⏳</div>加载中…</div>`;
  try {
    await views[name](view);
  } catch (e) {
    view.innerHTML = `<div class="empty"><div class="empty-ico">⚠️</div>${e.message}</div>`;
  }
}

// ── Shared helpers ──────────────────────────────────────────────────────────
const fmt = (n) => "¥" + Number(n || 0).toLocaleString();
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function statusBadge(status) {
  const map = {
    "待确认": "badge-gold", "待对接": "badge-gold", "报名中": "badge-green",
    "已确认": "badge-blue", "顾问已对接": "badge-blue",
    "已付订金": "badge-blue", "已结清": "badge-green", "已签约": "badge-green",
    "已完成": "badge-grey", "已取消": "badge-red", "已关闭": "badge-red"
  };
  return `<span class="badge ${map[status] || "badge-grey"}">${esc(status)}</span>`;
}

function chips(arr) {
  if (!Array.isArray(arr) || !arr.length) return '<span class="muted">—</span>';
  return `<div class="chip-row">${arr.map(a => `<span class="chip">${esc(a)}</span>`).join("")}</div>`;
}

// ── Boot ─────────────────────────────────────────────────────────────────
document.getElementById("loginBtn").onclick = login;
document.getElementById("loginPass").addEventListener("keydown", e => { if (e.key === "Enter") login(); });
document.getElementById("logoutBtn").onclick = logout;
document.getElementById("modalClose").onclick = closeModal;
document.getElementById("modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
document.querySelectorAll(".nav-item").forEach(n => n.onclick = () => navigate(n.dataset.view));

// Auto-login if token present and valid
(async function init() {
  if (!TOKEN) return;
  try {
    const { admin } = await api("GET", "/admin/api/me");
    showApp(admin);
  } catch {
    logout();
  }
})();

// ════════════════════════════════════════════════════════════════════════
// VIEW: OVERVIEW
// ════════════════════════════════════════════════════════════════════════
views.overview = async function (el) {
  const s = await api("GET", "/admin/api/stats");
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">概览 Overview</div>
        <div class="view-subtitle">实时业务数据 · Real-time business snapshot</div>
      </div>
    </div>
    <div class="stat-grid">
      <div class="stat-card accent-terra"><div class="stat-num">${s.trips}</div><div class="stat-lbl">在售行程 Active Trips</div></div>
      <div class="stat-card accent-gold"><div class="stat-num">${s.ordersPending}</div><div class="stat-lbl">待确认订单 Pending Orders</div></div>
      <div class="stat-card accent-blue"><div class="stat-num">${s.ordersTotal}</div><div class="stat-lbl">订单总数 Total Orders</div></div>
      <div class="stat-card accent-green"><div class="stat-num">${fmt(s.revenueCollected)}</div><div class="stat-lbl">已收款 Revenue Collected</div></div>
    </div>
    <div class="stat-grid" style="margin-top:16px">
      <div class="stat-card accent-gold"><div class="stat-num">${s.partnersNew}</div><div class="stat-lbl">待对接合作 New Partner Leads</div></div>
      <div class="stat-card accent-blue"><div class="stat-num">${s.partnersTotal}</div><div class="stat-lbl">合作申请总数 Total Leads</div></div>
      <div class="stat-card accent-terra"><div class="stat-num">${s.ordersConfirmed}</div><div class="stat-lbl">已确认订单 Confirmed</div></div>
      <div class="stat-card"><div class="stat-num">${s.seatsLeft}</div><div class="stat-lbl">剩余席位 Seats Remaining</div></div>
    </div>
    <div class="card" style="margin-top:24px">
      <div class="card-head">快捷操作 Quick Actions</div>
      <div style="padding:18px 20px;display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="navigate('trips')">管理行程与价格 →</button>
        <button class="btn btn-ink" onclick="navigate('orders')">查看订单 →</button>
        <button class="btn btn-ghost" onclick="navigate('partners')">合作申请 →</button>
        <button class="btn btn-ghost" onclick="navigate('notifications')">发送通知 →</button>
      </div>
    </div>`;
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: TRIPS — edit itineraries / prices / seats
// ════════════════════════════════════════════════════════════════════════
views.trips = async function (el) {
  const trips = await api("GET", "/admin/api/trips");
  TRIPS_CACHE = trips;
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">行程管理 Trips</div>
        <div class="view-subtitle">编辑行程、价格、席位 · Edit itineraries, prices & seats</div>
      </div>
      <button class="btn btn-primary" onclick="editTrip()">+ 新建行程 New Trip</button>
    </div>
    <div class="card">
      <table>
        <thead><tr>
          <th>行程 Trip</th><th>出发 Depart</th><th>会员价 Member</th><th>原价 Normal</th>
          <th>订金 Deposit</th><th>席位 Seats</th><th>状态 Status</th><th></th>
        </tr></thead>
        <tbody>
          ${trips.map(t => `
            <tr>
              <td>
                <div style="font-weight:600">${esc(t.shortTitle)}</div>
                <div class="muted" style="font-size:12px">${esc(t.id)} · ${t.days}天 · ${t.isPublished ? '已上架' : '<span style="color:var(--red)">已下架</span>'}</div>
              </td>
              <td>${esc(t.depart)}<div class="muted" style="font-size:12px">${esc(t.dateRange)}</div></td>
              <td class="price-cell">${fmt(t.memberPrice)}</td>
              <td class="muted">${fmt(t.normalPrice)}</td>
              <td>${fmt(t.deposit)}</td>
              <td><b>${t.seatsLeft}</b> <span class="muted">/ ${t.seatsTotal}</span></td>
              <td>${statusBadge(t.status)}</td>
              <td class="row-actions">
                <button class="btn btn-sm btn-ghost" onclick="quickPrice('${t.id}')">改价/席位</button>
                <button class="btn btn-sm btn-ink" onclick="editTrip('${t.id}')">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTrip('${t.id}')">删除</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>`;
};

// Quick price + seats adjustment (most common task)
window.quickPrice = function (id) {
  const t = TRIPS_CACHE.find(x => x.id === id);
  openModal(`快速调整 · ${t.shortTitle}`, `
    <div class="form-grid">
      <div class="form-field"><label>会员价 Member Price</label><input id="q_member" type="number" value="${t.memberPrice}"/></div>
      <div class="form-field"><label>原价 Normal Price</label><input id="q_normal" type="number" value="${t.normalPrice}"/></div>
      <div class="form-field"><label>订金 Deposit</label><input id="q_deposit" type="number" value="${t.deposit}"/></div>
      <div class="form-field"><label>剩余席位 Seats Left</label><input id="q_seats" type="number" value="${t.seatsLeft}"/></div>
      <div class="form-field"><label>状态 Status</label>
        <select id="q_status">
          ${["报名中","名额紧张","已满","已结束"].map(s => `<option ${t.status === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </div>
      <div class="form-field"><label>上架 Published</label>
        <select id="q_pub"><option value="1" ${t.isPublished ? "selected" : ""}>已上架 Yes</option><option value="0" ${!t.isPublished ? "selected" : ""}>已下架 No</option></select>
      </div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="saveQuickPrice('${id}')">保存 Save</button>
    </div>`);
};

window.saveQuickPrice = async function (id) {
  const patch = {
    memberPrice: Number(document.getElementById("q_member").value),
    normalPrice: Number(document.getElementById("q_normal").value),
    deposit: Number(document.getElementById("q_deposit").value),
    seatsLeft: Number(document.getElementById("q_seats").value),
    status: document.getElementById("q_status").value,
    isPublished: document.getElementById("q_pub").value === "1"
  };
  try {
    await api("PATCH", `/admin/api/trips/${id}`, patch);
    closeModal(); toast("已更新 Updated", "success"); navigate("trips");
  } catch (e) { toast(e.message, "error"); }
};

window.deleteTrip = async function (id) {
  if (!confirm("确认删除该行程？此操作不可撤销。\nDelete this trip permanently?")) return;
  try {
    await api("DELETE", `/admin/api/trips/${id}`);
    toast("已删除 Deleted", "success"); navigate("trips");
  } catch (e) { toast(e.message, "error"); }
};

// ── Full trip editor (create + edit, incl. itinerary) ──────────────────────
window.editTrip = function (id) {
  const t = id ? TRIPS_CACHE.find(x => x.id === id) : {
    id: "", flag: "", country: "", countryEn: "", shortTitle: "", shortTitleEn: "",
    title: "", titleEn: "", days: 7, nights: 6, depart: "", departShort: "", dateRange: "",
    structure: "4天商务 + 1天休闲", structureEn: "4 Business Days + 1 Leisure Day",
    lead: "", leadEn: "", gradient: "linear-gradient(120deg,#2E5E1F,#C24214)",
    memberPrice: 0, normalPrice: 0, deposit: 0, seatsTotal: 15, seatsLeft: 15,
    status: "报名中", statusEn: "Registering", statusTag: "tag-terra", seatTag: "", seatTagEn: "",
    highlights: [], highlightsEn: [], summary: "", summaryEn: "",
    includes: [], includesEn: [], itinerary: [], isPublished: true
  };
  const isNew = !id;
  const field = (k, label, val, type = "text") =>
    `<div class="form-field"><label>${label}</label><input id="t_${k}" type="${type}" value="${esc(val)}"/></div>`;

  openModal(isNew ? "新建行程 New Trip" : `编辑行程 · ${esc(t.shortTitle)}`, `
    <div class="form-grid">
      <div class="form-field"><label>行程ID Trip ID ${isNew ? "" : "(不可改)"}</label>
        <input id="t_id" value="${esc(t.id)}" ${isNew ? 'placeholder="e.g. kenya"' : "disabled"}/></div>
      <div class="form-field"><label>国家 Country</label>
        <select id="t_flag" onchange="updateCountryColors()">
          <option value="">Select Country</option>
          ${Object.entries(COUNTRY_COLORS).map(([code, data]) => `<option ${t.flag === code ? "selected" : ""} value="${code}">${code} - ${data.nameCn} / ${data.name}</option>`).join("")}
        </select></div>
      <div class="form-field"><label>国家名称 Country (中)</label><input id="t_country" value="${esc(t.country)}"/></div>
      <div class="form-field"><label>Country Name (EN)</label><input id="t_countryEn" value="${esc(t.countryEn)}"/></div>
      ${field("shortTitle", "短标题 Short Title (中)", t.shortTitle)}
      ${field("shortTitleEn", "Short Title (EN)", t.shortTitleEn)}
      ${field("title", "完整标题 Title (中)", t.title)}
      ${field("titleEn", "Title (EN)", t.titleEn)}
      ${field("days", "天数 Days", t.days, "number")}
      ${field("nights", "晚数 Nights", t.nights, "number")}
      ${field("depart", "出发日期 Depart (2026.07.19)", t.depart)}
      ${field("dateRange", "日期范围 Range (07.19—07.25)", t.dateRange)}
      ${field("memberPrice", "会员价 Member Price", t.memberPrice, "number")}
      ${field("normalPrice", "原价 Normal Price", t.normalPrice, "number")}
      ${field("deposit", "订金 Deposit", t.deposit, "number")}
      ${field("seatsTotal", "总席位 Total Seats", t.seatsTotal, "number")}
      ${field("seatsLeft", "剩余席位 Seats Left", t.seatsLeft, "number")}
      ${field("seatTag", "席位标签 Seat Tag (中)", t.seatTag)}
      ${field("lead", "亮点语 Lead (中)", t.lead)}
      ${field("leadEn", "Lead (EN)", t.leadEn)}
      <div class="form-field full"><label>摘要 Summary (中)</label><input id="t_summary" value="${esc(t.summary)}"/></div>
      <div class="form-field full"><label>Summary (EN)</label><input id="t_summaryEn" value="${esc(t.summaryEn)}"/></div>
      <div class="form-field"><label>渐变色 Gradient (CSS)</label><input id="t_gradient" value="${esc(t.gradient)}"/></div>
      <div class="form-field"><label>状态标签色 Status Tag</label>
        <select id="t_statusTag">
          ${["tag-terra","tag-green","tag-gold"].map(s => `<option ${t.statusTag === s ? "selected" : ""}>${s}</option>`).join("")}
        </select></div>
      <div class="form-field full"><label>亮点 Highlights (中, 逗号分隔)</label><input id="t_highlights" value="${esc((t.highlights||[]).join(", "))}"/></div>
      <div class="form-field full"><label>Highlights (EN, comma separated)</label><input id="t_highlightsEn" value="${esc((t.highlightsEn||[]).join(", "))}"/></div>
      <div class="form-field full"><label>费用包含 Includes (中, 逗号分隔)</label><textarea id="t_includes">${esc((t.includes||[]).join(", "))}</textarea></div>
      <div class="form-field full"><label>Includes (EN, comma separated)</label><textarea id="t_includesEn">${esc((t.includesEn||[]).join(", "))}</textarea></div>
    </div>

    <div style="margin-top:20px;font-weight:600;font-size:14px">每日行程 Itinerary</div>
    <div class="form-hint" style="margin-bottom:10px">VIP=政商接待日(金边) · 休闲=休闲体验日(金底)</div>
    <div id="itinList">
      ${(t.itinerary||[]).map((d, i) => itinRowHtml(d, i)).join("")}
    </div>
    <button class="btn btn-sm btn-ghost" onclick="addItinRow()">+ 添加一天 Add Day</button>

    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">取消 Cancel</button>
      <button class="btn btn-primary" onclick="saveTrip(${isNew})">${isNew ? "创建 Create" : "保存 Save"}</button>
    </div>`);
};

function itinRowHtml(d, i) {
  return `<div class="itin-row" data-i="${i}">
    <input class="itin-day" type="number" value="${d.day || i + 1}" title="Day"/>
    <div><input class="itin-title" value="${esc(d.title || "")}" placeholder="标题 中"/>
         <input class="itin-titleEn" value="${esc(d.titleEn || "")}" placeholder="Title EN" style="margin-top:4px"/></div>
    <div><input class="itin-desc" value="${esc(d.desc || "")}" placeholder="描述 中"/>
         <input class="itin-descEn" value="${esc(d.descEn || "")}" placeholder="Desc EN" style="margin-top:4px"/></div>
    <div class="itin-flags">
      <label><input type="checkbox" class="itin-vip" ${d.vip ? "checked" : ""}/>VIP</label>
      <label><input type="checkbox" class="itin-leisure" ${d.leisure ? "checked" : ""}/>休闲</label>
    </div>
    <button class="btn btn-sm btn-danger" onclick="this.parentElement.remove()">×</button>
  </div>`;
}
window.addItinRow = function () {
  const list = document.getElementById("itinList");
  const i = list.children.length;
  list.insertAdjacentHTML("beforeend", itinRowHtml({ day: i + 1 }, i));
};

window.saveTrip = async function (isNew) {
  const v = (id) => document.getElementById(id).value;
  const arr = (id) => v(id).split(",").map(s => s.trim()).filter(Boolean);

  const itinerary = [...document.querySelectorAll("#itinList .itin-row")].map(row => ({
    day: Number(row.querySelector(".itin-day").value),
    title: row.querySelector(".itin-title").value,
    titleEn: row.querySelector(".itin-titleEn").value,
    desc: row.querySelector(".itin-desc").value,
    descEn: row.querySelector(".itin-descEn").value,
    vip: row.querySelector(".itin-vip").checked,
    leisure: row.querySelector(".itin-leisure").checked
  }));

  const payload = {
    id: v("t_id"),
    flag: v("t_flag"), country: v("t_country"), countryEn: v("t_countryEn"),
    shortTitle: v("t_shortTitle"), shortTitleEn: v("t_shortTitleEn"),
    title: v("t_title"), titleEn: v("t_titleEn"),
    days: Number(v("t_days")), nights: Number(v("t_nights")),
    depart: v("t_depart"), dateRange: v("t_dateRange"),
    departShort: v("t_depart").split(".").slice(1).join(".") + "出发",
    memberPrice: Number(v("t_memberPrice")), normalPrice: Number(v("t_normalPrice")),
    deposit: Number(v("t_deposit")), seatsTotal: Number(v("t_seatsTotal")), seatsLeft: Number(v("t_seatsLeft")),
    seatTag: v("t_seatTag"), lead: v("t_lead"), leadEn: v("t_leadEn"),
    summary: v("t_summary"), summaryEn: v("t_summaryEn"),
    gradient: v("t_gradient"), statusTag: v("t_statusTag"),
    highlights: arr("t_highlights"), highlightsEn: arr("t_highlightsEn"),
    includes: arr("t_includes"), includesEn: arr("t_includesEn"),
    itinerary
  };
  if (!payload.id) { toast("行程ID必填", "error"); return; }
  try {
    if (isNew) await api("POST", "/admin/api/trips", payload);
    else await api("PUT", `/admin/api/trips/${payload.id}`, payload);
    closeModal(); toast(isNew ? "已创建 Created" : "已保存 Saved", "success"); navigate("trips");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: ORDERS — track orders & payments
// ════════════════════════════════════════════════════════════════════════
let ORDER_FILTER = "";
views.orders = async function (el) {
  const q = ORDER_FILTER ? `?status=${encodeURIComponent(ORDER_FILTER)}` : "";
  const orders = await api("GET", "/admin/api/orders" + q);
  const statuses = ["", "待确认", "已付订金", "已确认", "已结清", "已完成", "已取消"];
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">订单管理 Orders</div>
        <div class="view-subtitle">跟踪报名与付款 · Track bookings & payments</div>
      </div>
    </div>
    <div class="filters">
      ${statuses.map(s => `<div class="filter-pill ${ORDER_FILTER === s ? "on" : ""}" onclick="setOrderFilter('${s}')">${s || "全部 All"}</div>`).join("")}
    </div>
    <div class="card">
      ${orders.length ? `
      <table>
        <thead><tr>
          <th>订单号 Order</th><th>客户 Customer</th><th>行程 Trip</th><th>金额 Amount</th>
          <th>订金 Deposit</th><th>余款 Balance</th><th>状态 Status</th><th></th>
        </tr></thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td class="mono">${esc(o.id)}<div class="muted" style="font-size:11px">${esc((o.createdAt||"").slice(0,10))}</div></td>
              <td><b>${esc(o.customerName)}</b><div class="muted" style="font-size:12px">${esc(o.phone)}</div></td>
              <td>${esc(o.title)}<div class="muted" style="font-size:12px">${esc(o.depart)}</div></td>
              <td class="price-cell">${fmt(o.totalPrice)}</td>
              <td>${o.depositPaid ? '<span class="badge badge-green">已付</span>' : '<span class="badge badge-grey">未付</span>'}<div class="muted" style="font-size:12px">${fmt(o.deposit)}</div></td>
              <td>${o.balancePaid ? '<span class="badge badge-green">已付</span>' : '<span class="badge badge-gold">待付</span>'}<div class="muted" style="font-size:12px">${fmt(o.balance)}</div></td>
              <td>${statusBadge(o.status)}</td>
              <td class="row-actions"><button class="btn btn-sm btn-ink" onclick="viewOrder('${o.id}')">详情/管理</button></td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">📭</div>暂无订单 No orders yet</div>`}
    </div>`;
};
window.setOrderFilter = function (s) { ORDER_FILTER = s; navigate("orders"); };

window.viewOrder = async function (id) {
  const o = await api("GET", `/admin/api/orders/${id}`);
  const row = (k, v) => `<div class="detail-row"><div class="detail-k">${k}</div><div class="detail-v">${v}</div></div>`;
  const checklist = (o.checklist || []).map(c =>
    `<div style="font-size:13px;padding:4px 0">${c.done ? "✅" : "⬜"} ${esc(c.label)}</div>`).join("") || '<span class="muted">—</span>';
  openModal(`订单 · ${esc(o.id)}`, `
    ${row("客户 Customer", esc(o.customerName))}
    ${row("电话 Phone", esc(o.phone))}
    ${row("护照 Passport", esc(o.passport) || "—")}
    ${row("企业 Company", esc(o.company) || "—")}
    ${row("行程 Trip", esc(o.title))}
    ${row("出发 Depart", esc(o.depart) + " · " + esc(o.city))}
    ${row("总价 Total", `<b class="price-cell">${fmt(o.totalPrice)}</b>`)}
    ${row("订金 Deposit", fmt(o.deposit) + (o.depositPaid ? ' <span class="badge badge-green">已付</span>' : ' <span class="badge badge-grey">未付</span>'))}
    ${row("余款 Balance", fmt(o.balance) + (o.balancePaid ? ' <span class="badge badge-green">已付</span>' : ' <span class="badge badge-gold">待付 (' + esc(o.balanceDue) + ')</span>'))}
    ${row("出行准备 Checklist", checklist)}
    ${row("备注 Notes", `<textarea id="o_notes" style="width:100%;min-height:50px;border:1px solid var(--line);border-radius:8px;padding:8px">${esc(o.notes || "")}</textarea>`)}
    ${row("状态 Status", `<select id="o_status">
        ${["待确认","已付订金","已确认","已结清","已完成","已取消"].map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>`)}
    <div class="modal-foot">
      ${!o.depositPaid ? `<button class="btn btn-green btn-sm" onclick="markPaid('${o.id}','deposit')">标记订金已付</button>` : ""}
      ${!o.balancePaid ? `<button class="btn btn-green btn-sm" onclick="markPaid('${o.id}','balance')">标记余款已付</button>` : ""}
      <button class="btn btn-primary" onclick="saveOrder('${o.id}')">保存 Save</button>
    </div>`);
};
window.markPaid = async function (id, kind) {
  try { await api("POST", `/admin/api/orders/${id}/mark-paid`, { kind }); closeModal(); toast("已记录付款 Payment recorded", "success"); navigate("orders"); }
  catch (e) { toast(e.message, "error"); }
};
window.saveOrder = async function (id) {
  try {
    await api("PUT", `/admin/api/orders/${id}`, {
      status: document.getElementById("o_status").value,
      notes: document.getElementById("o_notes").value
    });
    closeModal(); toast("已保存 Saved", "success"); navigate("orders");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: PARTNERS — manage partner leads
// ════════════════════════════════════════════════════════════════════════
let PARTNER_FILTER = "";
views.partners = async function (el) {
  const q = PARTNER_FILTER ? `?status=${encodeURIComponent(PARTNER_FILTER)}` : "";
  const apps = await api("GET", "/admin/api/partner-apps" + q);
  const statuses = ["", "待对接", "顾问已对接", "已签约", "已关闭"];
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">合作申请 Partner Leads</div>
        <div class="view-subtitle">管理企业合作意向 · Manage partnership applications</div>
      </div>
    </div>
    <div class="filters">
      ${statuses.map(s => `<div class="filter-pill ${PARTNER_FILTER === s ? "on" : ""}" onclick="setPartnerFilter('${s}')">${s || "全部 All"}</div>`).join("")}
    </div>
    <div class="card">
      ${apps.length ? `
      <table>
        <thead><tr>
          <th>企业 Company</th><th>联系人 Contact</th><th>类目 Categories</th>
          <th>合作方式 Modes</th><th>市场 Markets</th><th>状态 Status</th><th></th>
        </tr></thead>
        <tbody>
          ${apps.map(a => `
            <tr>
              <td><b>${esc(a.company)}</b><div class="muted" style="font-size:11px">${esc((a.createdAt||"").slice(0,10))}</div></td>
              <td>${esc(a.contact)}<div class="muted" style="font-size:12px">微信 ${esc(a.wechat)}</div></td>
              <td>${chips(a.categories)}</td>
              <td>${chips(a.modes)}</td>
              <td>${chips(a.markets)}</td>
              <td>${statusBadge(a.status)}</td>
              <td class="row-actions"><button class="btn btn-sm btn-ink" onclick="viewPartner('${a.id}')">详情/管理</button></td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">🤝</div>暂无合作申请 No partner leads yet</div>`}
    </div>`;
};
window.setPartnerFilter = function (s) { PARTNER_FILTER = s; navigate("partners"); };

window.viewPartner = async function (id) {
  const a = await api("GET", `/admin/api/partner-apps/${id}`);
  const row = (k, v) => `<div class="detail-row"><div class="detail-k">${k}</div><div class="detail-v">${v}</div></div>`;
  openModal(`合作申请 · ${esc(a.company)}`, `
    ${row("企业 Company", esc(a.company))}
    ${row("联系人 Contact", esc(a.contact))}
    ${row("微信 WeChat", `<b>${esc(a.wechat)}</b>`)}
    ${row("电话 Phone", esc(a.phone) || "—")}
    ${row("产品类目 Categories", chips(a.categories))}
    ${row("合作方式 Modes", chips(a.modes))}
    ${row("目标市场 Markets", chips(a.markets))}
    ${row("提交时间 Created", esc((a.createdAt||"").slice(0,16))) }
    ${row("备注 Notes", `<textarea id="p_notes" style="width:100%;min-height:60px;border:1px solid var(--line);border-radius:8px;padding:8px">${esc(a.notes || "")}</textarea>`)}
    ${row("状态 Status", `<select id="p_status">
        ${["待对接","顾问已对接","已签约","已关闭"].map(s => `<option ${a.status === s ? "selected" : ""}>${s}</option>`).join("")}
      </select>`)}
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="copyWeChat('${esc(a.wechat)}')">复制微信号</button>
      <button class="btn btn-primary" onclick="savePartner('${a.id}')">保存 Save</button>
    </div>`);
};
window.copyWeChat = function (w) { navigator.clipboard?.writeText(w); toast("已复制微信号: " + w, "success"); };
window.savePartner = async function (id) {
  try {
    await api("PUT", `/admin/api/partner-apps/${id}`, {
      status: document.getElementById("p_status").value,
      notes: document.getElementById("p_notes").value
    });
    closeModal(); toast("已保存 Saved", "success"); navigate("partners");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: NOTIFICATIONS — notify clients
// ════════════════════════════════════════════════════════════════════════
views.notifications = async function (el) {
  const [orders, partners, log] = await Promise.all([
    api("GET", "/admin/api/orders"),
    api("GET", "/admin/api/partner-apps"),
    api("GET", "/admin/api/notifications?limit=50")
  ]);
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">客户通知 Notifications</div>
        <div class="view-subtitle">向订单客户或合作企业发送通知 · Notify customers & partner leads</div>
      </div>
    </div>
    <div class="card">
      <div class="card-head">发送通知 Send Notification</div>
      <div style="padding:20px">
        <div class="form-grid">
          <div class="form-field">
            <label>接收对象类型 Audience</label>
            <select id="n_audience" onchange="onAudienceChange()">
              <option value="order">订单客户 Order customer</option>
              <option value="partner">合作企业 Partner lead</option>
            </select>
          </div>
          <div class="form-field">
            <label>选择对象 Target</label>
            <select id="n_target">
              ${orders.map(o => `<option value="${o.id}">${esc(o.customerName)} · ${esc(o.title)}</option>`).join("")}
            </select>
          </div>
          <div class="form-field full"><label>标题 Title</label><input id="n_title" placeholder="如：行程确认通知"/></div>
          <div class="form-field full"><label>内容 Message</label><textarea id="n_body" placeholder="通知内容…"></textarea></div>
          <div class="form-field full">
            <label>WeChat 订阅消息模板ID (可选) Subscribe-message template ID (optional)</label>
            <input id="n_template" placeholder="留空 = 仅记录, 由顾问通过微信跟进"/>
            <div class="form-hint">填写模板ID且客户已授权该模板时，将通过微信下发；否则仅作为内部记录，由顾问通过微信/电话跟进。</div>
          </div>
        </div>
        <div style="margin-top:16px"><button class="btn btn-primary" onclick="sendNotification()">发送 Send</button></div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">通知记录 Notification Log</div>
      ${log.length ? `
      <table>
        <thead><tr><th>时间 Time</th><th>对象 Audience</th><th>标题 Title</th><th>渠道 Channel</th><th>状态 Status</th></tr></thead>
        <tbody>
          ${log.map(n => `<tr>
            <td class="muted mono">${esc((n.created_at||"").slice(0,16))}</td>
            <td>${esc(n.audience)} ${esc(n.target_id || "")}</td>
            <td>${esc(n.title)}</td>
            <td>${n.channel === "subscribe" ? '<span class="badge badge-blue">微信</span>' : '<span class="badge badge-grey">记录</span>'}</td>
            <td>${n.status === "sent" ? '<span class="badge badge-green">已发送</span>' : n.status === "failed" ? '<span class="badge badge-red">失败</span>' : '<span class="badge badge-gold">已记录</span>'}</td>
          </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">✉️</div>暂无通知记录 No notifications yet</div>`}
    </div>`;
  // stash for audience switching
  window._notifyData = { orders, partners };
};
window.onAudienceChange = function () {
  const aud = document.getElementById("n_audience").value;
  const { orders, partners } = window._notifyData;
  const target = document.getElementById("n_target");
  target.innerHTML = aud === "order"
    ? orders.map(o => `<option value="${o.id}">${esc(o.customerName)} · ${esc(o.title)}</option>`).join("")
    : partners.map(p => `<option value="${p.id}">${esc(p.company)} · ${esc(p.contact)}</option>`).join("");
};
window.sendNotification = async function () {
  const payload = {
    audience: document.getElementById("n_audience").value,
    targetId: document.getElementById("n_target").value,
    title: document.getElementById("n_title").value,
    body: document.getElementById("n_body").value,
    templateId: document.getElementById("n_template").value || undefined
  };
  if (!payload.targetId) { toast("请选择接收对象", "error"); return; }
  if (!payload.title) { toast("请输入标题", "error"); return; }
  try {
    const r = await api("POST", "/admin/api/notifications", payload);
    toast(r.sendResult && r.sendResult.ok ? "已发送 Sent" : "已记录 Logged", "success");
    navigate("notifications");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: STORIES — manage success stories
// ════════════════════════════════════════════════════════════════════════
views.stories = async function (el) {
  const stories = await api("GET", "/admin/api/stories");
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">成功案例 Success Stories</div>
        <div class="view-subtitle">管理成功案例内容 · Manage success story content</div>
      </div>
      <button class="btn btn-primary" onclick="editStory()">+ 新建案例 New Story</button>
    </div>
    <div class="card">
      ${stories.length ? `
      <table>
        <thead><tr>
          <th>标题 Title</th><th>公司 Company</th><th>分类 Category</th>
          <th>精选 Featured</th><th>创建时间 Created</th><th></th>
        </tr></thead>
        <tbody>
          ${stories.map(s => `
            <tr>
              <td><b>${esc(s.title)}</b><div class="muted" style="font-size:12px">${esc(s.titleEn || "")}</div></td>
              <td>${esc(s.company)}</td>
              <td>${statusBadge(s.category)}</td>
              <td>${s.featured ? '<span class="badge badge-green">是 Yes</span>' : '<span class="badge badge-grey">否 No</span>'}</td>
              <td class="muted">${esc((s.createdAt||"").slice(0,10))}</td>
              <td class="row-actions">
                <button class="btn btn-sm btn-ink" onclick="editStory('${s.id}')">编辑 Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteStory('${s.id}')">删除 Delete</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">${ICONS.trophy}</div>暂无案例 No stories yet</div>`}
    </div>`;
};

window.editStory = function (id) {
  const s = id ? null : { title: "", titleEn: "", company: "", companyEn: "", category: "business", summary: "", summaryEn: "", content: "", contentEn: "", featured: false };
  // For editing, we'd need to fetch the story - simplified for now
  openModal(id ? "编辑案例 Edit Story" : "新建案例 New Story", `
    <div class="form-grid">
      <div class="form-field full"><label>标题 Title (中)</label><input id="s_title" placeholder="案例标题"/></div>
      <div class="form-field full"><label>Title (EN)</label><input id="s_titleEn" placeholder="Story title"/></div>
      <div class="form-field"><label>公司 Company (中)</label><input id="s_company" placeholder="公司名称"/></div>
      <div class="form-field"><label>Company (EN)</label><input id="s_companyEn" placeholder="Company name"/></div>
      <div class="form-field"><label>分类 Category</label>
        <select id="s_category">
          <option value="business">商务 Business</option>
          <option value="investment">投资 Investment</option>
          <option value="tour">考察团 Tour</option>
        </select></div>
      <div class="form-field"><label>精选 Featured</label>
        <select id="s_featured"><option value="0">否 No</option><option value="1">是 Yes</option></select></div>
      <div class="form-field full"><label>摘要 Summary (中)</label><textarea id="s_summary" placeholder="简短摘要"></textarea></div>
      <div class="form-field full"><label>Summary (EN)</label><textarea id="s_summaryEn" placeholder="Brief summary"></textarea></div>
      <div class="form-field full"><label>详细内容 Content (中)</label><textarea id="s_content" style="min-height:100px" placeholder="详细内容"></textarea></div>
      <div class="form-field full"><label>Content (EN)</label><textarea id="s_contentEn" style="min-height:100px" placeholder="Full content"></textarea></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">取消 Cancel</button>
      <button class="btn btn-primary" onclick="saveStory('${id || ""}')">保存 Save</button>
    </div>`);
};

window.saveStory = async function (id) {
  const payload = {
    title: document.getElementById("s_title").value,
    titleEn: document.getElementById("s_titleEn").value,
    company: document.getElementById("s_company").value,
    companyEn: document.getElementById("s_companyEn").value,
    category: document.getElementById("s_category").value,
    featured: document.getElementById("s_featured").value === "1",
    summary: document.getElementById("s_summary").value,
    summaryEn: document.getElementById("s_summaryEn").value,
    content: document.getElementById("s_content").value,
    contentEn: document.getElementById("s_contentEn").value
  };
  if (!payload.title) { toast("请输入标题", "error"); return; }
  try {
    if (id) await api("PUT", `/admin/api/stories/${id}`, payload);
    else await api("POST", "/admin/api/stories", payload);
    closeModal(); toast("已保存 Saved", "success"); navigate("stories");
  } catch (e) { toast(e.message, "error"); }
};

window.deleteStory = async function (id) {
  if (!confirm("确认删除该案例？\nDelete this story?")) return;
  try {
    await api("DELETE", `/admin/api/stories/${id}`);
    toast("已删除 Deleted", "success"); navigate("stories");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: OPPORTUNITIES — manage African opportunities
// ════════════════════════════════════════════════════════════════════════
views.opportunities = async function (el) {
  const opps = await api("GET", "/admin/api/opportunities");
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">非洲商机 African Opportunities</div>
        <div class="view-subtitle">管理投资与贸易机会 · Manage investment & trade opportunities</div>
      </div>
      <button class="btn btn-primary" onclick="editOpportunity()">+ 新建机会 New Opportunity</button>
    </div>
    <div class="card">
      ${opps.length ? `
      <table>
        <thead><tr>
          <th>标题 Title</th><th>国家 Country</th><th>类型 Type</th>
          <th>分类 Category</th><th>状态 Status</th><th></th>
        </tr></thead>
        <tbody>
          ${opps.map(o => `
            <tr>
              <td><b>${esc(o.title)}</b><div class="muted" style="font-size:12px">${esc(o.titleEn || "")}</div></td>
              <td>${esc(o.country)}</td>
              <td>${o.type === 'demand' ? '<span class="badge badge-gold">需求 Demand</span>' : '<span class="badge badge-blue">机会 Opportunity</span>'}</td>
              <td>${statusBadge(o.category)}</td>
              <td>${o.isPublished ? '<span class="badge badge-green">已发布</span>' : '<span class="badge badge-grey">草稿</span>'}</td>
              <td class="row-actions">
                <button class="btn btn-sm btn-ink" onclick="editOpportunity('${o.id}')">编辑 Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteOpportunity('${o.id}')">删除 Delete</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">${ICONS.briefcase}</div>暂无机会 No opportunities yet</div>`}
    </div>`;
};

window.editOpportunity = function (id) {
  openModal(id ? "编辑机会 Edit Opportunity" : "新建机会 New Opportunity", `
    <div class="form-grid">
      <div class="form-field full"><label>标题 Title (中)</label><input id="o_title" placeholder="机会标题"/></div>
      <div class="form-field full"><label>Title (EN)</label><input id="o_titleEn" placeholder="Opportunity title"/></div>
      <div class="form-field"><label>国家 Country (中)</label><input id="o_country" placeholder="国家"/></div>
      <div class="form-field"><label>Country (EN)</label><input id="o_countryEn" placeholder="Country"/></div>
      <div class="form-field"><label>类型 Type</label>
        <select id="o_type">
          <option value="opportunity">机会 Opportunity</option>
          <option value="demand">需求 Demand</option>
        </select></div>
      <div class="form-field"><label>分类 Category</label>
        <select id="o_category">
          <option value="investment">投资 Investment</option>
          <option value="trade">贸易 Trade</option>
          <option value="joint_venture">合资 Joint Venture</option>
          <option value="supply">供应 Supply</option>
          <option value="project">项目 Project</option>
        </select></div>
      <div class="form-field full"><label>描述 Description (中)</label><textarea id="o_description" placeholder="详细描述"></textarea></div>
      <div class="form-field full"><label>Description (EN)</label><textarea id="o_descriptionEn" placeholder="Detailed description"></textarea></div>
      <div class="form-field"><label>预算 Budget</label><input id="o_budget" placeholder="如: $50,000 - $100,000"/></div>
      <div class="form-field"><label>截止日期 Deadline</label><input id="o_deadline" placeholder="2026-12-31"/></div>
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">取消 Cancel</button>
      <button class="btn btn-primary" onclick="saveOpportunity('${id || ""}')">保存 Save</button>
    </div>`);
};

window.saveOpportunity = async function (id) {
  const payload = {
    title: document.getElementById("o_title").value,
    titleEn: document.getElementById("o_titleEn").value,
    country: document.getElementById("o_country").value,
    countryEn: document.getElementById("o_countryEn").value,
    type: document.getElementById("o_type").value,
    category: document.getElementById("o_category").value,
    description: document.getElementById("o_description").value,
    descriptionEn: document.getElementById("o_descriptionEn").value,
    budget: document.getElementById("o_budget").value,
    deadline: document.getElementById("o_deadline").value
  };
  if (!payload.title) { toast("请输入标题", "error"); return; }
  try {
    if (id) await api("PUT", `/admin/api/opportunities/${id}`, payload);
    else await api("POST", "/admin/api/opportunities", payload);
    closeModal(); toast("已保存 Saved", "success"); navigate("opportunities");
  } catch (e) { toast(e.message, "error"); }
};

window.deleteOpportunity = async function (id) {
  if (!confirm("确认删除该机会？\nDelete this opportunity?")) return;
  try {
    await api("DELETE", `/admin/api/opportunities/${id}`);
    toast("已删除 Deleted", "success"); navigate("opportunities");
  } catch (e) { toast(e.message, "error"); }
};

// ════════════════════════════════════════════════════════════════════════
// VIEW: INQUIRIES — manage user questions/intents
// ════════════════════════════════════════════════════════════════════════
views.inquiries = async function (el) {
  const inquiries = await api("GET", "/admin/api/inquiries");
  el.innerHTML = `
    <div class="view-head">
      <div>
        <div class="view-title">用户咨询 User Inquiries</div>
        <div class="view-subtitle">管理用户提问与合作意向 · Manage questions & intents</div>
      </div>
    </div>
    <div class="card">
      ${inquiries.length ? `
      <table>
        <thead><tr>
          <th>类型 Type</th><th>内容 Content</th><th>用户 User</th>
          <th>状态 Status</th><th>时间 Created</th><th></th>
        </tr></thead>
        <tbody>
          ${inquiries.map(i => `
            <tr>
              <td>${i.type === 'story_question' ? '案例提问' : i.type === 'opportunity_intent' ? '合作意向' : '咨询'}</td>
              <td><b>${esc(i.targetTitle || "")}</b><div class="muted" style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis">${esc(i.content || "")}</div></td>
              <td>${esc(i.userName)}<div class="muted" style="font-size:11px">${esc(i.userPhone || "")}</div></td>
              <td>${i.status === 'new' ? '<span class="badge badge-gold">新 New</span>' : i.status === 'contacted' ? '<span class="badge badge-blue">已联系</span>' : '<span class="badge badge-grey">已关闭</span>'}</td>
              <td class="muted">${esc((i.createdAt||"").slice(0,16))}</td>
              <td class="row-actions">
                <button class="btn btn-sm btn-ink" onclick="viewInquiry('${i.id}')">详情 Detail</button>
              </td>
            </tr>`).join("")}
        </tbody>
      </table>` : `<div class="empty"><div class="empty-ico">${ICONS.chat}</div>暂无咨询 No inquiries yet</div>`}
    </div>`;
};

window.viewInquiry = async function (id) {
  const i = await api("GET", `/admin/api/inquiries/${id}`);
  const row = (k, v) => `<div class="detail-row"><div class="detail-k">${k}</div><div class="detail-v">${v}</div></div>`;
  openModal(`咨询详情 · ${esc(i.targetTitle || "General")}`, `
    ${row("类型 Type", i.type === 'story_question' ? '案例提问 Story Question' : i.type === 'opportunity_intent' ? '合作意向 Intent' : '咨询 Inquiry')}
    ${row("相关内容 Related", esc(i.targetTitle || "—"))}
    ${row("内容 Content", esc(i.content || "—"))}
    ${row("用户 User", esc(i.userName))}
    ${row("电话 Phone", esc(i.userPhone || "—"))}
    ${row("公司 Company", esc(i.userCompany || "—"))}
    ${row("备注 Notes", `<textarea id="i_notes" style="width:100%;min-height:60px;border:1px solid var(--line);border-radius:8px;padding:8px">${esc(i.notes || "")}</textarea>`)}
    ${row("状态 Status", `<select id="i_status">
        <option value="new" ${i.status === 'new' ? 'selected' : ''}>新 New</option>
        <option value="contacted" ${i.status === 'contacted' ? 'selected' : ''}>已联系 Contacted</option>
        <option value="closed" ${i.status === 'closed' ? 'selected' : ''}>已关闭 Closed</option>
      </select>`)}
    <div class="modal-foot">
      <button class="btn btn-ghost" onclick="closeModal()">取消 Cancel</button>
      <button class="btn btn-primary" onclick="saveInquiry('${i.id}')">保存 Save</button>
    </div>`);
};

window.saveInquiry = async function (id) {
  try {
    await api("PUT", `/admin/api/inquiries/${id}`, {
      status: document.getElementById("i_status").value,
      notes: document.getElementById("i_notes").value
    });
    closeModal(); toast("已保存 Saved", "success"); navigate("inquiries");
  } catch (e) { toast(e.message, "error"); }
};
