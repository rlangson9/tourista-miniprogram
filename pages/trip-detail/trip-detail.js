// pages/trip-detail/trip-detail.js
const data = require("../../utils/data.js");
const i18n = require("../../utils/i18n.js");
const app = getApp();

Page({
  data: {
    trip: {},
    i18n: {},
    reviews: [],
    reviewCount: 0,
    avgRating: null,
    avgRatingNum: 0,
    commentInput: '',
    showWriteReview: false,
    expandedDay: null,
    newReview: {
      rating: 5,
      title: '',
      content: '',
      media: []
    }
  },

  onLoad(options) {
    this.loadTranslations();
    this.loadTrip(options.id);
    this.loadReviews(options.id);
    app.verifyMascots('trip-detail', [
      { name: 'mira', css: 'none (detail-mascot)' }
    ]);
  },

  onShow() {
    this.loadTranslations();
  },

  loadTranslations() {
    const translations = {
      ...i18n.getPageTranslations('tripDetail'),
      ...i18n.getPageTranslations('reviews')
    };
    this.setData({ i18n: translations });
  },

  loadTrip(id) {
    const lang = app.getLang();
    const t = data.getTrip(id || "zw");
    if (!t) return;

    const localizedItinerary = t.itinerary.map(item => ({
      ...item,
      title: lang === 'en' ? item.titleEn : item.title,
      desc: lang === 'en' ? item.descEn : item.desc,
      // Localize nested content
      schedule: (item.schedule || []).map(sch => ({
        ...sch,
        title: lang === 'en' ? sch.titleEn : sch.title,
        desc: lang === 'en' ? sch.descEn : sch.desc
      })),
      meetings: (item.meetings || []).map(mtg => ({
        ...mtg,
        company: lang === 'en' ? (mtg.companyEn || mtg.company) : mtg.company,
        purpose: lang === 'en' ? (mtg.purposeEn || mtg.purpose) : mtg.purpose,
        agenda: lang === 'en' ? (mtg.agendaEn || mtg.agenda) : mtg.agenda,
        outcome: lang === 'en' ? (mtg.outcomeEn || mtg.outcome) : mtg.outcome,
        preparation: lang === 'en' ? (mtg.preparationEn || mtg.preparation) : mtg.preparation
      })),
      activities: (item.activities || []).map(act => ({
        ...act,
        title: lang === 'en' ? (act.titleEn || act.title) : act.title,
        desc: lang === 'en' ? (act.descEn || act.desc) : act.desc
      })),
      meals: (item.meals || []).map(meal => ({
        ...meal,
        venue: lang === 'en' ? (meal.venueEn || meal.venue) : meal.venue,
        notes: lang === 'en' ? (meal.notesEn || meal.notes) : meal.notes
      })),
      accommodation: item.accommodation ? {
        ...item.accommodation,
        hotel: lang === 'en' ? (item.accommodation.hotelEn || item.accommodation.hotel) : item.accommodation.hotel,
        address: lang === 'en' ? (item.accommodation.addressEn || item.accommodation.address) : item.accommodation.address
      } : null,
      tips: lang === 'en' ? (item.tipsEn || item.tips) : item.tips
    }));

    const trip = Object.assign({}, t, {
      memberPriceText: t.memberPrice.toLocaleString(),
      normalPriceText: t.normalPrice.toLocaleString(),
      depositText: t.deposit.toLocaleString(),
      title: lang === 'en' ? t.titleEn : t.title,
      shortTitle: lang === 'en' ? t.shortTitleEn : t.shortTitle,
      country: lang === 'en' ? t.countryEn : t.country,
      lead: lang === 'en' ? t.leadEn : t.lead,
      structure: lang === 'en' ? t.structureEn : t.structure,
      includes: lang === 'en' ? t.includesEn : t.includes,
      seatTag: lang === 'en' ? t.seatTagEn : t.seatTag,
      itinerary: localizedItinerary
    });

    this.setData({ trip });
  },

  toggleDay(e) {
    const day = e.currentTarget.dataset.day;
    const currentExpanded = this.data.expandedDay;

    // Toggle: if clicking the same day, collapse it; otherwise expand the clicked day
    this.setData({
      expandedDay: currentExpanded === day ? null : day
    });
  },

  stopPropagation() {
    // Prevent event from propagating to parent elements
  },

  loadReviews(tripId) {
    const openid = app.globalData.user.openid || 'anonymous';
    wx.request({
      url: `${app.globalData.baseUrl || 'http://localhost:3000'}/api/reviews/${tripId}`,
      method: 'GET',
      success: (res) => {
        const reviews = res.data.map(r => ({
          ...r,
          liked: r.likedBy && r.likedBy.includes(openid),
          showComments: false
        }));
        this.setData({ reviews });
        this.updateReviewStats();
        this.loadReviewStats(tripId);
      },
      fail: () => {
        this.setData({ reviews: [] });
      }
    });
  },

  loadReviewStats(tripId) {
    wx.request({
      url: `${app.globalData.baseUrl || 'http://localhost:3000'}/api/reviews/${tripId}/stats`,
      method: 'GET',
      success: (res) => {
        this.setData({
          reviewCount: res.data.count,
          avgRating: res.data.avgRating,
          avgRatingNum: res.data.avgRating ? Math.round(res.data.avgRating) : 0
        });
      }
    });
  },

  updateReviewStats() {
    const reviews = this.data.reviews;
    const count = reviews.length;
    const avgRating = count > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1) 
      : null;
    this.setData({
      reviewCount: count,
      avgRating,
      avgRatingNum: avgRating ? Math.round(avgRating) : 0
    });
  },

  goBooking() {
    wx.navigateTo({ url: `/pages/booking/booking?id=${this.data.trip.id}` });
  },

  contactAdvisor() {
    const lang = app.getLang();
    wx.showModal({
      title: lang === 'en' ? 'Contact Advisor' : '联系顾问',
      content: lang === 'en' 
        ? 'Add advisor on WeChat for 1-on-1 trip planning and full service.'
        : '添加顾问微信，享一对一行程规划与全程服务。',
      confirmText: lang === 'en' ? 'Copy WeChat ID' : '复制微信号',
      success: (res) => {
        if (res.confirm) wx.setClipboardData({ data: "TouristaAR_Advisor" });
      }
    });
  },

  openWriteReview() {
    this.setData({ showWriteReview: true });
  },

  closeWriteReview() {
    this.setData({ showWriteReview: false });
  },

  stopPropagation() {
    // Prevent event from propagating to modal-overlay
  },

  setRating(e) {
    this.setData({ 'newReview.rating': Number(e.currentTarget.dataset.rating) });
  },

  onReviewInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`newReview.${field}`]: e.detail.value });
  },

  uploadMedia() {
    const lang = app.getLang();
    wx.chooseMedia({
      count: 9,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const media = res.tempFiles.map(f => ({
          url: f.tempFilePath,
          type: f.type
        }));
        const newMedia = [...this.data.newReview.media, ...media];
        this.setData({ 'newReview.media': newMedia.slice(0, 9) });
      },
      fail: () => {
        wx.showToast({
          title: lang === 'en' ? 'Upload failed' : '上传失败',
          icon: 'none'
        });
      }
    });
  },

  removeMedia(e) {
    const index = e.currentTarget.dataset.index;
    const media = this.data.newReview.media.filter((_, i) => i !== index);
    this.setData({ 'newReview.media': media });
  },

  submitReview() {
    const { newReview, trip } = this.data;
    if (!newReview.content && newReview.media.length === 0) {
      wx.showToast({
        title: app.getLang() === 'en' ? 'Please add content or photos' : '请添加内容或图片',
        icon: 'none'
      });
      return;
    }

    const user = app.globalData.user;
    wx.request({
      url: `${app.globalData.baseUrl || 'http://localhost:3000'}/api/reviews`,
      method: 'POST',
      data: {
        tripId: trip.id,
        openid: user.openid || null,
        userName: user.name || user.nameEn || 'Anonymous',
        rating: newReview.rating,
        title: newReview.title,
        content: newReview.content,
        media: newReview.media
      },
      success: () => {
        wx.showToast({
          title: this.data.i18n.success,
          icon: 'success'
        });
        this.setData({ 
          showWriteReview: false,
          newReview: { rating: 5, title: '', content: '', media: [] }
        });
        this.loadReviews(trip.id);
      },
      fail: () => {
        wx.showToast({
          title: app.getLang() === 'en' ? 'Submit failed' : '提交失败',
          icon: 'none'
        });
      }
    });
  },

  toggleLike(e) {
    const reviewId = e.currentTarget.dataset.id;
    const openid = app.globalData.user.openid || 'anonymous';
    
    wx.request({
      url: `${app.globalData.baseUrl || 'http://localhost:3000'}/api/reviews/${reviewId}/like`,
      method: 'POST',
      data: { openid },
      success: (res) => {
        const reviews = this.data.reviews.map(r => 
          r.id === reviewId ? { ...res.data, liked: !r.liked } : r
        );
        this.setData({ reviews });
      }
    });
  },

  openComments(e) {
    const reviewId = e.currentTarget.dataset.id;
    const reviews = this.data.reviews.map(r => 
      r.id === reviewId ? { ...r, showComments: !r.showComments } : r
    );
    this.setData({ reviews });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  submitComment(e) {
    const reviewId = e.currentTarget.dataset.reviewid;
    const content = this.data.commentInput.trim();
    if (!content) return;

    const user = app.globalData.user;
    wx.request({
      url: `${app.globalData.baseUrl || 'http://localhost:3000'}/api/reviews/${reviewId}/comments`,
      method: 'POST',
      data: {
        openid: user.openid || null,
        userName: user.name || user.nameEn || 'Anonymous',
        content
      },
      success: (res) => {
        const reviews = this.data.reviews.map(r => {
          if (r.id === reviewId) {
            return {
              ...r,
              comments: [...r.comments, res.data]
            };
          }
          return r;
        });
        this.setData({ reviews, commentInput: '' });
      },
      fail: () => {
        wx.showToast({
          title: app.getLang() === 'en' ? 'Comment failed' : '评论失败',
          icon: 'none'
        });
      }
    });
  },

  shareReview(e) {
    const reviewId = e.currentTarget.dataset.id;
    const review = this.data.reviews.find(r => r.id === reviewId);
    if (!review) return;

    const lang = app.getLang();
    const title = lang === 'en' ? 'Check out this review!' : '查看这条评价！';
    const content = review.content || review.title || lang === 'en' ? 'Great trip experience' : '很棒的行程体验';

    wx.showActionSheet({
      itemList: [lang === 'en' ? 'Share to Moments' : '分享到朋友圈'],
      success: () => {
        wx.showToast({
          title: this.data.i18n.shareSuccess,
          icon: 'success'
        });
      }
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    const urls = this.data.reviews
      .flatMap(r => r.media.map(m => m.url))
      .filter(u => u);
    
    wx.previewImage({
      current: url,
      urls
    });
  }
});
