// pages/booking/booking.js
const data = require("../../utils/data.js");
const i18n = require("../../utils/i18n.js");
const app = getApp();

function emptyTraveller() {
  return { name: "", passport: "", phone: "", company: "" };
}

Page({
  data: {
    trip: {},
    i18n: {},
    isMember: false,
    savedText: "0",
    bookingType: "individual",
    travellerCount: 2,
    travellers: [emptyTraveller()],
    companyInfo: { name: "", contact: "", contactPhone: "" },
    totalDepositText: "0"
  },

  onLoad(query) {
    const t = data.getTrip(query.id || "zw");
    const user = app.globalData.user;
    const lang = app.getLang();
    const saved = t.normalPrice - t.memberPrice;

    this.loadTranslations();

    this.setData({
      trip: Object.assign({}, t, {
        memberPriceText: t.memberPrice.toLocaleString(),
        depositText: t.deposit.toLocaleString(),
        departCity: t.id === "sa" ? (lang === 'en' ? "Durban" : "德班") : (lang === 'en' ? "Harare" : "哈拉雷")
      }),
      isMember: user.isMember,
      savedText: saved.toLocaleString(),
      travellers: [{
        name: user.name || "",
        passport: "",
        phone: "",
        company: user.company || ""
      }],
      totalDepositText: t.deposit.toLocaleString()
    });
  },

  onShow() {
    this.loadTranslations();
  },

  loadTranslations() {
    const translations = i18n.getPageTranslations('booking');
    translations.per = i18n.t('per');
    this.setData({ i18n: translations });
  },

  // ── Booking type ──────────────────────────────────────────────────────
  switchBookingType(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.bookingType) return;

    const t = this.data.trip;
    if (type === "company") {
      // Switch to company: init with 2 travellers
      this.setData({
        bookingType: "company",
        travellerCount: 2,
        travellers: [emptyTraveller(), emptyTraveller()],
        totalDepositText: (t.deposit * 2).toLocaleString()
      });
    } else {
      // Switch to individual: reset to 1 traveller
      const user = app.globalData.user;
      this.setData({
        bookingType: "individual",
        travellerCount: 1,
        travellers: [{
          name: user.name || "",
          passport: "",
          phone: "",
          company: user.company || ""
        }],
        companyInfo: { name: "", contact: "", contactPhone: "" },
        totalDepositText: t.deposit.toLocaleString()
      });
    }
  },

  // ── Traveller count (company only) ────────────────────────────────────
  changeCount(e) {
    const delta = parseInt(e.currentTarget.dataset.delta, 10);
    const current = this.data.travellerCount;
    const next = current + delta;
    if (next < 2) return; // minimum 2 for company

    const t = this.data.trip;
    const travellers = this.data.travellers.slice();

    if (delta > 0) {
      travellers.push(emptyTraveller());
    } else {
      travellers.pop();
    }

    this.setData({
      travellerCount: next,
      travellers,
      totalDepositText: (t.deposit * next).toLocaleString()
    });
  },

  addTraveller() {
    const t = this.data.trip;
    const travellers = this.data.travellers.slice();
    travellers.push(emptyTraveller());
    this.setData({
      travellerCount: travellers.length,
      travellers,
      totalDepositText: (t.deposit * travellers.length).toLocaleString()
    });
  },

  removeTraveller(e) {
    const index = e.currentTarget.dataset.index;
    if (this.data.travellers.length <= 2) {
      wx.showToast({ title: this.data.i18n.minTravellersNote, icon: "none" });
      return;
    }
    const t = this.data.trip;
    const travellers = this.data.travellers.slice();
    travellers.splice(index, 1);
    this.setData({
      travellerCount: travellers.length,
      travellers,
      totalDepositText: (t.deposit * travellers.length).toLocaleString()
    });
  },

  // ── Input handlers ────────────────────────────────────────────────────
  onTravellerInput(e) {
    const index = e.currentTarget.dataset.index;
    const k = e.currentTarget.dataset.k;
    const value = e.detail.value;
    const key = `travellers[${index}].${k}`;
    this.setData({ [key]: value });
  },

  onCompanyInput(e) {
    const k = e.currentTarget.dataset.k;
    const value = e.detail.value;
    this.setData({ [`companyInfo.${k}`]: value });
  },

  // ── Payment ───────────────────────────────────────────────────────────
  payDeposit() {
    const { bookingType, travellers, companyInfo, trip, i18n } = this.data;
    const lang = app.getLang();

    if (bookingType === "company") {
      // Company validation
      if (!companyInfo.name.trim()) {
        wx.showToast({ title: i18n.companyRequired, icon: "none" });
        return;
      }
      if (travellers.length < 2) {
        wx.showToast({ title: i18n.minTravellersError, icon: "none" });
        return;
      }
      // Validate all travellers
      for (let i = 0; i < travellers.length; i++) {
        const t = travellers[i];
        if (!t.name.trim() || !t.passport.trim() || !t.phone.trim()) {
          wx.showToast({ title: `${i18n.fillAllTravellers} (${i18n.traveller} ${i + 1})`, icon: "none" });
          return;
        }
      }
    } else {
      // Individual validation
      const t = travellers[0];
      if (!t.name.trim() || !t.passport.trim() || !t.phone.trim()) {
        wx.showToast({ title: lang === 'en' ? 'Please fill in traveller info' : '请完整填写出行人信息', icon: "none" });
        return;
      }
    }

    wx.showLoading({ title: lang === 'en' ? 'Placing order...' : '正在下单...' });

    setTimeout(() => {
      wx.hideLoading();
      const totalDeposit = trip.deposit * (bookingType === "company" ? travellers.length : 1);
      const totalDepositText = totalDeposit.toLocaleString();

      wx.showModal({
        title: lang === 'en' ? 'Deposit Payment Successful' : '订金支付成功',
        content: lang === 'en'
          ? `Deposit of ¥${totalDepositText} paid. Your advisor will confirm trip details soon. Balance due 14 days before departure.`
          : `已支付订金 ¥${totalDepositText}。顾问将尽快与您确认行程细节，余款请于出发前14天支付。`,
        showCancel: false,
        confirmText: lang === 'en' ? 'View Orders' : '查看订单',
        success: () => {
          app.globalData.tripOrders.unshift({
            id: "T" + Date.now(),
            tripId: trip.id,
            title: lang === 'en' ? `${trip.shortTitleEn} · ${trip.days} days` : `${trip.shortTitle} · ${trip.days}天`,
            depart: trip.depart,
            city: trip.departCity,
            status: lang === 'en' ? 'Pending' : '待确认',
            bookingType,
            travellerCount: bookingType === "company" ? travellers.length : 1,
            travellers: bookingType === "company" ? travellers.map(t => ({ name: t.name, passport: t.passport })) : undefined,
            companyName: bookingType === "company" ? companyInfo.name : undefined,
            contactPerson: bookingType === "company" ? companyInfo.contact : undefined,
            deposit: totalDeposit,
            balance: trip.memberPrice * (bookingType === "company" ? travellers.length : 1) - totalDeposit,
            balanceDue: lang === 'en' ? '14 days before departure' : '出发前14天',
            checklist: lang === 'en' ? [
              { label: "Passport valid for 6+ months", done: false },
              { label: "Yellow fever vaccination certificate", done: false },
              { label: "Visa materials (photo + itinerary)", done: false }
            ] : [
              { label: "护照有效期6个月以上", done: false },
              { label: "黄热病疫苗证书", done: false },
              { label: "落地签材料（照片+行程）", done: false }
            ]
          });
          wx.navigateTo({ url: "/pages/orders/orders" });
        }
      });
    }, 900);
  }
});
