"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, type Locale, type Translations } from "@/lib/i18n/translations";

interface LanguageContextValue {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: Translations;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
  dir: "ltr",
});

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [language, setLanguageState] = useState<Locale>(initialLocale);

  const dir = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [language, dir]);

  function setLanguage(lang: Locale) {
    document.cookie = `locale=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    setLanguageState(lang);
    // Refresh so server components re-render with new locale
    window.location.reload();
  }

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, t: translations[language], dir }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
