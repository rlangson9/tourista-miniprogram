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

  async onLoad(query) {
    const t = await data.fetchTrip(query.id || "zw");
    if (!t) return;
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

    // Primary traveller (used for order record)
    const primary = travellers[0];
    const totalDeposit = trip.deposit * (bookingType === "company" ? travellers.length : 1);

    wx.request({
      url: `${app.globalData.baseUrl}/api/orders`,
      method: 'POST',
      header: app.getAuthHeader(),
      data: {
        tripId: trip.id,
        customerName: primary.name,
        passport: primary.passport,
        phone: primary.phone,
        company: bookingType === "company" ? companyInfo.name : "",
        travellerCount: bookingType === "company" ? travellers.length : 1
      },
      success: (resp) => {
        wx.hideLoading();
        if (resp.statusCode === 201 && resp.data) {
          // Order created in DB — now pay deposit via WeChat Pay
          const orderId = resp.data.id;
          this._payDeposit(orderId, totalDeposit, trip, bookingType, travellers, companyInfo, lang);
        } else {
          this._fallbackOrder(totalDeposit, trip, bookingType, travellers, companyInfo, lang);
        }
      },
      fail: () => {
        wx.hideLoading();
        // Backend offline — fall back to local-only order
        this._fallbackOrder(totalDeposit, trip, bookingType, travellers, companyInfo, lang);
      }
    });
  },

  // ── Deposit payment via WeChat Pay ──────────────────────────────────────
  _payDeposit(orderId, totalDeposit, trip, bookingType, travellers, companyInfo, lang) {
    wx.request({
      url: `${app.globalData.baseUrl}/api/orders/${orderId}/pay`,
      method: 'POST',
      header: app.getAuthHeader(),
      data: { kind: 'deposit' },
      success: (resp) => {
        if (resp.statusCode === 200 && resp.data && resp.data.payParams) {
          const params = resp.data.payParams;
          // Real WeChat Pay — call wx.requestPayment if params have paySign
          if (params.paySign) {
            wx.requestPayment({
              timeStamp: params.timeStamp,
              nonceStr: params.nonceStr,
              package: params.package,
              signType: params.signType,
              paySign: params.paySign,
              success: () => this._onDepositPaid(orderId, totalDeposit, trip, bookingType, travellers, companyInfo, lang),
              fail: () => {
                // Order created but payment cancelled — still show order as pending
                wx.showToast({ title: lang === 'en' ? 'Payment cancelled' : '支付已取消', icon: 'none' });
                this._syncOrderToLocal(orderId, trip, bookingType, travellers, companyInfo, lang, false);
                wx.navigateTo({ url: "/pages/orders/orders" });
              }
            });
          } else {
            // Dev mode — no real payment, mark as paid for testing
            this._onDepositPaid(orderId, totalDeposit, trip, bookingType, travellers, companyInfo, lang);
          }
        } else {
          // Pay endpoint failed — order created, payment pending
          this._syncOrderToLocal(orderId, trip, bookingType, travellers, companyInfo, lang, false);
          this._showOrderCreatedModal(totalDeposit, lang, false);
        }
      },
      fail: () => {
        // Backend pay endpoint unreachable — order created, payment pending
        this._syncOrderToLocal(orderId, trip, bookingType, travellers, companyInfo, lang, false);
        this._showOrderCreatedModal(totalDeposit, lang, false);
      }
    });
  },

  _onDepositPaid(orderId, totalDeposit, trip, bookingType, travellers, companyInfo, lang) {
    // Confirm the payment with backend so DB order flags are updated
    const header = app.getAuthHeader();
    const confirmDone = () => {
      this._syncOrderToLocal(orderId, trip, bookingType, travellers, companyInfo, lang, true);
      this._showOrderCreatedModal(totalDeposit, lang, true);
    };
    if (Object.keys(header).length > 0) {
      wx.request({
        url: `${app.globalData.baseUrl}/api/orders/${orderId}/confirm-payment`,
        method: 'POST',
        header,
        data: { kind: 'deposit' },
        complete: () => confirmDone()
      });
    } else {
      confirmDone();
    }
  },

  _showOrderCreatedModal(totalDeposit, lang, paid) {
    const totalDepositText = totalDeposit.toLocaleString();
    wx.showModal({
      title: paid
        ? (lang === 'en' ? 'Deposit Payment Successful' : '订金支付成功')
        : (lang === 'en' ? 'Order Created' : '订单已创建'),
      content: paid
        ? (lang === 'en'
          ? `Deposit of ¥${totalDepositText} paid. Your advisor will confirm trip details soon. Balance due 14 days before departure.`
          : `已支付订金 ¥${totalDepositText}。顾问将尽快与您确认行程细节，余款请于出发前14天支付。`)
        : (lang === 'en'
          ? `Order created. Deposit of ¥${totalDepositText} pending payment. Your advisor will contact you.`
          : `订单已创建，订金 ¥${totalDepositText} 待支付。顾问将与您联系。`),
      showCancel: false,
      confirmText: lang === 'en' ? 'View Orders' : '查看订单',
      success: () => { wx.navigateTo({ url: "/pages/orders/orders" }); }
    });
  },

  _syncOrderToLocal(orderId, trip, bookingType, travellers, companyInfo, lang, depositPaid) {
    const totalDeposit = trip.deposit * (bookingType === "company" ? travellers.length : 1);
    const totalPrice = trip.memberPrice * (bookingType === "company" ? travellers.length : 1);
    app.globalData.tripOrders.unshift({
      id: orderId,
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
      depositPaid,
      balance: totalPrice - totalDeposit,
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
  },

  _fallbackOrder(totalDeposit, trip, bookingType, travellers, companyInfo, lang) {
    // Backend offline — create local-only order (old behavior)
    const localId = "T" + Date.now();
    this._syncOrderToLocal(localId, trip, bookingType, travellers, companyInfo, lang, false);
    this._showOrderCreatedModal(totalDeposit, lang, false);
  }
});
