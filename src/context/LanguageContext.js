"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations } from "@/i18n/translations";

const LanguageContext = createContext(null);
const LANG_STORAGE_KEY = "importora_lang";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("bn");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      if (stored && translations[stored]) {
        queueMicrotask(() => setLanguageState(stored));
        document.documentElement.lang = stored;
      } else {
        // Default to Bangla if no stored preference
        document.documentElement.lang = "bn";
      }
    } catch (e) {
      console.warn("Could not load language from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setLanguage = useCallback((lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      document.documentElement.lang = lang;
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch (e) {
        console.warn("Could not save language to storage", e);
      }
    }
  }, []);

  // Resolve a dot-notation key against the current language, falling back to
  // English, then to the raw key so missing strings are visible but harmless.
  const t = useCallback(
    (key) => {
      const keys = key.split(".");

      const resolve = (dict) => {
        let value = dict;
        for (const k of keys) {
          if (value && typeof value === "object" && k in value) {
            value = value[k];
          } else {
            return undefined;
          }
        }
        return typeof value === "string" ? value : undefined;
      };

      const current = resolve(translations[language]);
      if (current !== undefined) return current;

      const fallback = resolve(translations.en);
      return fallback !== undefined ? fallback : key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
