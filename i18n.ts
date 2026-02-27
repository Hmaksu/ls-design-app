import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import trTranslation from './locales/tr.json';
import esTranslation from './locales/es.json';
import frTranslation from './locales/fr.json';
import deTranslation from './locales/de.json';
import roTranslation from './locales/ro.json';
import itTranslation from './locales/it.json';
import huTranslation from './locales/hu.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enTranslation,
            },
            tr: {
                translation: trTranslation,
            },
            es: {
                translation: esTranslation,
            },
            fr: {
                translation: frTranslation,
            },
            de: {
                translation: deTranslation,
            },
            ro: {
                translation: roTranslation,
            },
            it: {
                translation: itTranslation,
            },
            hu: {
                translation: huTranslation,
            },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
    });

export default i18n;
