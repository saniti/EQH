import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enGB from "@/locales/en-GB.json";
import enAU from "@/locales/en-AU.json";
import es from "@/locales/es.json";

// Define supported locales
export const SUPPORTED_LOCALES = {
  "en-GB": { name: "English (UK)", flag: "🇬🇧" },
  "en-AU": { name: "English (AU)", flag: "🇦🇺" },
  "es": { name: "Español", flag: "🇪🇸" },
} as const;

export type SupportedLocale = keyof typeof SUPPORTED_LOCALES;

// Locale-specific date/number formats
export const LOCALE_FORMATS = {
  "en-GB": {
    dateFormat: "dd/MM/yyyy",
    timeFormat: "HH:mm",
    dateTimeFormat: "dd/MM/yyyy HH:mm",
    numberFormat: "en-GB",
    currencyCode: "GBP",
    currencySymbol: "£",
  },
  "en-AU": {
    dateFormat: "dd/MM/yyyy",
    timeFormat: "h:mm a",
    dateTimeFormat: "dd/MM/yyyy h:mm a",
    numberFormat: "en-AU",
    currencyCode: "AUD",
    currencySymbol: "$",
  },
  "es": {
    dateFormat: "dd/MM/yyyy",
    timeFormat: "HH:mm",
    dateTimeFormat: "dd/MM/yyyy HH:mm",
    numberFormat: "es-ES",
    currencyCode: "EUR",
    currencySymbol: "€",
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "en-GB": { translation: enGB },
      "en-AU": { translation: enAU },
      "es": { translation: es },
    },
    fallbackLng: "en-GB",
    supportedLngs: Object.keys(SUPPORTED_LOCALES),
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;

