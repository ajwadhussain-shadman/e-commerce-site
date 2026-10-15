"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/data/categories";
import { Flame, Sparkles, Tag, ChevronDown } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function CategoryNavigation() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const railRef = useRef(null);

  // Edge-gradient visibility on the mobile rail: hide the left cue at the
  // start, hide the right cue once fully scrolled. Avoids setState on every
  // pixel — only toggles on boolean boundaries.
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const update = () => {
      const left = el.scrollLeft > 4;
      const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
      setCanScrollLeft((prev) => (prev === left ? prev : left));
      setCanScrollRight((prev) => (prev === right ? prev : right));
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const catLabel = (cat) => {
    const value = t(`categories.${cat.slug}`);
    return value === `categories.${cat.slug}` ? cat.name : value;
  };

  const subLabel = (sub) => {
    const key = `subs.${sub}`;
    const value = t(key);
    return value === key ? sub : value;
  };

  // Shared chip set used by the mobile rail.
  const quickLinks = [
    { href: "/products?filter=deals", label: t("categoryNav.specialDeals"), icon: Tag, cls: "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/60" },
    { href: "/products?filter=new", label: t("categoryNav.newArrivals"), icon: Sparkles, cls: "text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/60" },
    { href: "/products?filter=bestsellers", label: t("categoryNav.bestSellers"), icon: Flame, cls: "text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/60" },
  ];

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Mobile / tablet: horizontally scrollable single-line category rail */}
      {/* ------------------------------------------------------------------ */}
      <nav
        aria-label={t("mobileNav.productCategories")}
        className="lg:hidden relative bg-surface-muted/50 dark:bg-surface-muted/50 border-b border-border/80 dark:border-border/80"
      >
        {/* Left edge fade cue */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-surface-muted/50 dark:from-surface-muted/50 to-transparent transition-opacity ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Right edge fade cue */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-surface-muted/50 dark:from-surface-muted/50 to-transparent transition-opacity ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          ref={railRef}
          className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3 py-2"
        >
          <Link
            href="/products"
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              pathname === "/products"
                ? "bg-primary text-white border-primary"
                : "bg-surface dark:bg-surface text-foreground dark:text-foreground border-border dark:border-border hover:bg-surface-muted dark:hover:bg-surface-muted"
            }`}
          >
            {t("categoryNav.allProducts")}
          </Link>

          {categories.map((cat) => {
            const isActive = pathname === `/categories/${cat.slug}`;
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  isActive
                    ? "bg-primary text-white border-primary font-semibold"
                    : "bg-surface dark:bg-surface text-foreground dark:text-foreground border-border dark:border-border hover:bg-surface-muted dark:hover:bg-surface-muted"
                }`}
              >
                {catLabel(cat)}
              </Link>
            );
          })}

          {/* Quick filter chips */}
          {quickLinks.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${q.cls}`}
              >
                <Icon className="w-3 h-3" />
                {q.label}
              </Link>
            );
          })}

          {/* Trailing spacer so the last chip clears the right fade */}
          <span className="shrink-0 w-4" aria-hidden="true" />
        </div>
      </nav>

      {/* ------------------------------------------------------------------ */}
      {/* Desktop: preserved premium horizontal nav with hover dropdowns      */}
      {/* ------------------------------------------------------------------ */}
      <nav className="hidden lg:block bg-surface-muted/50 dark:bg-surface-muted/50 border-b border-border/80 dark:border-border/80 text-foreground/80 dark:text-foreground/80 text-xs font-medium relative z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <ul className="flex items-center gap-1 xl:gap-2 py-1">
              {/* All Products */}
              <li>
                <Link
                  href="/products"
                  className={`px-3 py-2.5 rounded-lg inline-flex items-center gap-1 font-semibold transition-colors ${
                    pathname === "/products"
                      ? "text-primary dark:text-primary bg-primary/10 dark:bg-primary/20"
                      : "text-foreground/70 dark:text-foreground/70 hover:text-foreground dark:hover:text-foreground hover:bg-surface-muted dark:hover:bg-surface-muted"
                  }`}
                >
                  {t("categoryNav.allProducts")}
                </Link>
              </li>

              {/* Dynamic Imported Product Categories */}
              {categories.map((cat) => {
                const isActive = pathname === `/categories/${cat.slug}`;
                const isHovered = activeDropdown === cat.id;

                return (
                  <li
                    key={cat.id}
                    className="relative"
                    onMouseEnter={() => setActiveDropdown(cat.id)}
                    onMouseLeave={() => setActiveDropdown(null)}
                    onFocus={() => setActiveDropdown(cat.id)}
                  >
                    <Link
                      href={`/categories/${cat.slug}`}
                      className={`px-3 py-2.5 rounded-lg inline-flex items-center gap-1 whitespace-nowrap transition-colors ${
                        isActive
                          ? "text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 font-semibold"
                          : "text-foreground/70 dark:text-foreground/70 hover:text-foreground dark:hover:text-foreground hover:bg-surface-muted dark:hover:bg-surface-muted"
                      }`}
                    >
                      <span>{catLabel(cat)}</span>
                      <ChevronDown className="w-3 h-3 text-stone-400" />
                    </Link>

                    {/* Mega dropdown preview */}
                    {isHovered && (
                      <div className="absolute top-full left-0 w-64 bg-surface dark:bg-surface rounded-2xl shadow-xl border border-border dark:border-border p-3 animate-fade-in z-50">
                        <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-2 pb-1.5 border-b border-border dark:border-border mb-1">
                          {t("categoryNav.subcategories")}
                        </div>
                        <div className="space-y-0.5">
                          {cat.subcategories.map((sub, i) => (
                            <Link
                              key={i}
                              href={`/products?category=${cat.slug}&subcategory=${encodeURIComponent(sub)}`}
                              className="block px-2.5 py-1.5 text-xs text-foreground/70 dark:text-foreground/70 hover:text-foreground dark:hover:text-foreground hover:bg-surface-muted dark:hover:bg-surface-muted rounded-lg transition-colors"
                            >
                              {subLabel(sub)}
                            </Link>
                          ))}
                        </div>
                        <div className="mt-2 pt-2 border-t border-border dark:border-border">
                          <Link
                            href={`/categories/${cat.slug}`}
                            className="block text-center text-[11px] font-semibold text-primary dark:text-primary hover:underline py-1"
                          >
                            {t("categoryNav.exploreAll")} {catLabel(cat)} →
                          </Link>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Right Highlight Badges: Deals & New */}
            <div className="flex items-center gap-2 py-1 pl-4">
              {quickLinks.map((q) => {
                const Icon = q.icon;
                return (
                  <Link
                    key={q.href}
                    href={q.href}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1 transition-colors ${q.cls}`}
                  >
                    <Icon className="w-3 h-3" />
                    {q.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
