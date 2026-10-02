// src/db/index.js
// Uses Node's built-in SQLite (node:sqlite, Node >= 22.5).
// Zero native compilation, single-file persistent DB.
const { DatabaseSync } = require("node:sqlite");
const path = require("node:path");
const fs = require("node:fs");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "tourista.db");
const db = new DatabaseSync(DB_PATH);

// Pragmas for reliability + concurrency
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// ── Schema ──────────────────────────────────────────────────────────────
// JSON-shaped fields (itinerary, includes, highlights, checklist, arrays)
// are stored as TEXT containing JSON. Helpers in models parse/stringify.
db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'manager',   -- 'admin' | 'manager'
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trips (
  id            TEXT PRIMARY KEY,                   -- 'zw' | 'sa' | 'both' | custom
  flag          TEXT,
  country       TEXT, country_en TEXT,
  title         TEXT, title_en TEXT,
  short_title   TEXT, short_title_en TEXT,
  days          INTEGER, nights INTEGER,
  depart        TEXT,                               -- '2026.07.19'
  depart_short  TEXT,
  date_range    TEXT,
  structure     TEXT, structure_en TEXT,
  lead          TEXT, lead_en TEXT,
  gradient      TEXT,
  member_price  INTEGER NOT NULL,
  normal_price  INTEGER NOT NULL,
  deposit       INTEGER NOT NULL,
  seats_total   INTEGER NOT NULL DEFAULT 15,
  seats_left    INTEGER NOT NULL DEFAULT 15,
  status        TEXT, status_en TEXT,               -- '报名中' etc
  status_tag    TEXT,                               -- 'tag-terra' | 'tag-green' | 'tag-gold'
  seat_tag      TEXT, seat_tag_en TEXT,
  highlights    TEXT,  highlights_en TEXT,          -- JSON array
  summary       TEXT,  summary_en TEXT,
  includes      TEXT,  includes_en TEXT,            -- JSON array
  itinerary     TEXT,                               -- JSON array of {day,vip,leisure,title,titleEn,desc,descEn}
  is_published  INTEGER NOT NULL DEFAULT 1,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY,                   -- 'T' + timestamp / order no
  trip_id       TEXT,
  title         TEXT, title_en TEXT,
  openid        TEXT,                               -- WeChat user openid
  customer_name TEXT,
  passport      TEXT,
  phone         TEXT,
  company       TEXT,
  depart        TEXT,
  city          TEXT, city_en TEXT,
  status        TEXT NOT NULL DEFAULT '待确认',      -- 待确认 | 已确认 | 已付订金 | 已结清 | 已完成 | 已取消
  status_en     TEXT NOT NULL DEFAULT 'Pending',
  total_price   INTEGER NOT NULL DEFAULT 0,
  deposit       INTEGER NOT NULL DEFAULT 0,
  deposit_paid  INTEGER NOT NULL DEFAULT 0,         -- 0/1
  balance       INTEGER NOT NULL DEFAULT 0,
  balance_paid  INTEGER NOT NULL DEFAULT 0,         -- 0/1
  balance_due   TEXT,
  checklist     TEXT,                               -- JSON array of {label,labelEn,done,info}
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS partner_apps (
  id            TEXT PRIMARY KEY,                   -- 'P' + timestamp
  openid        TEXT,
  company       TEXT, company_en TEXT,
  contact       TEXT,
  wechat        TEXT,
  phone         TEXT,
  categories    TEXT,  categories_en TEXT,          -- JSON array
  modes         TEXT,  modes_en TEXT,               -- JSON array
  markets       TEXT,  markets_en TEXT,             -- JSON array
  status        TEXT NOT NULL DEFAULT '待对接',       -- 待对接 | 顾问已对接 | 已签约 | 已关闭
  status_en     TEXT NOT NULL DEFAULT 'New',
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  audience      TEXT NOT NULL,                      -- 'order' | 'partner' | 'broadcast'
  target_id     TEXT,                               -- order id / partner id (null for broadcast)
  openid        TEXT,
  template      TEXT,                               -- WeChat subscribe-message template id
  title         TEXT,
  body          TEXT,
  channel       TEXT NOT NULL DEFAULT 'subscribe',  -- 'subscribe' | 'log'
  status        TEXT NOT NULL DEFAULT 'queued',     -- queued | sent | failed
  error         TEXT,
  created_by    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at       TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id       TEXT NOT NULL,
  openid        TEXT,
  user_name     TEXT,
  rating        INTEGER NOT NULL DEFAULT 5,          -- 1-5 stars
  title         TEXT,
  content       TEXT,
  media         TEXT,                               -- JSON array of {url, type: 'image'|'video'}
  likes         INTEGER NOT NULL DEFAULT 0,
  liked_by      TEXT,                               -- JSON array of openids who liked
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS review_comments (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id     INTEGER NOT NULL,
  openid        TEXT,
  user_name     TEXT,
  content       TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS success_stories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT,
  title_en      TEXT,
  company       TEXT,
  company_en    TEXT,
  category      TEXT,                              -- 'tour' | 'business' | 'investment'
  summary       TEXT,
  summary_en    TEXT,
  content       TEXT,
  content_en    TEXT,
  media         TEXT,                               -- JSON array of {url, type}
  featured      INTEGER NOT NULL DEFAULT 0,         -- 0/1 for featured stories
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_published  INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS opportunities (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT,
  title_en      TEXT,
  country       TEXT,
  country_en    TEXT,
  region        TEXT,
  category      TEXT,                              -- 'investment' | 'trade' | 'joint_venture' | 'supply' | 'project'
  type          TEXT,                              -- 'demand' | 'opportunity'
  description   TEXT,
  description_en TEXT,
  requirements  TEXT,
  requirements_en TEXT,
  contact_info  TEXT,
  budget        TEXT,
  deadline      TEXT,
  featured      INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_published  INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inquiries (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT,                              -- 'story_question' | 'opportunity_question' | 'opportunity_intent'
  target_id     TEXT,
  target_title  TEXT,
  content       TEXT,
  opportunity_id TEXT,
  opportunity_title TEXT,
  openid        TEXT,
  user_name     TEXT,
  user_phone    TEXT,
  user_company  TEXT,
  status        TEXT NOT NULL DEFAULT 'new',        -- 'new' | 'contacted' | 'closed'
  notes         TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_trip      ON orders(trip_id);
CREATE INDEX IF NOT EXISTS idx_partner_status   ON partner_apps(status);
CREATE INDEX IF NOT EXISTS idx_notif_target     ON notifications(target_id);

CREATE TABLE IF NOT EXISTS verification_codes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  phone         TEXT NOT NULL UNIQUE,
  code          TEXT NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 0,
  expires_at    TEXT NOT NULL,                     -- ISO timestamp
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_vcode_phone ON verification_codes(phone);
`);

try {
  db.exec("ALTER TABLE trips ADD COLUMN qr_code TEXT;");
} catch (e) {
  if (!e.message.includes("duplicate column")) throw e;
}

module.exports = db;
