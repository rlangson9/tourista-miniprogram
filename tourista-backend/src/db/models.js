// src/db/models.js
const db = require("./index.js");

const J = (v) => { try { return JSON.parse(v); } catch { return v == null ? null : v; } };
const S = (v) => JSON.stringify(v == null ? null : v);

// ── TRIPS ─────────────────────────────────────────────────────────────────
// Output shape matches the mini program's utils/data.js trip objects exactly,
// so the app can drop these straight into its templates.
function tripToApi(r) {
  if (!r) return null;
  return {
    id: r.id, flag: r.flag,
    country: r.country, countryEn: r.country_en,
    title: r.title, titleEn: r.title_en,
    shortTitle: r.short_title, shortTitleEn: r.short_title_en,
    days: r.days, nights: r.nights,
    depart: r.depart, departShort: r.depart_short, dateRange: r.date_range,
    structure: r.structure, structureEn: r.structure_en,
    lead: r.lead, leadEn: r.lead_en,
    gradient: r.gradient,
    memberPrice: r.member_price, normalPrice: r.normal_price, deposit: r.deposit,
    seatsTotal: r.seats_total, seatsLeft: r.seats_left,
    status: r.status, statusEn: r.status_en, statusTag: r.status_tag,
    seatTag: r.seat_tag, seatTagEn: r.seat_tag_en,
    highlights: J(r.highlights), highlightsEn: J(r.highlights_en),
    summary: r.summary, summaryEn: r.summary_en,
    includes: J(r.includes), includesEn: J(r.includes_en),
    itinerary: J(r.itinerary),
    qrCode: r.qr_code,
    isPublished: !!r.is_published,
    sortOrder: r.sort_order
  };
}

const Trips = {
  allPublished() {
    return db.prepare("SELECT * FROM trips WHERE is_published = 1 ORDER BY sort_order, created_at")
      .all().map(tripToApi);
  },
  all() {
    return db.prepare("SELECT * FROM trips ORDER BY sort_order, created_at").all().map(tripToApi);
  },
  get(id) {
    return tripToApi(db.prepare("SELECT * FROM trips WHERE id = ?").get(id));
  },
  raw(id) {
    return db.prepare("SELECT * FROM trips WHERE id = ?").get(id);
  },
  create(t) {
    db.prepare(`INSERT INTO trips (
      id, flag, country, country_en, title, title_en, short_title, short_title_en,
      days, nights, depart, depart_short, date_range, structure, structure_en,
      lead, lead_en, gradient, member_price, normal_price, deposit, seats_total, seats_left,
      status, status_en, status_tag, seat_tag, seat_tag_en,
      highlights, highlights_en, summary, summary_en, includes, includes_en, itinerary,
      is_published, sort_order
    ) VALUES (
      @id,@flag,@country,@country_en,@title,@title_en,@short_title,@short_title_en,
      @days,@nights,@depart,@depart_short,@date_range,@structure,@structure_en,
      @lead,@lead_en,@gradient,@member_price,@normal_price,@deposit,@seats_total,@seats_left,
      @status,@status_en,@status_tag,@seat_tag,@seat_tag_en,
      @highlights,@highlights_en,@summary,@summary_en,@includes,@includes_en,@itinerary,
      @is_published,@sort_order
    )`).run(normalizeTripInput(t));
    return this.get(t.id);
  },
  update(id, t) {
    const cur = this.raw(id);
    if (!cur) return null;
    // Convert the existing row to API (camelCase) shape, then overlay the
    // incoming camelCase patch so partial updates (e.g. just memberPrice)
    // correctly override existing values instead of being shadowed by the
    // snake_case row keys.
    const curApi = tripToApi(cur);
    const merged = normalizeTripInput({ ...curApi, ...t, id });
    db.prepare(`UPDATE trips SET
      flag=@flag, country=@country, country_en=@country_en, title=@title, title_en=@title_en,
      short_title=@short_title, short_title_en=@short_title_en, days=@days, nights=@nights,
      depart=@depart, depart_short=@depart_short, date_range=@date_range,
      structure=@structure, structure_en=@structure_en, lead=@lead, lead_en=@lead_en,
      gradient=@gradient, member_price=@member_price, normal_price=@normal_price, deposit=@deposit,
      seats_total=@seats_total, seats_left=@seats_left, status=@status, status_en=@status_en,
      status_tag=@status_tag, seat_tag=@seat_tag, seat_tag_en=@seat_tag_en,
      highlights=@highlights, highlights_en=@highlights_en, summary=@summary, summary_en=@summary_en,
      includes=@includes, includes_en=@includes_en, itinerary=@itinerary,
      qr_code=@qr_code,
      is_published=@is_published, sort_order=@sort_order, updated_at=datetime('now')
      WHERE id=@id`).run(merged);
    return this.get(id);
  },
  remove(id) {
    return db.prepare("DELETE FROM trips WHERE id = ?").run(id).changes > 0;
  },
  adjustSeats(id, delta) {
    db.prepare("UPDATE trips SET seats_left = MAX(0, seats_left + ?), updated_at=datetime('now') WHERE id = ?")
      .run(delta, id);
    return this.get(id);
  }
};

function normalizeTripInput(t) {
  // Accept either API-shaped (camelCase) or column-shaped (snake) input.
  const g = (camel, snake, def = null) => (t[snake] !== undefined ? t[snake] : (t[camel] !== undefined ? t[camel] : def));
  const arr = (camel, snake) => {
    const v = g(camel, snake, []);
    return typeof v === "string" ? v : S(v);
  };
  return {
    id: t.id,
    flag: g("flag", "flag", ""),
    country: g("country", "country", ""), country_en: g("countryEn", "country_en", ""),
    title: g("title", "title", ""), title_en: g("titleEn", "title_en", ""),
    short_title: g("shortTitle", "short_title", ""), short_title_en: g("shortTitleEn", "short_title_en", ""),
    days: g("days", "days", 0), nights: g("nights", "nights", 0),
    depart: g("depart", "depart", ""), depart_short: g("departShort", "depart_short", ""),
    date_range: g("dateRange", "date_range", ""),
    structure: g("structure", "structure", ""), structure_en: g("structureEn", "structure_en", ""),
    lead: g("lead", "lead", ""), lead_en: g("leadEn", "lead_en", ""),
    gradient: g("gradient", "gradient", "linear-gradient(120deg,#2E5E1F,#C24214)"),
    member_price: g("memberPrice", "member_price", 0),
    normal_price: g("normalPrice", "normal_price", 0),
    deposit: g("deposit", "deposit", 0),
    seats_total: g("seatsTotal", "seats_total", 15),
    seats_left: g("seatsLeft", "seats_left", 15),
    status: g("status", "status", "报名中"), status_en: g("statusEn", "status_en", "Registering"),
    status_tag: g("statusTag", "status_tag", "tag-terra"),
    seat_tag: g("seatTag", "seat_tag", ""), seat_tag_en: g("seatTagEn", "seat_tag_en", ""),
    highlights: arr("highlights", "highlights"), highlights_en: arr("highlightsEn", "highlights_en"),
    summary: g("summary", "summary", ""), summary_en: g("summaryEn", "summary_en", ""),
    includes: arr("includes", "includes"), includes_en: arr("includesEn", "includes_en"),
    itinerary: arr("itinerary", "itinerary"),
    qr_code: g("qrCode", "qr_code", ""),
    is_published: g("isPublished", "is_published", 1) ? 1 : 0,
    sort_order: g("sortOrder", "sort_order", 0)
  };
}

// ── ORDERS ──────────────────────────────────────────────────────────────
function orderToApi(r) {
  if (!r) return null;
  return {
    id: r.id, tripId: r.trip_id,
    title: r.title, titleEn: r.title_en,
    openid: r.openid, customerName: r.customer_name, passport: r.passport, phone: r.phone, company: r.company,
    depart: r.depart, city: r.city, cityEn: r.city_en,
    status: r.status, statusEn: r.status_en,
    totalPrice: r.total_price, deposit: r.deposit, depositPaid: !!r.deposit_paid,
    balance: r.balance, balancePaid: !!r.balance_paid, balanceDue: r.balance_due,
    checklist: J(r.checklist), notes: r.notes,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
}

const Orders = {
  all({ status, tripId } = {}) {
    let q = "SELECT * FROM orders", w = [], p = [];
    if (status) { w.push("status = ?"); p.push(status); }
    if (tripId) { w.push("trip_id = ?"); p.push(tripId); }
    if (w.length) q += " WHERE " + w.join(" AND ");
    q += " ORDER BY created_at DESC";
    return db.prepare(q).all(...p).map(orderToApi);
  },
  get(id) { return orderToApi(db.prepare("SELECT * FROM orders WHERE id = ?").get(id)); },
  byOpenid(openid) {
    return db.prepare("SELECT * FROM orders WHERE openid = ? ORDER BY created_at DESC").all(openid).map(orderToApi);
  },
  create(o) {
    const id = o.id || ("T" + Date.now());
    db.prepare(`INSERT INTO orders (
      id, trip_id, title, title_en, openid, customer_name, passport, phone, company,
      depart, city, city_en, status, status_en, total_price, deposit, deposit_paid,
      balance, balance_paid, balance_due, checklist, notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, o.tripId || null, o.title || "", o.titleEn || "", o.openid || null,
      o.customerName || "", o.passport || "", o.phone || "", o.company || "",
      o.depart || "", o.city || "", o.cityEn || "",
      o.status || "待确认", o.statusEn || "Pending",
      o.totalPrice || 0, o.deposit || 0, o.depositPaid ? 1 : 0,
      o.balance || 0, o.balancePaid ? 1 : 0, o.balanceDue || "",
      S(o.checklist || []), o.notes || ""
    );
    return this.get(id);
  },
  update(id, o) {
    const cur = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
    if (!cur) return null;
    const f = {
      status: o.status ?? cur.status,
      status_en: o.statusEn ?? cur.status_en,
      deposit_paid: o.depositPaid != null ? (o.depositPaid ? 1 : 0) : cur.deposit_paid,
      balance_paid: o.balancePaid != null ? (o.balancePaid ? 1 : 0) : cur.balance_paid,
      balance_due: o.balanceDue ?? cur.balance_due,
      checklist: o.checklist != null ? S(o.checklist) : cur.checklist,
      notes: o.notes ?? cur.notes
    };
    db.prepare(`UPDATE orders SET status=@status, status_en=@status_en,
      deposit_paid=@deposit_paid, balance_paid=@balance_paid, balance_due=@balance_due,
      checklist=@checklist, notes=@notes, updated_at=datetime('now') WHERE id=@id`)
      .run({ ...f, id });
    return this.get(id);
  },
  remove(id) { return db.prepare("DELETE FROM orders WHERE id = ?").run(id).changes > 0; }
};

// ── PARTNER APPLICATIONS ──────────────────────────────────────────────────
function partnerToApi(r) {
  if (!r) return null;
  return {
    id: r.id, openid: r.openid,
    company: r.company, companyEn: r.company_en,
    contact: r.contact, wechat: r.wechat, phone: r.phone,
    categories: J(r.categories), categoriesEn: J(r.categories_en),
    modes: J(r.modes), modesEn: J(r.modes_en),
    markets: J(r.markets), marketsEn: J(r.markets_en),
    status: r.status, statusEn: r.status_en, notes: r.notes,
    createdAt: r.created_at, updatedAt: r.updated_at
  };
}

const Partners = {
  all({ status } = {}) {
    let q = "SELECT * FROM partner_apps", p = [];
    if (status) { q += " WHERE status = ?"; p.push(status); }
    q += " ORDER BY created_at DESC";
    return db.prepare(q).all(...p).map(partnerToApi);
  },
  get(id) { return partnerToApi(db.prepare("SELECT * FROM partner_apps WHERE id = ?").get(id)); },
  byOpenid(openid) {
    return db.prepare("SELECT * FROM partner_apps WHERE openid = ? ORDER BY created_at DESC").all(openid).map(partnerToApi);
  },
  create(a) {
    const id = a.id || ("P" + Date.now());
    db.prepare(`INSERT INTO partner_apps (
      id, openid, company, company_en, contact, wechat, phone,
      categories, categories_en, modes, modes_en, markets, markets_en, status, status_en, notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id, a.openid || null, a.company || "", a.companyEn || "", a.contact || "", a.wechat || "", a.phone || "",
      S(a.categories || []), S(a.categoriesEn || []),
      S(a.modes || []), S(a.modesEn || []),
      S(a.markets || []), S(a.marketsEn || []),
      a.status || "待对接", a.statusEn || "New", a.notes || ""
    );
    return this.get(id);
  },
  update(id, a) {
    const cur = db.prepare("SELECT * FROM partner_apps WHERE id = ?").get(id);
    if (!cur) return null;
    const f = {
      status: a.status ?? cur.status,
      status_en: a.statusEn ?? cur.status_en,
      notes: a.notes ?? cur.notes
    };
    db.prepare("UPDATE partner_apps SET status=@status, status_en=@status_en, notes=@notes, updated_at=datetime('now') WHERE id=@id")
      .run({ ...f, id });
    return this.get(id);
  },
  remove(id) { return db.prepare("DELETE FROM partner_apps WHERE id = ?").run(id).changes > 0; }
};

// ── REVIEWS ────────────────────────────────────────────────────────────────
function reviewToApi(r) {
  if (!r) return null;
  return {
    id: r.id,
    tripId: r.trip_id,
    openid: r.openid,
    userName: r.user_name,
    rating: r.rating,
    title: r.title,
    content: r.content,
    media: J(r.media) || [],
    likes: r.likes,
    likedBy: J(r.liked_by) || [],
    createdAt: r.created_at,
    comments: []
  };
}

function commentToApi(r) {
  if (!r) return null;
  return {
    id: r.id,
    reviewId: r.review_id,
    openid: r.openid,
    userName: r.user_name,
    content: r.content,
    createdAt: r.created_at
  };
}

const Reviews = {
  allByTrip(tripId) {
    const reviews = db.prepare("SELECT * FROM reviews WHERE trip_id = ? ORDER BY created_at DESC").all(tripId).map(reviewToApi);
    reviews.forEach(r => {
      r.comments = db.prepare("SELECT * FROM review_comments WHERE review_id = ? ORDER BY created_at ASC").all(r.id).map(commentToApi);
    });
    return reviews;
  },
  get(id) {
    const r = reviewToApi(db.prepare("SELECT * FROM reviews WHERE id = ?").get(id));
    if (r) {
      r.comments = db.prepare("SELECT * FROM review_comments WHERE review_id = ? ORDER BY created_at ASC").all(id).map(commentToApi);
    }
    return r;
  },
  create(review) {
    const r = db.prepare(`INSERT INTO reviews (
      trip_id, openid, user_name, rating, title, content, media
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
      review.tripId,
      review.openid || null,
      review.userName || "Anonymous",
      review.rating || 5,
      review.title || "",
      review.content || "",
      S(review.media || [])
    );
    return this.get(r.lastInsertRowid);
  },
  update(id, data) {
    const cur = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);
    if (!cur) return null;
    const updates = [];
    const params = { id };
    if (data.title !== undefined) { updates.push("title = @title"); params.title = data.title; }
    if (data.content !== undefined) { updates.push("content = @content"); params.content = data.content; }
    if (data.rating !== undefined) { updates.push("rating = @rating"); params.rating = data.rating; }
    if (data.media !== undefined) { updates.push("media = @media"); params.media = S(data.media); }
    if (updates.length) {
      db.prepare(`UPDATE reviews SET ${updates.join(", ")} WHERE id = @id`).run(params);
    }
    return this.get(id);
  },
  remove(id) {
    db.prepare("DELETE FROM review_comments WHERE review_id = ?").run(id);
    return db.prepare("DELETE FROM reviews WHERE id = ?").run(id).changes > 0;
  },
  like(id, openid) {
    const r = db.prepare("SELECT likes, liked_by FROM reviews WHERE id = ?").get(id);
    if (!r) return null;
    const likedBy = J(r.liked_by) || [];
    const alreadyLiked = likedBy.includes(openid);
    let newLikes, newLikedBy;
    if (alreadyLiked) {
      newLikes = Math.max(0, r.likes - 1);
      newLikedBy = likedBy.filter(id => id !== openid);
    } else {
      newLikes = r.likes + 1;
      newLikedBy = [...likedBy, openid];
    }
    db.prepare("UPDATE reviews SET likes = ?, liked_by = ? WHERE id = ?")
      .run(newLikes, S(newLikedBy), id);
    return this.get(id);
  },
  addComment(reviewId, comment) {
    const r = db.prepare(`INSERT INTO review_comments (review_id, openid, user_name, content)
      VALUES (?, ?, ?, ?)`).run(
      reviewId,
      comment.openid || null,
      comment.userName || "Anonymous",
      comment.content || ""
    );
    return db.prepare("SELECT * FROM review_comments WHERE id = ?").get(r.lastInsertRowid);
  },
  deleteComment(commentId) {
    return db.prepare("DELETE FROM review_comments WHERE id = ?").run(commentId).changes > 0;
  },
  countByTrip(tripId) {
    return db.prepare("SELECT COUNT(*) c FROM reviews WHERE trip_id = ?").get(tripId).c;
  },
  avgRatingByTrip(tripId) {
    const r = db.prepare("SELECT AVG(rating) avg FROM reviews WHERE trip_id = ?").get(tripId);
    return r.avg ? Number(r.avg).toFixed(1) : null;
  }
};

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────
const Notifications = {
  all({ limit = 100 } = {}) {
    return db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT ?").all(limit);
  },
  create(n) {
    const r = db.prepare(`INSERT INTO notifications
      (audience, target_id, openid, template, title, body, channel, status, created_by)
      VALUES (?,?,?,?,?,?,?,?,?)`).run(
      n.audience, n.targetId || null, n.openid || null, n.template || null,
      n.title || "", n.body || "", n.channel || "subscribe", n.status || "queued", n.createdBy || null
    );
    return db.prepare("SELECT * FROM notifications WHERE id = ?").get(r.lastInsertRowid);
  },
  markSent(id, ok, error) {
    db.prepare("UPDATE notifications SET status=?, error=?, sent_at=datetime('now') WHERE id=?")
      .run(ok ? "sent" : "failed", error || null, id);
  }
};

// ── SUCCESS STORIES ──────────────────────────────────────────────────────
function storyToApi(r) {
  if (!r) return null;
  return {
    id: r.id,
    title: r.title,
    titleEn: r.title_en,
    company: r.company,
    companyEn: r.company_en,
    category: r.category,
    summary: r.summary,
    summaryEn: r.summary_en,
    content: r.content,
    contentEn: r.content_en,
    media: J(r.media) || [],
    featured: !!r.featured,
    sortOrder: r.sort_order,
    isPublished: !!r.is_published,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

const SuccessStories = {
  all(includeUnpublished = false) {
    const sql = includeUnpublished
      ? "SELECT * FROM success_stories ORDER BY sort_order, created_at DESC"
      : "SELECT * FROM success_stories WHERE is_published = 1 ORDER BY sort_order, created_at DESC";
    return db.prepare(sql).all().map(storyToApi);
  },
  featured() {
    return db.prepare("SELECT * FROM success_stories WHERE is_published = 1 AND featured = 1 ORDER BY sort_order")
      .all().map(storyToApi);
  },
  byCategory(category) {
    return db.prepare("SELECT * FROM success_stories WHERE is_published = 1 AND category = ? ORDER BY sort_order, created_at DESC")
      .all(category).map(storyToApi);
  },
  get(id) {
    return storyToApi(db.prepare("SELECT * FROM success_stories WHERE id = ?").get(id));
  },
  create(story) {
    const r = db.prepare(`INSERT INTO success_stories (
      title, title_en, company, company_en, category,
      summary, summary_en, content, content_en, media,
      featured, sort_order, is_published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      story.title || "",
      story.titleEn || "",
      story.company || "",
      story.companyEn || "",
      story.category || "tour",
      story.summary || "",
      story.summaryEn || "",
      story.content || "",
      story.contentEn || "",
      S(story.media || []),
      story.featured ? 1 : 0,
      story.sortOrder || 0,
      story.isPublished !== false ? 1 : 0
    );
    return this.get(r.lastInsertRowid);
  },
  update(id, story) {
    const cur = db.prepare("SELECT * FROM success_stories WHERE id = ?").get(id);
    if (!cur) return null;
    const updates = [];
    const params = { id };
    if (story.title !== undefined) { updates.push("title = @title"); params.title = story.title; }
    if (story.titleEn !== undefined) { updates.push("title_en = @title_en"); params.title_en = story.titleEn; }
    if (story.company !== undefined) { updates.push("company = @company"); params.company = story.company; }
    if (story.companyEn !== undefined) { updates.push("company_en = @company_en"); params.company_en = story.companyEn; }
    if (story.category !== undefined) { updates.push("category = @category"); params.category = story.category; }
    if (story.summary !== undefined) { updates.push("summary = @summary"); params.summary = story.summary; }
    if (story.summaryEn !== undefined) { updates.push("summary_en = @summary_en"); params.summary_en = story.summaryEn; }
    if (story.content !== undefined) { updates.push("content = @content"); params.content = story.content; }
    if (story.contentEn !== undefined) { updates.push("content_en = @content_en"); params.content_en = story.contentEn; }
    if (story.media !== undefined) { updates.push("media = @media"); params.media = S(story.media); }
    if (story.featured !== undefined) { updates.push("featured = @featured"); params.featured = story.featured ? 1 : 0; }
    if (story.sortOrder !== undefined) { updates.push("sort_order = @sort_order"); params.sort_order = story.sortOrder; }
    if (story.isPublished !== undefined) { updates.push("is_published = @is_published"); params.is_published = story.isPublished ? 1 : 0; }
    updates.push("updated_at = datetime('now')");
    db.prepare(`UPDATE success_stories SET ${updates.join(", ")} WHERE id = @id`).run(params);
    return this.get(id);
  },
  remove(id) {
    return db.prepare("DELETE FROM success_stories WHERE id = ?").run(id).changes > 0;
  },
  count() {
    return db.prepare("SELECT COUNT(*) c FROM success_stories WHERE is_published = 1").get().c;
  }
};

// ── OPPORTUNITIES ──────────────────────────────────────────────────────
function opportunityToApi(o) {
  if (!o) return null;
  return {
    id: o.id,
    title: o.title,
    titleEn: o.title_en,
    country: o.country,
    countryEn: o.country_en,
    region: o.region,
    category: o.category,
    type: o.type,
    description: o.description,
    descriptionEn: o.description_en,
    requirements: o.requirements,
    requirementsEn: o.requirements_en,
    contactInfo: o.contact_info,
    budget: o.budget,
    deadline: o.deadline,
    media: J(o.media) || [],
    featured: !!o.featured,
    sortOrder: o.sort_order,
    isPublished: !!o.is_published,
    createdAt: o.created_at,
    updatedAt: o.updated_at
  };
}

const Opportunities = {
  all(includeUnpublished = false) {
    const sql = includeUnpublished
      ? "SELECT * FROM opportunities ORDER BY sort_order, created_at DESC"
      : "SELECT * FROM opportunities WHERE is_published = 1 ORDER BY sort_order, created_at DESC";
    return db.prepare(sql).all().map(opportunityToApi);
  },
  featured() {
    return db.prepare("SELECT * FROM opportunities WHERE is_published = 1 AND featured = 1 ORDER BY sort_order")
      .all().map(opportunityToApi);
  },
  byType(type) {
    return db.prepare("SELECT * FROM opportunities WHERE is_published = 1 AND type = ? ORDER BY sort_order, created_at DESC")
      .all(type).map(opportunityToApi);
  },
  byCategory(category) {
    return db.prepare("SELECT * FROM opportunities WHERE is_published = 1 AND category = ? ORDER BY sort_order, created_at DESC")
      .all(category).map(opportunityToApi);
  },
  get(id) {
    return opportunityToApi(db.prepare("SELECT * FROM opportunities WHERE id = ?").get(id));
  },
  create(o) {
    const r = db.prepare(`INSERT INTO opportunities (
      title, title_en, country, country_en, region, category, type,
      description, description_en, requirements, requirements_en,
      contact_info, budget, deadline, media, featured, sort_order, is_published
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      o.title || "",
      o.titleEn || "",
      o.country || "",
      o.countryEn || "",
      o.region || "",
      o.category || "investment",
      o.type || "opportunity",
      o.description || "",
      o.descriptionEn || "",
      o.requirements || "",
      o.requirementsEn || "",
      o.contactInfo || "",
      o.budget || "",
      o.deadline || "",
      S(o.media || []),
      o.featured ? 1 : 0,
      o.sortOrder || 0,
      o.isPublished !== false ? 1 : 0
    );
    return this.get(r.lastInsertRowid);
  },
  update(id, o) {
    const cur = db.prepare("SELECT * FROM opportunities WHERE id = ?").get(id);
    if (!cur) return null;
    const updates = [];
    const params = { id };
    if (o.title !== undefined) { updates.push("title = @title"); params.title = o.title; }
    if (o.titleEn !== undefined) { updates.push("title_en = @title_en"); params.title_en = o.titleEn; }
    if (o.country !== undefined) { updates.push("country = @country"); params.country = o.country; }
    if (o.countryEn !== undefined) { updates.push("country_en = @country_en"); params.country_en = o.countryEn; }
    if (o.region !== undefined) { updates.push("region = @region"); params.region = o.region; }
    if (o.category !== undefined) { updates.push("category = @category"); params.category = o.category; }
    if (o.type !== undefined) { updates.push("type = @type"); params.type = o.type; }
    if (o.description !== undefined) { updates.push("description = @description"); params.description = o.description; }
    if (o.descriptionEn !== undefined) { updates.push("description_en = @description_en"); params.description_en = o.descriptionEn; }
    if (o.requirements !== undefined) { updates.push("requirements = @requirements"); params.requirements = o.requirements; }
    if (o.requirementsEn !== undefined) { updates.push("requirements_en = @requirements_en"); params.requirements_en = o.requirementsEn; }
    if (o.contactInfo !== undefined) { updates.push("contact_info = @contact_info"); params.contact_info = o.contactInfo; }
    if (o.budget !== undefined) { updates.push("budget = @budget"); params.budget = o.budget; }
    if (o.deadline !== undefined) { updates.push("deadline = @deadline"); params.deadline = o.deadline; }
    if (o.media !== undefined) { updates.push("media = @media"); params.media = S(o.media); }
    if (o.featured !== undefined) { updates.push("featured = @featured"); params.featured = o.featured ? 1 : 0; }
    if (o.sortOrder !== undefined) { updates.push("sort_order = @sort_order"); params.sort_order = o.sortOrder; }
    if (o.isPublished !== undefined) { updates.push("is_published = @is_published"); params.is_published = o.isPublished ? 1 : 0; }
    updates.push("updated_at = datetime('now')");
    db.prepare(`UPDATE opportunities SET ${updates.join(", ")} WHERE id = @id`).run(params);
    return this.get(id);
  },
  remove(id) {
    return db.prepare("DELETE FROM opportunities WHERE id = ?").run(id).changes > 0;
  },
  count() {
    return db.prepare("SELECT COUNT(*) c FROM opportunities WHERE is_published = 1").get().c;
  }
};

// ── INQUIRIES (user questions / intents) ────────────────────────────────
function inquiryToApi(i) {
  if (!i) return null;
  return {
    id: i.id,
    type: i.type,
    targetId: i.target_id,
    targetTitle: i.target_title,
    content: i.content,
    opportunityId: i.opportunity_id,
    opportunityTitle: i.opportunity_title,
    openid: i.openid,
    userName: i.user_name,
    userPhone: i.user_phone,
    userCompany: i.user_company,
    status: i.status,
    notes: i.notes,
    createdAt: i.created_at,
    updatedAt: i.updated_at
  };
}

const Inquiries = {
  all() {
    return db.prepare("SELECT * FROM inquiries ORDER BY created_at DESC").all().map(inquiryToApi);
  },
  byType(type) {
    return db.prepare("SELECT * FROM inquiries WHERE type = ? ORDER BY created_at DESC").all(type).map(inquiryToApi);
  },
  get(id) {
    return inquiryToApi(db.prepare("SELECT * FROM inquiries WHERE id = ?").get(id));
  },
  create(i) {
    const r = db.prepare(`INSERT INTO inquiries (
      type, target_id, target_title, content, opportunity_id, opportunity_title,
      openid, user_name, user_phone, user_company, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      i.type || "general",
      i.targetId || "",
      i.targetTitle || "",
      i.content || "",
      i.opportunityId || "",
      i.opportunityTitle || "",
      i.openid || "",
      i.userName || "",
      i.userPhone || "",
      i.userCompany || "",
      i.status || "new"
    );
    return this.get(r.lastInsertRowid);
  },
  update(id, i) {
    const cur = db.prepare("SELECT * FROM inquiries WHERE id = ?").get(id);
    if (!cur) return null;
    const updates = [];
    const params = { id };
    if (i.status !== undefined) { updates.push("status = @status"); params.status = i.status; }
    if (i.notes !== undefined) { updates.push("notes = @notes"); params.notes = i.notes; }
    if (i.userPhone !== undefined) { updates.push("user_phone = @user_phone"); params.user_phone = i.userPhone; }
    updates.push("updated_at = datetime('now')");
    db.prepare(`UPDATE inquiries SET ${updates.join(", ")} WHERE id = @id`).run(params);
    return this.get(id);
  },
  remove(id) {
    return db.prepare("DELETE FROM inquiries WHERE id = ?").run(id).changes > 0;
  },
  count() {
    return db.prepare("SELECT COUNT(*) c FROM inquiries").get().c;
  }
};

// ── ADMINS ──────────────────────────────────────────────────────────────
const Admins = {
  byUsername(u) { return db.prepare("SELECT * FROM admins WHERE username = ?").get(u); },
  get(id) { return db.prepare("SELECT id, username, role, created_at FROM admins WHERE id = ?").get(id); }
};

// ── VERIFICATION CODES (SMS phone verification) ─────────────────────────
const VerificationCodes = {
  set(phone, code, ttlMs = 5 * 60 * 1000) {
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    db.prepare(`INSERT INTO verification_codes (phone, code, expires_at)
      VALUES (?, ?, ?)
      ON CONFLICT(phone) DO UPDATE SET code=excluded.code, attempts=0, expires_at=excluded.expires_at, created_at=datetime('now')`)
      .run(phone, code, expiresAt);
  },
  get(phone) {
    return db.prepare("SELECT * FROM verification_codes WHERE phone = ?").get(phone);
  },
  incrementAttempts(phone) {
    db.prepare("UPDATE verification_codes SET attempts = attempts + 1 WHERE phone = ?").run(phone);
  },
  isValid(phone, code) {
    const row = this.get(phone);
    if (!row) return false;
    if (Date.now() > new Date(row.expires_at).getTime()) return false;
    if (row.attempts >= 5) return false; // brute-force protection
    if (row.code !== code) {
      this.incrementAttempts(phone);
      return false;
    }
    return true;
  },
  consume(phone) {
    db.prepare("DELETE FROM verification_codes WHERE phone = ?").run(phone);
  },
  purgeExpired() {
    const now = new Date().toISOString();
    db.prepare("DELETE FROM verification_codes WHERE expires_at < ?").run(now);
  }
};

// ── STATS (dashboard overview) ──────────────────────────────────────────────
const Stats = {
  overview() {
    const oneNum = (sql, ...p) => db.prepare(sql).get(...p);
    return {
      trips: oneNum("SELECT COUNT(*) c FROM trips WHERE is_published=1").c,
      ordersTotal: oneNum("SELECT COUNT(*) c FROM orders").c,
      ordersPending: oneNum("SELECT COUNT(*) c FROM orders WHERE status='待确认'").c,
      ordersConfirmed: oneNum("SELECT COUNT(*) c FROM orders WHERE status='已确认'").c,
      partnersTotal: oneNum("SELECT COUNT(*) c FROM partner_apps").c,
      partnersNew: oneNum("SELECT COUNT(*) c FROM partner_apps WHERE status='待对接'").c,
      revenueCollected:
        oneNum("SELECT COALESCE(SUM(deposit),0) s FROM orders WHERE deposit_paid=1").s +
        oneNum("SELECT COALESCE(SUM(balance),0) s FROM orders WHERE balance_paid=1").s,
      seatsLeft: oneNum("SELECT COALESCE(SUM(seats_left),0) s FROM trips WHERE is_published=1").s
    };
  }
};

module.exports = { Trips, Orders, Partners, Reviews, SuccessStories, Opportunities, Inquiries, Notifications, Admins, Stats, VerificationCodes };
