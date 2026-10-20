"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "@/components/common/SiteNav";
import SiteFooter from "@/components/common/SiteFooter";
import HeroBanner from "@/components/home/HeroBanner";
import HorizontalProductSection from "@/components/home/HorizontalProductSection";
import HomepageTestimonials from "@/components/home/HomepageTestimonials";
import { ArrowRight, Zap, Sparkles } from "lucide-react";
import { productService } from "@/services/productService";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [catalogError, setCatalogError] = useState(false);

  useEffect(() => {
    let active = true;
    productService.getAllProducts()
      .then((data) => { if (active) setProducts(data); })
      .catch(() => { if (active) setCatalogError(true); });
    return () => { active = false; };
  }, []);

  const featuredProducts = products.filter((p) => p.isFeatured && p.isActive !== false).slice(0, 8);
  const newArrivals = products.filter((p) => p.isNewArrival && p.isActive !== false).slice(0, 8);
  const bestSellers = products.filter((p) => p.isBestSeller && p.isActive !== false).slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Bars & Navigation */}
      <SiteNav showCategories />

      {/* Hero Section */}
      <main className="flex-1">
        <HeroBanner />
        {catalogError && <p role="status" className="mx-auto max-w-7xl px-4 py-3 text-sm text-rose-700">Products are temporarily unavailable. Please try again shortly.</p>}

        {/* 1. Featured / trending products */}
        <HorizontalProductSection
          eyebrow={t("home.curatedCollection")}
          icon={Zap}
          title={t("home.trendingGoods")}
          viewAllHref="/products?filter=trending"
          viewAllLabel={t("home.exploreAllTrending")}
          products={featuredProducts}
          background="bg-surface-muted"
        />

        {/* Promotional Banner Showcase */}
        <section className="py-8 bg-primary text-on-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" /> {t("home.specialImportDeals")}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {t("home.limitedTimeOffers")}
            </h2>
            <p className="text-xs sm:text-sm opacity-90 mb-4 max-w-xl mx-auto">
              {t("home.dealsSubtitle")}
            </p>
            <Link
              href="/products?filter=deals"
              className="inline-block px-6 py-2.5 bg-surface text-orange-600 font-semibold rounded-full hover:bg-surface-muted transition-colors text-sm"
            >
              {t("home.viewAllDeals")}
              <ArrowRight className="w-4 h-4 inline-block ml-2" />
            </Link>
          </div>
        </section>

        {/* 2. Customer favorites / best sellers */}
        <HorizontalProductSection
          title={t("home.customerFavorites")}
          viewAllHref="/products?filter=bestsellers"
          viewAllLabel={t("home.viewAllBestSellers")}
          products={bestSellers}
          background="bg-surface"
        />

        {/* 3. New arrivals */}
        <HorizontalProductSection
          eyebrow={t("home.justLanded")}
          icon={Sparkles}
          title={t("home.newArrivals")}
          viewAllHref="/products?filter=new"
          viewAllLabel={t("home.viewAllNew")}
          products={newArrivals}
          background="bg-surface-muted"
        />

        {/* Customer Testimonials */}
        <HomepageTestimonials />

        {/* Customer reviews will appear after verified reviews are available. */}
      </main>

      <SiteFooter />
    </div>
  );
}
