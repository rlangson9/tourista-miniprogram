// pages/profile/profile.js
const app = getApp();
const i18n = require('../../utils/i18n.js');

// Real team photos — drop the actual photo files into images/team/
// (raymond.jpg, blessed.jpg, sandra.jpg, elliot.jpg). If a file is
// missing, the card falls back to an initials avatar (see onTeamPhotoError).
const TEAM_PHOTOS = [
  '/images/team/raymond.jpg',
  '/images/team/blessed.jpg',
  '/images/team/sandra.jpg',
  '/images/team/elliot.jpg'
];

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
    codeSent: false,
    countdown: 0,
    showAbout: false,
    teamMembers: []
  },

  onLoad() {
    this.loadTranslations();
    app.verifyMascots('profile', [
      { name: 'lens', css: 'none (dl-mascot)' },
      { name: 'zola', css: 'none (about-mascot)' }
    ]);
  },

  onShow() {
    this.loadUserData();
    this.loadTranslations();
  },

  loadTranslations() {
    const lang = app.getLang();
    const translations = i18n.getPageTranslations('profile');
    const teamMembers = [
      { id: 1, photo: TEAM_PHOTOS[0], photoFailed: false, initial: 'R', name: translations.teamMember1Name, role: translations.teamMember1Role, bio: translations.teamMember1Bio || '' },
      { id: 2, photo: TEAM_PHOTOS[1], photoFailed: false, initial: 'B', name: translations.teamMember2Name, role: translations.teamMember2Role, bio: translations.teamMember2Bio || '' },
      { id: 3, photo: TEAM_PHOTOS[2], photoFailed: false, initial: 'S', name: translations.teamMember3Name, role: translations.teamMember3Role, bio: translations.teamMember3Bio || '' },
      { id: 4, photo: TEAM_PHOTOS[3], photoFailed: false, initial: 'E', name: translations.teamMember4Name, role: translations.teamMember4Role, bio: translations.teamMember4Bio || '' }
    ];
    this.setData({
      i18n: translations,
      teamMembers,
      langDisplay: lang === 'zh' ? 'English' : '中文',
      footerText: 'Tourista AR'
    });
  },

  // If a team photo file is missing, show an initials avatar instead
  onTeamPhotoError(e) {
    const id = e.currentTarget.dataset.id;
    const teamMembers = this.data.teamMembers.map(m =>
      m.id === id ? Object.assign({}, m, { photoFailed: true }) : m
    );
    this.setData({ teamMembers });
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
    this.setData({ showAbout: true });
  },

  closeAbout() {
    this.setData({ showAbout: false });
  },

  // Copy a piece of contact info (label + value are passed via data-* on the target)
  copyContact(e) {
    const lang = app.getLang();
    const { text, label } = e.currentTarget.dataset;
    if (!text) return;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: lang === 'zh' ? `已复制${label || ''}` : `${label || ''} copied`,
          icon: 'none'
        });
      }
    });
  },

  // Call the service hotline — take the first phone number if two are listed
  callHotline() {
    const raw = (this.data.i18n.hotlineValue || '').split(/\s*[\/／]\s*/)[0];
    const phone = raw.replace(/[^0-9+]/g, '');
    if (!phone) return;
    wx.makePhoneCall({ phoneNumber: phone });
  },

  // Prevent event propagation (used by modals via catchtap)
  noop() {},

  showLoginModal() {
    this.setData({ showLoginModal: true, showPhoneForm: false });
  },

  closeLoginModal() {
    this.setData({ showLoginModal: false, showPhoneForm: false, phone: '', code: '', codeSent: false, countdown: 0 });
    if (this._timer) clearInterval(this._timer);
  },

  loginWithWeChat() {
    const lang = app.getLang();
    wx.showLoading({ title: lang === 'zh' ? '微信登录中...' : 'WeChat login...' });
    
    wx.login({
      success: (res) => {
        if (res.code) {
          wx.request({
            url: `${app.globalData.baseUrl}/api/login`,
            method: 'POST',
            data: { code: res.code, type: 'wechat' },
            success: (loginRes) => {
              wx.hideLoading();
              if (loginRes.data && loginRes.data.user) {
                app.login(loginRes.data.user, loginRes.data.token);
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

  isValidPhone(phone) {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return /^1[3-9]\d{9}$/.test(cleaned);
  },

  sendCode() {
    const { phone } = this.data;
    const lang = app.getLang();
    
    if (this.data.countdown > 0) return;

    if (!this.isValidPhone(phone)) {
      wx.showToast({
        title: lang === 'zh' ? '请输入正确的手机号' : 'Please enter a valid phone number',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: lang === 'zh' ? '发送中...' : 'Sending...' });
    
    wx.request({
      url: `${app.globalData.baseUrl}/api/send-code`,
      method: 'POST',
      data: { phone },
      success: () => {
        wx.hideLoading();
        this.setData({ codeSent: true });
        wx.showToast({ title: lang === 'zh' ? '验证码已发送' : 'Code sent', icon: 'success' });
        this.startCountdown();
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ codeSent: true });
        wx.showToast({ title: lang === 'zh' ? '验证码已发送' : 'Code sent', icon: 'success' });
        this.startCountdown();
      }
    });
  },

  startCountdown() {
    this.setData({ countdown: 60 });
    this._timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(this._timer);
        this.setData({ countdown: 0 });
      } else {
        this.setData({ countdown: this.data.countdown - 1 });
      }
    }, 1000);
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer);
  },

  loginWithPhone() {
    const { phone, code } = this.data;
    const lang = app.getLang();
    
    if (!this.isValidPhone(phone)) {
      wx.showToast({ title: lang === 'zh' ? '请输入正确的手机号' : 'Please enter a valid phone number', icon: 'none' });
      return;
    }
    if (!code || code.length < 4) {
      wx.showToast({ title: lang === 'zh' ? '请输入验证码' : 'Please enter the code', icon: 'none' });
      return;
    }

    wx.showLoading({ title: lang === 'zh' ? '登录中...' : 'Logging in...' });
    
    wx.request({
      url: `${app.globalData.baseUrl}/api/login`,
      method: 'POST',
      data: { phone, code, type: 'phone' },
      success: (res) => {
        wx.hideLoading();
        if (res.data && res.data.user) {
          app.login(res.data.user, res.data.token);
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
