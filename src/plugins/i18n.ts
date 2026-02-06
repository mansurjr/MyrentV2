import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import uzLat from '../locales/uz-lat.json';
import uzCyr from '../locales/uz-cyr.json';
import en from '../locales/en.json';

const resources = {
  uz: {
    translation: uzLat
  },
  uz_cyr: {
    translation: uzCyr
  },
  en: {
    translation: en
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'uz',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
