// pages/home/home.js
const data = require("../../utils/data.js");
const i18n = require("../../utils/i18n.js");
const app = getApp();

Page({
  data: {
    stats: [],
    featured: {},
    featuredTitle: '',
    bizMini: [],
    stories: [],
    opportunities: [],
    showStoryModal: false,
    selectedStory: {},
    showOppModal: false,
    selectedOpp: {},
    showAllStoriesModal: false,
    showAllOpportunitiesModal: false,
    showStoryDropdown: false,
    showOppDropdown: false,
    storyFilter: 'all',
    oppTypeFilter: 'all',
    oppCategoryFilter: 'all',
    filteredStories: [],
    filteredOpportunities: [],
    // Search state
    searchText: '',
    allTrips: [],
    allStories: [],
    searchTrips: [],
    searchStories: [],
    searchOpportunities: [],
    searchResultCount: 0,
    showAskModal: false,
    askContext: '',
    askType: '',
    askTargetId: '',
    askContent: '',
    i18n: {}
  },

  onLoad() {
    this.loadTranslations();
    this.loadData();
    this.loadStories();
    this.loadOpportunities();
    app.verifyMascots('home', [
      { name: 'touri', css: 'none (hero-mascot)' },
      { name: 'mira', css: 'none (mode-mascot)' },
      { name: 'bao', css: 'none (mode-mascot)' },
      { name: 'lens', css: 'none (badge-ar-mascot)' },
      { name: 'zola', css: 'none (contact-mascot)' }
    ]);
  },

  onShow() {
    this.loadTranslations();
    this.loadData();
    this.loadStories();
    this.loadOpportunities();
  },

  loadTranslations() {
    const translations = i18n.getPageTranslations('home');
    const lang = app.getLang();
    
    this.setData({
      i18n: translations,
      stats: [
        { num: lang === 'en' ? '320+' : '320+', label: translations.statsClients },
        { num: lang === 'en' ? '6' : '6', label: translations.statsCountries },
        { num: lang === 'en' ? '24/yr' : '24次/年', label: translations.statsTrips },
        { num: '1,200m²', label: translations.statsShowroom }
      ],
      bizMini: [
        { icon: "/images/icon-package.svg", title: translations.productExport, desc: translations.productExportDesc },
        { icon: "/images/icon-store.svg", title: translations.showroomEntry, desc: translations.showroomEntryDesc },
        { icon: "/images/icon-ship.svg", title: translations.logistics, desc: translations.logisticsDesc }
      ]
    });
  },

  async loadData() {
    const lang = app.getLang();
    const [f, trips] = await Promise.all([data.fetchTrip("zw"), data.fetchTrips()]);
    // Keep the full localized catalog for the search bar
    const allTrips = trips.map(t => ({
      ...t,
      title: lang === 'en' ? t.titleEn : t.title,
      country: lang === 'en' ? t.countryEn : t.country,
      highlights: lang === 'en' ? t.highlightsEn : t.highlights,
      memberPriceText: t.memberPrice.toLocaleString()
    }));
    if (!f) {
      this.setData({ allTrips });
      this.applySearch(this.data.searchText);
      return;
    }
    const featuredTrips = trips.slice(0, 2).map(t => ({
      ...t,
      title: lang === 'en' ? t.titleEn : t.title,
      country: lang === 'en' ? t.countryEn : t.country,
      highlights: lang === 'en' ? t.highlightsEn : t.highlights,
      memberPriceText: t.memberPrice.toLocaleString()
    }));

    this.setData({
      allTrips,
      featured: Object.assign({}, f, {
        title: lang === 'en' ? f.titleEn : f.title,
        country: lang === 'en' ? f.countryEn : f.country,
        highlights: lang === 'en' ? f.highlightsEn : f.highlights,
        memberPriceText: f.memberPrice.toLocaleString()
      }),
      featuredTitle: lang === 'en'
        ? `${f.titleEn} · ${f.days} ${i18n.t('home.dayUnit')}`
        : f.title,
      featuredTrips
    });
    this.applySearch(this.data.searchText);
  },

  // ── Search ────────────────────────────────────────────────────────────────
  onSearchInput(e) {
    const q = e.detail.value;
    this.setData({ searchText: q });
    this.applySearch(q);
  },

  clearSearch() {
    this.applySearch('');
  },

  // Live group-filter across trips / stories / opportunities.
  // Matches the displayed language AND the other language, case-insensitive.
  applySearch(raw) {
    const q = String(raw || '').trim().toLowerCase();
    if (!q) {
      this.setData({ searchText: '', searchTrips: [], searchStories: [], searchOpportunities: [], searchResultCount: 0 });
      return;
    }
    const hit = (...vals) => vals.some(v =>
      Array.isArray(v) ? v.some(x => String(x || '').toLowerCase().includes(q))
                       : String(v || '').toLowerCase().includes(q)
    );
    const searchTrips = (this.data.allTrips || [])
      .filter(t => hit(t.title, t.titleEn, t.country, t.countryEn, t.highlights, t.highlightsEn))
      .slice(0, 3);
    const searchStories = (this.data.allStories || [])
      .filter(s => hit(s.title, s.titleEn, s.company, s.companyEn, s.summary, s.summaryEn))
      .slice(0, 3);
    const searchOpportunities = (this.data.opportunities || [])
      .filter(o => hit(o.title, o.titleEn, o.country, o.countryEn, o.description, o.descriptionEn))
      .slice(0, 3);
    this.setData({
      searchTrips,
      searchStories,
      searchOpportunities,
      searchResultCount: searchTrips.length + searchStories.length + searchOpportunities.length
    });
  },

  goTrips() {
    wx.switchTab({ url: "/pages/trips/trips" });
  },

  goBusiness() {
    this.setData({ showAllOpportunitiesModal: true });
  },

  openTrip(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/trip-detail/trip-detail?id=${id}` });
  },

  loadStories() {
    const lang = app.getLang();
    wx.request({
      url: `${app.globalData.baseUrl}/api/stories`,
      method: 'GET',
      success: (res) => {
        if (res.data && Array.isArray(res.data)) {
          const all = res.data.map(story => ({
            ...story,
            title: lang === 'en' ? story.titleEn || story.title : story.title,
            company: lang === 'en' ? story.companyEn || story.company : story.company,
            summary: lang === 'en' ? story.summaryEn || story.summary : story.summary,
            content: lang === 'en' ? story.contentEn || story.content : story.content,
            categoryText: this.getCategoryText(story.category, lang)
          }));
          const stories = all.slice(0, 3);
          this.setData({ stories, filteredStories: stories, allStories: all });
          this.applySearch(this.data.searchText);
        }
      },
      fail: () => {
        this.setData({ stories: [], filteredStories: [], allStories: [] });
        this.applySearch(this.data.searchText);
      }
    });
  },

  getCategoryText(category, lang) {
    const categories = {
      tour: lang === 'en' ? 'Tour' : '考察团',
      business: lang === 'en' ? 'Business' : '商务',
      investment: lang === 'en' ? 'Investment' : '投资'
    };
    return categories[category] || (lang === 'en' ? 'Success' : '成功');
  },

  openStoryDetail(e) {
    const id = e.currentTarget.dataset.id;
    // Search results may reference stories beyond the 3 shown on the feed
    const story = (this.data.allStories || []).find(s => s.id === id) ||
                  this.data.stories.find(s => s.id === id);
    if (story) {
      this.setData({
        selectedStory: story,
        showStoryModal: true
      });
    }
  },

  closeStoryModal() {
    this.setData({ showStoryModal: false });
  },

  loadOpportunities() {
    const lang = app.getLang();
    wx.request({
      url: `${app.globalData.baseUrl}/api/opportunities`,
      method: 'GET',
      success: (res) => {
        if (res.data && res.data.length > 0) {
          const opportunities = res.data.map(o => ({
            ...o,
            title: lang === 'en' ? o.titleEn : o.title,
            country: lang === 'en' ? o.countryEn : o.country,
            description: lang === 'en' ? o.descriptionEn : o.description,
            requirements: lang === 'en' ? o.requirementsEn : o.requirements,
            typeText: lang === 'en' ? (o.type === 'demand' ? 'Demand' : 'Opportunity') : (o.type === 'demand' ? '需求' : '机会'),
            categoryText: this.getOppCategoryText(o.category, lang)
          }));
          this.setData({ opportunities, filteredOpportunities: opportunities });
          this.applySearch(this.data.searchText);
        } else {
          this.setData({ opportunities: [], filteredOpportunities: [] });
          this.applySearch(this.data.searchText);
        }
      },
      fail: () => {
        this.setData({ opportunities: [], filteredOpportunities: [] });
        this.applySearch(this.data.searchText);
      }
    });
  },

  getOppCategoryText(category, lang) {
    const map = {
      investment: lang === 'en' ? 'Investment' : '投资',
      trade: lang === 'en' ? 'Trade' : '贸易',
      joint_venture: lang === 'en' ? 'Joint Venture' : '合资',
      supply: lang === 'en' ? 'Supply' : '供应',
      project: lang === 'en' ? 'Project' : '项目'
    };
    return map[category] || (lang === 'en' ? 'Other' : '其他');
  },

  openOpportunityDetail(e) {
    const id = e.currentTarget.dataset.id;
    const opp = this.data.opportunities.find(o => o.id === id);
    if (opp) {
      this.setData({
        selectedOpp: opp,
        showOppModal: true
      });
    }
  },

  closeOppModal() {
    this.setData({ showOppModal: false });
  },

  showStoriesModal() {
    this.setData({ showAllStoriesModal: true });
  },

  closeAllStoriesModal() {
    this.setData({ showAllStoriesModal: false });
  },

  showOpportunitiesModal() {
    this.setData({ showAllOpportunitiesModal: true });
  },

  showAllOpportunities() {
    this.setData({ showAllOpportunitiesModal: true });
  },

  closeAllOpportunitiesModal() {
    this.setData({ showAllOpportunitiesModal: false });
  },

  toggleStoryDropdown() {
    this.setData({ showStoryDropdown: !this.data.showStoryDropdown });
  },

  toggleOppDropdown() {
    this.setData({ showOppDropdown: !this.data.showOppDropdown });
  },

  setStoryFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ storyFilter: filter, showStoryDropdown: false });
    this.applyStoryFilter();
  },

  applyStoryFilter() {
    const { stories, storyFilter } = this.data;
    if (storyFilter === 'all') {
      this.setData({ filteredStories: stories });
    } else {
      this.setData({ filteredStories: stories.filter(s => s.category === storyFilter) });
    }
  },

  setOppTypeFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ oppTypeFilter: filter, showOppDropdown: false });
    this.applyOppFilter();
  },

  setOppCategoryFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ oppCategoryFilter: filter, showOppDropdown: false });
    this.applyOppFilter();
  },

  applyOppFilter() {
    const { opportunities, oppTypeFilter, oppCategoryFilter } = this.data;
    let filtered = opportunities;
    
    if (oppTypeFilter !== 'all') {
      filtered = filtered.filter(o => o.type === oppTypeFilter);
    }
    if (oppCategoryFilter !== 'all') {
      filtered = filtered.filter(o => o.category === oppCategoryFilter);
    }
    
    this.setData({ filteredOpportunities: filtered });
  },

  copyWeChat() {
    wx.setClipboardData({
      data: 'touristaar',
      success: () => wx.showToast({ title: app.getLang() === 'en' ? 'Copied!' : '已复制！', icon: 'success' })
    });
  },

  copyEmail() {
    wx.setClipboardData({
      data: 'rlangson91@touristaar.com',
      success: () => wx.showToast({ title: app.getLang() === 'en' ? 'Copied!' : '已复制！', icon: 'success' })
    });
  },

  viewQRCode() {
    wx.previewImage({
      urls: ['/QR code.jpg'],
      current: '/QR code.jpg'
    });
  },

  askAboutStory(e) {
    const id = e.currentTarget.dataset.id;
    const story = this.data.stories.find(s => s.id === id) || this.data.selectedStory;
    if (story) {
      this.setData({
        showAskModal: true,
        showStoryModal: false,
        showAllStoriesModal: false,
        askContext: story.title,
        askType: 'story_question',
        askTargetId: story.id,
        askContent: ''
      });
    }
  },

  askAboutOpp(e) {
    const id = e.currentTarget.dataset.id;
    const opp = this.data.opportunities.find(o => o.id === id) || this.data.selectedOpp;
    if (opp) {
      this.setData({
        showAskModal: true,
        showOppModal: false,
        showAllOpportunitiesModal: false,
        askContext: opp.title,
        askType: 'opportunity_question',
        askTargetId: opp.id,
        askContent: ''
      });
    }
  },

  onAskInput(e) {
    this.setData({ askContent: e.detail.value });
  },

  closeAskModal() {
    this.setData({
      showAskModal: false,
      askContent: ''
    });
  },

  submitAsk() {
    const lang = app.getLang();
    if (!this.data.askContent.trim()) {
      wx.showToast({
        title: lang === 'en' ? 'Please enter your question' : '请输入您的问题',
        icon: 'none'
      });
      return;
    }
    const user = app.globalData.user;
    const payload = {
      type: this.data.askType,
      targetId: this.data.askTargetId,
      content: this.data.askContent,
      openid: user.openid || 'guest',
      userName: user.name || (lang === 'en' ? 'Guest' : '访客')
    };
    wx.request({
      url: `${app.globalData.baseUrl}/api/inquiries`,
      method: 'POST',
      data: payload,
      success: (res) => {
        wx.showToast({
          title: lang === 'en' ? 'Question submitted!' : '问题已提交！',
          icon: 'success'
        });
        this.closeAskModal();
      },
      fail: () => {
        wx.showToast({
          title: lang === 'en' ? 'Saved locally. We will reach out soon.' : '已保存，我们会尽快联系您。',
          icon: 'success'
        });
        this.closeAskModal();
      }
    });
  },

  contactTeam(e) {
    const lang = app.getLang();
    wx.showActionSheet({
      itemList: lang === 'en' 
        ? ['Copy WeChat ID', 'Copy Email', 'View QR Code'] 
        : ['复制微信号', '复制邮箱', '查看二维码'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.setClipboardData({
            data: 'touristaar',
            success: () => wx.showToast({ title: lang === 'en' ? 'WeChat ID copied' : '微信号已复制', icon: 'success' })
          });
        } else if (res.tapIndex === 1) {
          wx.setClipboardData({
            data: 'rlangson91@touristaar.com',
            success: () => wx.showToast({ title: lang === 'en' ? 'Email copied' : '邮箱已复制', icon: 'success' })
          });
        } else if (res.tapIndex === 2) {
          wx.previewImage({
            urls: ['/QR code.jpg'],
            current: '/QR code.jpg'
          });
        }
      }
    });
  },

  submitOpportunityIntent(e) {
    const id = e.currentTarget.dataset.id;
    const opp = this.data.opportunities.find(o => o.id === id) || this.data.selectedOpp;
    if (!opp) return;
    const lang = app.getLang();
    const user = app.globalData.user;
    
    wx.showModal({
      title: lang === 'en' ? 'Submit Your Intent' : '提交合作意向',
      content: lang === 'en' 
        ? `Submit your intent for "${opp.title}"? We will contact you within 24 hours.`
        : `提交对"${opp.title}"的合作意向？我们将在24小时内联系您。`,
      confirmText: lang === 'en' ? 'Submit' : '提交',
      success: (res) => {
        if (res.confirm) {
          const payload = {
            type: 'opportunity_intent',
            opportunityId: opp.id,
            opportunityTitle: opp.title,
            openid: user.openid || 'guest',
            userName: user.name || (lang === 'en' ? 'Guest' : '访客'),
            userPhone: '',
            userCompany: user.company || ''
          };
          wx.request({
            url: `${app.globalData.baseUrl}/api/inquiries`,
            method: 'POST',
            data: payload,
            success: () => {
              wx.showToast({
                title: lang === 'en' ? 'Intent submitted!' : '意向已提交！',
                icon: 'success'
              });
            },
            fail: () => {
              wx.showToast({
                title: lang === 'en' ? 'Saved! We will contact you.' : '已保存！我们会联系您。',
                icon: 'success'
              });
            }
          });
        }
      }
    });
  },

  noop() {}
});
