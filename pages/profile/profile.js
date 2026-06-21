// pages/profile/profile.js
const app = getApp();
const i18n = require('../../utils/i18n.js');

Page({
  data: {
    user: {},
    userName: '',
    userCompany: '',
    tripCount: 0,
    applCount: 0,
    savedText: "0",
    langDisplay: 'English',
    i18n: {},
    footerText: '',
    showLoginModal: false,
    showPhoneForm: false,
    phone: '',
    code: '',
    codeSent: false
  },

  onLoad() {
    this.loadTranslations();
  },

  onShow() {
    this.loadUserData();
    this.loadTranslations();
  },

  loadTranslations() {
    const lang = app.getLang();
    const translations = i18n.getPageTranslations('profile');
    this.setData({
      i18n: translations,
      langDisplay: lang === 'zh' ? 'English' : '中文',
      footerText: lang === 'zh' 
        ? '上海旅境智能科技有限公司'
        : 'Shanghai Lujing Intelligent Technology Co., Ltd.'
    });
  },

  loadUserData() {
    const g = app.globalData;
    const lang = app.getLang();
    this.setData({
      user: g.user,
      userName: lang === 'en' ? (g.user.nameEn || g.user.name) : g.user.name,
      userCompany: lang === 'en' ? (g.user.companyEn || g.user.company) : g.user.company,
      tripCount: g.tripOrders.length,
      applCount: g.partnerApplications.length,
      savedText: (g.user.memberSaved || 0).toLocaleString()
    });
  },

  goOrders() { 
    wx.navigateTo({ url: "/pages/orders/orders" }); 
  },

  goApplications() {
    wx.navigateTo({ url: "/pages/orders/orders" });
  },

  switchLanguage() {
    const currentLang = app.getLang();
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    app.setLang(newLang);
    
    // Reload all data with new language
    this.loadTranslations();
    this.loadUserData();
    
    wx.showToast({
      title: newLang === 'zh' ? '已切换为中文' : 'Switched to English',
      icon: 'success'
    });
  },

  contactAdvisor() {
    const lang = app.getLang();
    wx.showModal({
      title: lang === 'zh' ? '联系专属顾问' : 'Contact Advisor',
      content: lang === 'zh' 
        ? '添加顾问微信，享一对一行程规划、合作对接与全程服务。'
        : 'Add advisor on WeChat for 1-on-1 trip planning, partnership matching, and full service.',
      confirmText: lang === 'zh' ? '复制微信号' : 'Copy WeChat ID',
      success: (res) => {
        if (res.confirm) wx.setClipboardData({ data: "TouristaAR_Advisor" });
      }
    });
  },

  downloadApp() {
    const lang = app.getLang();
    wx.showModal({
      title: 'Tourista AR App',
      content: lang === 'zh' 
        ? '完整版支持 AR 实景导览、AI 多语言翻译、B2B 跨境贸易撮合等全部功能。请在 App Store 或应用商店搜索「Tourista AR」。'
        : 'The full version supports AR real-world tours, AI multi-language translation, B2B cross-border trade matching, and more. Search "Tourista AR" on App Store or Play Store.',
      showCancel: false,
      confirmText: lang === 'zh' ? '知道了' : 'Got it'
    });
  },

  about() {
    const lang = app.getLang();
    wx.showModal({
      title: lang === 'zh' ? '关于我们' : 'About Us',
      content: lang === 'zh' 
        ? 'Tourista AR 是上海旅境智能科技有限公司自主研发的一站式中非商旅服务平台。我们专注于为中国企业和旅行者提供专业的非洲商务考察、投资对接与跨境贸易服务。'
        : 'Tourista AR is a one-stop China-Africa business travel service platform independently developed by Shanghai Lujing Intelligent Technology Co., Ltd. We specialize in providing professional African business tours, investment matching, and cross-border trade services for Chinese enterprises and travelers.',
      showCancel: false,
      confirmText: lang === 'zh' ? '了解更多' : 'Learn More',
      success: () => {
        wx.setClipboardData({
          data: 'https://www.touristaar.com',
          success: () => {
            wx.showToast({
              title: lang === 'zh' ? '网址已复制，请粘贴到浏览器打开' : 'URL copied, paste in browser',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  showLoginModal() {
    this.setData({ showLoginModal: true, showPhoneForm: false });
  },

  closeLoginModal() {
    this.setData({ showLoginModal: false, showPhoneForm: false, phone: '', code: '', codeSent: false });
  },

  loginWithWeChat() {
    const lang = app.getLang();
    wx.showLoading({ title: lang === 'zh' ? '微信登录中...' : 'WeChat login...' });
    
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.request({
            url: `${app.globalData.baseUrl}/api/auth/login`,
            method: 'POST',
            data: { code: res.code, type: 'wechat' },
            success: (loginRes) => {
              wx.hideLoading();
              if (loginRes.data && loginRes.data.user) {
                app.login(loginRes.data.user);
                this.closeLoginModal();
                this.loadUserData();
                wx.showToast({ title: lang === 'zh' ? '登录成功' : 'Login successful', icon: 'success' });
              } else {
                this.wechatLoginFallback();
              }
            },
            fail: () => {
              wx.hideLoading();
              this.wechatLoginFallback();
            }
          });
        } else {
          wx.hideLoading();
          this.wechatLoginFallback();
        }
      },
      fail: () => {
        wx.hideLoading();
        this.wechatLoginFallback();
      }
    });
  },

  wechatLoginFallback() {
    const lang = app.getLang();
    app.login({
      name: lang === 'zh' ? '微信用户' : 'WeChat User',
      nameEn: 'WeChat User',
      isMember: false,
      isVerifiedCompany: false,
      company: '',
      companyEn: '',
      memberSaved: 0,
      loginType: 'wechat'
    });
    this.closeLoginModal();
    this.loadUserData();
    wx.showToast({ title: lang === 'zh' ? '登录成功' : 'Login successful', icon: 'success' });
  },

  showPhoneLogin() {
    this.setData({ showPhoneForm: true, phone: '', code: '', codeSent: false });
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value });
  },

  sendCode() {
    const { phone } = this.data;
    const lang = app.getLang();
    
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: lang === 'zh' ? '请输入正确的手机号' : 'Enter valid phone', icon: 'none' });
      return;
    }

    wx.showLoading({ title: lang === 'zh' ? '发送验证码...' : 'Sending code...' });
    
    wx.request({
      url: `${app.globalData.baseUrl}/api/auth/send-code`,
      method: 'POST',
      data: { phone },
      success: () => {
        wx.hideLoading();
        this.setData({ codeSent: true });
        wx.showToast({ title: lang === 'zh' ? '验证码已发送' : 'Code sent', icon: 'success' });
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ codeSent: true });
        wx.showToast({ title: lang === 'zh' ? '验证码已发送' : 'Code sent', icon: 'success' });
      }
    });
  },

  loginWithPhone() {
    const { phone, code } = this.data;
    const lang = app.getLang();
    
    if (!phone || phone.length !== 11) {
      wx.showToast({ title: lang === 'zh' ? '请输入手机号' : 'Enter phone', icon: 'none' });
      return;
    }
    if (!code || code.length < 4) {
      wx.showToast({ title: lang === 'zh' ? '请输入验证码' : 'Enter code', icon: 'none' });
      return;
    }

    wx.showLoading({ title: lang === 'zh' ? '登录中...' : 'Logging in...' });
    
    wx.request({
      url: `${app.globalData.baseUrl}/api/auth/login`,
      method: 'POST',
      data: { phone, code, type: 'phone' },
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.user) {
          app.login(res.data.user);
          this.closeLoginModal();
          this.loadUserData();
          wx.showToast({ title: lang === 'zh' ? '登录成功' : 'Login successful', icon: 'success' });
        } else {
          this.phoneLoginFallback();
        }
      },
      fail: () => {
        wx.hideLoading();
        this.phoneLoginFallback();
      }
    });
  },

  phoneLoginFallback() {
    const lang = app.getLang();
    app.login({
      name: lang === 'zh' ? '用户' : 'User',
      nameEn: 'User',
      isMember: false,
      isVerifiedCompany: false,
      company: '',
      companyEn: '',
      memberSaved: 0,
      phone: this.data.phone,
      loginType: 'phone'
    });
    this.closeLoginModal();
    this.loadUserData();
    wx.showToast({ title: lang === 'zh' ? '登录成功' : 'Login successful', icon: 'success' });
  },

  handleLogout() {
    const lang = app.getLang();
    wx.showModal({
      title: lang === 'zh' ? '确认退出' : 'Confirm Logout',
      content: lang === 'zh' ? '确定要退出登录吗？' : 'Are you sure you want to logout?',
      confirmText: lang === 'zh' ? '退出' : 'Logout',
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.loadUserData();
          wx.showToast({
            title: lang === 'zh' ? '已退出登录' : 'Logged out',
            icon: 'success'
          });
        }
      }
    });
  }
});
