// pages/partner-form/partner-form.js
const data = require("../../utils/data.js");
const app = getApp();

Page({
  data: {
    categoryOptions: data.PRODUCT_CATEGORIES,
    modeOptions: data.COOPERATION_MODES,
    marketOptions: data.TARGET_MARKETS,
    categories: [],
    modes: [],
    markets: [],
    form: { company: "", contact: "", wechat: "" }
  },

  onLoad() {
    // prefill company if user is a verified company
    const u = app.globalData.user;
    if (u.company) this.setData({ "form.company": u.company });
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
    const { company, contact, wechat } = this.data.form;
    if (!company || !contact || !wechat) {
      wx.showToast({ title: "请完整填写企业信息", icon: "none" });
      return;
    }
    if (this.data.categories.length === 0) {
      wx.showToast({ title: "请至少选择一个产品类目", icon: "none" });
      return;
    }
    if (this.data.modes.length === 0) {
      wx.showToast({ title: "请至少选择一种合作方式", icon: "none" });
      return;
    }

    wx.showLoading({ title: "提交中..." });

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
        status: "待对接",
        createdAt: new Date().toISOString().slice(0, 10).replace(/-/g, ".")
      });

      wx.showModal({
        title: "申请已提交",
        content: "感谢您的合作意向！我们的顾问将在48小时内通过微信与您联系，请留意好友申请。",
        showCancel: false,
        confirmText: "好的",
        success: () => {
          wx.navigateBack();
        }
      });
    }, 900);
  }
});
