"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function HeroBanner() {
  const { t } = useLanguage();

  return (
    <div className="bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="py-8 md:py-12 lg:py-16">
          {/* Location Label */}
          <div className="inline-block mb-6">
            <span className="text-xs sm:text-sm font-medium text-stone-500">{t("home.bangladeshDelivery")}</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-bold text-stone-900 leading-tight mb-4">
            {t("home.heroTitle1")}
          </h1>

          {/* Supporting Text */}
          <p className="text-sm sm:text-base md:text-lg text-stone-600 mb-8 max-w-2xl leading-relaxed">
            {t("home.heroSubtitle")}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm md:text-base font-semibold rounded-full transition-colors"
            >
              <span>{t("home.shopAllImports")}</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
            </Link>
            <Link
              href="/products?filter=bestsellers"
              className="inline-flex items-center justify-center px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-900 text-sm md:text-base font-semibold rounded-full transition-colors border border-stone-300"
            >
              <span>{t("home.customerFavorites")}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}