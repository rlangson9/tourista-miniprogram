// pages/business/business.js
const data = require("../../utils/data.js");
const i18n = require("../../utils/i18n.js");
const app = getApp();

Page({
  data: {
    types: [],
    steps: [],
    i18n: {}
  },

  onLoad() {
    this.loadTranslations();
  },

  onShow() {
    this.loadTranslations();
  },

  loadTranslations() {
    const translations = i18n.getPageTranslations('business');
    const lang = app.getLang();
    
    const types = data.BIZ_TYPES.map(t => ({
      ...t,
      title: lang === 'en' ? t.titleEn : t.title,
      desc: lang === 'en' ? t.descEn : t.desc
    }));
    
    const steps = data.BIZ_STEPS.map(s => ({
      ...s,
      text: lang === 'en' ? s.textEn : s.text
    }));
    
    this.setData({
      i18n: translations,
      types,
      steps
    });
  },

  goForm() {
    wx.navigateTo({ url: "/pages/partner-form/partner-form" });
  },

  onShareAppMessage() {
    const lang = app.getLang();
    return {
      title: lang === 'en' ? "Tourista AR — Bring Your Products to African Markets" : "Tourista AR — 让您的产品走进非洲市场",
      path: "/pages/business/business"
    };
  }
});
