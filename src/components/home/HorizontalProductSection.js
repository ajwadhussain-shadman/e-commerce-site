"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "@/components/products/ProductCard";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Horizontal product rail.
 *
 * Built on native overflow scrolling rather than a carousel library: touch
 * devices get the browser's own momentum scrolling and scroll-snap, and the
 * arrow buttons / dots are thin wrappers around scrollBy() and scrollTo().
 *
 * There is deliberately no autoplay — the page must never move on its own.
 * Motion is skipped entirely when the visitor asks for reduced motion.
 */
export default function HorizontalProductSection({
  title,
  eyebrow,
  icon: Icon,
  products: sectionProducts,
  viewAllHref,
  viewAllLabel,
  background = "bg-surface",
}) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /**
   * Derive the dot count and the active dot from the rail's real geometry, so
   * the dots stay correct at every breakpoint without hard-coded card counts.
   */
  const syncFromScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = Math.max(scrollWidth - clientWidth, 0);
    const scrollable = maxScroll > 4;

    setPageCount(scrollable ? Math.max(2, Math.ceil(scrollWidth / clientWidth)) : 1);
    setActivePage(
      scrollable
        ? Math.min(Math.round(scrollLeft / clientWidth), Math.ceil(scrollWidth / clientWidth) - 1)
        : 0
    );
    setCanScrollLeft(scrollable && scrollLeft > 4);
    setCanScrollRight(scrollable && scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    syncFromScroll();
    el.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("resize", syncFromScroll);

    return () => {
      el.removeEventListener("scroll", syncFromScroll);
      window.removeEventListener("resize", syncFromScroll);
    };
  }, [syncFromScroll, sectionProducts]);

  const behavior = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

  const scrollOnePage = (direction) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: behavior() });
  };

  const goToPage = (index) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: behavior() });
  };

  if (!sectionProducts || sectionProducts.length === 0) return null;

  return (
    <section className={`py-10 sm:py-12 ${background}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
          <div>
            {eyebrow && (
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
                {Icon && <Icon className="w-4 h-4" />} {eyebrow}
              </div>
            )}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {title}
            </h2>
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="mt-2 inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-semibold"
              >
                {viewAllLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Arrow controls are a desktop affordance; touch devices swipe. */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollOnePage(-1)}
              disabled={!canScrollLeft}
              aria-label={t("home.previousProducts")}
              className="p-2 bg-surface hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-full shadow-xs border border-border transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              type="button"
              onClick={() => scrollOnePage(1)}
              disabled={!canScrollRight}
              aria-label={t("home.nextProducts")}
              className="p-2 bg-surface hover:bg-surface-muted disabled:opacity-40 disabled:cursor-not-allowed rounded-full shadow-xs border border-border transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Native scroll rail — touch scrolling stays completely natural. */}
        <div
          ref={containerRef}
          className="no-scrollbar flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        >
          {sectionProducts.map((product) => (
            <div
              key={product.id}
              className="shrink-0 snap-start w-[calc(50%-0.5rem)] sm:w-60 md:w-72"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Pagination dots — one per rail viewport, hidden when nothing scrolls. */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            {Array.from({ length: pageCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToPage(index)}
                aria-label={`${t("home.goToSlide")} ${index + 1}`}
                aria-current={activePage === index ? "true" : undefined}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activePage === index
                    ? "w-6 bg-primary"
                    : "w-2 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
