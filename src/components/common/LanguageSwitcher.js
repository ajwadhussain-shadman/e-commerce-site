"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Languages, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

/**
 * Language selector. Renders a compact dropdown with English / বাংলা options.
 *
 * variant:
 *   "icon"   -> compact icon-only trigger (used in the dense mobile header)
 *   "inline" -> trigger with the current language label (used on desktop)
 *   "list"   -> renders the two options inline as segmented buttons (mobile drawer)
 */
export default function LanguageSwitcher({ variant = "inline", className = "" }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { code: "en", label: "English", short: "EN" },
    { code: "bn", label: "বাংলা", short: "বাং" },
  ];

  // Segmented inline list — best for the mobile drawer where space is vertical.
  if (variant === "list") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {options.map((opt) => (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLanguage(opt.code)}
            aria-pressed={language === opt.code}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              language === opt.code
                ? "bg-primary text-white border-primary"
                : "bg-surface text-foreground border-border hover:bg-surface-warm"
            }`}
          >
            {language === opt.code && <Check className="w-3.5 h-3.5" />}
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  const isIcon = variant === "icon";

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-full text-foreground/70 dark:text-foreground/70 hover:bg-surface-muted dark:hover:bg-surface-muted transition-colors ${
          isIcon ? "p-2.5" : "px-3 py-2"
        }`}
        aria-label={t("header.language")}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Languages className="w-5 h-5" />
        {!isIcon && (
          <span className="text-xs font-semibold">
            {language === "bn" ? "বাংলা" : "EN"}
          </span>
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-36 bg-surface rounded-2xl shadow-xl border border-border py-1.5 z-50 animate-fade-in"
        >
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              role="option"
              aria-selected={language === opt.code}
              onClick={() => {
                setLanguage(opt.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-medium text-left transition-colors ${
                language === opt.code
                  ? "text-primary dark:text-primary bg-primary/10 dark:bg-primary/20"
                  : "text-foreground hover:bg-surface-warm"
              }`}
            >
              <span>{opt.label}</span>
              {language === opt.code && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
