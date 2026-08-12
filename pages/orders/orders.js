// pages/orders/orders.js
const app = getApp();
const data = require('../../utils/data.js');
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    tab: 0,
    tripOrders: [],
    firstChecklist: [],
    applications: [],
    showQRModal: false,
    qrCodeUrl: "",
    groupTripTitle: "",
    i18n: {}
  },

  onShow() {
    this.loadTranslations();
    this.refresh();
    app.verifyMascots('orders', [
      { name: 'bao', css: 'none (orders-mascot)' }
    ]);
  },

  loadTranslations() {
    const translations = i18n.getPageTranslations('orders');
    this.setData({ i18n: translations });
  },

  refresh() {
    const orders = app.globalData.tripOrders.map(o => Object.assign({}, o, {
      depositText: o.deposit.toLocaleString(),
      balanceText: o.balance.toLocaleString()
    }));
    const apps = app.globalData.partnerApplications.map(a => Object.assign({}, a, {
      categoriesText: a.categories.join("、"),
      modesText: a.modes.join("、"),
      marketsText: a.markets.join("、")
    }));
    this.setData({
      tripOrders: orders,
      firstChecklist: orders.length ? orders[0].checklist : [],
      applications: apps
    });
  },

  switchTab(e) {
    this.setData({ tab: Number(e.currentTarget.dataset.i) });
  },

  payBalance(e) {
    const order = this.data.tripOrders.find(o => o.id === e.currentTarget.dataset.id);
    if (!order) return;
    const lang = app.getLang();
    
    wx.showModal({
      title: lang === 'en' ? 'Pay Balance' : '支付余款',
      content: lang === 'en'
        ? `Confirm balance payment of ¥${order.balanceText} for "${order.title}"? Your trip will be fully confirmed after payment.`
        : `确认支付 "${order.title}" 的行程余款 ¥${order.balanceText}？支付后行程即全额确认。`,
      confirmText: lang === 'en' ? 'Pay with WeChat' : '微信支付',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: lang === 'en' ? 'Payment successful' : '支付成功', icon: "success" });
        }
      }
    });
  },

  joinGroup() {
    const trip = data.getTrips()[0];
    const lang = app.getLang();
    if (trip && trip.qrCode) {
      const baseUrl = app.globalData.baseUrl || "http://localhost:3000";
      this.setData({
        showQRModal: true,
        qrCodeUrl: baseUrl + trip.qrCode,
        groupTripTitle: trip.title
      });
    } else {
      wx.showModal({
        title: lang === 'en' ? 'Join Study Group WeChat' : '加入考察团微信群',
        content: lang === 'en'
          ? 'Please add the group leader on WeChat with your name as note. The leader will invite you to the study group WeChat group.'
          : '请添加领队微信，备注您的姓名，领队将拉您进入本期考察团专属微信群。',
        confirmText: lang === 'en' ? 'Copy WeChat ID' : '复制微信号',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({ 
              data: "TouristaAR_Lead",
              success: () => wx.showToast({ title: lang === 'en' ? 'Copied' : '已复制', icon: "success" })
            });
          }
        }
      });
    }
  },

  closeQRModal() {
    this.setData({ showQRModal: false });
  },

  saveQRCode() {
    const lang = app.getLang();
    wx.showLoading({ title: lang === 'en' ? 'Saving...' : '保存中...' });
    wx.downloadFile({
      url: this.data.qrCodeUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({ title: lang === 'en' ? 'Saved' : '保存成功', icon: "success" });
              this.closeQRModal();
            },
            fail: (err) => {
              wx.hideLoading();
              if (err.errMsg.includes("auth")) {
                wx.showModal({
                  title: lang === 'en' ? 'Save failed' : '保存失败',
                  content: lang === 'en' ? 'Please allow saving images to album' : '请允许保存图片到相册',
                  showCancel: false
                });
              } else {
                wx.showToast({ title: lang === 'en' ? 'Save failed' : '保存失败', icon: "none" });
              }
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: lang === 'en' ? 'Download failed' : '下载失败', icon: "none" });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: lang === 'en' ? 'Download failed' : '下载失败', icon: "none" });
      }
    });
  },

  viewItinerary() {
    const lang = app.getLang();
    wx.showToast({ title: lang === 'en' ? 'Itinerary feature in development' : '行程单功能开发中', icon: "none" });
  },

  viewVisaMaterials() {
    const lang = app.getLang();
    wx.showToast({ title: lang === 'en' ? 'Visa materials feature in development' : '签证材料功能开发中', icon: "none" });
  },

  goTrips() { wx.switchTab({ url: "/pages/trips/trips" }); },
  goBusiness() { wx.switchTab({ url: "/pages/business/business" }); }
});
