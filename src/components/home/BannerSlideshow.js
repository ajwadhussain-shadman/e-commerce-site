"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { bannerService } from "@/services/bannerService";
import { useLanguage } from "@/context/LanguageContext";

export default function BannerSlideshow() {
  const { t } = useLanguage();
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isHovering, setIsHovering] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (event) => { setPrefersReducedMotion(event.matches); };
    // Set initial value after hydration (runs only on client)
    requestAnimationFrame(() => setPrefersReducedMotion(mediaQuery.matches));
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const loadBanners = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bannerService.getBanners(true);
      setBanners(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load banners.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    bannerService.getBanners(true)
      .then((data) => { if (active) { setBanners(data); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message || "Could not load banners."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isPlaying || banners.length <= 1 || prefersReducedMotion) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 2500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, banners.length, prefersReducedMotion]);

  const goToSlide = (index) => {
    setCurrentIndex(index);
    // Reset autoplay timer on manual navigation
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isPlaying && banners.length > 1 && !prefersReducedMotion) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 2500);
    }
  };

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    // Reset autoplay timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isPlaying && banners.length > 1 && !prefersReducedMotion) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 2500);
    }
  }, [banners.length, isPlaying, prefersReducedMotion]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    // Reset autoplay timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (isPlaying && banners.length > 1 && !prefersReducedMotion) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, 2500);
    }
  }, [banners.length, isPlaying, prefersReducedMotion]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goToPrevious(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); goToNext(); }
    else if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); setIsPlaying((p) => !p); }
  }, [goToPrevious, goToNext]);

  useEffect(() => {
    const container = document.querySelector(".banner-slideshow");
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, [handleKeyDown]);

  if (loading) {
    return (
      <section className="bg-surface border-b border-border" role="status" aria-label="Loading banner slideshow">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 sm:py-6">
          <div className="aspect-[8/3] bg-stone-100 animate-pulse rounded-2xl sm:rounded-2xl" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-surface border-b border-border" role="alert" aria-label="Banner slideshow error">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 sm:py-6">
          <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800 text-center">{error}</p>
        </div>
      </section>
    );
  }

  if (!banners.length) {
    return (
      <section className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 sm:py-6">
          <div className="aspect-[8/3] bg-stone-100 rounded-2xl sm:rounded-2xl flex items-center justify-center">
            <p className="text-sm text-stone-500">No active banners configured</p>
          </div>
        </div>
      </section>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <section className="bg-surface border-b border-border banner-slideshow" tabIndex={0} onKeyDown={handleKeyDown} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}>
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 sm:py-6">
        <div className="relative aspect-[8/3] rounded-2xl overflow-hidden shadow-lg group">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${t("home.bannerSlide") || "Banner"} ${index + 1} ${t("home.of") || "of"} ${banners.length}`}
            >
              {banner.link ? (
                <Link href={banner.link} className="absolute inset-0 focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-surface" aria-label={banner.title}>
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                </Link>
              ) : (
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  priority={index === 0}
                  sizes="100vw"
                  className="object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              )}
            </div>
          ))}

          {/* Navigation Controls */}
          {banners.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-stone-900 shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={t("home.previousBanner") || "Previous banner"}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white text-stone-900 shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
                aria-label={t("home.nextBanner") || "Next banner"}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Slide Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20" role="tablist" aria-label={t("home.bannerNavigation") || "Banner navigation"}>
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentIndex ? "bg-white w-8" : "bg-white/60 hover:bg-white/80"} focus:outline-none focus:ring-2 focus:ring-amber-500`}
                  role="tab"
                  aria-selected={index === currentIndex}
                  aria-label={`${t("home.bannerSlide") || "Banner"} ${index + 1} ${t("home.of") || "of"} ${banners.length}`}
                />
              ))}
            </div>
          )}

          {/* Play/Pause Toggle */}
          {banners.length > 1 && !prefersReducedMotion && (
            <button
              onClick={() => setIsPlaying((p) => !p)}
              className="absolute bottom-4 right-4 p-2 rounded-full bg-white/90 hover:bg-white text-stone-900 shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label={isPlaying ? (t("home.pauseSlideshow") || "Pause slideshow") : (t("home.playSlideshow") || "Play slideshow")}
              aria-pressed={isPlaying}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* CTA Buttons below slideshow */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-5 pb-6 sm:pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-hover text-on-primary text-sm md:text-base font-semibold rounded-full transition-colors"
            >
              <span>{t("home.shopAllImports")}</span>
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
            </Link>
            <Link
              href="/products?filter=bestsellers"
              className="inline-flex items-center justify-center px-6 py-3 bg-surface-muted hover:bg-surface-warm text-foreground text-sm md:text-base font-semibold rounded-full transition-colors border border-border"
            >
              <span>{t("home.customerFavorites")}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}