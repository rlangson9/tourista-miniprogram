// pages/partner-form/partner-form.js
const data = require("../../utils/data.js");
const i18n = require("../../utils/i18n.js");
const app = getApp();

Page({
  data: {
    categoryOptions: data.PRODUCT_CATEGORIES,
    modeOptions: data.COOPERATION_MODES,
    marketOptions: data.TARGET_MARKETS,
    categories: [],
    modes: [],
    markets: [],
    form: { company: "", contact: "", wechat: "" },
    i18n: {}
  },

  onLoad() {
    this.loadTranslations();
    // prefill company if user is a verified company
    const u = app.globalData.user;
    if (u.company) this.setData({ "form.company": u.company });
  },

  loadTranslations() {
    const lang = app.getLang();
    const translations = i18n.getPageTranslations('partnerForm');
    this.setData({ 
      i18n: translations,
      categoryOptions: lang === 'en' ? data.PRODUCT_CATEGORIES_EN : data.PRODUCT_CATEGORIES,
      modeOptions: lang === 'en' ? data.COOPERATION_MODES_EN : data.COOPERATION_MODES,
      marketOptions: lang === 'en' ? data.TARGET_MARKETS_EN : data.TARGET_MARKETS
    });
  },

  onInput(e) {
    const k = e.currentTarget.dataset.k;
    this.setData({ [`form.${k}`]: e.detail.value });
  },

  toggle(e) {
    const { group, val } = e.currentTarget.dataset;
    const list = this.data[group].slice();
    const i = list.indexOf(val);
    if (i > -1) list.splice(i, 1);
    else list.push(val);
    this.setData({ [group]: list });
  },

  submit() {
    const lang = app.getLang();
    const { company, contact, wechat } = this.data.form;
    if (!company || !contact || !wechat) {
      wx.showToast({ title: lang === 'en' ? 'Please fill in company info' : '请完整填写企业信息', icon: "none" });
      return;
    }
    if (this.data.categories.length === 0) {
      wx.showToast({ title: lang === 'en' ? 'Please select at least one product category' : '请至少选择一个产品类目', icon: "none" });
      return;
    }
    if (this.data.modes.length === 0) {
      wx.showToast({ title: lang === 'en' ? 'Please select at least one cooperation mode' : '请至少选择一种合作方式', icon: "none" });
      return;
    }

    wx.showLoading({ title: lang === 'en' ? 'Submitting...' : '提交中...' });

    // PRODUCTION: wx.request POST to your server with the form payload.
    setTimeout(() => {
      wx.hideLoading();

      // push into the global store (demo)
      app.globalData.partnerApplications.unshift({
        id: "P" + Date.now(),
        company,
        categories: this.data.categories,
        modes: this.data.modes,
        markets: this.data.markets,
        status: lang === 'en' ? 'Pending' : '待对接',
        createdAt: new Date().toISOString().slice(0, 10).replace(/-/g, ".")
      });

      wx.showModal({
        title: lang === 'en' ? 'Application Submitted' : '申请已提交',
        content: lang === 'en'
          ? 'Thank you for your interest! Our advisor will contact you via WeChat within 48 hours. Please accept the friend request.'
          : '感谢您的合作意向！我们的顾问将在48小时内通过微信与您联系，请留意好友申请。',
        showCancel: false,
        confirmText: lang === 'en' ? 'OK' : '好的',
        success: () => {
          wx.navigateBack();
        }
      });
    }, 900);
  }
});
