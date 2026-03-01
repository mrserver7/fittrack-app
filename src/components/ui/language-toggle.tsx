"use client";
import { useLanguage } from "@/contexts/language-context";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      title="Toggle language"
      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {language === "en" ? "AR" : "EN"}
    </button>
  );
}
