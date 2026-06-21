// pages/trips/trips.js
const data = require("../../utils/data.js");
const i18n = require("../../utils/i18n.js");
const app = getApp();

Page({
  data: {
    tab: 0,
    trips: [],
    past: [],
    i18n: {},
    showContactModal: false
  },

  onLoad() {
    this.loadTranslations();
    this.loadData();
  },

  onShow() {
    this.loadTranslations();
    this.loadData();
  },

  loadTranslations() {
    const translations = i18n.getPageTranslations('trips');
    const lang = app.getLang();
    this.setData({
      i18n: translations,
      past: [
        { flag: "ZW", title: lang === 'en' ? 'Zimbabwe Tour (First Group)' : '津巴布韦考察团（首发团）', date: "2026.03", pax: 12, outcome: lang === 'en' ? '3 partnership intents' : '促成3项合作意向', gradient: "linear-gradient(120deg,#2E5E1F,#C24214)" },
        { flag: "ZA", title: lang === 'en' ? 'South Africa Market Research' : '南非市场调研团', date: "2025.11", pax: 9, outcome: lang === 'en' ? 'Showroom selected' : '展厅选址确定', gradient: "linear-gradient(120deg,#0E4D3C,#1B6E9C)" }
      ]
    });
  },

  loadData() {
    const lang = app.getLang();
    const trips = data.TRIPS.map(t => {
      const localized = Object.assign({}, t, {
        memberPriceText: t.memberPrice.toLocaleString(),
        title: lang === 'en' ? t.titleEn : t.title,
        shortTitle: lang === 'en' ? t.shortTitleEn : t.shortTitle,
        country: lang === 'en' ? t.countryEn : t.country,
        structure: lang === 'en' ? t.structureEn : t.structure,
        summary: lang === 'en' ? t.summaryEn : t.summary,
        highlights: lang === 'en' ? t.highlightsEn : t.highlights,
        seatTag: lang === 'en' ? t.seatTagEn : t.seatTag
      });
      return localized;
    });
    this.setData({ trips });
  },

  switchTab(e) {
    this.setData({ tab: Number(e.currentTarget.dataset.i) });
  },

  openTrip(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${id}` });
  },

  contactAdvisor() {
    this.setData({ showContactModal: true });
  },

  closeModal() {
    this.setData({ showContactModal: false });
  },

  stopPropagation() {
    // Prevent event from propagating to modal-overlay
  },

  copyWechat() {
    wx.setClipboardData({
      data: "TouristaAR_Advisor",
      success: () => {
        wx.showToast({
          title: app.getLang() === 'en' ? 'WeChat ID copied' : '微信号已复制',
          icon: 'success'
        });
      }
    });
  }
});
