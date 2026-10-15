"use client";

import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Sun, Moon } from "lucide-react";

/**
 * Light / dark theme toggle button. The icon reflects the *target* action
 * (a moon while in light mode => "switch to dark"), matching common UX.
 */
export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`flex items-center justify-center p-2.5 rounded-full text-foreground/70 dark:text-foreground/70 hover:bg-surface-muted dark:hover:bg-surface-muted transition-colors ${className}`}
      aria-label={isDark ? t("header.lightMode") : t("header.darkMode")}
      aria-pressed={isDark}
      title={isDark ? t("header.lightMode") : t("header.darkMode")}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
