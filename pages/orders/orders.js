// pages/orders/orders.js
const app = getApp();

Page({
  data: {
    tab: 0,
    tripOrders: [],
    firstChecklist: [],
    applications: [],
    showQRModal: false,
    qrCodeUrl: "",
    groupTripTitle: ""
  },

  onShow() {
    this.refresh();
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
    
    wx.showModal({
      title: "支付余款",
      content: `确认支付 "${order.title}" 的行程余款 ¥${order.balanceText}？支付后行程即全额确认。`,
      confirmText: "微信支付",
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: "支付成功", icon: "success" });
        }
      }
    });
  },

  joinGroup() {
    const trip = app.globalData.trips[0];
    if (trip && trip.qrCode) {
      const baseUrl = app.globalData.baseUrl || "http://localhost:3000";
      this.setData({
        showQRModal: true,
        qrCodeUrl: baseUrl + trip.qrCode,
        groupTripTitle: trip.title
      });
    } else {
      wx.showModal({
        title: "加入考察团微信群",
        content: "请添加领队微信，备注您的姓名，领队将拉您进入本期考察团专属微信群。",
        confirmText: "复制微信号",
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({ 
              data: "TouristaAR_Lead",
              success: () => wx.showToast({ title: "已复制", icon: "success" })
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
    wx.showLoading({ title: "保存中..." });
    wx.downloadFile({
      url: this.data.qrCodeUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({ title: "保存成功", icon: "success" });
              this.closeQRModal();
            },
            fail: (err) => {
              wx.hideLoading();
              if (err.errMsg.includes("auth")) {
                wx.showModal({
                  title: "保存失败",
                  content: "请允许保存图片到相册",
                  showCancel: false
                });
              } else {
                wx.showToast({ title: "保存失败", icon: "none" });
              }
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: "下载失败", icon: "none" });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: "下载失败", icon: "none" });
      }
    });
  },

  viewItinerary() {
    wx.showToast({ title: "行程单功能开发中", icon: "none" });
  },

  viewVisaMaterials() {
    wx.showToast({ title: "签证材料功能开发中", icon: "none" });
  },

  goTrips() { wx.switchTab({ url: "/pages/trips/trips" }); },
  goBusiness() { wx.switchTab({ url: "/pages/business/business" }); }
});
