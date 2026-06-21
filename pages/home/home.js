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
  },

  onShow() {
    this.loadTranslations();
    this.loadData();
  },

  loadTranslations() {
    const translations = i18n.getPageTranslations('home');
    const lang = app.getLang();
    const statsLabels = lang === 'en' 
      ? ['Clients Served', 'Local Companies', 'Regular Tours', 'Harare Showroom']
      : ['服务客户', '本地公司', '定期考察团', '哈拉雷展厅'];
    
    this.setData({
      i18n: translations,
      stats: [
        { num: "200+", label: statsLabels[0] },
        { num: lang === 'en' ? "2 Countries" : "2国", label: statsLabels[1] },
        { num: lang === 'en' ? "3/year" : "3次/年", label: statsLabels[2] },
        { num: "2900㎡", label: statsLabels[3] }
      ],
      bizMini: [
        { icon: "/images/icon-package.svg", title: translations.productExport, desc: translations.productExportDesc },
        { icon: "/images/icon-store.svg", title: translations.showroomEntry, desc: translations.showroomEntryDesc },
        { icon: "/images/icon-ship.svg", title: translations.logistics, desc: translations.logisticsDesc }
      ]
    });
  },

  loadData() {
    const f = data.getTrip("zw");
    const lang = app.getLang();
    this.setData({
      featured: Object.assign({}, f, {
        memberPriceText: f.memberPrice.toLocaleString()
      }),
      featuredTitle: lang === 'en' 
        ? `Zimbabwe Business Tour · ${f.days} Days`
        : f.title
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
          const stories = res.data.slice(0, 3).map(story => ({
            ...story,
            title: lang === 'en' ? story.titleEn || story.title : story.title,
            company: lang === 'en' ? story.companyEn || story.company : story.company,
            summary: lang === 'en' ? story.summaryEn || story.summary : story.summary,
            content: lang === 'en' ? story.contentEn || story.content : story.content,
            categoryText: this.getCategoryText(story.category, lang)
          }));
          this.setData({ stories, filteredStories: stories });
        }
      },
      fail: () => {
        const stories = this.getMockStories(lang);
        this.setData({ stories, filteredStories: stories });
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

  getMockStories(lang) {
    if (lang === 'en') {
      return [
        {
          id: 1,
          title: 'Electronics Export Success',
          company: 'Shenzhen Tech Co.',
          summary: 'Successfully exported consumer electronics to Zimbabwe, establishing distribution network covering 3 major cities.',
          content: 'Shenzhen Tech Co. partnered with Tourista AR to enter the Zimbabwean market. Within 6 months, they established a distribution network covering Harare, Bulawayo, and Mutare, achieving monthly sales of over $50,000.',
          category: 'business',
          categoryText: 'Business',
          media: []
        },
        {
          id: 2,
          title: 'Mining Investment Journey',
          company: 'Zhejiang Mining Group',
          summary: 'Completed successful investment in Zimbabwe mining sector after joining our business tour.',
          content: 'Zhejiang Mining Group joined Tourista AR\'s Zimbabwe Business Tour, met with local mining authorities, and successfully invested $2 million in a gold mining project.',
          category: 'investment',
          categoryText: 'Investment',
          media: []
        },
        {
          id: 3,
          title: 'Agricultural Equipment Partnership',
          company: 'Shandong Agri-Machinery',
          summary: 'Signed distribution agreement for agricultural machinery in Southern Africa.',
          content: 'Shandong Agri-Machinery showcased their products in Tourista AR\'s Harare showroom and signed a distribution agreement with 3 local partners, covering Zimbabwe and South Africa markets.',
          category: 'business',
          categoryText: 'Business',
          media: []
        }
      ];
    } else {
      return [
        {
          id: 1,
          title: '电子产品出口成功案例',
          company: '深圳科技有限公司',
          summary: '成功将消费电子产品出口到津巴布韦，建立覆盖3个主要城市的分销网络。',
          content: '深圳科技有限公司与Tourista AR合作进入津巴布韦市场。6个月内，他们建立了覆盖哈拉雷、布拉瓦约和穆塔雷的分销网络，月销售额超过5万美元。',
          category: 'business',
          categoryText: '商务',
          media: []
        },
        {
          id: 2,
          title: '矿业投资之旅',
          company: '浙江矿业集团',
          summary: '参加商务考察团后，成功完成在津巴布韦矿业领域的投资。',
          content: '浙江矿业集团参加了Tourista AR的津巴布韦商务考察团，与当地矿业主管部门会面，并成功投资200万美元于一个金矿项目。',
          category: 'investment',
          categoryText: '投资',
          media: []
        },
        {
          id: 3,
          title: '农业设备合作',
          company: '山东农业机械',
          summary: '签署了南部非洲农业机械分销协议。',
          content: '山东农业机械在Tourista AR哈拉雷展厅展示了他们的产品，并与3个当地合作伙伴签署了分销协议，覆盖津巴布韦和南非市场。',
          category: 'business',
          categoryText: '商务',
          media: []
        }
      ];
    }
  },

  openStoryDetail(e) {
    const id = e.currentTarget.dataset.id;
    const story = this.data.stories.find(s => s.id === id);
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

  showStoriesModal() {
    wx.showToast({
      title: app.getLang() === 'en' ? 'More stories coming soon' : '更多案例即将推出',
      icon: 'none'
    });
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
            categoryText: this.getCategoryText(o.category, lang)
          }));
          this.setData({ opportunities, filteredOpportunities: opportunities });
        } else {
          const opportunities = this.getMockOpportunities(lang);
          this.setData({ opportunities, filteredOpportunities: opportunities });
        }
      },
      fail: () => {
        const opportunities = this.getMockOpportunities(lang);
        this.setData({ opportunities, filteredOpportunities: opportunities });
      }
    });
  },

  getCategoryText(category, lang) {
    const map = {
      investment: lang === 'en' ? 'Investment' : '投资',
      trade: lang === 'en' ? 'Trade' : '贸易',
      joint_venture: lang === 'en' ? 'Joint Venture' : '合资',
      supply: lang === 'en' ? 'Supply' : '供应',
      project: lang === 'en' ? 'Project' : '项目'
    };
    return map[category] || (lang === 'en' ? 'Other' : '其他');
  },

  getMockOpportunities(lang) {
    if (lang === 'en') {
      return [
        {
          id: 1,
          title: 'Solar Panel Supply Contract',
          country: 'Zimbabwe',
          type: 'demand',
          typeText: 'Demand',
          category: 'supply',
          categoryText: 'Supply',
          description: 'Government tender for 50MW solar panel supply. Looking for Chinese manufacturers with competitive pricing and quality certifications.',
          requirements: 'ISO 9001 certified, previous experience with government projects in Africa, delivery within 90 days.',
          budget: 'USD 8M',
          deadline: '2026-08-30'
        },
        {
          id: 2,
          title: 'Mining Equipment Investment',
          country: 'South Africa',
          type: 'opportunity',
          typeText: 'Opportunity',
          category: 'investment',
          categoryText: 'Investment',
          description: 'Established gold mine seeking equipment investment partner. Ready to start production with Chinese mining equipment.',
          requirements: 'Minimum investment USD 500K, equipment supply capability, technical support team.',
          budget: 'USD 500K-1M',
          deadline: '2026-09-15'
        },
        {
          id: 3,
          title: 'Pharmaceutical Distribution Partnership',
          country: 'Nigeria',
          type: 'opportunity',
          typeText: 'Opportunity',
          category: 'joint_venture',
          categoryText: 'Joint Venture',
          description: 'Local distributor seeking partnership with Chinese pharmaceutical companies to expand product portfolio.',
          requirements: 'FDA/NAFDAC approved products, competitive pricing, marketing support.',
          budget: 'Negotiable',
          deadline: ''
        }
      ];
    } else {
      return [
        {
          id: 1,
          title: '太阳能板供应合同',
          country: '津巴布韦',
          type: 'demand',
          typeText: '需求',
          category: 'supply',
          categoryText: '供应',
          description: '政府招标50MW太阳能板供应项目，寻求具有竞争力价格和质量认证的中国制造商。',
          requirements: 'ISO 9001认证，有非洲政府项目经验，90天内交付。',
          budget: '800万美元',
          deadline: '2026-08-30'
        },
        {
          id: 2,
          title: '矿业设备投资机会',
          country: '南非',
          type: 'opportunity',
          typeText: '机会',
          category: 'investment',
          categoryText: '投资',
          description: '成熟金矿寻求设备投资合作伙伴，准备使用中国采矿设备开始生产。',
          requirements: '最低投资50万美元，设备供应能力，技术支持团队。',
          budget: '50-100万美元',
          deadline: '2026-09-15'
        },
        {
          id: 3,
          title: '医药分销合作',
          country: '尼日利亚',
          type: 'opportunity',
          typeText: '机会',
          category: 'joint_venture',
          categoryText: '合资',
          description: '当地分销商寻求与中国制药公司合作，扩大产品组合。',
          requirements: 'FDA/NAFDAC认证产品，有竞争力的价格，营销支持。',
          budget: '商议',
          deadline: ''
        }
      ];
    }
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
