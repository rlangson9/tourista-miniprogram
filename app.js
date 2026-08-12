const i18n = require('./utils/i18n.js');

App({
  globalData: {
    baseUrl: 'http://localhost:3000',
    lang: 'zh',
    // Logged-in user
    user: { loggedIn: false, name: '', nameEn: '', avatar: '', isMember: false, isVerifiedCompany: false, company: '', companyEn: '', memberSaved: 0 },
    // Trip orders placed by this user
    tripOrders: [],
    // Business / partnership applications
    partnerApplications: []
  },

  onLaunch() {
    // Initialize language from storage
    this.globalData.lang = i18n.initLanguage();
    // Load user from storage
    this.loadUserFromStorage();
    // Load user data (orders, applications)
    this.loadUserData();
  },

  loadUserFromStorage() {
    try {
      const userData = wx.getStorageSync('tourista_user');
      if (userData) {
        this.globalData.user = userData;
      }
    } catch (e) {}
  },

  saveUserToStorage(user) {
    try {
      wx.setStorageSync('tourista_user', user);
    } catch (e) {}
  },

  login(userInfo) {
    const user = {
      loggedIn: true,
      name: userInfo.name || '微信用户',
      nameEn: userInfo.nameEn || 'WeChat User',
      avatar: userInfo.avatar || '',
      isMember: userInfo.isMember || false,
      isVerifiedCompany: userInfo.isVerifiedCompany || false,
      company: userInfo.company || '',
      companyEn: userInfo.companyEn || '',
      memberSaved: userInfo.memberSaved || 0,
      openid: userInfo.openid || ''
    };
    this.globalData.user = user;
    this.saveUserToStorage(user);
    this.loadUserData();
  },

  logout() {
    const defaultUser = { loggedIn: false, name: '', nameEn: '', avatar: '', isMember: false, isVerifiedCompany: false, company: '', companyEn: '', memberSaved: 0 };
    this.globalData.user = defaultUser;
    this.globalData.tripOrders = [];
    this.globalData.partnerApplications = [];
    try {
      wx.removeStorageSync('tourista_user');
      wx.removeStorageSync('tourista_orders');
      wx.removeStorageSync('tourista_applications');
    } catch (e) {}
  },

  loadUserData() {
    const user = this.globalData.user;
    if (!user.loggedIn) {
      // Load mock data for demo
      this.loadMockData();
      return;
    }
    
    wx.request({
      url: `${this.globalData.baseUrl}/api/user/profile`,
      method: 'GET',
      header: { 'X-Openid': user.openid || 'mock' },
      success: (res) => {
        if (res.data && res.data.user) {
          const updatedUser = { ...user, ...res.data.user };
          this.globalData.user = updatedUser;
          this.saveUserToStorage(updatedUser);
        }
        if (res.data && res.data.orders) {
          this.globalData.tripOrders = res.data.orders;
        }
        if (res.data && res.data.applications) {
          this.globalData.partnerApplications = res.data.applications;
        }
      },
      fail: () => {
        this.loadMockData();
      }
    });
  },

  loadMockData() {
    this.globalData.tripOrders = [
      {
        id: "T20260719",
        tripId: "zw",
        title: "津巴布韦商务考察团 · 7天",
        titleEn: "Zimbabwe Business Tour · 7 Days",
        depart: "2026.07.19",
        city: "哈拉雷",
        cityEn: "Harare",
        status: "已确认",
        statusEn: "Confirmed",
        deposit: 8000,
        balance: 20000,
        balanceDue: "2026.07.05",
        checklist: [
          { label: "护照有效期6个月以上", labelEn: "Passport valid for 6+ months", done: true },
          { label: "黄热病疫苗证书", labelEn: "Yellow fever vaccine certificate", done: true },
          { label: "落地签材料（照片+行程）", labelEn: "Visa on arrival materials (photo + itinerary)", done: false },
          { label: "美元现金准备建议", labelEn: "USD cash recommended", done: false, info: true }
        ]
      }
    ];
    this.globalData.partnerApplications = [
      {
        id: "P20260610",
        company: "上海科技创新有限公司",
        companyEn: "Shanghai Tech Innovation Co., Ltd.",
        categories: ["家用电器"],
        categoriesEn: ["Home Appliances"],
        modes: ["分销代理", "展厅入驻"],
        modesEn: ["Distribution", "Showroom Entry"],
        markets: ["津巴布韦", "南非"],
        marketsEn: ["Zimbabwe", "South Africa"],
        status: "顾问已对接",
        statusEn: "Advisor Connected",
        createdAt: "2026.06.10"
      }
    ];
  },

  // Get current language
  getLang() {
    return this.globalData.lang;
  },

  // Set language and notify all pages
  setLang(lang) {
    this.globalData.lang = lang;
    i18n.setLanguage(lang);
  },

  // Get translation
  t(key) {
    return i18n.t(key);
  },

  // Get localized text based on current language
  getLocalizedText(zhText, enText) {
    return this.globalData.lang === 'en' ? enText : zhText;
  },

  // Verify mascot images are rendered and not blocking interactions
  verifyMascots(pageName, mascots) {
    console.log(`[Mascot] === Verifying ${mascots.length} mascot(s) on "${pageName}" ===`);
    mascots.forEach(m => {
      const src = `/images/mascot-${m.name}.png`;
      wx.getImageInfo({
        src,
        success: (res) => {
          console.log(`[Mascot] ✓ ${m.name} rendered on "${pageName}" | src=${src} | ${res.width}x${res.height} | pointer-events=${m.css || 'none'}`);
        },
        fail: (err) => {
          console.error(`[Mascot] ✗ ${m.name} FAILED on "${pageName}" | src=${src} | error:`, err.errMsg || err);
        }
      });
    });
  }
});
