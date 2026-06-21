// i18n - Internationalization utility
const zh = require('./locales/zh.js');
const en = require('./locales/en.js');

const locales = { zh, en };

let currentLang = 'zh';

function setLanguage(lang) {
  if (locales[lang]) {
    currentLang = lang;
    try {
      wx.setStorageSync('lang', lang);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  }
}

function getLanguage() {
  return currentLang;
}

function initLanguage() {
  try {
    const savedLang = wx.getStorageSync('lang');
    if (savedLang && locales[savedLang]) {
      currentLang = savedLang;
    }
  } catch (e) {
    console.error('Failed to get language preference:', e);
  }
  return currentLang;
}

function t(key) {
  const keys = key.split('.');
  let value = locales[currentLang];
  for (const k of keys) {
    if (value && value[k] !== undefined) {
      value = value[k];
    } else {
      // Fallback to Chinese if key not found in current language
      let fallback = locales['zh'];
      for (const fk of keys) {
        if (fallback && fallback[fk] !== undefined) {
          fallback = fallback[fk];
        } else {
          return key; // Return key if not found in any language
        }
      }
      return fallback;
    }
  }
  return value;
}

// Get all translations for a page
function getPageTranslations(pageKey) {
  const translations = {};
  const pageStrings = locales[currentLang][pageKey] || {};
  for (const key in pageStrings) {
    translations[key] = pageStrings[key];
  }
  return translations;
}

module.exports = {
  setLanguage,
  getLanguage,
  initLanguage,
  t,
  getPageTranslations,
  locales
};
