"use client";

import Link from "next/link";
import Image from "next/image";
import { products } from "@/data/products";
import SiteNav from "@/components/common/SiteNav";
import HeroBanner from "@/components/home/HeroBanner";
import { ArrowRight, Zap, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();

  const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 8);
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, 8);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 8);
  const dealProducts = products.filter((p) => p.discountPrice).slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top Bars & Navigation */}
      <SiteNav showCategories />

      {/* Hero Section */}
      <main className="flex-1">
        <HeroBanner />

        {/* 1. Featured Products Section */}
        <section className="py-12 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
                  <Zap className="w-4 h-4" /> {t("home.curatedCollection")}
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 mt-1">
                  {t("home.trendingGoods")}
                </h2>
              </div>
              <Link
                href="/products?filter=trending"
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
              >
                <span>{t("home.exploreAllTrending")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {featuredProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="shrink-0">
                  <ProductCardCompact product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Promotional Banner Showcase */}
        <section className="py-8 bg-orange-500 text-white">
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
              className="inline-block px-6 py-2.5 bg-white text-orange-600 font-semibold rounded-full hover:bg-stone-100 transition-colors text-sm"
            >
              {t("home.viewAllDeals")}
              <ArrowRight className="w-4 h-4 inline-block ml-2" />
            </Link>
          </div>
        </section>

        {/* 2. Horizontal Product Sections */}
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-stone-900">
                {t("home.customerFavorites")}
              </h3>
              <Link
                href="/products?filter=bestsellers"
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
              >
                {t("home.viewAllBestSellers")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {bestSellers.slice(0, 4).map((product) => (
                <div key={product.id} className="shrink-0">
                  <ProductCardCompact product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. New Arrivals Section */}
        <section className="py-12 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
                  <Sparkles className="w-4 h-4" /> {t("home.justLanded")}
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-stone-900 mt-1">
                  {t("home.newArrivals")}
                </h2>
              </div>
              <Link
                href="/products?filter=new"
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
              >
                <span>{t("home.viewAllNew")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {newArrivals.slice(0, 4).map((product) => (
                <div key={product.id} className="shrink-0">
                  <ProductCardCompact product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Deals Section */}
        <section className="py-12 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900">
                {t("home.customerFavorites")}
              </h2>
              <Link
                href="/products?filter=deals"
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
              >
                {t("home.viewAllDeals")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {dealProducts.map((product) => (
                <div key={product.id} className="shrink-0">
                  <ProductCardCompact product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ProductCardCompact({ product }) {
  const { t } = useLanguage();

  return (
    <div className="group bg-white border border-stone-200 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
      <div className="relative aspect-square bg-stone-50 overflow-hidden">
        <Link href={`/products/${product.slug}`} className="block w-full h-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>
      </div>

      <div className="p-3 flex-1 flex flex-col justify-between">
        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="text-sm font-semibold text-stone-900 group-hover:text-orange-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-stone-900">
              ৳{product.discountPrice || product.price}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-stone-400 line-through">
                ৳{product.price}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}